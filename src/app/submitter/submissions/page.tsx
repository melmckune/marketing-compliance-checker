import Link from "next/link";
import { listMySubmissions, currentVersionOf, activeFlagsForVersion, highestSeverity } from "@/lib/submissions";
import {
  CHANNEL_LABELS,
  PRODUCT_TYPE_LABELS,
  SEVERITY_BADGE_CLASSES,
  SEVERITY_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/labels";

// Live operational view — never serve a stale build-time snapshot. (Same
// pitfall as /reviewer: a plain async DB fetch with no dynamic APIs gets
// statically prerendered by default, so revalidatePath is the only thing
// keeping it fresh unless this is forced.)
export const dynamic = "force-dynamic";

export default async function MySubmissionsPage() {
  const mySubmissions = await listMySubmissions();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Submissions</h1>
        <Link
          href="/submitter/submit"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          New Submission
        </Link>
      </div>

      {mySubmissions.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          No submissions yet. <Link href="/submitter/submit" className="underline">Submit your first asset</Link>.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-black/10 dark:divide-white/10">
          {mySubmissions.map((s) => {
            const version = currentVersionOf(s.versions);
            const active = activeFlagsForVersion(s.flags, version.id);
            const severity = highestSeverity(active);

            return (
              <li key={s.id}>
                <Link
                  href={`/submitter/submissions/id?id=${s.id}`}
                  className="flex items-center justify-between gap-4 py-4 hover:bg-black/[.02] dark:hover:bg-white/[.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {PRODUCT_TYPE_LABELS[s.productType]} · {CHANNEL_LABELS[s.channel]}
                      {s.affiliateName ? ` · ${s.affiliateName}` : ""} · v{version.versionNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {severity && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASSES[severity]}`}
                      >
                        {SEVERITY_LABELS[severity]} flag{active.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[s.status]}`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
