import PageHeader from "../components/ui/PageHeader.jsx";
import ServiceHealthCard from "../components/ServiceHealthCard.jsx";
import Notice from "../components/ui/Notice.jsx";
import { services, SERVICE_STATUS } from "../data/demoData.js";

export default function ServiceHealthPage({ onAskAgent }) {
  const counts = services.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page">
      <PageHeader
        title="Service Health"
        description="Overview of monitored services and their dependencies."
        actions={
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => onAskAgent("Check the health of all services and summarize any degradation.")}
          >
            Ask agent for live status
          </button>
        }
      />

      <Notice tone="info">
        Statuses shown here are a reference snapshot matching the backend's service-health tool
        dataset. Live values are retrieved when the agent calls the service-health Lambda via MCP.
      </Notice>

      <div className="summary-row" aria-label="Status summary">
        <div className="summary-tile summary-tile--success">
          <strong>{counts[SERVICE_STATUS.HEALTHY] || 0}</strong>
          <span>Healthy</span>
        </div>
        <div className="summary-tile summary-tile--warning">
          <strong>{counts[SERVICE_STATUS.DEGRADED] || 0}</strong>
          <span>Degraded</span>
        </div>
        <div className="summary-tile summary-tile--danger">
          <strong>{counts[SERVICE_STATUS.DOWN] || 0}</strong>
          <span>Down</span>
        </div>
      </div>

      <div className="health-grid">
        {services.map((s) => (
          <ServiceHealthCard
            key={s.id}
            service={s}
            expanded
            onInvestigate={(svc) => onAskAgent(`Check the health of the ${svc.name} service.`)}
          />
        ))}
      </div>
    </div>
  );
}
