import { previousCalendarDate } from "./daily-practice.js";

export function notebookWindowStart(today) {
  let cursor = today;
  for (let offset = 0; offset < 6; offset += 1) cursor = previousCalendarDate(cursor);
  return cursor;
}

function dateLabel(date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function groupNotebookHistory({ items = [], status = "to_review", today }) {
  const start = notebookWindowStart(today);
  const dateField = status === "resolved" ? "resolved_date" : "latest_mistake_date";
  const buckets = new Map();
  for (const item of items) {
    const date = item?.[dateField];
    if (!date || date < start || date > today) continue;
    if (!buckets.has(date)) buckets.set(date, []);
    buckets.get(date).push(item);
  }
  const dates = [...buckets.keys()].sort((left, right) => right.localeCompare(left));
  return {
    today: buckets.get(today) ?? [],
    older: dates.filter(date => date !== today).map(date => ({ date, label: dateLabel(date), items: buckets.get(date) })),
  };
}
