import { eq } from "drizzle-orm";
import { db } from "./index";
import { flags, submissions } from "./schema";
import type { Severity } from "@/rules/types";

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

const NEEDS_REVIEW_STATUSES = new Set(["pending", "in_review"]);

export async function getQueue() {
  const rows = await db.query.submissions.findMany({
    with: {
      flags: {
        where: (flags, { eq }) => eq(flags.dismissed, false),
      },
    },
    orderBy: (submissions, { asc }) => [asc(submissions.createdAt)],
  });

  return rows
    .map((submission) => {
      const activeFlags = submission.flags;
      const maxSeverity = activeFlags.reduce<Severity | null>(
        (max, f) =>
          !max || SEVERITY_RANK[f.severity] > SEVERITY_RANK[max] ? f.severity : max,
        null
      );
      return {
        ...submission,
        activeFlagCount: activeFlags.length,
        maxSeverity,
      };
    })
    .sort((a, b) => {
      const aNeedsReview = NEEDS_REVIEW_STATUSES.has(a.status);
      const bNeedsReview = NEEDS_REVIEW_STATUSES.has(b.status);
      if (aNeedsReview !== bNeedsReview) return aNeedsReview ? -1 : 1;

      const aRank = a.maxSeverity ? SEVERITY_RANK[a.maxSeverity] : 0;
      const bRank = b.maxSeverity ? SEVERITY_RANK[b.maxSeverity] : 0;
      if (aRank !== bRank) return bRank - aRank;

      return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

export async function getSubmissionForReview(id: number) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: {
      versions: {
        orderBy: (versions, { asc }) => [asc(versions.versionNumber)],
      },
      reviews: {
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      },
    },
  });
  if (!submission) return null;

  const latestVersion = submission.versions[submission.versions.length - 1];

  const versionFlags = await db.query.flags.findMany({
    where: eq(flags.submissionVersionId, latestVersion.id),
    orderBy: (flags, { asc }) => [asc(flags.startOffset)],
  });

  return { submission, latestVersion, flags: versionFlags };
}

export type QueueItem = Awaited<ReturnType<typeof getQueue>>[number];
export type SubmissionForReview = NonNullable<
  Awaited<ReturnType<typeof getSubmissionForReview>>
>;
