# Project Context

I'm building a take-home project. I have ~6 hours. Final deliverable is a
deployed URL plus a GitHub repo.

## The prompt I was given

ClearPath Financial (fictional) is a national consumer finance company offering
personal loans, credit cards, and mortgage prequalification products online.
They market through typical channels including affiliate partners. The
compliance marketing team's review process is currently done via Excel and
email, and it's bottlenecking growth. Build a product that increases the
throughput of the compliance marketing team.

## The problem, as I understand it

Today: a marketer or affiliate manager emails an ad asset to compliance. An
analyst reads it against a checklist, replies with free-text feedback, and
updates a shared spreadsheet. The partner revises and resubmits days later.
Three round-trips is common.

Where the time actually goes:
- No queue — just an inbox. No triage, no visibility into what's pending.
- Every review starts from zero. The same handful of violations recur constantly
  and a human re-reads for them every time.
- State drifts between the spreadsheet and email threads.
- Version confusion (landing_page_v2_FINAL.docx) — no diff, so full re-reads.
- Free-text feedback means partners misinterpret and under-correct.
- No memory — can't answer "how many times has this affiliate done this?"
- Weak audit trail for regulators.

Key insight for the pitch: most elapsed time is queue time and round-trip time,
not review time. A 20-minute review takes 10 days. So the win is removing the
mechanical portion of the read and collapsing 3 round-trips into 1.

Affiliates matter specifically: ClearPath is legally liable for what affiliates
publish, affiliates are paid on conversion so they're incentivized toward
aggressive claims, and they can edit pages after approval. Affiliate risk should
be first-class in the product, not an afterthought.

## What I'm building

ONE app, TWO roles (not two apps).

Submitter (marketing / affiliate manager):
- New submission form — 5 fields max
- My submissions list with status
- Detail view: flags, reviewer feedback, resubmit

Reviewer (compliance):
- Priority queue across all submissions
- Review view: asset text with flagged spans highlighted inline, flags listed
  with regulation citations, approve / reject / request-changes with structured
  reason codes
- Dashboard: throughput, top violations, per-affiliate rejection rate

No real auth — a role switcher in the header. Good enough for a demo and lets me
flip perspectives live. README notes that production would use SSO.

## Design principles I'm being graded on

The interviewer values simple solutions users would actually adopt over
technically clever ones. In the technical round I proposed asking users to set a
budget to improve fraud detection; he said that's too much work and users
wouldn't want it — the right answer was a "travel mode" toggle. Minimum user
input, maximum sensible defaults.

Applied here:
- Submission form is 5 fields, not 15
- Don't ask submitters which regulations apply — the system knows
- Reason codes are clickable chips, not a free-text box
- Ship a default rule pack; no rule-authoring UI in v1
- Keep Excel export, because compliance teams live in Excel

## Rules engine (the differentiator)

Pattern-matched checks over the asset text, each producing a flag with severity,
the specific regulation cited, and character offsets so the UI can highlight
inline. Domain rules to encode:

- Reg Z triggering terms: if the ad states a downpayment amount, payment amount,
  number of payments, repayment period, or finance charge, it must also disclose
  downpayment, repayment terms, and APR. Stating a rate requires "Annual
  Percentage Rate."
- Prohibited/risky claims: "guaranteed approval", "pre-approved" (FCRA — requires
  a firm offer of credit), "no credit check", unqualified "free",
  unsubstantiated superlatives, urgency/pressure language (UDAAP), implied
  government affiliation (Reg N, mortgage).
- Required elements: Equal Housing Lender + NMLS ID for mortgage,
  representative example when a rate range is shown, opt-out notice for
  prescreened offers.

Important framing: the tool triages, it does not decide. Compliance decisions
carry legal liability and regulators expect human review. False positives are
the main product risk — a checker that over-flags gets ignored — so flags have
severity and reviewers can dismiss one with a reason.

## Stack

Next.js on Vercel (fastest path to URL + repo). Postgres via Neon or Vercel
Postgres — I want real persistence, not in-memory, because serverless cold
starts would wipe state mid-demo.

---

# What I need from you right now

Design and set up the database layer. Four tables:

1. `submissions` — id, title, content, product_type, channel, source
   (internal/affiliate), affiliate_name, status, submitted_by, created_at
2. `flags` — submission_id, rule_id, severity, regulation, message,
   start_offset, end_offset, dismissed
3. `reviews` — submission_id, reviewer, decision, reason_codes, notes, created_at
4. `submission_versions` — for resubmits, so I can show what changed between
   drafts

Please:
- Recommend an approach for this stack and timeline, and say why
- Write the schema with sensible types, constraints, indexes, and enums
- Explain any modeling decisions where you'd push back on my table list
- Include the setup/migration commands I need to run
- Write a seed script with 8-12 realistic assets: some clean, some borderline,
  and at least one affiliate email that trips several rules at once (e.g.
  "GUARANTEED APPROVAL! Rates as low as 5.99% — pre-approved, no credit check!").
  Seed data is the demo, so it should make the rules engine look good without
  looking like it only catches obvious garbage.

Ask me questions if anything is ambiguous before you start writing code.
