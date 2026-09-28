// Agent API client. Isolated so the transport can change without touching UI.
// Never logs tokens or includes them in error messages.
import { agentConfig, getAgentInvokeUrl, isAgentApiConfigured } from "../config/agent.js";

const SESSION_ID_KEY = "incidentai_agent_session_id";

const SKIP_KEYS = new Set([
  "sessionid",
  "session_id",
  "runtimesessionid",
  "runtime_session_id",
  "headers",
  "statuscode",
  "status_code",
  "requestid",
  "traceid",
]);

export class AgentApiError extends Error {
  constructor(code, message, { status = null } = {}) {
    super(message);
    this.name = "AgentApiError";
    this.code = code;
    this.status = status;
  }
}

export const NOT_CONFIGURED_MESSAGE =
  "Agent API connection has not been configured yet. Set VITE_AGENT_API_URL to your AgentCore API Gateway endpoint to enable live agent calls.";

// ---------- AgentCore runtime session ----------

export function getStoredSessionId() {
  try {
    return sessionStorage.getItem(SESSION_ID_KEY) || null;
  } catch {
    return null;
  }
}

export function saveSessionId(id) {
  if (!id || typeof id !== "string") return;
  sessionStorage.setItem(SESSION_ID_KEY, id);
}

export function clearSessionId() {
  sessionStorage.removeItem(SESSION_ID_KEY);
}

// ---------- response normalization ----------

function looksLikeJwt(value) {
  return typeof value === "string" && /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value.trim());
}

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function extractText(payload, depth = 0) {
  if (depth > 6 || payload == null) return null;
  if (typeof payload === "string") {
    const parsed = tryParseJson(payload);
    if (parsed != null) return extractText(parsed, depth + 1);
    const trimmed = payload.trim();
    return trimmed && !looksLikeJwt(trimmed) ? trimmed : null;
  }
  if (typeof payload === "number" || typeof payload === "boolean") {
    return String(payload);
  }
  if (Array.isArray(payload)) {
    const parts = payload.map((p) => extractText(p, depth + 1)).filter(Boolean);
    return parts.length ? parts.join("\n") : null;
  }
  if (typeof payload !== "object") return null;

  if (Array.isArray(payload.content)) {
    const parts = payload.content
      .map((p) => (typeof p === "string" ? extractText(p, depth + 1) : extractText(p?.text ?? p, depth + 1)))
      .filter(Boolean);
    if (parts.length) return parts.join("\n");
  }

  const preferred = [
    "response",
    "output",
    "message",
    "result",
    "text",
    "answer",
    "completion",
    "content",
    "body",
  ];
  for (const key of preferred) {
    if (!(key in payload)) continue;
    const text = extractText(payload[key], depth + 1);
    if (text) return text;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (SKIP_KEYS.has(key.toLowerCase())) continue;
    const text = extractText(value, depth + 1);
    if (text) return text;
  }
  return null;
}

function extractSessionId(payload) {
  if (!payload || typeof payload !== "object") return null;
  const id =
    payload.sessionId ||
    payload.session_id ||
    payload.runtimeSessionId ||
    payload.runtime_session_id ||
    null;
  return typeof id === "string" && id.trim() ? id.trim() : null;
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

  const source = payload.response && typeof payload.response === "object" ? payload.response : payload;

  const candidate =
    source.approval ||
    source.approval_request ||
    source.approvalRequest ||
    source.pending_approval ||
    payload.approval ||
    (source.approval_required === true || source.approvalRequired === true ? source : null) ||
    (APPROVAL_STATUSES.has(normalizeStatus(source.status)) ? source : null);

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
  const fromResponse =
    payload && typeof payload === "object" && "response" in payload
      ? extractText(payload.response)
      : null;
  const text = fromResponse || extractText(payload);
  const approval = extractApproval(payload);
  const sessionId = extractSessionId(payload);

  if (!text && !approval) {
    throw new AgentApiError(
      "MALFORMED",
      "The agent returned a response the console could not interpret.",
    );
  }
  return {
    text: text || "The agent requested approval before proceeding.",
    approval,
    sessionId,
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

function safeErrorDetail(payload) {
  if (!payload || typeof payload !== "object") return null;
  const detail = payload.message || payload.error || payload.detail || null;
  if (typeof detail !== "string") return null;
  if (looksLikeJwt(detail)) return null;
  return detail.slice(0, 180);
}

function statusError(status, payload) {
  const detail = safeErrorDetail(payload);
  if (status === 400) {
    return new AgentApiError(
      "BAD_REQUEST",
      detail || "The agent API rejected the request. Check the prompt and try again.",
      { status },
    );
  }
  if (status === 401 || status === 403) {
    return new AgentApiError(
      "UNAUTHORIZED",
      "The agent API rejected your credentials. Sign in again or check your role permissions.",
      { status },
    );
  }
  if (status >= 500) {
    return new AgentApiError(
      "HTTP",
      "The agent service is unavailable right now. Try again shortly.",
      { status },
    );
  }
  return new AgentApiError(
    "HTTP",
    `The agent API returned an error (HTTP ${status}).`,
    { status },
  );
}

/**
 * Sends a prompt to the configured Agent API Gateway.
 * @param {{ prompt: string, accessToken: string, sessionId?: string|null, signal?: AbortSignal }} args
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

  const body = { prompt: prompt.trim() };
  if (sessionId) body.sessionId = sessionId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), agentConfig.requestTimeoutMs);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(getAgentInvokeUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
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

  let payload;
  try {
    payload = await parseBody(response);
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw statusError(response.status, payload);
  }

  const result = normalizeAgentResponse(payload);
  if (result.sessionId) saveSessionId(result.sessionId);
  return result;
}
