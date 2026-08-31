"use client";

import { useState } from "react";
import { APPROVE_REASON_CODES, REJECT_REASON_CODES } from "@/lib/reason-codes";
import { decideSubmission } from "../actions";

type Decision = "approved" | "changes_requested" | "rejected";

const DECISION_ACTIVE_CLASS: Record<Decision, string> = {
  approved: "border-green-600 bg-green-600 text-white",
  changes_requested: "border-amber-600 bg-amber-600 text-white",
  rejected: "border-red-600 bg-red-600 text-white",
};

const DECISION_LABELS: Record<Decision, string> = {
  approved: "Approve",
  changes_requested: "Request changes",
  rejected: "Reject",
};

export function DecisionForm({
  submissionId,
  submissionVersionId,
}: {
  submissionId: number;
  submissionVersionId: number;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const codes = decision === "approved" ? APPROVE_REASON_CODES : REJECT_REASON_CODES;

  function selectDecision(d: Decision) {
    setDecision(d);
    setSelectedCodes([]);
  }

  function toggleCode(id: string) {
    setSelectedCodes((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  return (
    <form action={decideSubmission} className="space-y-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="submissionVersionId" value={submissionVersionId} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      {selectedCodes.map((c) => (
        <input key={c} type="hidden" name="reasonCodes" value={c} />
      ))}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(DECISION_LABELS) as Decision[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => selectDecision(d)}
            className={`rounded border px-3 py-1.5 text-sm font-medium ${
              decision === d
                ? DECISION_ACTIVE_CLASS[d]
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {DECISION_LABELS[d]}
          </button>
        ))}
      </div>

      {decision && (
        <>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Reason codes (select at least one)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {codes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCode(c.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    selectedCodes.includes(c.id)
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
              htmlFor="notes"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={selectedCodes.length === 0}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900"
          >
            Submit decision
          </button>
        </>
      )}
    </form>
  );
}
