import Link from "next/link";

// Brand-only bar shared by every route. Each role owns its own nav/identity
// row below this (see reviewer/layout.tsx and (submitter)/layout.tsx) — this
// used to also show a static "Reviewer" badge, which was wrong on submitter
// pages now that both roles exist. No real auth in this build; CLAUDE.md
// calls for a proper role switcher here eventually.
export function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
        <Link href="/" className="font-semibold">
          ClearPath Compliance Review
        </Link>
      </div>
    </header>
  );
}
