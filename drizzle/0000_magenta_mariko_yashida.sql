CREATE TYPE "public"."channel" AS ENUM('email', 'landing_page', 'social', 'display', 'print', 'sms');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('personal_loan', 'credit_card', 'mortgage');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approved', 'rejected', 'changes_requested');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('internal', 'affiliate');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'in_review', 'changes_requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"submission_version_id" integer NOT NULL,
	"rule_id" text NOT NULL,
	"severity" "severity" NOT NULL,
	"regulation" text NOT NULL,
	"message" text NOT NULL,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_reason" text,
	"dismissed_by" text,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "end_after_start" CHECK ("flags"."end_offset" > "flags"."start_offset"),
	CONSTRAINT "dismissed_reason_required_when_dismissed" CHECK (("flags"."dismissed" = false) OR ("flags"."dismissed_reason" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"submission_version_id" integer NOT NULL,
	"reviewer" text NOT NULL,
	"decision" "review_decision" NOT NULL,
	"reason_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"change_summary" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"product_type" "product_type" NOT NULL,
	"channel" "channel" NOT NULL,
	"source" "source" DEFAULT 'internal' NOT NULL,
	"affiliate_name" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"submitted_by" text NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_name_required_for_affiliate_source" CHECK (("submissions"."source" <> 'affiliate') OR ("submissions"."affiliate_name" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_submission_version_id_submission_versions_id_fk" FOREIGN KEY ("submission_version_id") REFERENCES "public"."submission_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_version_id_submission_versions_id_fk" FOREIGN KEY ("submission_version_id") REFERENCES "public"."submission_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_versions" ADD CONSTRAINT "submission_versions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flags_submission_id_idx" ON "flags" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "flags_submission_version_id_idx" ON "flags" USING btree ("submission_version_id");--> statement-breakpoint
CREATE INDEX "flags_rule_id_idx" ON "flags" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "reviews_submission_id_idx" ON "reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "reviews_submission_version_id_idx" ON "reviews" USING btree ("submission_version_id");--> statement-breakpoint
CREATE INDEX "reviews_decision_idx" ON "reviews" USING btree ("decision");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_versions_submission_id_version_number_idx" ON "submission_versions" USING btree ("submission_id","version_number");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_id_idx" ON "submission_versions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_affiliate_name_idx" ON "submissions" USING btree ("affiliate_name");--> statement-breakpoint
CREATE INDEX "submissions_source_idx" ON "submissions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");