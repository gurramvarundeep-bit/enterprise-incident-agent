import { Activity, AlertTriangle, CircleCheck, CircleX } from "lucide-react";
import StatusBadge from "./ui/StatusBadge.jsx";
import { toneForStatus } from "../utils/status.js";

const ICONS = {
  HEALTHY: CircleCheck,
  DEGRADED: AlertTriangle,
  DOWN: CircleX,
};

export default function ServiceHealthCard({ service, expanded = false, onInvestigate }) {
  const tone = toneForStatus(service.status);
  const Icon = ICONS[service.status] || Activity;

  return (
    <article className={`service-card service-card--${tone}`}>
      <header className="service-card__head">
        <span className="service-card__name">{service.name}</span>
        <Icon size={18} className="service-card__icon" aria-hidden="true" />
      </header>
      <StatusBadge status={service.status} />
      <p className="service-card__summary">{service.summary}</p>

      {expanded && (
        <>
          <dl className="service-card__meta">
            <div>
              <dt>Owner</dt>
              <dd>{service.owner}</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{service.region}</dd>
            </div>
            <div>
              <dt>Depends on</dt>
              <dd>{service.dependencies.length ? service.dependencies.join(", ") : "None"}</dd>
            </div>
          </dl>
          {onInvestigate && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onInvestigate(service)}
            >
              Ask agent to verify
            </button>
          )}
        </>
      )}
    </article>
  );
}
