// Agent API client. Isolated so the transport (direct proxy, API Gateway,
// Lambda URL, etc.) can change without touching UI code.
// Never logs tokens or includes them in error messages.
import { agentConfig, isAgentApiConfigured } from "../config/agent.js";
import { createId } from "../utils/format.js";

const SESSION_ID_KEY = "incidentai.agent.sessionId";

export class AgentApiError extends Error {
  constructor(code, message, { status = null } = {}) {
    super(message);
    this.name = "AgentApiError";
    this.code = code;
    this.status = status;
  }
}

export const NOT_CONFIGURED_MESSAGE =
  "Agent API connection has not been configured yet. Set VITE_AGENT_API_URL to your AgentCore proxy endpoint to enable live agent calls.";

// ---------- conversation session ----------

export function getOrCreateSessionId() {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = createId();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export function resetSessionId() {
  const id = createId();
  sessionStorage.setItem(SESSION_ID_KEY, id);
  return id;
}

// ---------- response normalization ----------

const TEXT_KEYS = [
  "response",
  "output",
  "message",
  "result",
  "text",
  "answer",
  "completion",
];

function extractText(payload, depth = 0) {
  if (depth > 4 || payload == null) return null;
  if (typeof payload === "string") return payload.trim() || null;
  if (Array.isArray(payload)) {
    const parts = payload
      .map((p) => extractText(p, depth + 1))
      .filter(Boolean);
    return parts.length ? parts.join("\n") : null;
  }
  if (typeof payload !== "object") return null;

  if (Array.isArray(payload.content)) {
    const parts = payload.content
      .map((p) => (typeof p === "string" ? p : p?.text))
      .filter(Boolean);
    if (parts.length) return parts.join("\n");
  }
  for (const key of TEXT_KEYS) {
    const value = payload[key];
    const text = extractText(value, depth + 1);
    if (text) return text;
  }
  return null;
}

const APPROVAL_STATUSES = new Set([
  "APPROVAL_REQUIRED",
  "PENDING_APPROVAL",
  "AWAITING_APPROVAL",
  "PENDING",
]);

function normalizeStatus(value) {
  return typeof value === "string" ? value.toUpperCase().replace(/[\s-]+/g, "_") : "";
}

function extractApproval(payload) {
  if (!payload || typeof payload !== "object") return null;

  const candidate =
    payload.approval ||
    payload.approval_request ||
    payload.approvalRequest ||
    payload.pending_approval ||
    (payload.approval_required === true || payload.approvalRequired === true
      ? payload
      : null) ||
    (APPROVAL_STATUSES.has(normalizeStatus(payload.status)) ? payload : null);

  if (!candidate || typeof candidate !== "object") return null;

  const approvalId =
    candidate.approvalId || candidate.approval_id || candidate.id || null;
  const status = normalizeStatus(candidate.status) || "APPROVAL_REQUIRED";
  if (!approvalId && !APPROVAL_STATUSES.has(status)) return null;

  return {
    approvalId: approvalId || "unknown",
    action: candidate.action || candidate.operation || "Unspecified action",
    service: candidate.service || candidate.target || "Unspecified service",
    requesterRole:
      candidate.requesterRole ||
      candidate.requester_role ||
      candidate.requestedBy ||
      candidate.requested_by ||
      null,
    status: APPROVAL_STATUSES.has(status) ? "APPROVAL_REQUIRED" : status,
  };
}

function normalizeAgentResponse(payload) {
  const text = extractText(payload);
  const approval = extractApproval(payload);
  if (!text && !approval) {
    throw new AgentApiError(
      "MALFORMED",
      "The agent returned a response the console could not interpret.",
    );
  }
  return {
    text: text || "The agent requested approval before proceeding.",
    approval,
    raw: payload,
  };
}

// ---------- transport ----------

async function parseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Sends a prompt to the agent backend.
 * @param {{ prompt: string, accessToken: string, sessionId: string, signal?: AbortSignal }} args
 * @returns {Promise<{ text: string, approval: object|null, raw: unknown }>}
 */
export async function sendPrompt({ prompt, accessToken, sessionId, signal }) {
  if (!isAgentApiConfigured()) {
    throw new AgentApiError("NOT_CONFIGURED", NOT_CONFIGURED_MESSAGE);
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new AgentApiError("INVALID_INPUT", "Prompt must be a non-empty string.");
  }
  if (!accessToken) {
    throw new AgentApiError(
      "UNAUTHENTICATED",
      "Your session has expired. Please sign in again.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), agentConfig.requestTimeoutMs);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(agentConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify({ prompt: prompt.trim(), sessionId }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new AgentApiError(
        "TIMEOUT",
        "The agent did not respond in time. It may still be processing; try again shortly.",
      );
    }
    throw new AgentApiError(
      "NETWORK",
      "Could not reach the agent API. Check the endpoint URL, CORS configuration, and your network.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AgentApiError(
      "UNAUTHORIZED",
      "The agent API rejected your credentials. Sign in again or check your role permissions.",
      { status: response.status },
    );
  }
  if (!response.ok) {
    throw new AgentApiError(
      "HTTP",
      `The agent API returned an error (HTTP ${response.status}).`,
      { status: response.status },
    );
  }

  let payload;
  try {
    payload = await parseBody(response);
  } catch {
    throw new AgentApiError("MALFORMED", "The agent response could not be read.");
  }
  return normalizeAgentResponse(payload);
}
