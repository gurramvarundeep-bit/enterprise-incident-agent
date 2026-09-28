import { Sparkles } from "lucide-react";
import { suggestedPrompts } from "../../data/demoData.js";

export default function SuggestedPrompts({ onPick, disabled }) {
  return (
    <div className="suggestions" aria-label="Suggested prompts">
      <span className="suggestions__label">
        <Sparkles size={13} aria-hidden="true" />
        Suggested
      </span>
      <div className="suggestions__list">
        {suggestedPrompts.map((item) => (
          <button
            key={item.label}
            type="button"
            className="chip"
            title={item.prompt}
            disabled={disabled}
            onClick={() => onPick(item.prompt)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
