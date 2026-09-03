'use client';

import React from 'react';
import { Shield, Check, Lock, Mail, Server } from 'lucide-react';

export const WebMCPProtocolDoc: React.FC = () => {
  return (
    <section id="spec" className="py-12 border-b border-rule bg-paper-2/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-accent uppercase tracking-wider">
              // ARCHITECTURE_SPECIFICATION
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-paper-3 text-ink-2 border border-rule">
              WebMCP Protocol Standard
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            How WebMCP Identity &amp; Email OTP Operates
          </h2>
          <p className="text-sm text-ink-2 mt-1 max-w-2xl">
            Why WebMCP provides a direct browser-native bridge for autonomous AI agent authentication and trust enforcement.
          </p>
        </div>

        {/* ASCII Flow Diagram & Explanations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: Architecture ASCII Card (7 cols) */}
          <div className="lg:col-span-7 bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-ink-2 uppercase">
                  Runtime Sequence &amp; Execution Pipeline
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-paper-3 text-accent border border-rule">
                  document.modelContext
                </span>
              </div>

              <pre className="p-4 rounded-lg bg-paper border border-rule font-mono text-xs text-accent leading-relaxed overflow-x-auto select-none">
{` ChatGPT Browser Agent / Inspector
          │
          │ 1. Discovers WebMCP tools on document.modelContext
          ▼
 WebMCP Host Website
          │
          │ 2. Agent invokes authenticate_agent({ agentId })
          │ 3. Website sends 6-digit OTP code to recipient email
          │ 4. Human provides code from inbox
          │ 5. Agent invokes authenticate_agent({ agentId, otp })
          ▼
 Identity & Reputation API
          ├── 6. verify_otp(agentId, otp) [5-min single use]
          ├── 7. check_rate_limit(agentId) [Per-agent sliding window]
          ├── 8. execute_action(params) [Protected Storefront]
          ├── 9. record_audit_event()
          └── 10. derive_reputation_score() [100 - penalties]`}
              </pre>
            </div>

            <div className="mt-4 pt-4 border-t border-rule grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-ink-2">
              <div className="p-2.5 rounded bg-paper border border-rule">
                <div className="text-accent font-semibold mb-1">01. Identity</div>
                <div>Persistent Agent ID replaces anonymous browser sessions.</div>
              </div>
              <div className="p-2.5 rounded bg-paper border border-rule">
                <div className="text-accent font-semibold mb-1">02. Reputation</div>
                <div>Deterministic scoring based on historical compliance.</div>
              </div>
              <div className="p-2.5 rounded bg-paper border border-rule">
                <div className="text-accent font-semibold mb-1">03. Rate Limit</div>
                <div>Per-agent quota applies strictly regardless of reputation.</div>
              </div>
            </div>
          </div>

          {/* Right: Security & Boundaries Card (5 cols) */}
          <div className="lg:col-span-5 bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-accent" />
                <h3 className="text-base font-bold text-ink">
                  Key Security Principles
                </h3>
              </div>

              <ul className="space-y-3 font-mono text-xs text-ink-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Human-in-the-Loop OTP:</strong> One-time code arrives in the real inbox; no OTP values are leaked in tool responses or UI.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Single-Use Expiry:</strong> OTP codes carry a strict 5-minute TTL and are consumed immediately upon verification.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Session-Determined Identity:</strong> Protected actions rely solely on validated session tokens rather than caller claims.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Distinct Rate Limits:</strong> Good and untrusted agents are limited independently per identity.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-3 mt-4 rounded-lg bg-accent/10 border border-accent/30 text-xs font-mono text-ink">
              <span className="text-accent font-semibold block mb-0.5">// WebMCP Trust Model:</span>
              &quot;Websites can use verifiable agent identity as a trust signal instead of treating every automated browser interaction as anonymous.&quot;
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
