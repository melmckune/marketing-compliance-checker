import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------- Enums ----------

export const productTypeEnum = pgEnum("product_type", [
  "personal_loan",
  "credit_card",
  "mortgage",
]);

export const channelEnum = pgEnum("channel", [
  "email",
  "landing_page",
  "social",
  "display",
  "print",
  "sms",
]);

export const sourceEnum = pgEnum("source", ["internal", "affiliate"]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "in_review",
  "changes_requested",
  "approved",
  "rejected",
]);

export const severityEnum = pgEnum("severity", ["low", "medium", "high"]);

export const reviewDecisionEnum = pgEnum("review_decision", [
  "approved",
  "rejected",
  "changes_requested",
]);

// ---------- Tables ----------

// The current/canonical state of a submission. `content` and `title` mirror
// the latest row in submission_versions so list/queue views don't need a
// join; submission_versions is the source of truth for history and diffing.
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    productType: productTypeEnum("product_type").notNull(),
    channel: channelEnum("channel").notNull(),
    source: sourceEnum("source").notNull().default("internal"),
    affiliateName: text("affiliate_name"),
    status: submissionStatusEnum("status").notNull().default("pending"),
    submittedBy: text("submitted_by").notNull(),
    currentVersion: integer("current_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("submissions_status_idx").on(table.status),
    index("submissions_affiliate_name_idx").on(table.affiliateName),
    index("submissions_source_idx").on(table.source),
    index("submissions_created_at_idx").on(table.createdAt),
    check(
      "affiliate_name_required_for_affiliate_source",
      sql`(${table.source} <> 'affiliate') OR (${table.affiliateName} IS NOT NULL)`
    ),
  ]
);

// One immutable row per draft of a submission (v1 on initial create, v2+ on
// each resubmit). This is what gets diffed for "what changed" and what flags
// / reviews are actually evaluated against.
export const submissionVersions = pgTable(
  "submission_versions",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    changeSummary: text("change_summary"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("submission_versions_submission_id_version_number_idx").on(
      table.submissionId,
      table.versionNumber
    ),
    index("submission_versions_submission_id_idx").on(table.submissionId),
  ]
);

// A single flagged span within one specific submission_version. Tied to the
// version (not just the submission) so that flags from a superseded draft
// never linger against a resubmitted one.
export const flags = pgTable(
  "flags",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    submissionVersionId: integer("submission_version_id")
      .notNull()
      .references(() => submissionVersions.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    severity: severityEnum("severity").notNull(),
    regulation: text("regulation").notNull(),
    message: text("message").notNull(),
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    dismissed: boolean("dismissed").notNull().default(false),
    dismissedReason: text("dismissed_reason"),
    dismissedBy: text("dismissed_by"),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("flags_submission_id_idx").on(table.submissionId),
    index("flags_submission_version_id_idx").on(table.submissionVersionId),
    index("flags_rule_id_idx").on(table.ruleId),
    check("end_after_start", sql`${table.endOffset} > ${table.startOffset}`),
    check(
      "dismissed_reason_required_when_dismissed",
      sql`(${table.dismissed} = false) OR (${table.dismissedReason} IS NOT NULL)`
    ),
  ]
);

// Admin-facing catalog of every policy/rule the engine currently checks.
// Mirrors the rule definitions in src/rules/rules.ts and is kept in sync from
// that source of truth (see src/db/policies-data.ts). One row per rule id.
export const policies = pgTable(
  "policies",
  {
    id: serial("id").primaryKey(),
    ruleId: text("rule_id").notNull().unique(),
    name: text("name").notNull(),
    regulation: text("regulation").notNull(),
    severity: severityEnum("severity").notNull(),
    productScope: text("product_scope").notNull().default("all products"),
    description: text("description").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("policies_rule_id_idx").on(table.ruleId),
    index("policies_active_idx").on(table.active),
  ]
);

// One decision event on one specific submission_version.
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    submissionVersionId: integer("submission_version_id")
      .notNull()
      .references(() => submissionVersions.id, { onDelete: "cascade" }),
    reviewer: text("reviewer").notNull(),
    decision: reviewDecisionEnum("decision").notNull(),
    reasonCodes: text("reason_codes")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reviews_submission_id_idx").on(table.submissionId),
    index("reviews_submission_version_id_idx").on(table.submissionVersionId),
    index("reviews_decision_idx").on(table.decision),
  ]
);

// ---------- Relations (for query API ergonomics) ----------

export const submissionsRelations = relations(submissions, ({ many }) => ({
  versions: many(submissionVersions),
  flags: many(flags),
  reviews: many(reviews),
}));

export const submissionVersionsRelations = relations(
  submissionVersions,
  ({ one, many }) => ({
    submission: one(submissions, {
      fields: [submissionVersions.submissionId],
      references: [submissions.id],
    }),
    flags: many(flags),
    reviews: many(reviews),
  })
);

export const flagsRelations = relations(flags, ({ one }) => ({
  submission: one(submissions, {
    fields: [flags.submissionId],
    references: [submissions.id],
  }),
  version: one(submissionVersions, {
    fields: [flags.submissionVersionId],
    references: [submissionVersions.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
  version: one(submissionVersions, {
    fields: [reviews.submissionVersionId],
    references: [submissionVersions.id],
  }),
}));
