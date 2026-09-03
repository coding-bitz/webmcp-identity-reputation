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
- Node.js 18+ or 20+

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
