import { useCallback, useEffect, useRef, useState } from "react";
import { Database, Eraser } from "lucide-react";
import Composer from "./Composer.jsx";
import MessageBubble from "./MessageBubble.jsx";
import ProcessingIndicator from "./ProcessingIndicator.jsx";
import SuggestedPrompts from "./SuggestedPrompts.jsx";
import Notice from "../ui/Notice.jsx";
import { isAgentApiConfigured } from "../../config/agent.js";

const ONLINE_STATE = {
  not_configured: { tone: "neutral", label: "NOT CONFIGURED" },
  idle: { tone: "info", label: "READY" },
  pending: { tone: "warning", label: "PROCESSING" },
  ok: { tone: "success", label: "ONLINE" },
  error: { tone: "danger", label: "ERROR" },
};

/**
 * @param {{ chat: object, viewerRole: string|null, draft?: { id: string, text: string } | null }} props
 * `draft` is an externally injected prompt (from other pages). Each injection
 * carries a unique id so the same text can be injected more than once.
 */
export default function AgentConsole({ chat, viewerRole, draft }) {
  const { messages, send, clear, isSending, apiStatus } = chat;
  const scrollRef = useRef(null);
  const [value, setValue] = useState("");
  const [focusKey, setFocusKey] = useState(0);
  const [seenDraftId, setSeenDraftId] = useState(null);
  const configured = isAgentApiConfigured();
  const online = ONLINE_STATE[apiStatus] || ONLINE_STATE.not_configured;

  // Adopt an injected draft during render (no effect needed).
  if (draft && draft.id !== seenDraftId) {
    setSeenDraftId(draft.id);
    setValue(draft.text);
    setFocusKey((k) => k + 1);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  // Approving sends an explicit instruction through the same agent channel;
  // the backend's DynamoDB workflow decides whether the caller may approve.
  const approve = useCallback(
    (approval) => send(`Approve request ${approval.approvalId} (${approval.action} on ${approval.service}).`),
    [send],
  );

  const pickSuggestion = (text) => {
    setValue(text);
    setFocusKey((k) => k + 1);
  };

  return (
    <section className="console" aria-labelledby="console-title">
      <header className="console__head">
        <div>
          <h3 id="console-title">Agent Console</h3>
          <span className="console__sub">Powered by AWS Bedrock + AgentCore</span>
        </div>
        <div className="console__head-right">
          <span className="memory-pill" title="AgentCore semantic memory is part of the deployed backend architecture.">
            <Database size={12} aria-hidden="true" />
            Durable Memory: Active
          </span>
          <span className={`online-pill online-pill--${online.tone}`}>
            <span
              className={`status-dot status-dot--${online.tone}${apiStatus === "pending" ? " status-dot--pulse" : ""}`}
              aria-hidden="true"
            />
            {online.label}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={clear}
            aria-label="Clear conversation"
            title="Clear conversation"
            disabled={messages.length <= 1 && !isSending}
          >
            <Eraser size={16} />
          </button>
        </div>
      </header>

      {!configured && (
        <div className="console__notice">
          <Notice tone="warning" title="Agent API connection has not been configured yet.">
            Set <code>VITE_AGENT_API_URL</code> to your AgentCore proxy endpoint. Messages you send
            will not reach AWS until then, and no responses will be simulated.
          </Notice>
        </div>
      )}

      <div className="console__scroll" ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            viewerRole={viewerRole}
            onApprove={approve}
            approving={isSending}
          />
        ))}
        {isSending && <ProcessingIndicator />}
      </div>

      <footer className="console__foot">
        <SuggestedPrompts onPick={pickSuggestion} disabled={isSending} />
        <Composer
          value={value}
          onChange={setValue}
          onSend={send}
          disabled={isSending}
          focusKey={focusKey}
        />
      </footer>
    </section>
  );
}
