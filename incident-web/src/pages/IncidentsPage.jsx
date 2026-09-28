import { Plus } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import DemoDataBadge from "../components/ui/DemoDataBadge.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Notice from "../components/ui/Notice.jsx";
import { demoIncidents } from "../data/demoData.js";
import { formatDateTime } from "../utils/format.js";

export default function IncidentsPage({ onAskAgent }) {
  return (
    <div className="page">
      <PageHeader
        title="Incidents"
        description="Active and recent incidents across monitored services."
        meta={<DemoDataBadge />}
        actions={
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => onAskAgent("Create a HIGH severity incident for Payments.")}
          >
            <Plus size={15} aria-hidden="true" />
            Create via agent
          </button>
        }
      />

      <Notice tone="info">
        This list is static sample content. Incident records are created and queried by the agent
        through the backend; a list endpoint has not been connected to this view yet.
      </Notice>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Title</th>
              <th scope="col">Service</th>
              <th scope="col">Severity</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col">Opened</th>
            </tr>
          </thead>
          <tbody>
            {demoIncidents.map((inc) => (
              <tr key={inc.id}>
                <td><code>{inc.id}</code></td>
                <td className="data-table__title">{inc.title}</td>
                <td>{inc.service}</td>
                <td><StatusBadge status={inc.severity} dot={false} /></td>
                <td><StatusBadge status={inc.status} /></td>
                <td>{inc.owner}</td>
                <td className="text-muted">{formatDateTime(inc.openedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
