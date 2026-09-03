/**
 * WebMCP Tool Registration & Lifecycle Manager
 * Implements document.modelContext.registerTool lifecycle per WebMCP specification.
 */

import { WebMCPToolDefinition } from './types';

export const WEBMCP_TOOLS: WebMCPToolDefinition[] = [
  {
    name: 'authenticate_agent',
    description: 'Authenticate an AI agent using a two-step Email OTP flow. Omit otp on first call to request a code; provide otp on second call to complete authentication.',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The persistent agent identifier to authenticate as',
        },
        otp: {
          type: 'string',
          description: 'The 6-digit one-time code received via email. Omit this field on the first call to request a code; include it on the second call to complete authentication.',
        },
      },
      required: ['agentId'],
    },
    handler: async (input: { agentId: string; otp?: string }) => {
      const res = await fetch('/api/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        const error: any = new Error(data.message || data.error || 'Authentication failed');
        error.status = res.status;
        error.data = data;
        throw error;
      }
      return data;
    },
  },
  {
    name: 'get_agent_profile',
    description: 'Query identity, deterministic reputation score, trust metrics, and active rate limits for an agent.',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The persistent agent ID to query profile for',
        },
      },
      required: ['agentId'],
    },
    handler: async (input: { agentId: string }) => {
      const res = await fetch(`/api/agents/${encodeURIComponent(input.agentId)}/profile`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch agent profile');
      }
      return data;
    },
  },
  {
    name: 'perform_demo_action',
    description: 'Perform an authenticated store query or view hardware catalog products post-authentication. Subject to per-agent rate limits.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword for hardware catalog products (e.g., "LiDAR", "accelerator", "thermal", "sensor")',
        },
        agentId: {
          type: 'string',
          description: 'The authenticated agent ID',
        },
      },
      required: ['query'],
    },
    handler: async (input: { query?: string; agentId?: string; token?: string }) => {
      const res = await fetch('/api/actions/perform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        const error: any = new Error(data.message || data.error || 'Action failed');
        error.status = res.status;
        error.data = data;
        throw error;
      }
      return data;
    },
  },
  {
    name: 'get_agent_history',
    description: 'Retrieve the chronological audit trail and activity log of actions performed on this website.',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Optional agentId to filter history by, or omit for all recent activity',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of event records to return (1-50)',
          default: 10,
        },
      },
    },
    handler: async (input: { agentId?: string; limit?: number }) => {
      const url = `/api/agents/${encodeURIComponent(input?.agentId || 'all')}/history?limit=${input?.limit || 10}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch agent history');
      }
      return data;
    },
  },
];

// Module-level tracking to prevent duplicate registration
const activeDisposers: Map<string, () => void> = new Map();

/**
 * Registers WebMCP tools with document.modelContext with retry-with-timeout and duplicate protection.
 * Returns a cleanup function to safely unregister on unmount.
 */
export function registerWebMCPTools(
  onToolInvoked?: (toolName: string, input: any, result: any, error?: any) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let cancelled = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 50; // 50 * 100ms = 5s max wait
  const RETRY_MS = 100;

  function cleanupTools() {
    activeDisposers.forEach((dispose) => {
      try {
        dispose();
      } catch {}
    });
    activeDisposers.clear();

    const modelContext = (document as any).modelContext;
    if (modelContext && typeof modelContext.unregisterTool === 'function') {
      WEBMCP_TOOLS.forEach((tool) => {
        try {
          modelContext.unregisterTool(tool.name);
        } catch {}
      });
    }
  }

  function tryRegister() {
    if (cancelled) return;
    attempts++;

    const modelContext = (document as any).modelContext;
    const ready = modelContext && typeof modelContext.registerTool === 'function';

    if (ready) {
      // First clean up any existing disposers
      cleanupTools();

      WEBMCP_TOOLS.forEach((tool) => {
        try {
          const wrappedHandler = async (input: any) => {
            try {
              const result = await tool.handler(input);
              onToolInvoked?.(tool.name, input, result);
              return result;
            } catch (err: any) {
              onToolInvoked?.(tool.name, input, null, err);
              throw err;
            }
          };

          // If unregisterTool method exists on modelContext, ensure name is free first
          if (typeof modelContext.unregisterTool === 'function') {
            try {
              modelContext.unregisterTool(tool.name);
            } catch {}
          }

          const unregister = modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: wrappedHandler, // Key name 'execute' per WebMCP spec
          });

          if (typeof unregister === 'function') {
            activeDisposers.set(tool.name, unregister);
          } else if (typeof modelContext.unregisterTool === 'function') {
            activeDisposers.set(tool.name, () => modelContext.unregisterTool(tool.name));
          }
        } catch (regErr: any) {
          // If already registered or Duplicate tool name, handle gracefully
          if (regErr?.name === 'InvalidStateError' || regErr?.message?.includes('Duplicate')) {
            console.warn(`[WebMCP] Tool '${tool.name}' is already registered in modelContext.`);
          } else {
            console.warn(`[WebMCP] Could not register tool '${tool.name}':`, regErr);
          }
        }
      });

      console.log(`[WebMCP] Registered ${WEBMCP_TOOLS.length} tools with document.modelContext`);
      return;
    }

    if (attempts < MAX_ATTEMPTS) {
      setTimeout(tryRegister, RETRY_MS);
    } else {
      console.warn(
        '[WebMCP] document.modelContext.registerTool never became available after 5s. Tools not registered. Is the WebMCP Inspector extension installed and enabled for this tab?'
      );
    }
  }

  tryRegister();

  return () => {
    cancelled = true;
    cleanupTools();
  };
}
