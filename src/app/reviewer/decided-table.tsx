"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import type { QueueItem } from "@/db/queries";

const PRODUCT_LABELS: Record<string, string> = {
  personal_loan: "Personal loan",
  credit_card: "Credit card",
  mortgage: "Mortgage",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "rejected", label: "Rejected" },
] as const;

const PRODUCT_OPTIONS = [
  { value: "all", label: "All products" },
  { value: "personal_loan", label: "Personal loan" },
  { value: "credit_card", label: "Credit card" },
  { value: "mortgage", label: "Mortgage" },
] as const;

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "internal", label: "Internal" },
  { value: "affiliate", label: "Affiliate" },
] as const;

const SEVERITY_OPTIONS = [
  { value: "all", label: "All flags" },
  { value: "none", label: "No flags" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export function DecidedTable({ rows }: { rows: QueueItem[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [product, setProduct] = useState("all");
  const [source, setSource] = useState("all");
  const [severity, setSeverity] = useState("all");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((submission) => {
      const searchableText = [
        submission.title,
        submission.productType,
        PRODUCT_LABELS[submission.productType],
        submission.source,
        submission.affiliateName,
        submission.submittedBy,
        submission.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
      const matchesStatus = status === "all" || submission.status === status;
      const matchesProduct = product === "all" || submission.productType === product;
      const matchesSource = source === "all" || submission.source === source;
      const matchesSeverity =
        severity === "all" ||
        (severity === "none"
          ? submission.activeFlagCount === 0
          : submission.maxSeverity === severity);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProduct &&
        matchesSource &&
        matchesSeverity
      );
    });
  }, [product, rows, search, severity, source, status]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    status !== "all" ||
    product !== "all" ||
    source !== "all" ||
    severity !== "all";

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Decided ({filteredRows.length} of {rows.length})
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setProduct("all");
                setSource("all");
                setSeverity("all");
              }}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear filters
            </button>
          )}
          <button
            type="button"
            onClick={() => exportDecidedRows(filteredRows)}
            disabled={filteredRows.length === 0}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40 md:grid-cols-5">
        <label className="md:col-span-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Search
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title, submitter, affiliate"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterSelect label="Product" value={product} onChange={setProduct} options={PRODUCT_OPTIONS} />
        <FilterSelect label="Source" value={source} onChange={setSource} options={SOURCE_OPTIONS} />
        <FilterSelect label="Flags" value={severity} onChange={setSeverity} options={SEVERITY_OPTIONS} />
      </div>

      {filteredRows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No decided submissions match those filters.
        </p>
      ) : (
        <QueueRows rows={filteredRows} />
      )}
    </section>
  );
}

function exportDecidedRows(rows: QueueItem[]) {
  const headers = [
    "Submission ID",
    "Title",
    "Status",
    "Product",
    "Source",
    "Affiliate",
    "Submitter",
    "Flag Count",
    "Max Severity",
    "Submitted Date",
    "Review URL",
  ];
  const origin = window.location.origin;
  const csvRows = rows.map((row) => [
    row.id,
    row.title,
    STATUS_LABELS[row.status] ?? row.status,
    PRODUCT_LABELS[row.productType] ?? row.productType,
    row.source === "affiliate" ? "Affiliate" : "Internal",
    row.affiliateName ?? "",
    row.submittedBy,
    row.activeFlagCount,
    row.maxSeverity ?? "none",
    new Date(row.createdAt).toLocaleDateString(),
    `${origin}/reviewer/id?id=${row.id}`,
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `decided-submissions-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: number | string) {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QueueRows({ rows }: { rows: QueueItem[] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Product</th>
            <th className="px-4 py-2 font-medium">Source</th>
            <th className="px-4 py-2 font-medium">Flags</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Submitted</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="max-w-xs truncate px-4 py-3 font-medium">{s.title}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {PRODUCT_LABELS[s.productType] ?? s.productType}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {s.source === "affiliate" ? s.affiliateName : "Internal"}
              </td>
              <td className="px-4 py-3">
                {s.activeFlagCount > 0 && s.maxSeverity ? (
                  <span className="flex items-center gap-1.5">
                    <SeverityBadge severity={s.maxSeverity} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {s.activeFlagCount}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">none</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                {s.createdAt.toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/reviewer/id?id=${s.id}`}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Review →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
