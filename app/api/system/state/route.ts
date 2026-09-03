import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const agents = store.getAllAgents().map((a) => store.getAgentProfile(a.agentId));
  const events = store.getEvents(undefined, 30);
  const products = store.queryProducts();

  return NextResponse.json({
    success: true,
    agents,
    events,
    products,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'reset') {
      store.reset();
      return NextResponse.json({
        success: true,
        message: 'WebMCP Passport store successfully reset to initial demo state',
        agents: store.getAllAgents().map((a) => store.getAgentProfile(a.agentId)),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
