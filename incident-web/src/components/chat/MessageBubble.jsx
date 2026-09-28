import { AlertTriangle, Bot, PlugZap, UserRound } from "lucide-react";
import ApprovalCard from "./ApprovalCard.jsx";
import { formatTime } from "../../utils/format.js";

function SystemMessage({ message }) {
  const isConfig = message.variant === "not_configured";
  const Icon = isConfig ? PlugZap : AlertTriangle;
  return (
    <div className={`sys-msg sys-msg--${isConfig ? "config" : "error"}`} role={isConfig ? "status" : "alert"}>
      <Icon size={15} aria-hidden="true" />
      <div>
        <strong>{isConfig ? "Development state" : "Request failed"}</strong>
        <p>{message.text}</p>
      </div>
      <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
    </div>
  );
}

export default function MessageBubble({ message, viewerRole, onApprove, approving }) {
  if (message.role === "system") return <SystemMessage message={message} />;

  const isUser = message.role === "user";
  const Icon = isUser ? UserRound : Bot;

  return (
    <article className={`msg msg--${isUser ? "user" : "agent"}`}>
      <div className="msg__avatar" aria-hidden="true">
        <Icon size={16} />
      </div>
      <div className="msg__body">
        <header className="msg__meta">
          <span className="msg__author">{isUser ? "You" : "Incident Agent"}</span>
          {!isUser && message.source === "backend" && (
            <span className="msg__source">via AgentCore</span>
          )}
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
        </header>
        <div className="msg__bubble">
          <p>{message.text}</p>
        </div>
        {message.approval && (
          <ApprovalCard
            approval={message.approval}
            viewerRole={viewerRole}
            onApprove={onApprove}
            disabled={approving}
          />
        )}
      </div>
    </article>
  );
}
