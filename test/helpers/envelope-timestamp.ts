import {
  formatUtcTimestamp,
  formatZonedTimestamp,
  resolveTimezone,
} from "../../src/infra/format-time/format-datetime.ts";

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatEnvelopeTimestamp(date: Date, timeZone?: string): string {
  const trimmed = timeZone?.trim();
  const resolved =
    !trimmed || trimmed.toLowerCase() === "utc" || trimmed.toLowerCase() === "gmt"
      ? { mode: "utc" as const }
      : trimmed.toLowerCase() === "local"
        ? { mode: "local" as const }
        : { mode: "iana" as const, timeZone: resolveTimezone(trimmed) ?? "UTC" };

  const weekday =
    resolved.mode === "utc"
      ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(date)
      : resolved.mode === "local"
        ? new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
        : new Intl.DateTimeFormat("en-US", {
            timeZone: resolved.timeZone,
            weekday: "short",
          }).format(date);

  const stamp =
    resolved.mode === "utc"
      ? formatUtcTimestamp(date)
      : resolved.mode === "local"
        ? formatZonedTimestamp(date)
        : formatZonedTimestamp(date, { timeZone: resolved.timeZone });

  return stamp ? `${weekday} ${stamp}` : weekday;
}
