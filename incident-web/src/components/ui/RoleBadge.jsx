import { ShieldCheck, UserRound, Wrench } from "lucide-react";
import { ROLES, roleLabel } from "../../utils/roles.js";

const ICON_BY_ROLE = {
  [ROLES.INCIDENT_MANAGER]: ShieldCheck,
  [ROLES.SUPPORT_ENGINEER]: Wrench,
  [ROLES.EMPLOYEE]: UserRound,
};

const TONE_BY_ROLE = {
  [ROLES.INCIDENT_MANAGER]: "accent",
  [ROLES.SUPPORT_ENGINEER]: "info",
  [ROLES.EMPLOYEE]: "neutral",
};

export default function RoleBadge({ role }) {
  const Icon = ICON_BY_ROLE[role] || UserRound;
  const tone = TONE_BY_ROLE[role] || "neutral";
  return (
    <span className={`badge badge--${tone} role-badge`} title="Role from Cognito groups (display only)">
      <Icon size={12} aria-hidden="true" />
      {roleLabel(role)}
    </span>
  );
}
