export function formatDuration(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  const days = hours / 24;
  return `${Number.isInteger(days) ? days : days.toFixed(1)}d`;
}

export function formatRoundTrips(count: number): string {
  return Number.isInteger(count) ? String(count) : count.toFixed(1);
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function humanizeRuleId(ruleId: string): string {
  return ruleId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
