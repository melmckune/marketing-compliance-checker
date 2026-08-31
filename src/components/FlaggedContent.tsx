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

/**
 * Renders `content` with each flag's span highlighted inline (numbered to
 * match the list below), then lists every flag with its regulation and
 * reviewer-facing message. Dismissed flags stay visible but muted — the
 * reviewer already judged them a false positive, but the audit trail should
 * still show they were caught and ruled on.
 */
export function FlaggedContent({ content, flags }: { content: string; flags: FlagLike[] }) {
  const sorted = [...flags].sort((a, b) => a.startOffset - b.startOffset);

  const segments: { text: string; flag?: FlagLike; index?: number }[] = [];
  let cursor = 0;
  sorted.forEach((flag, i) => {
    if (flag.startOffset < cursor || flag.endOffset > content.length) return;
    if (flag.startOffset > cursor) {
      segments.push({ text: content.slice(cursor, flag.startOffset) });
    }
    segments.push({
      text: content.slice(flag.startOffset, flag.endOffset),
      flag,
      index: i + 1,
    });
    cursor = flag.endOffset;
  });
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor) });
  }

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-4 leading-7 dark:border-white/10 dark:bg-zinc-900">
        {segments.map((seg, i) =>
          seg.flag ? (
            <mark
              key={i}
              className={`rounded px-0.5 ${SEVERITY_MARK_CLASSES[seg.flag.severity]} ${
                seg.flag.dismissed ? "opacity-40" : ""
              }`}
              title={seg.flag.message}
            >
              {seg.text}
              <sup className="ml-0.5 font-sans font-semibold">{seg.index}</sup>
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
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
