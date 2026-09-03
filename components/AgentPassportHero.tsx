'use client';

import React, { useState } from 'react';
import { AgentProfile, AgentSession } from '@/lib/types';
import { Shield, Mail, Zap, CheckCircle2, AlertTriangle, XCircle, Lock, KeyRound, ArrowRight, UserCheck } from 'lucide-react';

export type AuthFlowState = 'WAITING_FOR_CODE' | 'CODE_SENT' | 'VERIFYING' | 'AUTHENTICATED' | 'FAILED';

interface AgentPassportHeroProps {
  agents: AgentProfile[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  activeSession: AgentSession | null;
  authFlowState: AuthFlowState;
  authStatusMessage?: string;
  onRequestOtp: () => void;
  onVerifyOtp: (otp: string) => void;
  onQuickAction: () => void;
  onTriggerSpam: () => void;
  onTriggerInvalidOtp: () => void;
  isLoading: boolean;
}

export const AgentPassportHero: React.FC<AgentPassportHeroProps> = ({
  agents,
  activeAgentId,
  onSelectAgent,
  activeSession,
  authFlowState,
  authStatusMessage,
  onRequestOtp,
  onVerifyOtp,
  onQuickAction,
  onTriggerSpam,
  onTriggerInvalidOtp,
  isLoading,
}) => {
  const [inputOtp, setInputOtp] = useState('');
  const currentAgent = agents.find((a) => a.agentId === activeAgentId) || agents[0];

  const getTier = (score: number) => {
    if (score >= 90) return { label: 'TIER 1 · VERIFIED AGENT', color: 'text-accent border-accent/40 bg-accent/10' };
    if (score >= 60) return { label: 'TIER 2 · MONITORED', color: 'text-amber-400 border-amber-400/40 bg-amber-400/10' };
    return { label: 'TIER 3 · PROBATION / UNTRUSTED', color: 'text-destructive border-destructive/40 bg-destructive/10' };
  };

  const tier = currentAgent ? getTier(currentAgent.reputation) : getTier(100);
  const isAuthenticated = !!activeSession && activeSession.agentId === activeAgentId;
  const rateLimitRemaining = currentAgent?.rateLimit?.remaining ?? 10;
  const rateLimitMax = currentAgent?.rateLimit?.maxPerMinute ?? 10;
  const rateLimitUsed = currentAgent?.rateLimit?.usedInCurrentWindow ?? 0;

  const getAuthStateBadge = () => {
    switch (authFlowState) {
      case 'WAITING_FOR_CODE':
        return (
          <div className="flex items-center gap-2 text-ink-2 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rule" />
            <span className="font-semibold text-ink">Waiting for code</span>
          </div>
        );
      case 'CODE_SENT':
        return (
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">Code sent to your email</span>
          </div>
        );
      case 'VERIFYING':
        return (
          <div className="flex items-center gap-2 text-accent font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <span className="font-semibold text-accent">Verifying...</span>
          </div>
        );
      case 'AUTHENTICATED':
        return (
          <div className="flex items-center gap-2 text-accent font-mono text-xs">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span className="font-semibold text-accent">Authenticated</span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-2 text-destructive font-mono text-xs">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="font-semibold text-destructive">Authentication Failed</span>
          </div>
        );
    }
  };

  return (
    <section id="passport" className="relative pt-8 pb-12 overflow-hidden border-b border-rule">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header & Agent Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-accent uppercase tracking-wider">
              // AGENT_IDENTITY_PASSPORT
            </span>
            <span className="text-rule text-xs">|</span>
            <span className="text-xs font-mono text-ink-2">
              Email OTP Verified Trust Protocol
            </span>
          </div>

          {/* Two Seeded Agent Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-paper-2 border border-rule">
            <span className="text-xs font-mono text-ink-2 px-2 hidden sm:inline">Active Agent:</span>
            {agents.map((agent) => (
              <button
                key={agent.agentId}
                onClick={() => onSelectAgent(agent.agentId)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  activeAgentId === agent.agentId
                    ? 'bg-accent text-accent-ink font-semibold shadow-sm'
                    : 'text-ink-2 hover:text-ink hover:bg-paper-3'
                }`}
              >
                {agent.name} ({agent.agentId})
              </button>
            ))}
          </div>
        </div>

        {/* Hero Grid: Passport Card (Left) + Stat Metrics (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: Agent Passport Card (5 cols) */}
          <div className="lg:col-span-5 bg-paper-2 rounded-xl border border-rule p-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className={`absolute top-0 left-0 right-0 h-1 ${isAuthenticated ? 'bg-accent' : 'bg-rule'}`} />

            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded border tracking-wide font-medium bg-paper-3 border-rule text-ink-2">
                      PASSPORT
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border tracking-wide font-medium ${tier.color}`}>
                      {tier.label}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-2">
                    {currentAgent?.name || 'Research Agent'}
                  </h2>
                  <p className="text-xs text-ink-2 font-mono mt-0.5">
                    Issuer: {currentAgent?.issuer}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-paper-3 border border-rule text-accent">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              {/* Single Clean Auth State Indicator */}
              <div className="my-5 p-4 rounded-lg bg-paper/80 border border-rule space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink-2">Auth State:</span>
                  {getAuthStateBadge()}
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink-2">Agent ID:</span>
                  <span className="text-ink font-semibold">{currentAgent?.agentId}</span>
                </div>
                {authStatusMessage && (
                  <p className="text-[11px] font-mono text-amber-300 pt-1 border-t border-rule/50">
                    {authStatusMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Email OTP Auth Action Controls */}
            <div className="space-y-3 pt-2">
              {!isAuthenticated ? (
                <div className="space-y-2">
                  {authFlowState !== 'CODE_SENT' && (
                    <button
                      onClick={onRequestOtp}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent text-accent-ink font-mono text-xs font-bold hover:bg-accent/90 transition-all disabled:opacity-50 shadow-sm"
                    >
                      <Mail className="w-4 h-4" />
                      1. Request OTP Code via Email
                    </button>
                  )}

                  {authFlowState === 'CODE_SENT' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={inputOtp}
                          onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP code"
                          className="flex-1 px-3 py-2 bg-paper border border-rule rounded-lg text-xs font-mono text-ink text-center tracking-widest placeholder:tracking-normal placeholder:text-ink-2/60 focus:outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => {
                            if (inputOtp.length === 6) {
                              onVerifyOtp(inputOtp);
                              setInputOtp('');
                            }
                          }}
                          disabled={isLoading || inputOtp.length !== 6}
                          className="px-4 py-2 bg-accent text-accent-ink font-mono text-xs font-bold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50"
                        >
                          Verify
                        </button>
                      </div>
                      <button
                        onClick={onRequestOtp}
                        disabled={isLoading}
                        className="text-[11px] font-mono text-ink-2 hover:text-ink underline block text-center w-full"
                      >
                        Resend Code
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-accent/10 border border-accent/30 text-accent font-mono text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Session Active
                    </span>
                    <span className="text-[10px] text-ink-2">Store Unlocked</span>
                  </div>
                  <button
                    onClick={onQuickAction}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-mono font-medium rounded-md bg-paper-3 border border-rule hover:border-accent text-ink hover:text-accent transition-all disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    Perform WebMCP Store Action
                  </button>
                </div>
              )}

              {/* Stress & Negative Tests */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <button
                  onClick={onTriggerSpam}
                  disabled={isLoading}
                  title="Burst 11 calls to test rate limiter"
                  className="flex items-center justify-center gap-1 p-2 rounded bg-paper-3 border border-rule text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Test 10/min Limit
                </button>
                <button
                  onClick={onTriggerInvalidOtp}
                  disabled={isLoading}
                  title="Submit wrong OTP code to test rejection and -10 score penalty"
                  className="flex items-center justify-center gap-1 p-2 rounded bg-paper-3 border border-rule text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" />
                  Test Bad OTP (-10)
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: 4 Stat-Led Metric Panels (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Stat 1: Deterministic Reputation Score */}
            <div className="bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between card-dark">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-ink-2 uppercase tracking-wide">
                  Reputation Score
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-paper-3 text-accent border border-rule">
                  Deterministic
                </span>
              </div>
              
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-ink">
                    {currentAgent?.reputation ?? 100}
                  </span>
                  <span className="text-base font-mono text-ink-2">/ 100</span>
                </div>
                <div className="w-full bg-paper-3 h-2 rounded-full overflow-hidden mt-3 border border-rule">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (currentAgent?.reputation ?? 100) >= 90
                        ? 'bg-accent'
                        : (currentAgent?.reputation ?? 100) >= 60
                        ? 'bg-amber-400'
                        : 'bg-destructive'
                    }`}
                    style={{ width: `${currentAgent?.reputation ?? 100}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-ink-2 font-mono mt-2">
                Starting: 100 · Failed: -1 · Rate-Limit: -5 · Bad Auth: -10
              </p>
            </div>

            {/* Stat 2: Per-Agent Independent Rate Limit */}
            <div className="bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between card-dark">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-ink-2 uppercase tracking-wide">
                  Per-Agent Rate Limit
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-paper-3 text-ink-2 border border-rule">
                  60s Sliding
                </span>
              </div>

              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-ink">
                    {rateLimitRemaining}
                  </span>
                  <span className="text-base font-mono text-ink-2">
                    / {rateLimitMax} remaining
                  </span>
                </div>

                <div className="w-full bg-paper-3 h-2 rounded-full overflow-hidden mt-3 border border-rule">
                  <div
                    className={`h-full transition-all duration-300 ${
                      rateLimitRemaining > 3 ? 'bg-accent' : rateLimitRemaining > 0 ? 'bg-amber-400' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.max(5, (rateLimitRemaining / rateLimitMax) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-2 font-mono mt-2">
                <span>Used: {rateLimitUsed} calls</span>
                <span className="text-accent">Independent Quota</span>
              </div>
            </div>

            {/* Stat 3: Total Actions */}
            <div className="bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between card-dark">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-ink-2 uppercase tracking-wide">
                  Action History
                </span>
                <Shield className="w-4 h-4 text-ink-2" />
              </div>

              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-ink">
                    {currentAgent?.totalActions ?? 0}
                  </span>
                  <span className="text-xs font-mono text-ink-2">total WebMCP calls</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-rule font-mono text-xs">
                  <div>
                    <span className="text-ink-2 block text-[11px]">Successful:</span>
                    <span className="text-accent font-semibold text-sm">
                      {currentAgent?.successfulActions ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2 block text-[11px]">Failed:</span>
                    <span className="text-destructive font-semibold text-sm">
                      {currentAgent?.failedActions ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-ink-2 font-mono">
                Persistent across browser sessions
              </p>
            </div>

            {/* Stat 4: Security & Violations Audit */}
            <div className="bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between card-dark">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-ink-2 uppercase tracking-wide">
                  Security Violations
                </span>
                <AlertTriangle className="w-4 h-4 text-ink-2" />
              </div>

              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${
                    ((currentAgent?.rateLimitViolations ?? 0) + (currentAgent?.authFailures ?? 0)) > 0
                      ? 'text-amber-400'
                      : 'text-ink'
                  }`}>
                    {(currentAgent?.rateLimitViolations ?? 0) + (currentAgent?.authFailures ?? 0)}
                  </span>
                  <span className="text-xs font-mono text-ink-2">flagged incidents</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-rule font-mono text-xs">
                  <div>
                    <span className="text-ink-2 block text-[11px]">Rate-Limit Hits:</span>
                    <span className="text-amber-400 font-semibold text-sm">
                      {currentAgent?.rateLimitViolations ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2 block text-[11px]">Auth Rejections:</span>
                    <span className="text-destructive font-semibold text-sm">
                      {currentAgent?.authFailures ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-ink-2 font-mono">
                Directly impacts agent reputation score
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
