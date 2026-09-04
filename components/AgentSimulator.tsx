'use client';

import React, { useState } from 'react';
import { AgentProfile, AgentSession } from '@/lib/types';
import { Play, Check, AlertTriangle, Mail, Terminal, Zap, XCircle, RotateCcw, Copy, Code2, ArrowRight } from 'lucide-react';

interface AgentSimulatorProps {
  activeAgentId: string;
  agents: AgentProfile[];
  activeSession: AgentSession | null;
  onExecuteTool: (toolName: string, params: any) => Promise<any>;
  isLoading: boolean;
  onSelectAgent: (id: string) => void;
}

export const AgentSimulator: React.FC<AgentSimulatorProps> = ({
  activeAgentId,
  agents,
  activeSession,
  onExecuteTool,
  isLoading,
  onSelectAgent,
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('authenticate_agent');
  const [customOtp, setCustomOtp] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('LiDAR sensor');
  const [executionLog, setExecutionLog] = useState<{
    tool: string;
    input: any;
    output: any;
    status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED' | 'AUTH_FAILED';
    latencyMs: number;
    timestamp: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const currentAgent = agents.find((a) => a.agentId === activeAgentId) || agents[0];
  const isAuthenticated = !!activeSession && activeSession.agentId === activeAgentId;

  const handleRunTool = async (toolName: string, customParams?: any) => {
    const startTime = Date.now();
    try {
      let params: any = customParams;
      if (!params) {
        if (toolName === 'authenticate_agent') {
          // If OTP is typed in box, verify it; otherwise request code
          params = customOtp.trim()
            ? { agentId: activeAgentId, otp: customOtp.trim() }
            : {
                agentId: activeAgentId,
                ...(customEmail.trim() ? { email: customEmail.trim() } : {}),
              };
        } else if (toolName === 'get_agent_profile') {
          params = { agentId: activeAgentId };
        } else if (toolName === 'perform_demo_action') {
          params = { query: customQuery, agentId: activeAgentId };
        } else if (toolName === 'get_agent_history') {
          params = { agentId: activeAgentId, limit: 10 };
        }
      }

      const result = await onExecuteTool(toolName, params);
      setExecutionLog({
        tool: toolName,
        input: params,
        output: result,
        status: 'SUCCESS',
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setExecutionLog({
        tool: toolName,
        input: customParams || {},
        output: err?.data || { error: err?.message || 'Execution error' },
        status: err?.status === 429 ? 'RATE_LIMITED' : err?.status === 401 ? 'AUTH_FAILED' : 'ERROR',
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleCopyJson = () => {
    if (!executionLog) return;
    navigator.clipboard.writeText(JSON.stringify(executionLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="simulator" className="py-12 border-b border-rule bg-paper-2/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-accent uppercase tracking-wider">
                // WEBMCP_INSPECTOR_SIMULATOR
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-paper-3 text-accent border border-accent/30">
                Live Test Bench
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              WebMCP Agent Tool Execution Simulator
            </h2>
            <p className="text-sm text-ink-2 mt-1 max-w-2xl">
              Drive the exact WebMCP tool sequence exposed to ChatGPT and WebMCP Inspector extensions with authentic Email OTP validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-ink-2">Target Agent:</span>
            <select
              value={activeAgentId}
              onChange={(e) => onSelectAgent(e.target.value)}
              className="px-3 py-1.5 bg-paper border border-rule rounded-md text-xs font-mono text-accent font-medium focus:outline-none focus:border-accent"
            >
              {agents.map((a) => (
                <option key={a.agentId} value={a.agentId}>
                  {a.name} ({a.agentId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7-Step Demo Scenario Guided Bar */}
        <div className="mb-8 p-4 rounded-xl bg-paper border border-rule">
          <div className="text-xs font-mono text-ink-2 mb-3 flex items-center justify-between">
            <span className="text-accent font-semibold flex items-center gap-1.5">
              <Terminal className="w-4 h-4" /> 7-STEP WEBMCP DEMO SCENARIO:
            </span>
            <span>Active: {currentAgent?.name}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
            <button
              onClick={() => handleRunTool('authenticate_agent', { agentId: activeAgentId })}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-rule hover:border-accent text-left transition-all group"
            >
              <div className="text-[10px] text-accent font-semibold mb-1">STEP 1</div>
              <div className="text-ink font-medium group-hover:text-accent">Request OTP</div>
              <div className="text-[10px] text-ink-2 mt-0.5">Send Email Code</div>
            </button>

            <button
              onClick={() => {
                const code = prompt('Enter the 6-digit OTP code received in your inbox:');
                if (code) {
                  handleRunTool('authenticate_agent', { agentId: activeAgentId, otp: code.trim() });
                }
              }}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-rule hover:border-accent text-left transition-all group"
            >
              <div className="text-[10px] text-accent font-semibold mb-1">STEP 2</div>
              <div className="text-ink font-medium group-hover:text-accent">Verify OTP</div>
              <div className="text-[10px] text-ink-2 mt-0.5">Input Code</div>
            </button>

            <button
              onClick={() => handleRunTool('get_agent_profile')}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-rule hover:border-accent text-left transition-all group"
            >
              <div className="text-[10px] text-accent font-semibold mb-1">STEP 3</div>
              <div className="text-ink font-medium group-hover:text-accent">Get Profile</div>
              <div className="text-[10px] text-ink-2 mt-0.5">Score &amp; Rate Quota</div>
            </button>

            <button
              onClick={() => handleRunTool('perform_demo_action', { query: 'LiDAR', agentId: activeAgentId })}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-rule hover:border-accent text-left transition-all group"
            >
              <div className="text-[10px] text-accent font-semibold mb-1">STEP 4</div>
              <div className="text-ink font-medium group-hover:text-accent">Store Query</div>
              <div className="text-[10px] text-ink-2 mt-0.5">&quot;LiDAR&quot; Search</div>
            </button>

            <button
              onClick={async () => {
                for (let i = 0; i < 11; i++) {
                  await handleRunTool('perform_demo_action', { query: `burst_call_${i}`, agentId: activeAgentId });
                }
              }}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-amber-400/40 hover:border-amber-400 text-left transition-all group"
            >
              <div className="text-[10px] text-amber-400 font-semibold mb-1">STEP 5</div>
              <div className="text-amber-400 font-medium">Spam Burst</div>
              <div className="text-[10px] text-ink-2 mt-0.5">Trigger 10/min Limit</div>
            </button>

            <button
              onClick={() => handleRunTool('authenticate_agent', { agentId: activeAgentId, otp: '000000' })}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-destructive/40 hover:border-destructive text-left transition-all group"
            >
              <div className="text-[10px] text-destructive font-semibold mb-1">STEP 6</div>
              <div className="text-destructive font-medium">Wrong OTP</div>
              <div className="text-[10px] text-ink-2 mt-0.5">-10 Rep Penalty</div>
            </button>

            <button
              onClick={() => handleRunTool('get_agent_history')}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-paper-2 border border-rule hover:border-accent text-left transition-all group"
            >
              <div className="text-[10px] text-accent font-semibold mb-1">STEP 7</div>
              <div className="text-ink font-medium group-hover:text-accent">Audit Trail</div>
              <div className="text-[10px] text-ink-2 mt-0.5">Verify Log</div>
            </button>
          </div>
        </div>

        {/* Workbench Grid: Tool Configuration (Left) + Live JSON Terminal (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tool Selector & Input (5 cols) */}
          <div className="lg:col-span-5 bg-paper rounded-xl border border-rule p-5 space-y-4">
            <div>
              <label className="text-xs font-mono text-ink-2 uppercase block mb-2">
                Select WebMCP Tool:
              </label>
              <div className="space-y-2">
                {[
                  { name: 'authenticate_agent', desc: 'Email OTP Request / Verification' },
                  { name: 'get_agent_profile', desc: 'Read reputation score & rate quota' },
                  { name: 'perform_demo_action', desc: 'Search hardware store catalog' },
                  { name: 'get_agent_history', desc: 'Query immutable action history' },
                ].map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => setSelectedTool(tool.name)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedTool === tool.name
                        ? 'bg-paper-2 border-accent text-ink shadow-sm'
                        : 'bg-paper-2/40 border-rule text-ink-2 hover:border-rule hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs font-semibold">
                      <span className={selectedTool === tool.name ? 'text-accent' : ''}>
                        {tool.name}()
                      </span>
                      {selectedTool === tool.name && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <div className="text-[11px] text-ink-2 mt-1">{tool.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter Fields */}
            {selectedTool === 'authenticate_agent' && (
              <div className="pt-2 border-t border-rule space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-ink-2 uppercase block">
                    Recipient Email (optional, defaults to server recipient):
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. test@test.com"
                    className="w-full px-3 py-2 bg-paper-2 border border-rule rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-ink-2 uppercase block">
                    Optional OTP Code (leave empty to request code):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={customOtp}
                    onChange={(e) => setCustomOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 482913 (or leave blank to request)"
                    className="w-full px-3 py-2 bg-paper-2 border border-rule rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {selectedTool === 'perform_demo_action' && (
              <div className="pt-2 border-t border-rule space-y-2">
                <label className="text-xs font-mono text-ink-2 uppercase block">
                  Store Catalog Query:
                </label>
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="e.g. LiDAR, TPU, cooler"
                  className="w-full px-3 py-2 bg-paper-2 border border-rule rounded-md text-xs font-mono text-ink focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Execute Tool Button */}
            <div className="pt-2">
              <button
                onClick={() => handleRunTool(selectedTool)}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-accent text-accent-ink font-mono text-xs font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Invoke document.modelContext.{selectedTool}()
              </button>
            </div>
          </div>

          {/* Live JSON Inspector (7 cols) */}
          <div className="lg:col-span-7 bg-paper rounded-xl border border-rule overflow-hidden">
            <div className="px-4 py-3 bg-paper-2 border-b border-rule flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs">
                <Code2 className="w-4 h-4 text-accent" />
                <span className="text-ink font-semibold">WebMCP Execution Output</span>
                {executionLog && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded font-mono font-medium ${
                      executionLog.status === 'SUCCESS'
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : executionLog.status === 'RATE_LIMITED'
                        ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                        : 'bg-destructive/15 text-destructive border border-destructive/30'
                    }`}
                  >
                    {executionLog.status} ({executionLog.latencyMs}ms)
                  </span>
                )}
              </div>

              {executionLog && (
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] font-mono text-ink-2 hover:text-ink transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            <div className="p-4 font-mono text-xs min-h-[300px] max-h-[460px] overflow-y-auto bg-paper/95 text-ink-2">
              {executionLog ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] text-accent font-semibold mb-1">
                      &gt; Invoked: {executionLog.tool} [{executionLog.timestamp}]
                    </div>
                    <div className="text-[11px] text-ink-2 mb-1">// Input Arguments:</div>
                    <pre className="p-2.5 rounded bg-paper-2 border border-rule text-ink overflow-x-auto text-[11px] leading-relaxed">
                      {JSON.stringify(executionLog.input, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className="text-[11px] text-ink-2 mb-1">// Result Payload:</div>
                    <pre
                      className={`p-2.5 rounded border overflow-x-auto text-[11px] leading-relaxed ${
                        executionLog.status === 'SUCCESS'
                          ? 'bg-paper-2 border-rule text-ink'
                          : executionLog.status === 'RATE_LIMITED'
                          ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                          : 'bg-destructive/10 border-destructive/40 text-red-300'
                      }`}
                    >
                      {JSON.stringify(executionLog.output, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 text-ink-2/60">
                  <Terminal className="w-8 h-8 mb-2 opacity-50 text-accent" />
                  <p className="text-xs">Select a tool or click a step above to invoke WebMCP.</p>
                  <p className="text-[11px] mt-1 text-ink-2/40">
                    Live execution payloads, OTP responses, and reputation updates will stream here.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
