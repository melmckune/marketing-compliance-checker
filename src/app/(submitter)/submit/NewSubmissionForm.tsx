"use client";

import { useActionState, useState } from "react";
import { CHANNELS, PRODUCT_TYPES, SOURCES } from "@/db/schema-types";
import type { Source } from "@/db/schema-types";
import { CHANNEL_LABELS, PRODUCT_TYPE_LABELS, SOURCE_LABELS } from "@/lib/labels";
import { submitNewAsset, type NewSubmissionState } from "./actions";

const initialState: NewSubmissionState = { errors: {}, values: {} };

export function NewSubmissionForm() {
  const [state, formAction, pending] = useActionState(submitNewAsset, initialState);
  const [source, setSource] = useState<Source>(
    (state.values.source as Source) || "internal"
  );

  return (
    <form action={formAction} className="space-y-6">
      <Field label="Title" htmlFor="title" error={state.errors.title}>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={state.values.title}
          placeholder="e.g. Spring Personal Loan Email Blast"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Product" htmlFor="productType" error={state.errors.productType}>
          <select
            id="productType"
            name="productType"
            defaultValue={state.values.productType || ""}
            className={inputClass}
          >
            <option value="" disabled>
              Select a product
            </option>
            {PRODUCT_TYPES.map((p) => (
              <option key={p} value={p}>
                {PRODUCT_TYPE_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Channel" htmlFor="channel" error={state.errors.channel}>
          <select
            id="channel"
            name="channel"
            defaultValue={state.values.channel || ""}
            className={inputClass}
          >
            <option value="" disabled>
              Select a channel
            </option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Source" htmlFor="source" error={state.errors.source}>
        <div className="flex gap-2">
          {SOURCES.map((s) => (
            <label
              key={s}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${
                source === s
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              <input
                type="radio"
                name="source"
                value={s}
                checked={source === s}
                onChange={() => setSource(s)}
                className="sr-only"
              />
              {SOURCE_LABELS[s]}
            </label>
          ))}
        </div>
      </Field>

      {source === "affiliate" && (
        <Field label="Affiliate Name" htmlFor="affiliateName" error={state.errors.affiliateName}>
          <input
            id="affiliateName"
            name="affiliateName"
            type="text"
            defaultValue={state.values.affiliateName}
            placeholder="e.g. QuickApprove Partners"
            className={inputClass}
          />
        </Field>
      )}

      <Field label="Ad Copy" htmlFor="content" error={state.errors.content}>
        <textarea
          id="content"
          name="content"
          rows={8}
          defaultValue={state.values.content}
          placeholder="Paste the exact text of the ad, email, or landing page copy to be reviewed."
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "Submitting…" : "Submit for Review"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-white/10 dark:bg-zinc-900";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
