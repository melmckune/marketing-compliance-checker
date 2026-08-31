import { notFound } from "next/navigation";
import { FlaggedContent } from "@/components/FlaggedContent";
import { getSubmissionDetail, currentVersionOf, activeFlagsForVersion } from "@/lib/submissions";
import {
  CHANNEL_LABELS,
  PRODUCT_TYPE_LABELS,
  RESUBMITTABLE_STATUSES,
  SOURCE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/labels";
import { ResubmitForm } from "./ResubmitForm";

export default async function SubmissionDetailPage(props: PageProps<"/submissions/[id]">) {
  const { id } = await props.params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) notFound();

  const submission = await getSubmissionDetail(submissionId);
  if (!submission) notFound();

  const version = currentVersionOf(submission.versions);
  const versionFlags = submission.flags.filter((f) => f.submissionVersionId === version.id);
  const activeCount = activeFlagsForVersion(versionFlags, version.id).length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{submission.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[submission.status]}`}
          >
            {STATUS_LABELS[submission.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {PRODUCT_TYPE_LABELS[submission.productType]} · {CHANNEL_LABELS[submission.channel]} ·{" "}
          {SOURCE_LABELS[submission.source]}
          {submission.affiliateName ? ` (${submission.affiliateName})` : ""} · Version{" "}
          {version.versionNumber}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Compliance Flags {activeCount > 0 && `(${activeCount})`}
        </h2>
        <FlaggedContent content={version.content} flags={versionFlags} />
      </section>

      {submission.reviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Reviewer Feedback
          </h2>
          <ul className="space-y-3">
            {submission.reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{review.reviewer}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {review.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 font-medium capitalize">{review.decision.replace("_", " ")}</p>
                {review.reasonCodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {review.reasonCodes.map((code) => (
                      <span
                        key={code}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {code.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
                {review.notes && (
                  <p className="mt-2 text-zinc-600 dark:text-zinc-300">{review.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {submission.versions.length > 1 && (
        <details className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
          <summary className="cursor-pointer font-medium">
            Version History ({submission.versions.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {[...submission.versions].reverse().map((v) => (
              <li key={v.id} className="border-t border-black/10 pt-2 first:border-none first:pt-0 dark:border-white/10">
                <p className="font-medium">
                  v{v.versionNumber}: {v.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {v.createdAt.toLocaleString()} by {v.createdBy}
                </p>
                {v.changeSummary && (
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">{v.changeSummary}</p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {RESUBMITTABLE_STATUSES.includes(submission.status) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Resubmit
          </h2>
          <ResubmitForm
            submissionId={submission.id}
            title={submission.title}
            content={submission.content}
          />
        </section>
      )}
    </div>
  );
}
