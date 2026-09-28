import { toneForStatus } from "../../utils/status.js";

export default function StatusBadge({ status, tone, dot = true, children }) {
  const resolvedTone = tone || toneForStatus(status);
  const label = children ?? String(status || "").replace(/_/g, " ");
  return (
    <span className={`badge badge--${resolvedTone}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {label}
    </span>
  );
}
