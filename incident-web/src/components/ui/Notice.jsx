import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

const ICONS = { info: Info, warning: AlertTriangle, danger: ShieldAlert };

export default function Notice({ tone = "info", title, children, action }) {
  const Icon = ICONS[tone] || Info;
  return (
    <div className={`notice notice--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={16} className="notice__icon" aria-hidden="true" />
      <div className="notice__body">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action && <div className="notice__action">{action}</div>}
    </div>
  );
}
