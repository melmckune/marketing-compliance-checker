CREATE TABLE "policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" text NOT NULL,
	"name" text NOT NULL,
	"regulation" text NOT NULL,
	"severity" "severity" NOT NULL,
	"product_scope" text DEFAULT 'all products' NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policies_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE INDEX "policies_rule_id_idx" ON "policies" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "policies_active_idx" ON "policies" USING btree ("active");