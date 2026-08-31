import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/badges";
import { getSubmissionForReview } from "@/db/queries";
import { DecisionForm } from "./decision-form";
import { FlagList } from "./flag-list";
import { HighlightedContent } from "./highlighted-content";

// Live operational view — never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

const PRODUCT_LABELS: Record<string, string> = {
  personal_loan: "Personal loan",
  credit_card: "Credit card",
  mortgage: "Mortgage",
};

const NEEDS_DECISION = new Set(["pending", "in_review"]);

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isFinite(submissionId)) notFound();

  const result = await getSubmissionForReview(submissionId);
  if (!result) notFound();

  const { submission, latestVersion, flags } = result;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/reviewer" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to queue
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{submission.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {PRODUCT_LABELS[submission.productType] ?? submission.productType} ·{" "}
            {submission.channel} ·{" "}
            {submission.source === "affiliate"
              ? `Affiliate: ${submission.affiliateName}`
              : "Internal"}{" "}
            · Submitted by {submission.submittedBy}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 p-5 dark:border-slate-800">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Asset text (v{latestVersion.versionNumber})
        </h2>
        <div className="mt-3 text-sm">
          <HighlightedContent content={latestVersion.content} flags={flags} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Flags ({flags.length})
        </h2>
        <div className="mt-3">
          <FlagList flags={flags} submissionId={submission.id} />
        </div>
      </section>

      {submission.versions.length > 1 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Version history
          </h2>
          <ul className="mt-3 space-y-2">
            {[...submission.versions].reverse().map((v) => (
              <li
                key={v.id}
                className="rounded border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    v{v.versionNumber}: {v.title}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {v.createdAt.toLocaleDateString()}
                  </span>
                </div>
                {v.changeSummary && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {v.changeSummary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {submission.reviews.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Review history
          </h2>
          <ul className="mt-3 space-y-2">
            {submission.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {r.decision.replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {r.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">by {r.reviewer}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.reasonCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                    >
                      {code}
                    </span>
                  ))}
                </div>
                {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {NEEDS_DECISION.has(submission.status) && (
        <section className="mt-8 rounded-lg border border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Decision
          </h2>
          <div className="mt-3">
            <DecisionForm submissionId={submission.id} submissionVersionId={latestVersion.id} />
          </div>
        </section>
      )}
    </div>
  );
}
