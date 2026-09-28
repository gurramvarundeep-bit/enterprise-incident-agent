import { Clock, ShieldCheck, Lock } from "lucide-react";
import StatusBadge from "../ui/StatusBadge.jsx";
import { ROLES, canApprove, roleLabel } from "../../utils/roles.js";

/**
 * UI representation of an approval-required action returned by the backend.
 * Button visibility is a UX convenience only; the backend enforces who may
 * actually approve.
 */
export default function ApprovalCard({ approval, viewerRole, onApprove, disabled, compact = false }) {
  const isManager = canApprove(viewerRole);
  const pending = approval.status === "APPROVAL_REQUIRED";

  return (
    <section className={`approval-card${compact ? " approval-card--compact" : ""}`} aria-label="Approval request">
      <header className="approval-card__head">
        <div className="approval-card__title">
          <Lock size={15} aria-hidden="true" />
          <span>Controlled action</span>
        </div>
        <StatusBadge status={approval.status} />
      </header>

      <dl className="approval-card__grid">
        <div>
          <dt>Action</dt>
          <dd><code>{approval.action}</code></dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{approval.service}</dd>
        </div>
        <div>
          <dt>Approval ID</dt>
          <dd><code>{approval.approvalId}</code></dd>
        </div>
        <div>
          <dt>Requester role</dt>
          <dd>{approval.requesterRole ? roleLabel(approval.requesterRole) : "Not provided"}</dd>
        </div>
      </dl>

      {pending && (
        <footer className="approval-card__foot">
          {isManager && onApprove ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => onApprove(approval)}
              disabled={disabled}
            >
              <ShieldCheck size={15} aria-hidden="true" />
              Approve
            </button>
          ) : viewerRole === ROLES.SUPPORT_ENGINEER ? (
            <span className="approval-card__wait">
              <Clock size={14} aria-hidden="true" />
              Waiting for Incident Manager approval.
            </span>
          ) : (
            <span className="approval-card__wait">
              <Clock size={14} aria-hidden="true" />
              Requires Incident Manager approval.
            </span>
          )}
        </footer>
      )}
    </section>
  );
}
