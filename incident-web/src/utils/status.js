const TONE_BY_STATUS = {
  HEALTHY: "success",
  OPERATIONAL: "success",
  APPROVED: "success",
  RESOLVED: "success",
  OK: "success",
  DEGRADED: "warning",
  MONITORING: "warning",
  APPROVAL_REQUIRED: "warning",
  INVESTIGATING: "info",
  OPEN: "info",
  PENDING: "info",
  DOWN: "danger",
  CRITICAL: "danger",
  REJECTED: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

export function toneForStatus(status) {
  return TONE_BY_STATUS[String(status || "").toUpperCase()] || "neutral";
}
