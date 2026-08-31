import Link from "next/link";
import { getQueue } from "@/db/queries";
import { SeverityBadge, StatusBadge } from "@/components/badges";

// Live operational queue — never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

const NEEDS_REVIEW = new Set(["pending", "in_review"]);

const PRODUCT_LABELS: Record<string, string> = {
  personal_loan: "Personal loan",
  credit_card: "Credit card",
  mortgage: "Mortgage",
};

export default async function ReviewerQueuePage() {
  const queue = await getQueue();
  const needsReview = queue.filter((s) => NEEDS_REVIEW.has(s.status));
  const decided = queue.filter((s) => !NEEDS_REVIEW.has(s.status));
  const highSeverityCount = needsReview.filter((s) => s.maxSeverity === "high").length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Review queue</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {needsReview.length} awaiting a decision
        {highSeverityCount > 0 && (
          <>
            {" · "}
            <span className="font-medium text-red-600 dark:text-red-400">
              {highSeverityCount} with a high-severity flag
            </span>
          </>
        )}
      </p>

      <QueueTable title="Needs review" rows={needsReview} emptyText="Nothing waiting — queue is clear." />
      {decided.length > 0 && (
        <QueueTable title="Decided" rows={decided} emptyText="" />
      )}
    </div>
  );
}

function QueueTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof getQueue>>;
  emptyText: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Flags</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="max-w-xs truncate px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {PRODUCT_LABELS[s.productType] ?? s.productType}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {s.source === "affiliate" ? s.affiliateName : "Internal"}
                  </td>
                  <td className="px-4 py-3">
                    {s.activeFlagCount > 0 && s.maxSeverity ? (
                      <span className="flex items-center gap-1.5">
                        <SeverityBadge severity={s.maxSeverity} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {s.activeFlagCount}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">none</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {s.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/reviewer/${s.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
