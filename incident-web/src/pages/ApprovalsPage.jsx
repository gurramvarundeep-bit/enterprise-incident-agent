import PageHeader from "../components/ui/PageHeader.jsx";
import DemoDataBadge from "../components/ui/DemoDataBadge.jsx";
import Notice from "../components/ui/Notice.jsx";
import ApprovalCard from "../components/chat/ApprovalCard.jsx";
import { demoApprovals } from "../data/demoData.js";
import { formatDateTime } from "../utils/format.js";
import { ROLES } from "../utils/roles.js";

export default function ApprovalsPage({ liveApprovals, viewerRole, onApprove, busy }) {
  const roleNote =
    viewerRole === ROLES.INCIDENT_MANAGER
      ? "You can approve pending actions. The backend re-validates your role on every request."
      : viewerRole === ROLES.SUPPORT_ENGINEER
        ? "Your requests are held until an Incident Manager approves them."
        : "Your role does not include approval controls.";

  return (
    <div className="page">
      <PageHeader
        title="Approvals"
        description="Approval queue for controlled operational actions."
      />

      <Notice tone="info" title="Role context">{roleNote}</Notice>

      <section className="page-section" aria-labelledby="live-approvals">
        <div className="page-section__head">
          <h3 id="live-approvals">From this session</h3>
          <span className="text-muted">Approval requests returned by the agent in the current conversation</span>
        </div>
        {liveApprovals.length === 0 ? (
          <div className="empty">
            No approval requests have been returned by the agent yet. Try asking it to restart
            the Payments service.
          </div>
        ) : (
          <div className="approval-grid">
            {liveApprovals.map((a) => (
              <ApprovalCard
                key={`${a.approvalId}-${a.receivedAt}`}
                approval={a}
                viewerRole={viewerRole}
                onApprove={onApprove}
                disabled={busy}
                compact
              />
            ))}
          </div>
        )}
      </section>

      <section className="page-section" aria-labelledby="demo-approvals">
        <div className="page-section__head">
          <h3 id="demo-approvals">Sample queue</h3>
          <DemoDataBadge />
        </div>
        <div className="approval-grid">
          {demoApprovals.map((a) => (
            <div key={a.approvalId} className="approval-demo">
              <ApprovalCard approval={a} viewerRole={viewerRole} compact />
              <span className="approval-demo__time text-muted">
                Requested {formatDateTime(a.requestedAt)} · sample entry, no backend action available
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
