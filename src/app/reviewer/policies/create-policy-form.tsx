"use client";

import { useState } from "react";
import { createPolicy } from "./actions";

export function CreatePolicyForm() {
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");

  if (!open) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          New policy
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-slate-200 p-5 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          New policy
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>

      <form action={createPolicy} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rule id">
            <input
              name="ruleId"
              required
              placeholder="e.g. guaranteed_approval_claim"
              className={inputClass}
            />
          </Field>
          <Field label="Policy name">
            <input name="name" required placeholder="e.g. Guaranteed Approval Claim" className={inputClass} />
          </Field>
        </div>

        <Field label="Regulation">
          <input
            name="regulation"
            required
            placeholder="e.g. UDAAP / FTC Act §5 — deceptive claim"
            className={inputClass}
          />
        </Field>

        <Field label="Description (what the policy flags)">
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Plain-English explanation of what this policy checks for."
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Severity">
            <select
              name="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high")}
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Applies to">
            <select name="productScope" defaultValue="all products" className={inputClass}>
              <option value="all products">All products</option>
              <option value="personal_loan">Personal loan</option>
              <option value="credit_card">Credit card</option>
              <option value="mortgage">Mortgage</option>
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="new-policy-active"
            name="active"
            value="true"
            defaultChecked
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
          />
          <label htmlFor="new-policy-active" className="text-sm text-slate-600 dark:text-slate-300">
            Enforce this policy immediately
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Create policy
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
