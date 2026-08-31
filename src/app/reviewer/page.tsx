import Link from "next/link";
import { getQueue } from "@/db/queries";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { DecidedTable } from "./decided-table";

// Live operational queue — never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

const NEEDS_REVIEW = new Set(["pending", "in_review"]);

const PRODUCT_LABELS: Record<string, string> = {
  personal_loan: "Personal loan",
  credit_card: "Credit card",
  mortgage: "Mortgage",
};

// Human-readable elapsed time since the submission entered the queue.
function timeInQueue(createdAt: Date): string {
  const ms = Date.now() - createdAt.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default async function ReviewerQueuePage() {
  const queue = await getQueue();
  const needsReview = queue
    .filter((s) => NEEDS_REVIEW.has(s.status))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
        <DecidedTable rows={decided} />
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
                <th className="px-4 py-2 font-medium">Time in queue</th>
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
                    <span title={s.createdAt.toLocaleString()}>{timeInQueue(s.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/reviewer/id?id=${s.id}`}
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
