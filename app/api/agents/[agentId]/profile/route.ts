import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json({ error: 'agentId parameter required' }, { status: 400 });
  }

  const profile = store.getAgentProfile(agentId);
  if (!profile) {
    return NextResponse.json(
      { error: `Agent '${agentId}' not found in registry` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    agentId: profile.agentId,
    name: profile.name,
    issuer: profile.issuer,
    reputation: profile.reputation,
    successfulActions: profile.successfulActions,
    failedActions: profile.failedActions,
    rateLimitViolations: profile.rateLimitViolations,
    authFailures: profile.authFailures,
    totalActions: profile.totalActions,
    status: profile.status,
    createdAt: profile.createdAt,
    rateLimit: profile.rateLimit,
  });
}
