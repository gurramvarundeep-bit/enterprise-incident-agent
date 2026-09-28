import { useCallback, useMemo, useRef, useState } from "react";
import { isAgentApiConfigured } from "../config/agent.js";
import {
  AgentApiError,
  NOT_CONFIGURED_MESSAGE,
  getOrCreateSessionId,
  resetSessionId,
  sendPrompt,
} from "../services/agentApi.js";
import { createId } from "../utils/format.js";

export const WELCOME_TEXT =
  "I'm ready to investigate operational incidents. I can check service health, search runbooks, review incident history, create incidents, and coordinate controlled remediation.";

function welcomeMessage() {
  return {
    id: createId(),
    role: "agent",
    text: WELCOME_TEXT,
    timestamp: Date.now(),
    source: "local",
  };
}

/**
 * Backend connectivity as observed by this browser session:
 * not_configured | idle (configured, no request yet) | pending | ok | error
 */
function initialApiStatus() {
  return isAgentApiConfigured() ? "idle" : "not_configured";
}

export function useAgentChat({ getAccessToken, onUnauthorized }) {
  const [messages, setMessages] = useState(() => [welcomeMessage()]);
  const [isSending, setIsSending] = useState(false);
  const [apiStatus, setApiStatus] = useState(initialApiStatus);
  const [lastError, setLastError] = useState(null);
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);
  const abortRef = useRef(null);

  const append = useCallback((message) => {
    setMessages((prev) => [...prev, { id: createId(), timestamp: Date.now(), ...message }]);
  }, []);

  const send = useCallback(
    async (rawText) => {
      const text = (rawText || "").trim();
      if (!text || isSending) return;

      setLastError(null);
      append({ role: "user", text });

      if (!isAgentApiConfigured()) {
        // Explicit development state; never impersonate a real backend reply.
        append({ role: "system", variant: "not_configured", text: NOT_CONFIGURED_MESSAGE });
        return;
      }

      setIsSending(true);
      setApiStatus("pending");
      abortRef.current = new AbortController();

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          onUnauthorized?.();
          return;
        }
        const result = await sendPrompt({
          prompt: text,
          accessToken,
          sessionId,
          signal: abortRef.current.signal,
        });
        setApiStatus("ok");
        append({
          role: "agent",
          text: result.text,
          approval: result.approval,
          source: "backend",
        });
      } catch (err) {
        const message =
          err instanceof AgentApiError
            ? err.message
            : "Something went wrong while contacting the agent.";
        setApiStatus("error");
        setLastError(message);
        append({ role: "system", variant: "error", text: message });
        if (err instanceof AgentApiError && err.code === "UNAUTHORIZED") {
          onUnauthorized?.();
        }
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [append, getAccessToken, isSending, onUnauthorized, sessionId],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([welcomeMessage()]);
    setLastError(null);
    setIsSending(false);
    setApiStatus(initialApiStatus());
    setSessionId(resetSessionId());
  }, []);

  const liveApprovals = useMemo(
    () => messages.filter((m) => m.approval).map((m) => ({ ...m.approval, receivedAt: m.timestamp })),
    [messages],
  );

  return { messages, send, clear, isSending, apiStatus, lastError, sessionId, liveApprovals };
}
