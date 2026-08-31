import { buildHighlightSegments, maxSeverity, type HighlightFlag } from "@/lib/highlight";
import type { Severity } from "@/rules/types";

const SEVERITY_MARK_STYLES: Record<Severity, string> = {
  high: "bg-red-200/70 decoration-red-500 dark:bg-red-900/50",
  medium: "bg-amber-200/70 decoration-amber-500 dark:bg-amber-900/50",
  low: "bg-slate-200/70 decoration-slate-500 dark:bg-slate-700/50",
};

export function HighlightedContent({
  content,
  flags,
}: {
  content: string;
  flags: HighlightFlag[];
}) {
  const segments = buildHighlightSegments(content, flags);

  return (
    <p className="leading-relaxed whitespace-pre-wrap">
      {segments.map((segment, i) => {
        if (segment.flags.length === 0) {
          return <span key={i}>{segment.text}</span>;
        }

        const active = segment.flags.filter((f) => !f.dismissed);
        const allDismissed = active.length === 0;
        const severity = maxSeverity(active.length > 0 ? active : segment.flags);
        const title = segment.flags
          .map((f) => `${f.dismissed ? "[dismissed] " : ""}${f.message}`)
          .join("\n");

        return (
          <a
            key={i}
            href={`#flag-${segment.flags[0].id}`}
            title={title}
            className={`rounded px-0.5 underline decoration-2 underline-offset-2 ${
              allDismissed
                ? "bg-slate-100 text-slate-400 line-through decoration-slate-400 dark:bg-slate-800 dark:text-slate-500"
                : SEVERITY_MARK_STYLES[severity]
            }`}
          >
            {segment.text}
          </a>
        );
      })}
    </p>
  );
}
