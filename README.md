# Marketing Compliance Checker

ClearPath Financial is a fictional consumer finance company whose marketing
compliance process is stuck in email threads and a shared Excel sheet. This
project is a focused replacement for that workflow: submitters can send in
marketing assets, the system pre-flags likely compliance issues, and reviewers
can work from a prioritized queue with a durable audit trail.

The goal is not to automate legal judgment. The goal is to remove the mechanical
parts of review so the compliance team can spend more time on decisions and less
time triaging inboxes, tracking versions, and rewriting the same feedback.

### Assumptions/ Guiding Decisions
1. In the previous system, the main source of marketing team submissions is done via email. 
2. The compliance team primarily uses the Excel sheet to track the request, but the actual content of the 
submission is either fragmented or stored elsewhere (email threads).
3. The main priority of the new system is to be easily integrated into the prior workflow, 
track statuses of submissions and versioning, and "light" enough to be well-adopted by both sides
   (marketing and compliance). 
4. Marketing compliance rules do not come from one single source of truth. Compliance checks are sourced from
regulations, official interpretations, state law, supervisory guidance, etc. The main
driver for compliance is through human-reviews, so the app should not try to replace human-in-the-loop, but 
rather automate some of the mechanical load.

## Design Choices

The product is intentionally small and operational. Compliance reviewers need a
tool they can trust during repeated daily use, so the UI favors dense tables,
clear status indicators, and direct workflows.

Key choices:

- **Minimal submitter input:** the submission form asks for only the fields
  needed to run rules and route the item: title, content, product, channel, and
  source details.
- **Human-in-the-loop review:** the rules engine flags risk but does not approve
  or reject anything. Reviewers make the final decision.
- **Structured decisions:** reviewers approve, reject, or request changes with
  reason codes and notes, producing a cleaner audit trail than email replies.
- **Version-aware resubmission:** every draft is preserved so compliance can
  understand what changed without losing prior review history.
- **Excel-friendly export:** the decided table can export filtered decisions as
  CSV so compliance can share outcomes with legal and leadership.

## Feature Selection

The feature set targets the highest-friction parts of the current workflow.

### Submitter

- Create a new marketing submission.
- See all personal submissions and current statuses.
- Open a submission detail page with highlighted flags and reviewer feedback.
- Resubmit revised copy when changes are requested.

### Reviewer

- Work from a queue split into active review items and decided items.
- Automatically prioritize active review items by highest flag severity first.
- Open a review detail page with inline highlighted text spans.
- Review rule flags with citations, severity, and messages.
- Approve, reject, request changes, or dismiss false-positive flags.
- Search and filter the decided table by text, status, product, source, and flag
  severity.
- Export the decided table to Excel-compatible CSV.
- View a dashboard with operational metrics, queue health, top violations, and
  affiliate scorecards.

### Rules Engine

The rules engine is deliberately simple: each rule is a pure TypeScript function
that scans submitted text and returns flags with character offsets. Those offsets
allow the UI to highlight exactly where the issue appears.

Current rule coverage includes:

- Reg Z / TILA rate and triggering-term disclosure checks.
- FCRA pre-approved and prescreened-offer checks.
- UDAAP-style guaranteed approval, pressure-language, and no-credit-check risks.
- FTC free-claim and unsubstantiated-superlative checks.
- Mortgage-specific Equal Housing, NMLS, and government-affiliation checks.

### Policies 

The Policies tab on the Reviewer view is in draft status. The table displays all the active compliance policies
currently used by the rules engine to review the request before human-review. Any modifications to the policies
(disabling, modifying, or creating) would be barred to admin users.  

## Architecture Overview

Stack:

- **Next.js 16 App Router** for the application shell, routes, server actions,
  and server-rendered data fetching.
- **React 19** for interactive client components such as filters and CSV export.
- **Tailwind CSS 4** for styling.
- **Neon Postgres** for persistence.
- **Drizzle ORM** for schema definition, queries, migrations, and typed database
  access.

Important directories:

- `src/app/submitter` contains the submitter workflow.
- `src/app/reviewer` contains the reviewer queue, review detail pages, dashboard,
  and decided-table export/filter UI.
- `src/components` contains shared UI such as badges, headers, and highlighted
  content.
- `src/db` contains Drizzle schema, queries, seed data, and database utilities.
- `src/rules` contains the rule definitions and rule runner.
- `src/lib` contains shared formatting, labels, current demo users, and
  submission helpers.

Data flow:

1. A submitter creates an asset.
2. The server action writes a submission and initial immutable version.
3. The rules engine scans the submitted text and stores flags tied to that
   version.
4. Reviewers see the item in the queue, ordered by severity.
5. A reviewer makes a decision and may dismiss individual flags with reasons.
6. If changes are requested, the submitter can resubmit; the app creates a new
   version and reruns the rules.

The app uses real persistence instead of in-memory data so the demo behaves like
a workflow tool rather than a static prototype.

## Database Schema

The schema is defined in `src/db/schema.ts`.

### `submissions`

One row per marketing asset. It stores the current state of the submission and a
denormalized copy of the latest title/content for efficient list views.

Key fields:

- `id`
- `title`
- `content`
- `product_type`
- `channel`
- `source`
- `affiliate_name`
- `status`
- `submitted_by`
- `current_version`
- `created_at`
- `updated_at`

### `submission_versions`

One immutable row per draft. The initial submission is version 1, and every
resubmission creates a new version.

This table is the source of truth for version history and future diffing.

### `flags`

One row per rule violation or risk indicator. Flags are tied to a specific
submission version, not just the parent submission, so old flags do not linger
against revised copy.

Key fields:

- `submission_id`
- `submission_version_id`
- `rule_id`
- `severity`
- `regulation`
- `message`
- `start_offset`
- `end_offset`
- `dismissed`
- `dismissed_reason`

### `reviews`

One row per reviewer decision. Reviews are also tied to a specific version so the
audit trail records exactly what was reviewed.

Key fields:

- `submission_id`
- `submission_version_id`
- `reviewer`
- `decision`
- `reason_codes`
- `notes`
- `created_at`

## Running Locally

Create a Neon database, then copy the connection string into `.env.local`:

```bash
cp .env.example .env.local
```

Install dependencies:

```bash
npm install
```

Apply migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

Start the app:

```bash
npm run dev
```

The app redirects `/` to `/reviewer`.

Useful routes:

- `/reviewer`
- `/reviewer/dashboard`
- `/submitter/submissions`
- `/submitter/submit`

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Build the production app |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate a new Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset and seed demo data |
| `npm run db:verify-seed` | Validate seed data without a database connection |
| `npm run db:studio` | Open Drizzle Studio |

## Further Improvements

The next improvements I would prioritize are workflow integrations and richer
asset intake:

- **Slack notifications:** notify reviewers when high-severity submissions enter
  the queue, when a queue backup threshold is crossed, and when a submitter
  resubmits revised copy. Also alert submitters when their submission has changed statuses.
- **Email intake:** allow compliance to forward or receive submission emails into
  the system so teams can adopt the product without changing every upstream
  process on day one.
- **One-time Excel import:** let the compliance team upload its existing
  spreadsheet to seed the queue and preserve current work-in-progress items
  during migration.
- **Image uploads:** support image assets in submissions, not just plain text.
  This would require file storage, image preview UI, and OCR or multimodal review
  support so the rules engine can inspect text embedded in creative assets.
- **Authentication and roles:** replace the demo role switcher with SSO and
  role-based access control.
- **Multi-user support:** allow compliance team members to set a status on a review to
"In Review" to prevent other users from creating duplicate reviews.
- **Version diffing:** show side-by-side or inline diffs between submitted
  versions so reviewers can focus only on changed copy.
- **Rule management:** add an admin workflow for compliance leads to tune rule
  severity, add organization-specific guidance, and measure false positives.
- **SLA reporting:** add exports and dashboard views for queue age, decision
  time, reviewer throughput, and affiliate repeat-violation trends.
- **Smart Rule Engine:** uses actual compliance checks and feedback to update the 
rule engine to prevent check-fatigue (compliance should not be repeatedly flagging
the same issue).
- **Rule freshness and regulatory change management:** prevent the rules engine from becoming stale by tracking the 
authoritative regulatory or guidance source behind every compliance check, along with its effective date, last-checked 
date, and rule version. A scheduled source-monitoring process would detect changes to regulations, official interpretations, 
state law, and supervisory guidance and mark affected rules for compliance review. Proposed rule changes would remain human-in-the-loop: 
compliance leads review and approve updates before a new rule version becomes active. Because flags retain the exact rule 
version that generated them, the system preserves a defensible audit trail and can selectively re-evaluate active submissions 
when underlying guidance changes.
- **Smarter Queue Ordering:** in the current implementation the queue ordering is based on time in queue, but in the future 
the ordering could be based off multiple fields such as time in queue, severity level, and priority set by marketing team.
