import Link from "next/link";
import { RoleSwitcher } from "./role-switcher";

// Brand bar + role switcher, shared by every route. Each role still owns
// its own nav/identity row below this (see reviewer/layout.tsx and
// (submitter)/layout.tsx) for within-role navigation; this is just for
// flipping between the two perspectives, per CLAUDE.md's "no real auth — a
// role switcher in the header" design call.
export function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          ClearPath Compliance Review
        </Link>
        <RoleSwitcher />
      </div>
    </header>
  );
}
