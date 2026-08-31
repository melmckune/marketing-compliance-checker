import Link from "next/link";

// No real auth in this build — CLAUDE.md calls for a role switcher here once
// the submitter side exists. Until then this is a static label.
export function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/reviewer" className="font-semibold">
          ClearPath Compliance Review
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Reviewer
        </span>
      </div>
    </header>
  );
}
