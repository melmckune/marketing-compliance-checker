import Link from "next/link";
import { CURRENT_REVIEWER } from "@/lib/current-user";

// Scoped to /reviewer only — mirrors (submitter)/layout.tsx so both roles
// get the same brand bar (root layout) + section nav/identity bar pattern,
// instead of one role showing a stray "Reviewer" badge that used to leak
// onto the other role's pages.
export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <span className="text-slate-500 dark:text-slate-400">Compliance Review</span>
            <Link href="/reviewer" className="hover:underline">
              Queue
            </Link>
            <Link href="/reviewer/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </nav>
          <span className="text-xs text-slate-500 dark:text-slate-400">{CURRENT_REVIEWER}</span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
