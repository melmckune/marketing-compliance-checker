import type {
  ProductType,
  Channel,
  Source,
  SubmissionStatus,
  Severity,
} from "@/db/schema-types";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  personal_loan: "Personal Loan",
  credit_card: "Credit Card",
  mortgage: "Mortgage",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: "Email",
  landing_page: "Landing Page",
  social: "Social",
  display: "Display",
  print: "Print",
  sms: "SMS",
};

export const SOURCE_LABELS: Record<Source, string> = {
  internal: "Internal",
  affiliate: "Affiliate",
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
};

export const STATUS_BADGE_CLASSES: Record<SubmissionStatus, string> = {
  pending:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_review: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  changes_requested:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const SEVERITY_BADGE_CLASSES: Record<Severity, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const SEVERITY_MARK_CLASSES: Record<Severity, string> = {
  low: "bg-slate-200 dark:bg-slate-700",
  medium: "bg-amber-200 dark:bg-amber-800",
  high: "bg-red-200 dark:bg-red-800",
};

// Rejected can still be revised and resubmitted — only a still-open review
// (pending/in_review) or a final approval blocks it.
export const RESUBMITTABLE_STATUSES: SubmissionStatus[] = [
  "changes_requested",
  "rejected",
];
