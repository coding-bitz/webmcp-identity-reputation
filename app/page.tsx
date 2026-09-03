'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { AuthScreen, CodeSentScreen, RevealScreen, FailedScreen } from '@/components/AuthScreens';
import { BusinessPlatform } from '@/components/BusinessPlatform';
import { Footer } from '@/components/Footer';
import { AgentProfile, AgentSession, DemoFlowState, DemoProduct } from '@/lib/types';
import { registerWebMCPTools } from '@/lib/webmcp-registry';

export default function HomePage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('agent_research_001');
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null);
  const [authFlowState, setAuthFlowState] = useState<DemoFlowState>('WAITING_FOR_CODE');
  const [authStatusMessage, setAuthStatusMessage] = useState<string>('');
  const [products, setProducts] = useState<DemoProduct[]>([]);
  const [webMcpAvailable, setWebMcpAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Fetch full system state
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
        if (data.products) setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to sync state:', err);
    }
  }, []);

  // WebMCP Tool Registration & Lifecycle
  useEffect(() => {
    refreshState();

    const hasModelContext = typeof window !== 'undefined' && !!(window as any).document?.modelContext;
    setWebMcpAvailable(hasModelContext);

    // Register WebMCP tools with real-time lifecycle callback
    const cleanup = registerWebMCPTools((toolName, input, result, error) => {
      if (toolName === 'authenticate_agent') {
        if (result?.status === 'OTP_SENT') {
          // Screen 2: Code sent
          setAuthFlowState('CODE_SENT');
          setAuthStatusMessage('Authentication code dispatched to your email.');
          refreshState();
        } else if (result?.authenticated) {
          if (result.token) {
            setActiveSession({
              sessionId: result.sessionId,
              agentId: result.agentId,
              token: result.token,
              authenticatedAt: new Date().toISOString(),
              expiresAt: result.expiresAt,
            });
          }
          setAuthStatusMessage('');

          // Fetch fresh agent data FIRST, then reveal
          refreshState().then(() => {
            setAuthFlowState('REVEALING');
            setTimeout(() => {
              setAuthFlowState('AUTHENTICATED');
            }, 4000);
          });
        } else if (error) {
          setAuthFlowState('FAILED');
          setAuthStatusMessage(error.data?.error || error.message || 'Authentication code verification failed.');
          refreshState();
        }
      } else {
        refreshState();
      }
    });

    const interval = setInterval(() => {
      refreshState();
    }, 3500);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [refreshState]);

  // Phase 1: Request OTP Code (Manual or WebMCP trigger)
  const handleRequestOtp = useCallback(async () => {
    setIsLoading(true);
    setAuthStatusMessage('');
    try {
      const res = await fetch('/api/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: activeAgentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthFlowState('FAILED');
        setAuthStatusMessage(data.message || data.error || 'Failed to request code');
        throw new Error(data.message || data.error);
      }

      setAuthFlowState('CODE_SENT');
      setAuthStatusMessage('Code sent to your email. Check your inbox.');
      await refreshState();
      return data;
    } catch (err: any) {
      setAuthFlowState('FAILED');
      setAuthStatusMessage(err.message || 'Failed to send OTP code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeAgentId, refreshState]);

  // Phase 2: Verify OTP Code
  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      setIsLoading(true);
      setAuthFlowState('VERIFYING');
      setAuthStatusMessage('Verifying code...');
      try {
        const res = await fetch('/api/auth/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: activeAgentId, otp }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthFlowState('FAILED');
          setAuthStatusMessage(data.error || 'Invalid code. Score penalized (-10).');
          const error: any = new Error(data.error || 'Verification failed');
          error.status = res.status;
          error.data = data;
          await refreshState();
          throw error;
        }

        const session: AgentSession = {
          sessionId: data.sessionId,
          agentId: activeAgentId,
          token: data.token,
          authenticatedAt: new Date().toISOString(),
          expiresAt: data.expiresAt,
        };
        setActiveSession(session);
        setAuthStatusMessage('');

        // Fetch fresh agent data FIRST, then reveal
        await refreshState();
        setAuthFlowState('REVEALING');

        setTimeout(() => {
          setAuthFlowState('AUTHENTICATED');
        }, 4000);

        return data;
      } catch (err: any) {
        setAuthFlowState('FAILED');
        setAuthStatusMessage(err.data?.error || err.message || 'Verification rejected');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [activeAgentId, refreshState]
  );

  // Quick Action Handler (Store Product Query)
  const handleQuickAction = useCallback(
    async (query: string = 'LiDAR') => {
      setIsLoading(true);
      try {
        const payload: any = {
          agentId: activeAgentId,
          query,
          actionType: 'search_catalog',
          token: activeSession?.token,
        };

        const res = await fetch('/api/actions/perform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(activeSession ? { Authorization: `Bearer ${activeSession.token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        await refreshState();
        if (!res.ok) {
          const error: any = new Error(data.message || data.error || 'Action failed');
          error.status = res.status;
          error.data = data;
          throw error;
        }
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [activeAgentId, activeSession, refreshState]
  );

  // Reset Demo State
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
        setAuthFlowState('WAITING_FOR_CODE');
        setAuthStatusMessage('');
        await refreshState();
      }
    } finally {
      setIsResetting(false);
    }
  }, [refreshState]);

  const currentAgent = agents.find((a) => a.agentId === activeAgentId) || agents[0];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col selection:bg-accent/30 selection:text-ink">
      {/* Navigation */}
      <Navbar
        webMcpAvailable={webMcpAvailable}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Single-Screen Conditional Content */}
      <main className="flex-1 flex flex-col justify-center">
        {/* Screen 1: Authenticate / Waiting */}
        {authFlowState === 'WAITING_FOR_CODE' && (
          <AuthScreen
            agents={agents}
            activeAgentId={activeAgentId}
            onSelectAgent={(id) => {
              setActiveAgentId(id);
              setActiveSession(null);
              setAuthFlowState('WAITING_FOR_CODE');
              setAuthStatusMessage('');
            }}
            onRequestOtp={handleRequestOtp}
            isLoading={isLoading}
          />
        )}

        {/* Screen 2: Code Sent */}
        {authFlowState === 'CODE_SENT' && (
          <CodeSentScreen
            statusMessage={authStatusMessage}
            agentId={activeAgentId}
          />
        )}

        {/* Screen 3: Verifying / Revealing Identity */}
        {(authFlowState === 'VERIFYING' || authFlowState === 'REVEALING') && (
          <RevealScreen
            state={authFlowState}
            agent={currentAgent}
            reputationScore={currentAgent?.reputation}
          />
        )}

        {/* Screen 4: Storefront (Post-Auth) */}
        {authFlowState === 'AUTHENTICATED' && (
          <BusinessPlatform
            products={products}
            isAuthenticated={true}
            agentName={currentAgent?.name}
            reputationScore={currentAgent?.reputation}
            onExecuteProductAction={(q) => handleQuickAction(q)}
            isLoading={isLoading}
          />
        )}

        {/* Failure Screen */}
        {authFlowState === 'FAILED' && (
          <FailedScreen
            message={authStatusMessage}
            onRetry={() => {
              setAuthFlowState('WAITING_FOR_CODE');
              setAuthStatusMessage('');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
