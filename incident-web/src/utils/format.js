const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(value) {
  return timeFormatter.format(value instanceof Date ? value : new Date(value));
}

export function formatDateTime(value) {
  return dateTimeFormatter.format(
    value instanceof Date ? value : new Date(value),
  );
}

export function initialsFrom(text) {
  if (!text) return "?";
  const local = text.split("@")[0];
  const parts = local.split(/[.\s_-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0].toUpperCase());
  return letters.join("") || local.slice(0, 2).toUpperCase();
}

export function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
