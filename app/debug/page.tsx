'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AgentSimulator } from '@/components/AgentSimulator';
import { AuditLogStream } from '@/components/AuditLogStream';
import { WebMCPProtocolDoc } from '@/components/WebMCPProtocolDoc';
import { Footer } from '@/components/Footer';
import { AgentProfile, AgentSession, AuditEvent, DemoProduct } from '@/lib/types';
import { registerWebMCPTools } from '@/lib/webmcp-registry';
import { Terminal, ArrowLeft } from 'lucide-react';

export default function DebugPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('agent_research_001');
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [products, setProducts] = useState<DemoProduct[]>([]);
  const [webMcpAvailable, setWebMcpAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/system/state');
      if (res.ok) {
        const data = await res.json();
        if (data.agents) {
          setAgents(data.agents);
          setActiveAgentId((prev) => {
            if (data.agents.length > 0 && !data.agents.some((a: any) => a.agentId === prev)) {
              return data.agents[0].agentId;
            }
            return prev;
          });
        }
        if (data.events) setEvents(data.events);
        if (data.products) setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to sync state:', err);
    }
  }, []);

  useEffect(() => {
    refreshState();

    const hasModelContext = typeof window !== 'undefined' && !!(window as any).document?.modelContext;
    setWebMcpAvailable(hasModelContext);

    const cleanup = registerWebMCPTools(() => {
      setTimeout(() => refreshState(), 100);
    });

    const interval = setInterval(() => {
      refreshState();
    }, 3500);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [refreshState]);

  const handleResetDemo = useCallback(async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/system/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        setActiveSession(null);
        await refreshState();
      }
    } finally {
      setIsResetting(false);
    }
  }, [refreshState]);

  const handleExecuteTool = useCallback(
    async (toolName: string, params: any) => {
      setIsLoading(true);
      try {
        if (toolName === 'authenticate_agent') {
          const res = await fetch('/api/auth/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          });
          const data = await res.json();
          if (!res.ok) {
            const error: any = new Error(data.error || 'Auth failed');
            error.status = res.status;
            error.data = data;
            await refreshState();
            throw error;
          }
          if (data.authenticated) {
            setActiveSession({
              sessionId: data.sessionId,
              agentId: data.agentId,
              token: data.token,
              authenticatedAt: new Date().toISOString(),
              expiresAt: data.expiresAt,
            });
          }
          await refreshState();
          return data;
        } else if (toolName === 'get_agent_profile') {
          const res = await fetch(`/api/agents/${encodeURIComponent(params.agentId || activeAgentId)}/profile`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          await refreshState();
          return data;
        } else if (toolName === 'perform_demo_action') {
          const res = await fetch('/api/actions/perform', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(activeSession ? { Authorization: `Bearer ${activeSession.token}` } : {}),
            },
            body: JSON.stringify({
              agentId: params.agentId || activeAgentId,
              query: params.query || 'LiDAR',
              token: activeSession?.token,
            }),
          });
          const data = await res.json();
          await refreshState();
          if (!res.ok) {
            const error: any = new Error(data.message || data.error);
            error.status = res.status;
            error.data = data;
            throw error;
          }
          return data;
        } else if (toolName === 'get_agent_history') {
          const res = await fetch(
            `/api/agents/${encodeURIComponent(params.agentId || 'all')}/history?limit=${params.limit || 10}`
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data;
        }
        throw new Error(`Unknown tool: ${toolName}`);
      } finally {
        setIsLoading(false);
      }
    },
    [activeAgentId, activeSession, refreshState]
  );

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col selection:bg-accent/30 selection:text-ink">
      <Navbar
        webMcpAvailable={webMcpAvailable}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Debug Banner */}
        <div className="p-4 rounded-xl bg-paper-2 border border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-accent">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">// DEBUG_ROUTE</span>
            <span className="text-ink-2">· Tool Simulator, Raw Audit Log &amp; Protocol Spec</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper-3 border border-rule text-xs font-mono text-ink hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Main Demo Flow
          </Link>
        </div>

        {/* 1. Agent Simulator */}
        <AgentSimulator
          activeAgentId={activeAgentId}
          agents={agents}
          activeSession={activeSession}
          onExecuteTool={handleExecuteTool}
          isLoading={isLoading}
          onSelectAgent={setActiveAgentId}
        />

        {/* 2. Audit Log Stream */}
        <AuditLogStream
          events={events}
          activeAgentId={activeAgentId}
        />

        {/* 3. Protocol Doc */}
        <WebMCPProtocolDoc />
      </main>

      <Footer />
    </div>
  );
}
