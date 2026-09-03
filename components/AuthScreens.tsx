'use client';

import React from 'react';
import { AgentProfile, DemoFlowState } from '@/lib/types';
import { Lock, Mail, KeyRound, CheckCircle2, XCircle, RotateCcw, UserCheck, Shield, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  agents: AgentProfile[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  onRequestOtp: () => void;
  isLoading: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  agents,
  activeAgentId,
  onSelectAgent,
  onRequestOtp,
  isLoading,
}) => {
  const currentAgent = agents.find((a) => a.agentId === activeAgentId) || agents[0];

  return (
    <div className="py-20 max-w-2xl mx-auto px-4 text-center animate-fade-in">
      <div className="p-8 sm:p-12 rounded-2xl bg-paper-2 border border-rule shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rule via-accent to-rule" />

        {/* Agent Switcher */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <span className="text-xs font-mono text-ink-2 mr-1">Target Agent:</span>
          {agents.map((agent) => (
            <button
              key={agent.agentId}
              onClick={() => onSelectAgent(agent.agentId)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                activeAgentId === agent.agentId
                  ? 'bg-accent text-accent-ink font-semibold shadow-sm'
                  : 'bg-paper text-ink-2 hover:text-ink border border-rule'
              }`}
            >
              {agent.name}
            </button>
          ))}
        </div>

        {/* Icon & Landmark */}
        <div className="w-14 h-14 mx-auto rounded-full bg-paper-3 border border-rule flex items-center justify-center text-accent mb-5">
          <Lock className="w-7 h-7" />
        </div>

        <div className="inline-block px-3 py-1 rounded font-mono text-xs bg-paper-3 border border-rule text-accent mb-3">
          // SCREEN_1 · AGENT_AUTHENTICATION
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
          Agent Detected. Waiting for authentication.
        </h2>

        <p className="text-sm text-ink-2 max-w-md mx-auto mb-6 leading-relaxed">
          The agent must invoke <code className="text-accent bg-paper px-1.5 py-0.5 rounded border border-rule text-xs">authenticate_agent(&#123; agentId: &quot;{currentAgent?.agentId}&quot; &#125;)</code> via WebMCP to request a one-time verification code.
        </p>

        <div className="p-4 rounded-xl bg-paper/80 border border-rule font-mono text-xs text-left max-w-md mx-auto mb-8 space-y-2">
          <div className="flex justify-between">
            <span className="text-ink-2">Agent ID:</span>
            <span className="text-ink font-semibold">{currentAgent?.agentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-2">Identity Name:</span>
            <span className="text-ink">{currentAgent?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-2">Status:</span>
            <span className="text-amber-400 font-medium">Awaiting WebMCP Handshake</span>
          </div>
        </div>

        <button
          onClick={onRequestOtp}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-ink font-mono text-xs font-bold hover:bg-accent/90 transition-all shadow-md disabled:opacity-50"
        >
          <Mail className="w-4 h-4" />
          Request Code via Email (Manual Trigger)
        </button>
      </div>
    </div>
  );
};

interface CodeSentScreenProps {
  statusMessage?: string;
  agentId: string;
}

export const CodeSentScreen: React.FC<CodeSentScreenProps> = ({ statusMessage, agentId }) => {
  return (
    <div className="py-20 max-w-2xl mx-auto px-4 text-center animate-fade-in">
      <div className="p-8 sm:p-12 rounded-2xl bg-paper-2 border border-amber-400/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-pulse" />

        <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-5 animate-pulse">
          <Mail className="w-7 h-7" />
        </div>

        <div className="inline-block px-3 py-1 rounded font-mono text-xs bg-amber-400/15 border border-amber-400/30 text-amber-300 mb-3">
          // SCREEN_2 · CODE_DISPATCHED
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
          Check your email for a 6-digit code.
        </h2>

        <p className="text-sm text-ink-2 max-w-md mx-auto mb-6 leading-relaxed">
          A one-time verification code has been dispatched. Provide the code to the agent so it can submit <code className="text-accent bg-paper px-1.5 py-0.5 rounded border border-rule text-xs">authenticate_agent(&#123; agentId: &quot;{agentId}&quot;, otp: &quot;...&quot; &#125;)</code>.
        </p>

        <div className="p-4 rounded-xl bg-paper/80 border border-rule font-mono text-xs max-w-md mx-auto text-ink-2 space-y-1">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Waiting for agent to submit OTP code
          </div>
          <p className="text-[11px] text-ink-2/70 pt-1">
            (Code expires in 5 minutes · Single-use)
          </p>
        </div>
      </div>
    </div>
  );
};

interface RevealScreenProps {
  state: 'VERIFYING' | 'REVEALING';
  agent?: AgentProfile;
  reputationScore?: number;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({ state, agent, reputationScore = 100 }) => {
  if (state === 'VERIFYING') {
    return (
      <div className="py-20 max-w-2xl mx-auto px-4 text-center animate-fade-in">
        <div className="p-8 sm:p-12 rounded-2xl bg-paper-2 border border-rule shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 mx-auto rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center text-accent mb-5 animate-pulse">
            <KeyRound className="w-7 h-7 animate-spin" />
          </div>

          <div className="inline-block px-3 py-1 rounded font-mono text-xs bg-accent/15 border border-accent/30 text-accent mb-3">
            // SCREEN_3 · VERIFICATION
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-2">
            Verifying code...
          </h2>
          <p className="text-sm text-ink-2 max-w-md mx-auto">
            Validating one-time authentication code and retrieving reputation record.
          </p>
        </div>
      </div>
    );
  }

  // REVEALING State (~4s dwell time)
  const isHighRep = (reputationScore ?? 100) >= 90;

  return (
    <div className="py-20 max-w-2xl mx-auto px-4 text-center animate-fade-in">
      <div className="p-8 sm:p-12 rounded-2xl bg-paper-2 border border-accent/40 shadow-2xl relative overflow-hidden glow-emerald">
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />

        <div className="w-14 h-14 mx-auto rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-accent mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded font-mono text-xs bg-accent/15 border border-accent/30 text-accent mb-3">
          // SCREEN_3 · IDENTITY_CONFIRMED
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-2">
          Identity Confirmed.
        </h2>
        <p className="text-sm text-ink-2 max-w-md mx-auto mb-6">
          Cryptographic session established. Unlocking protected hardware store...
        </p>

        {/* Real Identity & Reputation Card */}
        <div className="p-6 rounded-xl bg-paper border border-rule font-mono text-left max-w-md mx-auto space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <div>
              <span className="text-[10px] text-ink-2 uppercase block">Agent Identity</span>
              <span className="text-base font-bold text-ink">{agent?.name}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
              {isHighRep ? 'TIER 1 · VERIFIED' : 'TIER 3 · PROBATION'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-ink-2 block text-[11px]">Agent ID:</span>
              <span className="text-ink font-semibold">{agent?.agentId}</span>
            </div>
            <div>
              <span className="text-ink-2 block text-[11px]">Reputation Score:</span>
              <span className={`text-base font-bold ${isHighRep ? 'text-accent' : 'text-destructive'}`}>
                {reputationScore} / 100
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-rule text-[11px] text-accent flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Redirecting to protected storefront in a moment...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FailedScreenProps {
  message?: string;
  onRetry: () => void;
}

export const FailedScreen: React.FC<FailedScreenProps> = ({ message, onRetry }) => {
  return (
    <div className="py-20 max-w-2xl mx-auto px-4 text-center animate-fade-in">
      <div className="p-8 sm:p-12 rounded-2xl bg-paper-2 border border-destructive/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />

        <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center text-destructive mb-5">
          <XCircle className="w-7 h-7" />
        </div>

        <div className="inline-block px-3 py-1 rounded font-mono text-xs bg-destructive/15 border border-destructive/30 text-destructive mb-3">
          // AUTHENTICATION_FAILED
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
          Authentication Failed
        </h2>

        <p className="text-sm text-ink-2 max-w-md mx-auto mb-6 leading-relaxed">
          {message || 'Invalid or expired code. Reputation score penalized (-10).'}
        </p>

        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-paper-3 border border-rule hover:border-accent text-ink hover:text-accent font-mono text-xs font-bold transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Retry Authentication Flow
        </button>
      </div>
    </div>
  );
};
