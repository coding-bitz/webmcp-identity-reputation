# WebMCP Identity and Reputation Layer

**Native WebMCP authentication, email OTP verification, a deterministic reputation engine, and per-agent rate limiting, for autonomous AI agents.**

---

> ### Scope of this prototype
> This project is a reference implementation built to validate a specific pattern: that a backend can sustain a per-agent reputation and audit engine, and dynamically adjust interaction limits based on each agent's history. That part of the system is real and functional end to end.
>
> What is still intentionally scoped down: the **identity registry**. For this prototype we work with two control identities, seeded through environment variables (`AGENT_ID_GOOD` and `AGENT_ID_BAD`), instead of an open registry where any agent can enroll. This was a scoping decision, not a technical limitation of the approach: it let us build and demonstrate the trust engine (reputation, auditing, differentiated limits) before tackling the harder and more important question of the project, which is who administers the identity registry at scale (see Section 7). That question is exactly the focus of what's next.
>
> The email OTP flow itself is real (via [Resend](https://resend.com)): it generates a code, sends it, and requires a human to confirm it before the agent's session is activated. What doesn't exist yet is an external identity-verification backend behind that code. See [`spec.md`](./spec.md) for the full protocol detail and roadmap.

---

## 1. Overview

WebMCP lets websites expose application actions directly to AI agents (such as ChatGPT, Claude, or autonomous browser agents) via `document.modelContext`. But that opens up an underlying problem:

> *Who is this agent, and should it be trusted with sensitive operations?*

**WebMCP Auth** answers that question with two pieces working together. The first is an email OTP authentication handshake that requires human confirmation before activating a session. The second, and the more central piece of the project, is a deterministic reputation engine that records every action as an auditable event and adjusts, in real time, how much each agent is allowed to do based on its history. Rather than treating automated agents as anonymous browser sessions or relying on brittle IP-based heuristics, the site maintains a persistent identity per agent, with a traceable history and its own limits.

---

## 2. Architecture and WebMCP flow

```text
 AI Agent (browser / inspector)
          │
          │ 1. Discovers WebMCP tools on document.modelContext
          ▼
 WebMCP Host Website
          │
          │ 2. The agent calls authenticate_agent({ agentId })
          │ 3. The site sends a 6-digit OTP to the registered email
          │ 4. A human provides the code from their inbox
          │ 5. The agent calls authenticate_agent({ agentId, otp })
          ▼
 Identity and Reputation Engine
          ├── 6. verify_otp(agentId, otp) [5-minute TTL, single use]
          ├── 7. check_rate_limit(agentId) [per-agent sliding window]
          ├── 8. execute_action(params) [protected action]
          ├── 9. record_audit_event() → AuditEvent
          └── 10. derive_reputation_score()
```

---

## 3. WebMCP tools exposed to agents

> For the full protocol detail (request/response schemas, sequence diagram, and integration roadmap) see [`spec.md`](./spec.md).

The application registers 4 tools directly on `document.modelContext.registerTool()`, with a retry-and-cleanup mechanism for the registration lifecycle:

### `authenticate_agent`
Runs a two-phase OTP verification flow:
- **Call 1 (request code):** `{ agentId: string }` sends the code to the registered email via Resend.
- **Call 2 (complete authentication):** `{ agentId: string, otp: string }` verifies the code and creates an authenticated session.
- **Output:** `{ authenticated: boolean, agentId: string, token: string, sessionId: string, profile: AgentProfile }`
- **Auditing (`AuditEvent`):** each phase (code sent, verification failed, session created) is recorded as its own event, with its associated reputation delta.

### `get_agent_profile`
Queries identity credentials, deterministic reputation score (0 to 100), and the current rate-limit status.
- **Input:** `{ agentId: string }`
- **Output:** `{ agentId: string, name: string, reputation: number, rateLimit: object, ... }`

### `perform_demo_action`
Runs an authenticated query against the store catalog, subject to the agent's rate limit.
- **Input:** `{ query: string, agentId?: string }`
- **Output:** `{ success: boolean, result: object, reputation: number, rateLimit: object }`
- **Auditing (`AuditEvent`):** every execution, successful or failed, is recorded as an event that feeds the agent's reputation score.

### `get_agent_history`
Retrieves the chronological, auditable trail of actions on the site.
- **Input:** `{ agentId?: string, limit?: number }`
- **Output:** `{ events: AuditEvent[], count: number }`

### The `AuditEvent` object
This is the system's central unit of traceability. Every event generated by `authenticate_agent` or `perform_demo_action` is recorded with: the agent, the tool invoked, the action, its outcome, the reputation delta applied, the resulting score, latency, and a timestamp. That record is what makes it possible to audit an agent's behavior over time, instead of treating each call as an isolated, memoryless event.

---

## 4. Deterministic reputation engine

Reputation scores start at **100** and adjust deterministically, with explicit, traceable rules:
- **Legitimate successful action:** `+0` (maintains the score)
- **Failed action:** `-1`
- **Rate-limit violation:** `-5`
- **Authentication failure or invalid code:** `-10`
- **Abusive action:** `-20`

There's no machine-learning scoring and no hidden weighting between agents: every score change maps to exactly one named rule.

---

## 5. Control identities for this prototype

> These are, for now, the only two identities the system recognizes (see the scope note at the top of this document). This is a fixed control set, meant to demonstrate the reputation engine and differentiated limits, not an open registry yet.

Agent identifiers are defined via environment variables:
- `AGENT_ID_GOOD`: high-reputation agent (starts at 100)
- `AGENT_ID_BAD`: low-trust agent (starts at 22, with a history of violations)

Both agents share the same rate limit (10 actions per minute) to demonstrate a key design point: **reputation and rate limit are independent signals**. A low-reputation agent isn't automatically more rate-restricted; the system can combine both signals however each site needs.

---

## 6. Getting started

### Prerequisites
- Node.js 18+ or 20+

### Environment configuration
Copy `.env.example` to `.env.local`:
```bash
AGENT_ID_GOOD=agent_research_001
AGENT_ID_BAD=agent_untrusted_003
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Your App <no-reply@yourdomain.com>
OTP_RECIPIENT_EMAILS=your_email@example.com
```

### Installation and run

```bash
npm install
npm run dev
```

Or for production:

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. What's next

The next step is moving the authentication layer toward a more robust scheme, aligned with 2FA compliance standards. But the central focus of the project remains identity and reputation per agent, and there's a fundamental decision still pending: should this be administered by a centralized provider, or should it be a public, auditable registry? This isn't a decision we'll make out of preference for any particular technology, but with an eye toward what format could become a standard the industry shares. The full detail of this roadmap is in [`spec.md`](./spec.md).
# WebMCP Identity Passport

**WebMCP-native identity, Email OTP authentication, deterministic reputation, and independent rate-limiting layer for autonomous AI agents.**

---

## 1. Overview

WebMCP allows websites to expose application actions directly to AI agents (such as ChatGPT, Claude, and autonomous browser agents) via `document.modelContext`. However, websites still face a fundamental trust problem:

> *"Who is this agent, and should I trust it with high-privilege operations?"*

**WebMCP Identity Passport** solves this by establishing persistent, human-verified agent identities using a two-phase Email OTP handshake. Rather than treating automated agents as anonymous browser sessions or relying on brittle IP heuristics, the website verifies the agent's identity code, maintains an auditable action history, computes a deterministic reputation score, and enforces per-agent rate limits.

---

## 2. Architecture & WebMCP Flow

```text
 ChatGPT Browser Agent / Inspector
          │
          │ 1. Discovers WebMCP tools on document.modelContext
          ▼
 WebMCP Host Website (Apex Compute & Autonomous Systems)
          │
          │ 2. Agent invokes authenticate_agent({ agentId })
          │ 3. Website dispatches 6-digit OTP code to recipient email
          │ 4. Human provides code from inbox
          │ 5. Agent invokes authenticate_agent({ agentId, otp })
          ▼
 Identity & Reputation Engine
          ├── 6. verify_otp(agentId, otp) [5-minute single-use TTL]
          ├── 7. check_rate_limit(agentId) [Per-agent sliding window]
          ├── 8. execute_action(params) [Protected Storefront]
          ├── 9. record_audit_event()
          └── 10. derive_reputation_score()
```

---

## 3. WebMCP Tools Exposed to Agents

The application registers the following 4 tools directly with `document.modelContext.registerTool()` using a robust retry-with-timeout lifecycle mechanism:

### `authenticate_agent`
Performs a two-phase Email OTP verification flow:
- **Call 1 (Request Code):** `{ agentId: string }` → Sends code to registered email address via Resend.
- **Call 2 (Complete Auth):** `{ agentId: string, otp: string }` → Verifies code and creates authenticated session.
- **Output:** `{ authenticated: boolean, agentId: string, token: string, sessionId: string, profile: AgentProfile }`

### `get_agent_profile`
Queries identity credentials, deterministic reputation score (0–100), and active rate-limit status.
- **Input:** `{ agentId: string }`
- **Output:** `{ agentId: string, name: string, reputation: number, rateLimit: object, ... }`

### `perform_demo_action`
Executes an authenticated store query or views hardware catalog products post-authentication.
- **Input:** `{ query: string, agentId?: string }`
- **Output:** `{ success: boolean, result: object, reputation: number, rateLimit: object }`

### `get_agent_history`
Retrieves the chronological audit trail and activity log of recent WebMCP actions.
- **Input:** `{ agentId?: string, limit?: number }`
- **Output:** `{ events: AuditEvent[], count: number }`

---

## 4. Deterministic Reputation Engine

Reputation scores start at **100** and adjust deterministically:
- **Legitimate successful action:** `+0` (maintains standing)
- **Failed action:** `-1`
- **Rate-limit violation:** `-5`
- **Authentication failure / invalid code:** `-10`
- **Abusive action:** `-20`

---

## 5. Seeded Agent Identities

Agent IDs are provided via environment variables:
- `AGENT_ID_GOOD` — High reputation agent (starts at 100)
- `AGENT_ID_BAD` — Untrusted agent (starts at 22 with past violations)

Both agents share the same rate limit (10 actions/minute) to demonstrate that **reputation ≠ rate limit**.

---

## 6. Getting Started

### Prerequisites
- Node.js 24+

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
AGENT_ID_GOOD=agent_research_001
AGENT_ID_BAD=agent_untrusted_003
RESEND_API_KEY=re_your_api_key_here
OTP_RECIPIENT_EMAILS=your_email@example.com
```

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
