import { db } from "./index";
import type { Severity } from "@/rules/types";

// Baselines for the "before" comparison — not computed from this system (it
// has no history of the old Excel/email process), but pulled directly from
// the numbers ClearPath's own pitch already commits to (see CLAUDE.md):
// "a 20-minute review takes 10 days" and "three round-trips is common."
export const BASELINE_MEDIAN_HOURS = 24 * 10; // 10 days
export const BASELINE_ROUND_TRIPS = 3;

const QUEUE_HEALTH_RULES = {
  watchOpenCases: 5,
  backedUpOpenCases: 8,
  watchPendingCases: 3,
  backedUpPendingCases: 5,
  watchOldestHours: 24,
  backedUpOldestHours: 48,
} as const;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const NEEDS_REVIEW_STATUSES = new Set(["pending", "in_review"]);
const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };

export async function getDashboardMetrics() {
  const allSubmissions = await db.query.submissions.findMany({
    columns: {
      id: true,
      status: true,
      source: true,
      affiliateName: true,
      createdAt: true,
    },
    with: {
      versions: { columns: { versionNumber: true, createdAt: true } },
      reviews: { columns: { createdAt: true } },
    },
  });

  const allFlags = await db.query.flags.findMany({
    // Deterministic order: without this, a tie in ruleCounts below (e.g. an
    // affiliate with exactly one flag of two different rules) resolves to
    // whatever row order Postgres happens to return, which isn't guaranteed
    // stable across requests.
    orderBy: (flags, { asc }) => [asc(flags.id)],
    columns: {
      submissionId: true,
      ruleId: true,
      regulation: true,
      severity: true,
      dismissed: true,
    },
  });
  const activeFlags = allFlags.filter((f) => !f.dismissed);

  // --- Median time to first decision (submission -> first review) ---
  const timeToDecisionHours: number[] = [];
  for (const s of allSubmissions) {
    if (s.reviews.length === 0 || s.versions.length === 0) continue;
    const firstVersion = s.versions.reduce((min, v) =>
      v.versionNumber < min.versionNumber ? v : min
    );
    const firstReview = s.reviews.reduce((min, r) =>
      r.createdAt < min.createdAt ? r : min
    );
    const hours =
      (firstReview.createdAt.getTime() - firstVersion.createdAt.getTime()) / (1000 * 60 * 60);
    timeToDecisionHours.push(Math.max(0, hours));
  }
  const medianTimeToDecisionHours = median(timeToDecisionHours);

  // --- Round-trips per approval (version count for submissions that landed on approved) ---
  const approvedVersionCounts = allSubmissions
    .filter((s) => s.status === "approved")
    .map((s) => s.versions.length);
  const avgRoundTrips =
    approvedVersionCounts.length > 0
      ? approvedVersionCounts.reduce((a, b) => a + b, 0) / approvedVersionCounts.length
      : null;

  // --- Open queue depth and age ---
  const pending = allSubmissions.filter((s) => NEEDS_REVIEW_STATUSES.has(s.status));
  const pendingCount = allSubmissions.filter((s) => s.status === "pending").length;
  const inReviewCount = allSubmissions.filter((s) => s.status === "in_review").length;
  const now = Date.now();
  const oldestPendingHours =
    pending.length > 0
      ? Math.max(...pending.map((s) => (now - s.createdAt.getTime()) / (1000 * 60 * 60)))
      : null;

  const queueReasons: string[] = [];
  const queueIsBackedUp =
    pending.length >= QUEUE_HEALTH_RULES.backedUpOpenCases ||
    pendingCount >= QUEUE_HEALTH_RULES.backedUpPendingCases ||
    (oldestPendingHours ?? 0) >= QUEUE_HEALTH_RULES.backedUpOldestHours;
  const queueNeedsWatch =
    pending.length >= QUEUE_HEALTH_RULES.watchOpenCases ||
    pendingCount >= QUEUE_HEALTH_RULES.watchPendingCases ||
    (oldestPendingHours ?? 0) >= QUEUE_HEALTH_RULES.watchOldestHours;

  if (pending.length >= QUEUE_HEALTH_RULES.backedUpOpenCases) {
    queueReasons.push(`${pending.length} open cases is at or above the ${QUEUE_HEALTH_RULES.backedUpOpenCases}-case backup limit`);
  } else if (pending.length >= QUEUE_HEALTH_RULES.watchOpenCases) {
    queueReasons.push(`${pending.length} open cases is above the ${QUEUE_HEALTH_RULES.watchOpenCases}-case watch line`);
  }

  if (pendingCount >= QUEUE_HEALTH_RULES.backedUpPendingCases) {
    queueReasons.push(`${pendingCount} pending cases have not been picked up yet`);
  } else if (pendingCount >= QUEUE_HEALTH_RULES.watchPendingCases) {
    queueReasons.push(`${pendingCount} pending cases are waiting for reviewer pickup`);
  }

  if ((oldestPendingHours ?? 0) >= QUEUE_HEALTH_RULES.backedUpOldestHours) {
    queueReasons.push(`oldest open case is at least ${QUEUE_HEALTH_RULES.backedUpOldestHours} hours old`);
  } else if ((oldestPendingHours ?? 0) >= QUEUE_HEALTH_RULES.watchOldestHours) {
    queueReasons.push(`oldest open case is at least ${QUEUE_HEALTH_RULES.watchOldestHours} hours old`);
  }

  const queueStatus: "healthy" | "watch" | "backed_up" = queueIsBackedUp
    ? "backed_up"
    : queueNeedsWatch
      ? "watch"
      : "healthy";

  const queueHealth = {
    status: queueStatus,
    rules: QUEUE_HEALTH_RULES,
    reasons: queueReasons,
    pendingCount,
    inReviewCount,
  };

  // --- Top violations (active flags only — a dismissed flag was judged not a real issue) ---
  const violationCounts = new Map<
    string,
    { count: number; regulation: string; severity: Severity }
  >();
  for (const f of activeFlags) {
    const existing = violationCounts.get(f.ruleId);
    if (existing) {
      existing.count++;
      if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[existing.severity]) {
        existing.severity = f.severity;
      }
    } else {
      violationCounts.set(f.ruleId, { count: 1, regulation: f.regulation, severity: f.severity });
    }
  }
  const topViolations = [...violationCounts.entries()]
    .map(([ruleId, v]) => ({
      ruleId,
      count: v.count,
      regulation: v.regulation,
      severity: v.severity,
      percentage: activeFlags.length > 0 ? (v.count / activeFlags.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // --- Per-affiliate scorecard ---
  const flagsBySubmissionId = new Map<number, typeof activeFlags>();
  for (const f of activeFlags) {
    if (!flagsBySubmissionId.has(f.submissionId)) flagsBySubmissionId.set(f.submissionId, []);
    flagsBySubmissionId.get(f.submissionId)!.push(f);
  }

  const affiliateGroups = new Map<string, typeof allSubmissions>();
  for (const s of allSubmissions) {
    if (s.source !== "affiliate" || !s.affiliateName) continue;
    if (!affiliateGroups.has(s.affiliateName)) affiliateGroups.set(s.affiliateName, []);
    affiliateGroups.get(s.affiliateName)!.push(s);
  }

  const affiliateScorecard = [...affiliateGroups.entries()]
    .map(([affiliateName, subs]) => {
      const decided = subs.filter((s) => s.status === "approved" || s.status === "rejected");
      const rejected = subs.filter((s) => s.status === "rejected").length;
      const rejectionRate = decided.length > 0 ? rejected / decided.length : null;
      const avgRevisions = subs.reduce((sum, s) => sum + s.versions.length, 0) / subs.length;

      const ruleCounts = new Map<string, number>();
      for (const s of subs) {
        for (const f of flagsBySubmissionId.get(s.id) ?? []) {
          ruleCounts.set(f.ruleId, (ruleCounts.get(f.ruleId) ?? 0) + 1);
        }
      }
      const topRule = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])[0];

      return {
        affiliateName,
        submissionCount: subs.length,
        rejectionRate,
        mostCommonViolation: topRule ? topRule[0] : null,
        avgRevisions,
      };
    })
    .sort((a, b) => b.submissionCount - a.submissionCount);

  return {
    medianTimeToDecisionHours,
    baselineMedianHours: BASELINE_MEDIAN_HOURS,
    avgRoundTrips,
    baselineRoundTrips: BASELINE_ROUND_TRIPS,
    openQueueDepth: pending.length,
    oldestPendingHours,
    queueHealth,
    topViolations,
    affiliateScorecard,
  };
}

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;
