// Agent API is injected via Vite env. Components must not hard-code the URL.
const raw = (import.meta.env.VITE_AGENT_API_URL || "").trim().replace(/\/$/, "");

export const agentConfig = {
  apiUrl: raw,
  requestTimeoutMs: 90_000,
};

export function isAgentApiConfigured() {
  return agentConfig.apiUrl.length > 0;
}

/** POST target: ${VITE_AGENT_API_URL}/agent (tolerant of a base that already ends in /agent). */
export function getAgentInvokeUrl() {
  if (!agentConfig.apiUrl) return "";
  return agentConfig.apiUrl.endsWith("/agent")
    ? agentConfig.apiUrl
    : `${agentConfig.apiUrl}/agent`;
}
