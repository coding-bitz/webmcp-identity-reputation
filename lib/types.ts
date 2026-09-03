export type AgentStatus = 'active' | 'suspended' | 'revoked';

export type EventStatus = 'SUCCESS' | 'RATE_LIMITED' | 'AUTH_FAILED' | 'INVALID_PARAMS' | 'ERROR';

export type DemoFlowState =
  | 'WAITING_FOR_CODE'   // Screen 1 — nothing sent yet
  | 'CODE_SENT'          // Screen 2 — OTP emailed, waiting for agent to submit it
  | 'VERIFYING'          // Screen 3 (first half) — otp submitted, checking it
  | 'REVEALING'          // Screen 3 (second half) — verified true, ~4s reveal of identity/reputation before advancing
  | 'AUTHENTICATED'      // Screen 4 — storefront unlocked
  | 'FAILED';            // error state, can occur from CODE_SENT or VERIFYING

export interface Agent {
  agentId: string;
  name: string;
  issuer: string;
  description: string;
  status: AgentStatus;
  createdAt: string;
  rateLimitMaxPerMinute: number;
}

export interface AgentReputation {
  score: number; // 0 - 100
  successfulActions: number;
  failedActions: number;
  rateLimitViolations: number;
  authFailures: number;
  abuseEvents: number;
  totalActions: number;
}

export interface AgentProfile {
  agentId: string;
  name: string;
  issuer: string;
  reputation: number;
  successfulActions: number;
  failedActions: number;
  rateLimitViolations: number;
  authFailures: number;
  totalActions: number;
  status: AgentStatus;
  createdAt: string;
  rateLimit: {
    maxPerMinute: number;
    usedInCurrentWindow: number;
    remaining: number;
    resetInSeconds: number;
  };
}

export interface AgentSession {
  sessionId: string;
  agentId: string;
  token: string;
  authenticatedAt: string;
  expiresAt: string;
}

export interface OtpChallenge {
  agentId: string;
  otp: string;
  createdAt: string;
  expiresAt: string; // createdAt + 5 minutes
  used: boolean;
}

export interface AuditEvent {
  id: string;
  agentId: string;
  agentName: string;
  tool: string;
  action: string;
  status: EventStatus;
  timestamp: string;
  reputationDelta: number;
  reputationScoreAfter: number;
  latencyMs?: number;
  details?: Record<string, any>;
}

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  handler: (input: any) => Promise<any>;
}

export type { DemoProduct } from './products';
