'use client';

import React, { useState } from 'react';
import { AuditEvent } from '@/lib/types';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, ChevronDown, ChevronRight, Shield, Filter } from 'lucide-react';

interface AuditLogStreamProps {
  events: AuditEvent[];
  activeAgentId?: string;
  onFilterAgent?: (agentId: string) => void;
}

export const AuditLogStream: React.FC<AuditLogStreamProps> = ({ events, activeAgentId }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  });

  const getStatusBadge = (status: AuditEvent['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-accent/15 text-accent border border-accent/30">
            <CheckCircle2 className="w-3 h-3" /> SUCCESS
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-400/15 text-amber-400 border border-amber-400/30">
            <AlertTriangle className="w-3 h-3" /> RATE_LIMITED
          </span>
        );
      case 'AUTH_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-destructive/15 text-destructive border border-destructive/30">
            <XCircle className="w-3 h-3" /> AUTH_FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-paper-3 text-ink-2 border border-rule">
            {status}
          </span>
        );
    }
  };

  const getReputationBadge = (delta: number) => {
    if (delta === 0) return <span className="text-ink-2 text-[11px] font-mono">±0</span>;
    if (delta < 0) return <span className="text-destructive text-[11px] font-mono font-bold">{delta}</span>;
    return <span className="text-accent text-[11px] font-mono font-bold">+{delta}</span>;
  };

  return (
    <section id="audit" className="py-12 border-b border-rule bg-paper relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-accent uppercase tracking-wider">
                // AREA_C · AUDIT_LOG_TELEMETRY
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-paper-3 text-ink-2 border border-rule">
                Real-Time WebMCP Event Stream
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Cryptographic Audit Trail &amp; Reputation History
            </h2>
            <p className="text-sm text-ink-2 mt-1 max-w-2xl">
              Chronological log of all WebMCP tool invocations, authentication attempts, rate-limit triggers, and deterministic reputation adjustments.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Filter className="w-3.5 h-3.5 text-ink-2 mr-1" />
            {['ALL', 'SUCCESS', 'RATE_LIMITED', 'AUTH_FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterStatus === st
                    ? 'bg-accent text-accent-ink font-semibold'
                    : 'bg-paper-2 text-ink-2 hover:text-ink border border-rule'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Event Table Container */}
        <div className="bg-paper-2 rounded-xl border border-rule overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-paper-3/80 border-b border-rule text-ink-2 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Agent ID</th>
                  <th className="py-3 px-4">WebMCP Tool</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Score Delta</th>
                  <th className="py-3 px-4 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {filteredEvents.map((event) => {
                  const isExpanded = expandedEventId === event.id;
                  const timeStr = new Date(event.timestamp).toLocaleTimeString();

                  return (
                    <React.Fragment key={event.id}>
                      <tr
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className={`hover:bg-paper-3/50 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-paper-3/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-ink-2">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-ink-2 whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-3 px-4 text-ink font-medium whitespace-nowrap">
                          <span className={event.agentId === activeAgentId ? 'text-accent' : ''}>
                            {event.agentId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-accent font-semibold whitespace-nowrap">
                          {event.tool}()
                        </td>
                        <td className="py-3 px-4 text-ink-2 whitespace-nowrap">
                          {event.action}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(event.status)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getReputationBadge(event.reputationDelta)}
                        </td>
                        <td className="py-3 px-4 text-right text-ink-2 whitespace-nowrap">
                          {event.latencyMs ? `${event.latencyMs}ms` : '—'}
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-paper/80 border-b border-rule">
                          <td colSpan={8} className="py-3 px-8">
                            <div className="space-y-2 text-[11px] text-ink-2">
                              <div className="flex items-center justify-between text-ink">
                                <span>Event ID: <code className="text-accent">{event.id}</code></span>
                                <span>Reputation Score After: <strong className="text-ink">{event.reputationScoreAfter} / 100</strong></span>
                              </div>
                              {event.details && (
                                <div className="mt-2">
                                  <span className="text-ink-2 block mb-1">// Event Payload &amp; Verification Details:</span>
                                  <pre className="p-3 rounded bg-paper-2 border border-rule text-ink overflow-x-auto text-[11px] leading-relaxed">
                                    {JSON.stringify(event.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-2">
                      No audit events recorded under &quot;{filterStatus}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
