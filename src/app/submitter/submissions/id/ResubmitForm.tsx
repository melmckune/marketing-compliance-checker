"use client";

import { useActionState, useState } from "react";
import { resubmitAction, type ResubmitState } from "./actions";

const initialState: ResubmitState = { errors: {}, values: {} };

export function ResubmitForm({
  submissionId,
  title,
  content,
}: {
  submissionId: number;
  title: string;
  content: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const action = resubmitAction.bind(null, submissionId);
  const [state, formAction, pending] = useActionState(action, initialState);

  // Collapse the form back to the summary view the render after a
  // successful resubmit, without an effect (react.dev/learn/you-might-not-need-an-effect).
  const [handledSuccess, setHandledSuccess] = useState(state.success);
  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success) setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        {state.success && (
          <p className="mb-3 text-sm text-emerald-700 dark:text-emerald-400">
            Resubmitted — back in the review queue as a new version.
          </p>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Revise &amp; Resubmit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div>
        <label htmlFor="resubmit-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="resubmit-title"
          name="title"
          type="text"
          defaultValue={state.values.title ?? title}
          className={inputClass}
        />
        {state.errors.title && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="resubmit-content" className="mb-1 block text-sm font-medium">
          Revised Ad Copy
        </label>
        <textarea
          id="resubmit-content"
          name="content"
          rows={8}
          defaultValue={state.values.content ?? content}
          className={inputClass}
        />
        {state.errors.content && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.errors.content}</p>
        )}
      </div>

      <div>
        <label htmlFor="resubmit-changeSummary" className="mb-1 block text-sm font-medium">
          What changed <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id="resubmit-changeSummary"
          name="changeSummary"
          type="text"
          defaultValue={state.values.changeSummary}
          placeholder="e.g. Removed guaranteed-approval language, added APR disclosure"
          className={inputClass}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Resubmitting…" : "Resubmit for Review"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-white/10 dark:bg-zinc-900";
