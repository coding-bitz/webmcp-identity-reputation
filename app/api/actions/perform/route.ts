import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const body = await req.json().catch(() => ({}));
    const { token, agentId, query, actionType = 'search_catalog' } = body;

    const effectiveToken = token || bearerToken;
    let session = effectiveToken ? store.getSessionByToken(effectiveToken) : undefined;

    // Fallback: If agentId is passed and has an active verified session in the store
    if (!session && agentId) {
      session = store.getSessionByAgentId(agentId);
    }

    // 1. Verify Authentication
    if (!session) {
      const targetAgentId = agentId || 'anonymous_agent';
      const penalty = targetAgentId !== 'anonymous_agent' ? store.adjustReputation(targetAgentId, 'AUTH_FAILURE') : { delta: -10, newScore: 0 };

      store.recordEvent({
        agentId: targetAgentId,
        agentName: targetAgentId,
        tool: 'perform_demo_action',
        action: actionType,
        status: 'AUTH_FAILED',
        timestamp: new Date().toISOString(),
        reputationDelta: penalty.delta,
        latencyMs: Date.now() - startTime,
        details: { error: 'Unauthenticated action attempt — active agent session required' },
      });

      return NextResponse.json(
        {
          error: 'UNAUTHENTICATED',
          message: 'Authentication required. Please authenticate agent with OTP before invoking WebMCP actions.',
          reputationPenalty: penalty.delta,
        },
        { status: 401 }
      );
    }

    const effectiveAgentId = session.agentId;
    const agent = store.getAgent(effectiveAgentId);
    const agentName = agent?.name || effectiveAgentId;

    // 2. Enforce Rate Limiting (independent of reputation)
    const rateLimitCheck = store.checkRateLimit(effectiveAgentId);
    if (!rateLimitCheck.allowed) {
      const penalty = store.adjustReputation(effectiveAgentId, 'RATE_LIMIT');

      store.recordEvent({
        agentId: effectiveAgentId,
        agentName,
        tool: 'perform_demo_action',
        action: actionType,
        status: 'RATE_LIMITED',
        timestamp: new Date().toISOString(),
        reputationDelta: penalty.delta,
        latencyMs: Date.now() - startTime,
        details: {
          maxPerMinute: rateLimitCheck.maxPerMinute,
          used: rateLimitCheck.used,
          resetInSeconds: rateLimitCheck.resetInSeconds,
        },
      });

      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: `Rate limit of ${rateLimitCheck.maxPerMinute} actions/minute exceeded for agent '${effectiveAgentId}'.`,
          agentId: effectiveAgentId,
          limit: rateLimitCheck.maxPerMinute,
          retryAfter: rateLimitCheck.resetInSeconds,
          reputationPenalty: penalty.delta,
          currentReputation: penalty.newScore,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.resetInSeconds),
            'X-RateLimit-Limit': String(rateLimitCheck.maxPerMinute),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitCheck.resetInSeconds),
          },
        }
      );
    }

    // Consume rate limit token
    store.consumeRateLimit(effectiveAgentId);

    // 3. Execute Storefront Catalog Search
    const searchResults = store.queryProducts(query);
    const actionResult = {
      query: query || '*',
      resultsCount: searchResults.length,
      products: searchResults,
    };

    // 4. Update Reputation (Successful Action)
    store.adjustReputation(effectiveAgentId, 'SUCCESS');
    const profile = store.getAgentProfile(effectiveAgentId);

    // 5. Record Audit Event
    store.recordEvent({
      agentId: effectiveAgentId,
      agentName,
      tool: 'perform_demo_action',
      action: actionType,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      reputationDelta: 0,
      latencyMs: Date.now() - startTime,
      details: {
        query: query || undefined,
        resultsCount: searchResults.length,
        rateLimitRemaining: profile?.rateLimit.remaining,
      },
    });

    // 6. Return Structured Response
    return NextResponse.json({
      success: true,
      agentId: effectiveAgentId,
      action: actionType,
      result: actionResult,
      reputation: profile?.reputation,
      rateLimit: profile?.rateLimit,
      executionTimestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Action execution error', message: err?.message },
      { status: 500 }
    );
  }
}
