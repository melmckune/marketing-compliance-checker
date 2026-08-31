"use client";

import { useMemo, useState } from "react";
import { diffWords, type DiffToken } from "@/lib/diff";
import type { SubmissionForReview } from "@/db/queries";

type Version = SubmissionForReview["submission"]["versions"][number];

function tokenClass(type: DiffToken["type"], side: "old" | "new") {
  if (type === "same") return "";
  if (type === "removed" && side === "old") {
    return "bg-red-100 text-red-700 line-through decoration-red-400 dark:bg-red-900/40 dark:text-red-300";
  }
  if (type === "added" && side === "new") {
    return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  }
  return "";
}

function DiffColumn({ tokens, side }: { tokens: DiffToken[]; side: "old" | "new" }) {
  const visible = tokens.filter((t) => t.type === "same" || (t.type === "removed" && side === "old") || (t.type === "added" && side === "new"));

  return (
    <p className="leading-relaxed whitespace-pre-wrap">
      {visible.map((t, i) => (
        <span key={i} className={tokenClass(t.type, side) ? `rounded px-0.5 ${tokenClass(t.type, side)}` : undefined}>
          {t.text}
        </span>
      ))}
    </p>
  );
}

export function VersionHistory({ versions }: { versions: Version[] }) {
  const sorted = useMemo(() => [...versions].sort((a, b) => a.versionNumber - b.versionNumber), [versions]);

  const [oldId, setOldId] = useState(sorted[sorted.length - 2]?.id ?? sorted[0].id);
  const [newId, setNewId] = useState(sorted[sorted.length - 1].id);

  const oldVersion = sorted.find((v) => v.id === oldId) ?? sorted[0];
  const newVersion = sorted.find((v) => v.id === newId) ?? sorted[sorted.length - 1];

  const tokens = useMemo(
    () => diffWords(oldVersion.content, newVersion.content),
    [oldVersion.content, newVersion.content]
  );

  const added = tokens.filter((t) => t.type === "added").reduce((n, t) => n + t.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const removed = tokens.filter((t) => t.type === "removed").reduce((n, t) => n + t.text.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Compare</span>
        <select
          value={oldId}
          onChange={(e) => setOldId(Number(e.target.value))}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
        >
          {sorted.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.versionNumber}
            </option>
          ))}
        </select>
        <span className="text-slate-500 dark:text-slate-400">to</span>
        <select
          value={newId}
          onChange={(e) => setNewId(Number(e.target.value))}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
        >
          {sorted.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.versionNumber}
            </option>
          ))}
        </select>
        {(added > 0 || removed > 0) && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            <span className="text-green-600 dark:text-green-400">+{added}</span>{" "}
            <span className="text-red-600 dark:text-red-400">-{removed}</span> words
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-200 p-3 text-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">v{oldVersion.versionNumber}: {oldVersion.title}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {oldVersion.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2">
            <DiffColumn tokens={tokens} side="old" />
          </div>
        </div>
        <div className="rounded border border-slate-200 p-3 text-sm dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">v{newVersion.versionNumber}: {newVersion.title}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {newVersion.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2">
            <DiffColumn tokens={tokens} side="new" />
          </div>
        </div>
      </div>

      {newVersion.changeSummary && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Submitter&apos;s change summary:</span> {newVersion.changeSummary}
        </p>
      )}
    </div>
  );
}
