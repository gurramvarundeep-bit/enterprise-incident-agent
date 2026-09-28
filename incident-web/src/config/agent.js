// Agent API endpoint. Browser -> AgentCore Runtime usually needs a backend
// proxy (CORS + credentials), so the URL is injected via environment variable.
export const agentConfig = {
  apiUrl: (import.meta.env.VITE_AGENT_API_URL || "").trim(),
  requestTimeoutMs: 90_000,
};

export function isAgentApiConfigured() {
  return agentConfig.apiUrl.length > 0;
}
