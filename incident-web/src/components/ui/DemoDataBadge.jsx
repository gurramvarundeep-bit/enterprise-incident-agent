import { FlaskConical } from "lucide-react";

/** Marks static sample content so it is never mistaken for live AWS data. */
export default function DemoDataBadge({ label = "Demo Data" }) {
  return (
    <span
      className="demo-badge"
      title="Static sample content bundled with the UI. Not retrieved from AWS."
    >
      <FlaskConical size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
