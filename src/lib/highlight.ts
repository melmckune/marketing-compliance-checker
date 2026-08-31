import type { Severity } from "@/rules/types";

export interface HighlightFlag {
  id: number;
  startOffset: number;
  endOffset: number;
  severity: Severity;
  dismissed: boolean;
  message: string;
}

export interface HighlightSegment {
  text: string;
  flags: HighlightFlag[];
}

/**
 * Splits `content` into segments at every flag boundary, so overlapping
 * flag spans (e.g. a rate match nested inside a broader "as low as X%"
 * match) render correctly instead of producing invalid nested markup. Each
 * segment carries every flag that covers it.
 */
export function buildHighlightSegments(
  content: string,
  flags: HighlightFlag[]
): HighlightSegment[] {
  if (flags.length === 0) return [{ text: content, flags: [] }];

  const points = new Set<number>([0, content.length]);
  for (const f of flags) {
    points.add(Math.max(0, Math.min(f.startOffset, content.length)));
    points.add(Math.max(0, Math.min(f.endOffset, content.length)));
  }
  const sorted = [...points].sort((a, b) => a - b);

  const segments: HighlightSegment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start === end) continue;
    const covering = flags.filter((f) => f.startOffset <= start && f.endOffset >= end);
    segments.push({ text: content.slice(start, end), flags: covering });
  }
  return segments;
}

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export function maxSeverity(flags: HighlightFlag[]): Severity {
  return flags.reduce<Severity>(
    (max, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[max] ? f.severity : max),
    "low"
  );
}
