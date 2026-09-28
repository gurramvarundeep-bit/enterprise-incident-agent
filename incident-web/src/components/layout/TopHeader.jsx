import { LogOut, Menu } from "lucide-react";
import RoleBadge from "../ui/RoleBadge.jsx";
import { initialsFrom } from "../../utils/format.js";

export default function TopHeader({ user, onLogout, onOpenNav }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn topbar__menu"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="topbar__title">
        <p className="eyebrow">Enterprise Operations</p>
        <h1>Incident Management Agent</h1>
        <p className="topbar__subtitle">
          Investigate services, analyze incidents, and execute controlled operational actions.
        </p>
      </div>

      <div className="topbar__user">
        <div className="topbar__identity">
          <strong title={user?.displayName}>{user?.displayName}</strong>
          <RoleBadge role={user?.role} />
        </div>
        <div className="avatar" aria-hidden="true">
          {initialsFrom(user?.displayName)}
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
          <LogOut size={15} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
