import {
  Activity,
  BookOpen,
  Bot,
  ClipboardCheck,
  Hexagon,
  Siren,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "console", label: "Agent Console", icon: Bot },
  { id: "incidents", label: "Incidents", icon: Siren },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck },
  { id: "health", label: "Service Health", icon: Activity },
  { id: "runbooks", label: "Runbooks", icon: BookOpen },
];

// Sidebar connectivity indicator reflects what the browser has actually
// observed about the agent API, never a hard-coded "connected" claim.
const RUNTIME_STATE = {
  not_configured: { tone: "neutral", label: "API endpoint not configured" },
  idle: { tone: "info", label: "Endpoint configured · not yet called" },
  pending: { tone: "warning", label: "Request in progress" },
  ok: { tone: "success", label: "Runtime reachable" },
  error: { tone: "danger", label: "Last request failed" },
};

export default function Sidebar({ activePage, onNavigate, apiStatus, badges = {}, open, onClose }) {
  const runtime = RUNTIME_STATE[apiStatus] || RUNTIME_STATE.not_configured;

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`} aria-label="Primary">
      <div className="sidebar__brand">
        <div className="brand-mark" aria-hidden="true">
          <Hexagon size={22} strokeWidth={2.2} />
        </div>
        <div className="brand-text">
          <strong>IncidentAI</strong>
          <span>Enterprise Operations</span>
        </div>
        <button
          type="button"
          className="icon-btn sidebar__close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = id === activePage;
          const count = badges[id];
          return (
            <button
              key={id}
              type="button"
              className={`nav-item${active ? " nav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              {count > 0 && <span className="nav-item__count">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <span className={`status-dot status-dot--${runtime.tone}${apiStatus === "pending" ? " status-dot--pulse" : ""}`} aria-hidden="true" />
        <div>
          <strong>AWS AgentCore</strong>
          <span>{runtime.label}</span>
        </div>
      </div>
    </aside>
  );
}
