import { getDashboardMetrics } from "@/db/dashboard-queries";
import { formatDuration, formatPercent, formatRoundTrips, humanizeRuleId } from "@/lib/format";

// Live operational view — never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Median time to decision" hint="Submission to first decision">
          {metrics.medianTimeToDecisionHours === null ? (
            <EmptyStat text="No decisions yet" />
          ) : (
            <>
              <div className="text-3xl font-semibold">
                {formatDuration(metrics.medianTimeToDecisionHours)}
              </div>
              <ComparisonBars
                current={{
                  value: metrics.medianTimeToDecisionHours,
                  label: formatDuration(metrics.medianTimeToDecisionHours),
                }}
                baseline={{
                  value: metrics.baselineMedianHours,
                  label: formatDuration(metrics.baselineMedianHours),
                }}
              />
            </>
          )}
        </MetricCard>

        <MetricCard label="Round-trips per approval" hint="Average submit → review cycles">
          {metrics.avgRoundTrips === null ? (
            <EmptyStat text="No approvals yet" />
          ) : (
            <>
              <div className="text-3xl font-semibold">
                {formatRoundTrips(metrics.avgRoundTrips)}
              </div>
              <ComparisonBars
                current={{
                  value: metrics.avgRoundTrips,
                  label: formatRoundTrips(metrics.avgRoundTrips),
                }}
                baseline={{
                  value: metrics.baselineRoundTrips,
                  label: String(metrics.baselineRoundTrips),
                }}
              />
            </>
          )}
        </MetricCard>

        <MetricCard label="Open queue">
          <div className="text-3xl font-semibold">{metrics.openQueueDepth}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">pending review</p>
          <p className="mt-4 text-sm">
            Oldest waiting:{" "}
            <span className="font-medium">
              {metrics.oldestPendingHours === null
                ? "—"
                : formatDuration(metrics.oldestPendingHours)}
            </span>
          </p>
        </MetricCard>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Top violations
        </h2>
        <div className="mt-4 space-y-3">
          {metrics.topViolations.length === 0 ? (
            <EmptyStat text="No active flags." />
          ) : (
            metrics.topViolations.map((v) => (
              <div key={v.ruleId}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{humanizeRuleId(v.ruleId)}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {v.count} ({Math.round(v.percentage)}%)
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${Math.max(v.percentage, 2)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {v.regulation}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Per-affiliate scorecard
        </h2>
        {metrics.affiliateScorecard.length === 0 ? (
          <div className="mt-4">
            <EmptyStat text="No affiliate submissions yet." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Affiliate</th>
                  <th className="px-4 py-2 font-medium">Submissions</th>
                  <th className="px-4 py-2 font-medium">Rejection rate</th>
                  <th className="px-4 py-2 font-medium">Most common violation</th>
                  <th className="px-4 py-2 font-medium">Avg revisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {metrics.affiliateScorecard.map((a) => (
                  <tr key={a.affiliateName}>
                    <td className="px-4 py-3 font-medium">{a.affiliateName}</td>
                    <td className="px-4 py-3">{a.submissionCount}</td>
                    <td className="px-4 py-3">
                      {a.rejectionRate === null ? (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      ) : (
                        <RejectionRate rate={a.rejectionRate} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {a.mostCommonViolation ? humanizeRuleId(a.mostCommonViolation) : "—"}
                    </td>
                    <td className="px-4 py-3">{a.avgRevisions.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyStat({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 dark:text-slate-500">{text}</p>;
}

function ComparisonBars({
  current,
  baseline,
}: {
  current: { value: number; label: string };
  baseline: { value: number; label: string };
}) {
  const max = Math.max(current.value, baseline.value, 1);
  return (
    <div className="mt-4 space-y-2">
      <ComparisonBar label="Now" value={current.value} valueLabel={current.label} max={max} tone="accent" />
      <ComparisonBar
        label="Before"
        value={baseline.value}
        valueLabel={baseline.label}
        max={max}
        tone="track"
      />
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  valueLabel,
  max,
  tone,
}: {
  label: string;
  value: number;
  valueLabel: string;
  max: number;
  tone: "accent" | "track";
}) {
  const widthPct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{valueLabel}</span>
      </div>
      <div className="mt-0.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${
            tone === "accent" ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
          }`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function RejectionRate({ rate }: { rate: number }) {
  const colorClass =
    rate === 0
      ? "text-green-700 dark:text-green-400"
      : rate < 0.5
        ? "text-amber-700 dark:text-amber-400"
        : "text-red-700 dark:text-red-400";
  return <span className={`font-medium ${colorClass}`}>{formatPercent(rate)}</span>;
}
