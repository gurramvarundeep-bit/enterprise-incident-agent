// Role resolution from Cognito groups, for UI display only.
export const ROLES = Object.freeze({
  INCIDENT_MANAGER: "INCIDENT_MANAGER",
  SUPPORT_ENGINEER: "SUPPORT_ENGINEER",
  EMPLOYEE: "EMPLOYEE",
});

// Highest privilege first.
export const ROLE_PRIORITY = [
  ROLES.INCIDENT_MANAGER,
  ROLES.SUPPORT_ENGINEER,
  ROLES.EMPLOYEE,
];

const ROLE_LABELS = {
  [ROLES.INCIDENT_MANAGER]: "Incident Manager",
  [ROLES.SUPPORT_ENGINEER]: "Support Engineer",
  [ROLES.EMPLOYEE]: "Employee",
};

export function resolveRole(groups) {
  if (!Array.isArray(groups)) return null;
  const normalized = groups.map((g) => String(g).toUpperCase());
  return ROLE_PRIORITY.find((role) => normalized.includes(role)) || null;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || "No role assigned";
}

export function canApprove(role) {
  return role === ROLES.INCIDENT_MANAGER;
}
