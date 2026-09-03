import { Agent, AgentProfile, AgentReputation, AgentSession, AuditEvent, OtpChallenge, EventStatus } from './types';
import { DEMO_PRODUCTS, DemoProduct } from './products';

// Global in-memory singleton store
class IdentityPassportStore {
  private agents = new Map<string, Agent>();
  private reputations = new Map<string, AgentReputation>();
  private sessions = new Map<string, AgentSession>(); // token -> session
  private agentSessions = new Map<string, AgentSession>(); // agentId -> session
  private otpChallenges = new Map<string, OtpChallenge>(); // agentId -> OtpChallenge
  private rateLimits = new Map<string, number[]>(); // agentId -> timestamp[]
  private events: AuditEvent[] = [];
  private products: DemoProduct[] = [...DEMO_PRODUCTS];

  constructor() {
    this.reset();
  }

  public reset() {
    this.agents.clear();
    this.reputations.clear();
    this.sessions.clear();
    this.agentSessions.clear();
    this.otpChallenges.clear();
    this.rateLimits.clear();
    this.events = [];
    this.products = [...DEMO_PRODUCTS];

    this.seedAgents();
    this.seedInitialEvents();
  }

  private seedAgents() {
    const goodId = process.env.AGENT_ID_GOOD || 'agent_research_001';
    const badId = process.env.AGENT_ID_BAD || 'agent_untrusted_003';

    // 1. Good Agent (Verified Research Agent)
    this.agents.set(goodId, {
      agentId: goodId,
      name: 'Research Agent',
      issuer: 'WebMCP Open Registry',
      description: 'Certified research and automated commerce integration agent with verified enterprise credentials.',
      status: 'active',
      createdAt: '2026-08-15T08:00:00.000Z',
      rateLimitMaxPerMinute: 10,
    });

    this.reputations.set(goodId, {
      score: 100,
      successfulActions: 47,
      failedActions: 1,
      rateLimitViolations: 0,
      authFailures: 0,
      abuseEvents: 0,
      totalActions: 48,
    });

    // 2. Bad Agent (Untrusted Agent)
    this.agents.set(badId, {
      agentId: badId,
      name: 'Untrusted Agent',
      issuer: 'WebMCP Open Registry',
      description: 'High-risk automated scraper agent with history of compliance and rate-limit violations.',
      status: 'active',
      createdAt: '2026-09-01T14:15:00.000Z',
      rateLimitMaxPerMinute: 10, // same limit — reputation ≠ rate limit
    });

    this.reputations.set(badId, {
      score: 22,
      successfulActions: 3,
      failedActions: 9,
      rateLimitViolations: 4,
      authFailures: 6,
      abuseEvents: 2,
      totalActions: 12,
    });
  }

  private seedInitialEvents() {
    const goodId = process.env.AGENT_ID_GOOD || 'agent_research_001';
    const now = Date.now();
    const seeded: AuditEvent[] = [
      {
        id: 'evt_init_01',
        agentId: goodId,
        agentName: 'Research Agent',
        tool: 'authenticate_agent',
        action: 'otp_verified',
        status: 'SUCCESS',
        timestamp: new Date(now - 120000).toISOString(),
        reputationDelta: 0,
        reputationScoreAfter: 100,
        latencyMs: 45,
        details: { method: 'email_otp', status: 'session_established' },
      },
      {
        id: 'evt_init_02',
        agentId: goodId,
        agentName: 'Research Agent',
        tool: 'get_agent_profile',
        action: 'query_passport',
        status: 'SUCCESS',
        timestamp: new Date(now - 110000).toISOString(),
        reputationDelta: 0,
        reputationScoreAfter: 100,
        latencyMs: 12,
        details: { score: 100, status: 'active' },
      },
      {
        id: 'evt_init_03',
        agentId: goodId,
        agentName: 'Research Agent',
        tool: 'perform_demo_action',
        action: 'search_catalog',
        status: 'SUCCESS',
        timestamp: new Date(now - 90000).toISOString(),
        reputationDelta: 0,
        reputationScoreAfter: 100,
        latencyMs: 28,
        details: { query: 'sensor', resultsCount: 2 },
      },
    ];

    this.events = seeded;
  }

  // Agent retrieval
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Reputation Engine
  public getReputation(agentId: string): AgentReputation {
    if (!this.reputations.has(agentId)) {
      this.reputations.set(agentId, {
        score: 100,
        successfulActions: 0,
        failedActions: 0,
        rateLimitViolations: 0,
        authFailures: 0,
        abuseEvents: 0,
        totalActions: 0,
      });
    }
    return this.reputations.get(agentId)!;
  }

  public adjustReputation(agentId: string, reason: 'SUCCESS' | 'FAILED_ACTION' | 'RATE_LIMIT' | 'AUTH_FAILURE' | 'ABUSE'): { delta: number; newScore: number } {
    const rep = this.getReputation(agentId);
    let delta = 0;

    switch (reason) {
      case 'SUCCESS':
        delta = 0; // legitimate success maintains standing
        rep.successfulActions += 1;
        break;
      case 'FAILED_ACTION':
        delta = -1;
        rep.failedActions += 1;
        break;
      case 'RATE_LIMIT':
        delta = -5;
        rep.rateLimitViolations += 1;
        break;
      case 'AUTH_FAILURE':
        delta = -10;
        rep.authFailures += 1;
        break;
      case 'ABUSE':
        delta = -20;
        rep.abuseEvents += 1;
        break;
    }

    rep.totalActions += 1;
    rep.score = Math.max(0, Math.min(100, rep.score + delta));

    return { delta, newScore: rep.score };
  }

  // Rate Limiting (1-minute sliding window)
  public checkRateLimit(agentId: string): { allowed: boolean; maxPerMinute: number; used: number; remaining: number; resetInSeconds: number } {
    const agent = this.getAgent(agentId);
    const max = agent?.rateLimitMaxPerMinute || 10;
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    let timestamps = this.rateLimits.get(agentId) || [];
    // prune expired
    timestamps = timestamps.filter((t) => t > oneMinuteAgo);
    this.rateLimits.set(agentId, timestamps);

    const used = timestamps.length;
    const remaining = Math.max(0, max - used);
    const oldest = timestamps[0];
    const resetInSeconds = oldest ? Math.max(1, Math.ceil((oldest + 60000 - now) / 1000)) : 60;

    if (used >= max) {
      return {
        allowed: false,
        maxPerMinute: max,
        used,
        remaining: 0,
        resetInSeconds,
      };
    }

    return {
      allowed: true,
      maxPerMinute: max,
      used,
      remaining,
      resetInSeconds,
    };
  }

  public consumeRateLimit(agentId: string) {
    const now = Date.now();
    const timestamps = this.rateLimits.get(agentId) || [];
    timestamps.push(now);
    this.rateLimits.set(agentId, timestamps);
  }

  // OTP Challenge Lifecycle
  public createOtpChallenge(agentId: string, otp: string): OtpChallenge {
    const challenge: OtpChallenge = {
      agentId,
      otp,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min TTL
      used: false,
    };
    this.otpChallenges.set(agentId, challenge);
    return challenge;
  }

  public getPendingOtpChallenge(agentId: string): OtpChallenge | undefined {
    const ch = this.otpChallenges.get(agentId);
    if (!ch) return undefined;
    if (ch.used || new Date() > new Date(ch.expiresAt)) {
      return undefined;
    }
    return ch;
  }

  public verifyAndConsumeOtp(agentId: string, otp: string): { success: boolean; reason?: string } {
    const challenge = this.otpChallenges.get(agentId);
    if (!challenge) {
      return { success: false, reason: 'No pending authentication code for this agent. Request a code first.' };
    }
    if (challenge.used) {
      return { success: false, reason: 'Authentication code has already been used. Please request a new code.' };
    }
    if (new Date() > new Date(challenge.expiresAt)) {
      return { success: false, reason: 'Authentication code has expired (5 minute TTL). Please request a new code.' };
    }
    if (challenge.otp !== otp.trim()) {
      return { success: false, reason: 'Invalid authentication code.' };
    }

    // Mark as consumed
    challenge.used = true;
    return { success: true };
  }

  // Session lifecycle
  public createSession(agentId: string): AgentSession {
    const token = `wsession_${agentId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const session: AgentSession = {
      sessionId: `sess_${Date.now()}`,
      agentId,
      token,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    };

    this.sessions.set(token, session);
    this.agentSessions.set(agentId, session);
    return session;
  }

  public getSessionByToken(token: string): AgentSession | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(token);
      this.agentSessions.delete(session.agentId);
      return undefined;
    }
    return session;
  }

  public getSessionByAgentId(agentId: string): AgentSession | undefined {
    const session = this.agentSessions.get(agentId);
    if (!session) return undefined;
    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(session.token);
      this.agentSessions.delete(agentId);
      return undefined;
    }
    return session;
  }

  public clearSession(agentId: string) {
    const session = this.agentSessions.get(agentId);
    if (session) {
      this.sessions.delete(session.token);
      this.agentSessions.delete(agentId);
    }
  }

  // Audit Events
  public recordEvent(event: Omit<AuditEvent, 'id' | 'reputationScoreAfter'>): AuditEvent {
    const rep = this.getReputation(event.agentId);
    const auditEvent: AuditEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reputationScoreAfter: rep.score,
    };

    this.events.unshift(auditEvent);
    if (this.events.length > 200) {
      this.events = this.events.slice(0, 200);
    }

    return auditEvent;
  }

  public getEvents(agentId?: string, limit: number = 20): AuditEvent[] {
    if (agentId) {
      return this.events.filter((e) => e.agentId === agentId).slice(0, limit);
    }
    return this.events.slice(0, limit);
  }

  // Profile builder
  public getAgentProfile(agentId: string): AgentProfile | null {
    const agent = this.getAgent(agentId);
    if (!agent) return null;

    const rep = this.getReputation(agentId);
    const rl = this.checkRateLimit(agentId);

    return {
      agentId: agent.agentId,
      name: agent.name,
      issuer: agent.issuer,
      reputation: rep.score,
      successfulActions: rep.successfulActions,
      failedActions: rep.failedActions,
      rateLimitViolations: rep.rateLimitViolations,
      authFailures: rep.authFailures,
      totalActions: rep.totalActions,
      status: agent.status,
      createdAt: agent.createdAt,
      rateLimit: {
        maxPerMinute: rl.maxPerMinute,
        usedInCurrentWindow: rl.used,
        remaining: rl.remaining,
        resetInSeconds: rl.resetInSeconds,
      },
    };
  }

  // Product Catalog query for E-Commerce Store
  public queryProducts(query?: string): DemoProduct[] {
    let list = this.products;
    if (query && query.trim() !== '' && query !== '*') {
      const q = query.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const fullText = `${p.name} ${p.description} ${p.category} ${p.sku}`.toLowerCase();
        return fullText.includes(q) || terms.some((term) => fullText.includes(term));
      });
    }
    return list;
  }
}

// Global declaration to survive hot reloading in development
declare global {
  var __IDENTITY_PASSPORT_STORE__: IdentityPassportStore | undefined;
}

export const store = global.__IDENTITY_PASSPORT_STORE__ || new IdentityPassportStore();
if (process.env.NODE_ENV !== 'production') {
  global.__IDENTITY_PASSPORT_STORE__ = store;
}
