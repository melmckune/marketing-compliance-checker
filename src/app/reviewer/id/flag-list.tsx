import { SeverityBadge } from "@/components/badges";
import { DISMISS_REASON_CODES } from "@/lib/reason-codes";
import type { SubmissionForReview } from "@/db/queries";
import { dismissFlag } from "../actions";

export function FlagList({ flags }: { flags: SubmissionForReview["flags"] }) {
  if (flags.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">No flags on this version.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {flags.map((f) => (
        <li
          key={f.id}
          id={`flag-${f.id}`}
          className={`scroll-mt-6 rounded-lg border p-4 ${
            f.dismissed
              ? "border-slate-200 opacity-60 dark:border-slate-800"
              : "border-slate-300 dark:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={f.severity} />
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {f.ruleId}
              </span>
            </div>
            {f.dismissed && (
              <span className="text-xs font-medium text-slate-400">Dismissed</span>
            )}
          </div>
          <p className="mt-2 text-sm">{f.message}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{f.regulation}</p>

          {f.dismissed ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Dismissed by {f.dismissedBy} — {f.dismissedReason}
            </p>
          ) : (
            <form action={dismissFlag} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="flagId" value={f.id} />
              <select
                name="reasonCode"
                required
                defaultValue=""
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="" disabled>
                  Dismiss as…
                </option>
                {DISMISS_REASON_CODES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Dismiss
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
