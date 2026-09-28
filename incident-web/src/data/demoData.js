// Static UI reference data. Everything here is labeled "Demo Data" in the UI.
// None of it is fetched from AWS; it exists so the views can be demonstrated
// before the list/query endpoints are wired to the backend.

export const SERVICE_STATUS = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  DOWN: "DOWN",
});

export const services = [
  {
    id: "payments",
    name: "Payments",
    status: SERVICE_STATUS.DEGRADED,
    summary: "Elevated processing failures",
    owner: "Payments Platform",
    region: "us-east-1",
    dependencies: ["Authentication", "Orders"],
  },
  {
    id: "orders",
    name: "Orders",
    status: SERVICE_STATUS.HEALTHY,
    summary: "Operating normally",
    owner: "Commerce Core",
    region: "us-east-1",
    dependencies: ["Inventory"],
  },
  {
    id: "inventory",
    name: "Inventory",
    status: SERVICE_STATUS.HEALTHY,
    summary: "Operating normally",
    owner: "Supply Chain Systems",
    region: "us-east-1",
    dependencies: [],
  },
  {
    id: "authentication",
    name: "Authentication",
    status: SERVICE_STATUS.DOWN,
    summary: "Service interruption",
    owner: "Identity & Access",
    region: "us-east-1",
    dependencies: [],
  },
];

export const demoIncidents = [
  {
    id: "INC-2041",
    title: "Payments processing failure rate above threshold",
    service: "Payments",
    severity: "HIGH",
    status: "INVESTIGATING",
    owner: "Support Engineer",
    openedAt: "2026-09-28T13:05:00Z",
  },
  {
    id: "INC-2040",
    title: "Authentication service unavailable in us-east-1",
    service: "Authentication",
    severity: "CRITICAL",
    status: "OPEN",
    owner: "Incident Manager",
    openedAt: "2026-09-28T12:48:00Z",
  },
  {
    id: "INC-2037",
    title: "Orders API latency regression after deploy",
    service: "Orders",
    severity: "MEDIUM",
    status: "MONITORING",
    owner: "Support Engineer",
    openedAt: "2026-09-27T21:12:00Z",
  },
  {
    id: "INC-2033",
    title: "Inventory sync job delayed by 40 minutes",
    service: "Inventory",
    severity: "LOW",
    status: "RESOLVED",
    owner: "Support Engineer",
    openedAt: "2026-09-26T08:30:00Z",
  },
];

export const demoApprovals = [
  {
    approvalId: "APR-7f3a21",
    action: "restart_service",
    service: "Payments",
    requesterRole: "SUPPORT_ENGINEER",
    status: "APPROVAL_REQUIRED",
    requestedAt: "2026-09-28T13:12:00Z",
  },
  {
    approvalId: "APR-6c9e08",
    action: "scale_out",
    service: "Authentication",
    requesterRole: "SUPPORT_ENGINEER",
    status: "APPROVED",
    requestedAt: "2026-09-28T12:55:00Z",
  },
  {
    approvalId: "APR-5b1d77",
    action: "rollback_deployment",
    service: "Orders",
    requesterRole: "EMPLOYEE",
    status: "REJECTED",
    requestedAt: "2026-09-27T21:20:00Z",
  },
];

export const demoRunbooks = [
  {
    id: "RB-101",
    title: "Payments: elevated processing failures",
    service: "Payments",
    category: "Remediation",
    summary:
      "Triage gateway error codes, verify downstream authentication dependency, and execute a controlled restart with approval.",
    steps: 6,
    updatedAt: "2026-09-20",
    tags: ["payments", "restart", "approval"],
  },
  {
    id: "RB-102",
    title: "Authentication outage response",
    service: "Authentication",
    category: "Incident Response",
    summary:
      "Confirm identity provider health, fail over to the secondary region, and communicate status to dependent service owners.",
    steps: 8,
    updatedAt: "2026-09-18",
    tags: ["authentication", "failover", "critical"],
  },
  {
    id: "RB-103",
    title: "Orders API latency investigation",
    service: "Orders",
    category: "Diagnostics",
    summary:
      "Compare p95 latency against the last known-good deploy, inspect connection pool saturation, and decide on rollback.",
    steps: 5,
    updatedAt: "2026-09-12",
    tags: ["orders", "latency", "rollback"],
  },
  {
    id: "RB-104",
    title: "Inventory sync job recovery",
    service: "Inventory",
    category: "Remediation",
    summary:
      "Re-drive the delayed batch, validate stock-level consistency, and clear the backlog alarm.",
    steps: 4,
    updatedAt: "2026-09-05",
    tags: ["inventory", "batch", "recovery"],
  },
  {
    id: "RB-105",
    title: "Creating and escalating incidents",
    service: "All",
    category: "Process",
    summary:
      "Severity definitions, required fields, and escalation path from Support Engineer to Incident Manager.",
    steps: 3,
    updatedAt: "2026-08-30",
    tags: ["process", "severity", "escalation"],
  },
];

export const suggestedPrompts = [
  {
    label: "Investigate Payments",
    prompt:
      "The Payments service is failing for customers. Investigate the issue and take the appropriate action.",
  },
  {
    label: "Check Authentication",
    prompt: "Check the health of the Authentication service.",
  },
  {
    label: "Recall prior diagnostic",
    prompt: "What was the Payments diagnostic code from our previous incident?",
  },
  {
    label: "Create HIGH incident",
    prompt: "Create a HIGH severity incident for Payments.",
  },
  {
    label: "Restart Payments",
    prompt: "Restart the Payments service.",
  },
];

export const agentCapabilities = [
  "Service health investigation",
  "Runbook retrieval",
  "Incident management",
  "Durable semantic memory",
  "Approval-controlled actions",
  "Role-based authorization",
];
