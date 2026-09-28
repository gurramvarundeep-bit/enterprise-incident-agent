import { Bot } from "lucide-react";

export default function ProcessingIndicator() {
  return (
    <div className="msg msg--agent msg--pending" role="status" aria-live="polite">
      <div className="msg__avatar" aria-hidden="true">
        <Bot size={16} />
      </div>
      <div className="msg__body">
        <div className="msg__bubble msg__bubble--typing">
          <span className="typing" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="msg__pending-text">Agent is investigating…</span>
        </div>
      </div>
    </div>
  );
}
