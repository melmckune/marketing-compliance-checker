"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// No real auth in this build (see CLAUDE.md) — this just navigates between
// the two role sections and highlights whichever one the current URL is in.
// Production would derive the role from the authenticated session instead.
export function RoleSwitcher() {
  const pathname = usePathname();
  const isReviewer = pathname.startsWith("/reviewer");
  const isSubmitter =
    pathname.startsWith("/submitter/submissions") || pathname.startsWith("/submitter/submit");

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-slate-200 p-0.5 text-xs font-medium dark:border-slate-700">
      <RoleLink href="/reviewer" active={isReviewer}>
        Reviewer
      </RoleLink>
      <RoleLink href="/submitter/submissions" active={isSubmitter}>
        Submitter
      </RoleLink>
    </div>
  );
}

function RoleLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition-colors ${
        active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
