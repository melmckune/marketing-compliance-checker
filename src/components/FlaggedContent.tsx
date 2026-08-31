import { SEVERITY_BADGE_CLASSES, SEVERITY_LABELS, SEVERITY_MARK_CLASSES } from "@/lib/labels";
import type { Severity } from "@/db/schema-types";

type FlagLike = {
  id: number;
  ruleId: string;
  severity: Severity;
  regulation: string;
  message: string;
  startOffset: number;
  endOffset: number;
  dismissed: boolean;
  dismissedReason: string | null;
  dismissedBy: string | null;
};

const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };

type NumberedFlag = FlagLike & { number: number };

type Segment = { text: string; flags: NumberedFlag[] };

/**
 * Splits `content` at every flag boundary rather than walking flags in
 * order with a single cursor. A single cursor silently drops any flag whose
 * span is nested inside (or overlaps) an earlier one — e.g. a narrow
 * "14.99%" APR-term flag nested inside a broader "as low as 14.99%"
 * representative-example flag — because its start falls behind the cursor
 * already advanced by the outer flag. Splitting on the union of all
 * start/end offsets means every flag gets its own sub-segment instead of
 * being silently skipped.
 */
function buildSegments(content: string, sortedFlags: NumberedFlag[]): Segment[] {
  if (sortedFlags.length === 0) return [{ text: content, flags: [] }];

  const points = new Set<number>([0, content.length]);
  for (const f of sortedFlags) {
    points.add(Math.max(0, Math.min(f.startOffset, content.length)));
    points.add(Math.max(0, Math.min(f.endOffset, content.length)));
  }
  const sortedPoints = [...points].sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    if (start === end) continue;
    const covering = sortedFlags.filter((f) => f.startOffset <= start && f.endOffset >= end);
    segments.push({ text: content.slice(start, end), flags: covering });
  }
  return segments;
}

/**
 * Renders `content` with each flag's span highlighted inline (numbered to
 * match the list below), then lists every flag with its regulation and
 * reviewer-facing message. Dismissed flags stay visible but muted — the
 * reviewer already judged them a false positive, but the audit trail should
 * still show they were caught and ruled on.
 */
export function FlaggedContent({ content, flags }: { content: string; flags: FlagLike[] }) {
  const sorted: NumberedFlag[] = [...flags]
    .sort((a, b) => a.startOffset - b.startOffset)
    .map((flag, i) => ({ ...flag, number: i + 1 }));

  const segments = buildSegments(content, sorted);

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-4 leading-7 dark:border-white/10 dark:bg-zinc-900">
        {segments.map((seg, i) => {
          if (seg.flags.length === 0) return <span key={i}>{seg.text}</span>;

          const active = seg.flags.filter((f) => !f.dismissed);
          const allDismissed = active.length === 0;
          const relevant = active.length > 0 ? active : seg.flags;
          const severity = relevant.reduce<Severity>(
            (worst, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[worst] ? f.severity : worst),
            relevant[0].severity
          );
          const title = seg.flags.map((f) => f.message).join("\n");
          const numbers = seg.flags.map((f) => f.number).join(",");

          return (
            <mark
              key={i}
              className={`rounded px-0.5 ${
                allDismissed ? "opacity-40" : SEVERITY_MARK_CLASSES[severity]
              }`}
              title={title}
            >
              {seg.text}
              <sup className="ml-0.5 font-sans font-semibold">{numbers}</sup>
            </mark>
          );
        })}
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No compliance flags on this version.
        </p>
      ) : (
        <ol className="space-y-2">
          {sorted.map((flag, i) => (
            <li
              key={flag.id}
              className={`rounded-lg border border-black/10 p-3 text-sm dark:border-white/10 ${
                flag.dismissed ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  #{i + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASSES[flag.severity]}`}
                >
                  {SEVERITY_LABELS[flag.severity]}
                </span>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {flag.regulation}
                </span>
                {flag.dismissed && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    Dismissed
                  </span>
                )}
              </div>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">{flag.message}</p>
              {flag.dismissed && flag.dismissedReason && (
                <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">
                  Dismissed by {flag.dismissedBy}: &ldquo;{flag.dismissedReason}&rdquo;
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
