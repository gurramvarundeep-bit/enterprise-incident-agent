import { useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";

/** Controlled multiline input. Enter sends, Shift+Enter inserts a newline. */
export default function Composer({ value, onChange, onSend, disabled, focusKey }) {
  const textareaRef = useRef(null);

  // Auto-grow up to the CSS max-height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  // Focus when a prompt is injected from elsewhere (chips, other pages).
  useEffect(() => {
    if (focusKey) textareaRef.current?.focus();
  }, [focusKey]);

  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    onChange("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="agent-prompt" className="sr-only">
        Message the incident agent
      </label>
      <textarea
        id="agent-prompt"
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe an incident or ask the agent to investigate…"
        disabled={disabled}
        aria-describedby="composer-hint"
      />
      <div className="composer__actions">
        <span id="composer-hint" className="composer__hint">
          Enter to send · Shift+Enter for a new line
        </span>
        <button type="submit" className="btn btn--primary" disabled={!canSend} aria-label="Send message">
          <SendHorizontal size={16} aria-hidden="true" />
          <span>Send</span>
        </button>
      </div>
    </form>
  );
}
