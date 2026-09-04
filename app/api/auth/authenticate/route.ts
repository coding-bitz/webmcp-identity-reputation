import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { generateOtp } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const { agentId, otp, email } = body;

    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json(
        { error: 'agentId is required and must be a string' },
        { status: 400 }
      );
    }

    const agent = store.getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${agentId}' is not registered in the passport registry` },
        { status: 404 }
      );
    }

    // PHASE 1: Request Code (otp is absent or empty)
    if (!otp || (typeof otp === 'string' && otp.trim() === '')) {
      const generatedOtp = generateOtp();
      store.createOtpChallenge(agentId, generatedOtp);

      const targetEmail = typeof email === 'string' && email.trim() ? email.trim() : undefined;

      try {
        await sendOtpEmail(generatedOtp, agentId, targetEmail);
      } catch (emailErr: any) {
        console.error('[WebMCP Auth] Resend email send failed:', emailErr?.message);
        return NextResponse.json(
          {
            error: 'Failed to send authentication code. Try again.',
            message: `Email dispatch failed: ${emailErr?.message || 'Ensure RESEND_API_KEY is configured.'}`,
          },
          { status: 500 }
        );
      }

      store.recordEvent({
        agentId,
        agentName: agent.name,
        tool: 'authenticate_agent',
        action: 'otp_dispatched',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        reputationDelta: 0,
        latencyMs: Date.now() - startTime,
        details: { step: 'otp_dispatched_to_email', recipientEmail: targetEmail || 'default_env_recipient' },
      });

      return NextResponse.json({
        status: 'OTP_SENT',
        message: targetEmail
          ? `Authentication code sent to ${targetEmail}. Provide the 6-digit code to complete authentication.`
          : 'Authentication code sent to registered email. Provide the 6-digit code to complete authentication.',
        agentId,
        email: targetEmail,
      });
    }

    // PHASE 2: Verify Code (otp is present)
    const verification = store.verifyAndConsumeOtp(agentId, otp);

    if (!verification.success) {
      const penalty = store.adjustReputation(agentId, 'AUTH_FAILURE');
      store.recordEvent({
        agentId,
        agentName: agent.name,
        tool: 'authenticate_agent',
        action: 'verify_otp',
        status: 'AUTH_FAILED',
        timestamp: new Date().toISOString(),
        reputationDelta: penalty.delta,
        latencyMs: Date.now() - startTime,
        details: { reason: verification.reason },
      });

      return NextResponse.json(
        {
          authenticated: false,
          error: verification.reason || 'Invalid or expired authentication code',
          reputationPenalty: penalty.delta,
          currentReputation: penalty.newScore,
        },
        { status: 401 }
      );
    }

    // Success: Create Authenticated Session
    const session = store.createSession(agentId);
    store.adjustReputation(agentId, 'SUCCESS');
    const profile = store.getAgentProfile(agentId);

    store.recordEvent({
      agentId,
      agentName: agent.name,
      tool: 'authenticate_agent',
      action: 'session_established',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      reputationDelta: 0,
      latencyMs: Date.now() - startTime,
      details: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        authMethod: 'email_otp',
      },
    });

    return NextResponse.json({
      authenticated: true,
      agentId,
      agentName: agent.name,
      token: session.token,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Authentication internal failure', message: err?.message },
      { status: 500 }
    );
  }
}
