import Link from "next/link";
import { CURRENT_SUBMITTER } from "@/lib/current-user";

// Scoped to /submitter only — does not touch the shared root layout, which
// owns the cross-role shell/role-switcher. Note: this folder is named
// `submitter`, not `(submitter)` — without the parens it's a real path
// segment, not a non-routing route group, so every route under here
// actually lives at /submitter/... now, not at the bare path.
export default function SubmitterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <span className="text-zinc-500 dark:text-zinc-400">ClearPath Compliance</span>
            <Link href="/submitter/submissions" className="hover:underline">
              My Submissions
            </Link>
            <Link href="/submitter/submit" className="hover:underline">
              New Submission
            </Link>
          </nav>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{CURRENT_SUBMITTER}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
