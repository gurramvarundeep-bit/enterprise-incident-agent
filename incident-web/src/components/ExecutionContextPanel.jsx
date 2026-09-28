import { Check, Info } from "lucide-react";
import { agentCapabilities } from "../data/demoData.js";
import { roleLabel } from "../utils/roles.js";

const RUNTIME_ROWS = {
  not_configured: { value: "Not configured", tone: "neutral" },
  idle: { value: "Configured", tone: "info", note: "no request yet" },
  pending: { value: "Processing", tone: "warning" },
  ok: { value: "Ready", tone: "success", note: "last call succeeded" },
  error: { value: "Unreachable", tone: "danger", note: "last call failed" },
};

function Row({ label, value, tone = "neutral", note, kind }) {
  return (
    <div className="ctx-row">
      <span className="ctx-row__label">{label}</span>
      <span className="ctx-row__value">
        <strong className={`text-${tone}`}>{value}</strong>
        {note && <small>{note}</small>}
        {kind === "static" && (
          <small className="ctx-row__static" title="Static architecture information. Not probed by the browser.">
            architecture
          </small>
        )}
      </span>
    </div>
  );
}

export default function ExecutionContextPanel({ user, isAuthenticated, apiStatus, sessionId }) {
  const runtime = RUNTIME_ROWS[apiStatus] || RUNTIME_ROWS.not_configured;

  return (
    <aside className="ctx-panel" aria-labelledby="ctx-title">
      <header className="ctx-panel__head">
        <h3 id="ctx-title">Execution Context</h3>
        <span className="ctx-panel__tag">Session</span>
      </header>

      <div className="ctx-panel__rows">
        <Row
          label="Identity"
          value={user?.role ? roleLabel(user.role) : "No group assigned"}
          tone={user?.role ? "accent" : "neutral"}
          note={user?.role ? user.role : "cognito:groups missing"}
        />
        <Row
          label="Authentication"
          value={isAuthenticated ? "Verified" : "Not signed in"}
          tone={isAuthenticated ? "success" : "neutral"}
          note={isAuthenticated ? "Cognito · PKCE" : undefined}
        />
        <Row label="Agent Runtime" value={runtime.value} tone={runtime.tone} note={runtime.note} />
        <Row label="Gateway / MCP" value="Connected" tone="muted" kind="static" />
        <Row label="Durable Memory" value="Active" tone="muted" kind="static" />
      </div>

      <p className="ctx-panel__hint">
        <Info size={12} aria-hidden="true" />
        <span>
          Rows tagged <em>architecture</em> describe the deployed backend design and are not
          live-probed from the browser.
        </span>
      </p>

      <div className="ctx-panel__divider" />

      <h4>Agent Capabilities</h4>
      <ul className="capabilities">
        {agentCapabilities.map((cap) => (
          <li key={cap}>
            <Check size={14} aria-hidden="true" />
            {cap}
          </li>
        ))}
      </ul>

      <div className="ctx-panel__divider" />

      <div className="ctx-row ctx-row--mono">
        <span className="ctx-row__label">Conversation ID</span>
        {sessionId ? (
          <code title={sessionId}>{sessionId.slice(0, 8)}…</code>
        ) : (
          <span className="text-muted">Not started</span>
        )}
      </div>
    </aside>
  );
}
