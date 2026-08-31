// ---------------------------------------------------------------------------
// Seed data. Flags are NOT hand-authored here — seed.ts runs the real rules
// engine (src/rules) against each version's `content` at seed time, so what
// ends up in the `flags` table is exactly what the product would produce.
// This file only supplies the ad copy, who submitted it, and the human
// layer the engine can't produce on its own: reviewer decisions and which
// engine-generated flag (if any) a reviewer dismissed as a false positive.
// No database dependency, so `verify-seed-data.ts` can sanity-check it
// standalone against the engine.
// ---------------------------------------------------------------------------

export type ReviewDef = {
  reviewer: string;
  decision: "approved" | "rejected" | "changes_requested";
  reasonCodes: string[];
  notes?: string;
  /** Hours after this version's createdAt that the decision landed — the tool's actual turnaround. */
  lagHours: number;
};

export type DismissSpec = {
  /** Dismisses the first engine-produced flag on this version with a matching ruleId. */
  ruleId: string;
  reason: string;
  by: string;
};

export type VersionDef = {
  title: string;
  content: string;
  changeSummary?: string;
  createdBy: string;
  dismissFlags?: DismissSpec[];
  review?: ReviewDef;
  /**
   * How many days before seed time this version was created. Backdated
   * (rather than defaulting to "now") so the dashboard's time-to-decision
   * and queue-age metrics reflect a realistic spread instead of every
   * submission having been created in the same instant the seed script ran.
   */
  daysAgo: number;
};

export type SubmissionDef = {
  productType: "personal_loan" | "credit_card" | "mortgage";
  channel: "email" | "landing_page" | "social" | "display" | "print" | "sms";
  source: "internal" | "affiliate";
  affiliateName?: string;
  submittedBy: string;
  status:
    | "pending"
    | "in_review"
    | "changes_requested"
    | "approved"
    | "rejected";
  versions: VersionDef[];
};

export const ANALYST = "compliance-analyst@clearpathfinancial.com";

export const SUBMISSIONS: SubmissionDef[] = [
  // 1. Clean, internal, personal loan email — engine produces no flags.
  {
    productType: "personal_loan",
    channel: "email",
    source: "internal",
    submittedBy: "jordan.ruiz@clearpathfinancial.com",
    status: "approved",
    versions: [
      {
        title: "Spring Personal Loan Refresh - Email Blast",
        createdBy: "jordan.ruiz@clearpathfinancial.com",
        daysAgo: 12,
        content:
          "Need extra breathing room this spring? ClearPath Financial personal loans offer fixed monthly payments and no prepayment penalty. Rates and terms vary based on creditworthiness and loan amount; see your personalized offer after a soft credit check that won't affect your score. Apply online in minutes and get a decision the same day. Equal Opportunity Lender.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          notes: "Clean copy, no triggering terms, no prohibited claims.",
          lagHours: 5,
        },
      },
    ],
  },

  // 2. Clean mortgage landing page with proper NMLS / Equal Housing Lender.
  {
    productType: "mortgage",
    channel: "landing_page",
    source: "affiliate",
    affiliateName: "HomeStart Advisors",
    submittedBy: "priya.shah@clearpathfinancial.com",
    status: "approved",
    versions: [
      {
        title: "HomeStart Mortgage Prequalification Landing Page",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 11,
        content:
          "Thinking about buying a home? Get prequalified with ClearPath Financial in minutes. Prequalification is not a commitment to lend and does not guarantee final loan approval; your actual rate and terms depend on a full underwriting review of your credit, income, and the property. ClearPath Financial, NMLS ID #1234567. Equal Housing Lender.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          notes: "NMLS ID and Equal Housing Lender present, prequal caveat is clear.",
          lagHours: 3,
        },
      },
    ],
  },

  // 3. Borderline: rate stated without APR terminology or a representative
  //    example. Engine produces two flags (representative_example_required,
  //    apr_term_required) — same underlying issue, two disclosure gaps.
  {
    productType: "credit_card",
    channel: "social",
    source: "internal",
    submittedBy: "marcus.lee@clearpathfinancial.com",
    status: "changes_requested",
    versions: [
      {
        title: "Cardholder Rewards Social Post - Q3",
        createdBy: "marcus.lee@clearpathfinancial.com",
        daysAgo: 2,
        content:
          "Introducing the ClearPath Rewards Card. Rates as low as 14.99% for qualified applicants. Earn 2% cash back on every purchase, no annual fee. Terms and conditions apply.",
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: ["missing_representative_example", "missing_apr_disclosure"],
          notes:
            "Rate claim needs the 'Annual Percentage Rate' term and a representative example before this can run.",
          lagHours: 6,
        },
      },
    ],
  },

  // 4. The showcase affiliate email: trips seven flags at once, then a clean
  //    resubmit. Demonstrates multi-flag review, round-trip, and that flags
  //    stay pinned to the version that earned them.
  {
    productType: "personal_loan",
    channel: "email",
    source: "affiliate",
    affiliateName: "QuickApprove Partners",
    submittedBy: "priya.shah@clearpathfinancial.com",
    status: "approved",
    versions: [
      {
        title: "Affiliate Email Draft — QuickApprove Partners",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 10,
        content:
          "GUARANTEED APPROVAL! Rates as low as 5.99% — pre-approved, no credit check! Apply now, this offer won't last. Get your cash today.",
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: [
            "prohibited_claim",
            "fcra_firm_offer_required",
            "missing_apr_disclosure",
            "pressure_language",
          ],
          notes:
            "Multiple issues — guaranteed approval, missing APR terminology and representative example, unsupported pre-approved/no-credit-check claims, and urgency language. Needs a full rewrite before resubmission.",
          lagHours: 8,
        },
      },
      {
        title: "Affiliate Email — QuickApprove Partners (Revised)",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 7,
        changeSummary:
          "Removed guaranteed/pre-approved/no-credit-check language, added the required APR term and a representative example, removed urgency language.",
        content:
          "Ready for extra breathing room? ClearPath Financial personal loans offer fixed monthly payments with no prepayment penalty. See if you qualify with a soft credit check that won't affect your score — approval and rate depend on creditworthiness. Representative example: a $10,000 loan at 11.99% Annual Percentage Rate over 48 months has a monthly payment of $263. Apply online today.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["resubmission_addressed_prior_flags"],
          notes: "All prior issues resolved. Approved.",
          lagHours: 4,
        },
      },
    ],
  },

  // 5. Mortgage affiliate ad missing Equal Housing Lender + NMLS ID.
  {
    productType: "mortgage",
    channel: "landing_page",
    source: "affiliate",
    affiliateName: "BridgeHome Marketing",
    submittedBy: "priya.shah@clearpathfinancial.com",
    status: "rejected",
    versions: [
      {
        title: "BridgeHome Mortgage Landing Page Refresh",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 6,
        content:
          "Get prequalified for your dream home with ClearPath Financial. Competitive rates, fast decisions, and a simple online application. Start your prequalification today — no obligation.",
        review: {
          reviewer: ANALYST,
          decision: "rejected",
          reasonCodes: [
            "missing_required_disclosure",
            "mortgage_licensing_disclosure_missing",
          ],
          notes:
            "Mortgage ads must always carry Equal Housing Lender + NMLS ID. Please add and resubmit.",
          lagHours: 12,
        },
      },
    ],
  },

  // 6. Borderline urgency language, still sitting in the queue (unreviewed).
  //    Engine trips urgency_pressure_language three times in this one.
  {
    productType: "personal_loan",
    channel: "display",
    source: "internal",
    submittedBy: "marcus.lee@clearpathfinancial.com",
    status: "pending",
    versions: [
      {
        title: "Display Banner — Rate Increase Countdown",
        createdBy: "marcus.lee@clearpathfinancial.com",
        daysAgo: 1,
        content:
          "Lock in your rate before it's too late! ClearPath Financial personal loans — apply now and get funded as soon as tomorrow. Limited time offer.",
      },
    ],
  },

  // 7. False positive: urgency language paired with an explicit no-pressure
  //    alternative, so the reviewer dismisses the flag.
  {
    productType: "credit_card",
    channel: "email",
    source: "internal",
    submittedBy: "jordan.ruiz@clearpathfinancial.com",
    status: "approved",
    versions: [
      {
        title: "Pre-Qualified Email Campaign",
        createdBy: "jordan.ruiz@clearpathfinancial.com",
        daysAgo: 5,
        content:
          "You're pre-qualified to check your rate for the ClearPath Rewards Card with no impact to your credit score. Apply now or come back anytime — approval is subject to full underwriting and your final rate depends on creditworthiness.",
        dismissFlags: [
          {
            ruleId: "urgency_pressure_language",
            reason:
              "'Apply now' is immediately paired with 'or come back anytime,' which removes the pressure — this doesn't read as a UDAAP violation. Dismissed as a false positive.",
            by: ANALYST,
          },
        ],
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          notes:
            "Flagged urgency language reviewed and dismissed — copy explicitly offers a no-pressure alternative, so it doesn't function as a pressure tactic.",
          lagHours: 2,
        },
      },
    ],
  },

  // 8. Prescreened credit card offer missing the FCRA opt-out notice; also
  //    trips apr_term_required since "APR" is never spelled out in full.
  {
    productType: "credit_card",
    channel: "email",
    source: "affiliate",
    affiliateName: "CardConnect Media",
    submittedBy: "priya.shah@clearpathfinancial.com",
    status: "changes_requested",
    versions: [
      {
        title: "CardConnect Prescreened Offer Email",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 3,
        content:
          "Because of your excellent credit history, you've been selected for this prescreened offer for the ClearPath Rewards Card with a 0% introductory APR for 12 months. Respond by the date on the enclosed letter.",
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: [
            "missing_required_disclosure",
            "fcra_optout_notice_required",
            "missing_apr_disclosure",
          ],
          notes:
            "Add the FCRA prescreen opt-out notice, and spell out 'Annual Percentage Rate' before resubmitting.",
          lagHours: 10,
        },
      },
    ],
  },

  // 9. Clean affiliate personal loan landing page.
  {
    productType: "personal_loan",
    channel: "landing_page",
    source: "affiliate",
    affiliateName: "BrightPath Referrals",
    submittedBy: "priya.shah@clearpathfinancial.com",
    status: "approved",
    versions: [
      {
        title: "BrightPath Personal Loan Landing Page",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 9,
        content:
          "Compare personal loan options from ClearPath Financial. Checking your rate uses a soft credit pull and won't affect your credit score. Your actual rate, term, and payment depend on your credit profile and are shown before you accept any offer. ClearPath Financial is an Equal Opportunity Lender.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          lagHours: 1,
        },
      },
    ],
  },

  // 10. Implied government affiliation + missing mortgage disclosures.
  {
    productType: "mortgage",
    channel: "social",
    source: "affiliate",
    affiliateName: "GovHome Connect",
    submittedBy: "priya.shah@clearpathfinancial.com",
    status: "rejected",
    versions: [
      {
        title: "GovHome Connect Mortgage Social Ad",
        createdBy: "priya.shah@clearpathfinancial.com",
        daysAgo: 4,
        content:
          "Check your eligibility for this official government home buyer assistance program, offered through ClearPath Financial. Get connected with a government-backed rate today.",
        review: {
          reviewer: ANALYST,
          decision: "rejected",
          reasonCodes: [
            "prohibited_claim",
            "implied_government_affiliation",
            "missing_required_disclosure",
          ],
          notes:
            "Multiple Reg N violations — implied government affiliation and missing required mortgage disclosures. Reject and escalate to affiliate manager.",
          lagHours: 7,
        },
      },
    ],
  },

  // 11. Unsubstantiated superlative claims, still in the queue.
  {
    productType: "credit_card",
    channel: "print",
    source: "internal",
    submittedBy: "marcus.lee@clearpathfinancial.com",
    status: "pending",
    versions: [
      {
        title: "Print Insert — Rewards Card",
        createdBy: "marcus.lee@clearpathfinancial.com",
        daysAgo: 6,
        content:
          "The ClearPath Rewards Card offers unbeatable rates and the best rewards program on the market, guaranteed. Terms and conditions apply.",
      },
    ],
  },

  // 12. Reg Z triggering term (payment amount) without full disclosure, then
  //     a clean resubmit with a representative example.
  {
    productType: "personal_loan",
    channel: "email",
    source: "internal",
    submittedBy: "jordan.ruiz@clearpathfinancial.com",
    status: "approved",
    versions: [
      {
        title: "Personal Loan Email — Payment Callout",
        createdBy: "jordan.ruiz@clearpathfinancial.com",
        daysAgo: 8,
        content:
          "Get a ClearPath Financial personal loan with monthly payments as low as $199. Apply today and get funded fast.",
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: ["missing_apr_disclosure", "reg_z_triggering_terms"],
          notes:
            "Payment amount stated without required Reg Z disclosures. Add repayment terms and APR.",
          lagHours: 6,
        },
      },
      {
        title: "Personal Loan Email — Payment Callout (Revised)",
        createdBy: "jordan.ruiz@clearpathfinancial.com",
        daysAgo: 6,
        changeSummary:
          "Added representative example with loan amount, APR, and repayment term per compliance feedback.",
        content:
          "Get a ClearPath Financial personal loan with monthly payments as low as $199. Representative example: a $6,000 loan at 13.49% Annual Percentage Rate repaid over 36 months has a monthly payment of $203; your actual rate and payment depend on creditworthiness. Apply today.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["resubmission_addressed_prior_flags"],
          notes: "Reg Z disclosures now present. Approved.",
          lagHours: 3,
        },
      },
    ],
  },
];
