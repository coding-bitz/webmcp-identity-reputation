import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 20)) : 20;

  if (agentId && agentId !== 'all') {
    const agent = store.getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${agentId}' not found` },
        { status: 404 }
      );
    }
    const events = store.getEvents(agentId, limit);
    return NextResponse.json({
      success: true,
      agentId,
      events,
      count: events.length,
    });
  }

  const allEvents = store.getEvents(undefined, limit);
  return NextResponse.json({
    success: true,
    events: allEvents,
    count: allEvents.length,
  });
}
