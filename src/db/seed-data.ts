// ---------------------------------------------------------------------------
// Seed data. The rules engine itself isn't built yet, so the flags below are
// hand-authored to look like what it will eventually produce: severity,
// regulation citation, human message, and a `matchText` that seed.ts resolves
// to exact character offsets via indexOf against the version's actual content
// (so highlighting is always correct, even if copy changes). This file has no
// database dependency, so `verify-seed-data.ts` can sanity-check it standalone.
// ---------------------------------------------------------------------------

export type FlagDef = {
  ruleId: string;
  severity: "low" | "medium" | "high";
  regulation: string;
  message: string;
  matchText: string;
  dismissed?: { reason: string; by: string };
};

export type ReviewDef = {
  reviewer: string;
  decision: "approved" | "rejected" | "changes_requested";
  reasonCodes: string[];
  notes?: string;
};

export type VersionDef = {
  title: string;
  content: string;
  changeSummary?: string;
  createdBy: string;
  flags?: FlagDef[];
  review?: ReviewDef;
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
  // 1. Clean, internal, personal loan email — nothing to flag.
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
        content:
          "Need extra breathing room this spring? ClearPath Financial personal loans offer fixed monthly payments and no prepayment penalty. Rates and terms vary based on creditworthiness and loan amount; see your personalized offer after a soft credit check that won't affect your score. Apply online in minutes and get a decision the same day. Equal Opportunity Lender.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          notes: "Clean copy, no triggering terms, no prohibited claims.",
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
        content:
          "Thinking about buying a home? Get prequalified with ClearPath Financial in minutes. Prequalification is not a commitment to lend and does not guarantee final loan approval; your actual rate and terms depend on a full underwriting review of your credit, income, and the property. ClearPath Financial, NMLS ID #1234567. Equal Housing Lender.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          notes: "NMLS ID and Equal Housing Lender present, prequal caveat is clear.",
        },
      },
    ],
  },

  // 3. Borderline: rate range with no representative example.
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
        content:
          "Introducing the ClearPath Rewards Card. Rates as low as 14.99% for qualified applicants. Earn 2% cash back on every purchase, no annual fee. Terms and conditions apply.",
        flags: [
          {
            ruleId: "representative_example_required",
            severity: "medium",
            regulation:
              "Reg Z / TILA – 12 CFR § 1026.16(b)(1) representative example",
            message:
              "A rate range or 'as low as' rate is advertised without a representative example showing a typical APR, fee, and repayment term.",
            matchText: "Rates as low as 14.99%",
          },
        ],
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: ["missing_representative_example"],
          notes: "Please add a representative example next to the rate claim.",
        },
      },
    ],
  },

  // 4. The showcase affiliate email: trips five rules at once, then a clean
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
        content:
          "GUARANTEED APPROVAL! Rates as low as 5.99% — pre-approved, no credit check! Apply now, this offer won't last. Get your cash today.",
        flags: [
          {
            ruleId: "guaranteed_approval_claim",
            severity: "high",
            regulation:
              "UDAAP / FTC Act §5 — deceptive claim; no approval is guaranteed prior to underwriting",
            message:
              "Ad guarantees approval, which is never true prior to underwriting and is a deceptive claim.",
            matchText: "GUARANTEED APPROVAL",
          },
          {
            ruleId: "apr_term_required",
            severity: "high",
            regulation:
              "Reg Z / TILA — 12 CFR § 1026.24(d) — stating a rate requires the term 'Annual Percentage Rate'",
            message:
              "A rate is stated without using the required term 'Annual Percentage Rate' and without a representative example.",
            matchText: "Rates as low as 5.99%",
          },
          {
            ruleId: "preapproved_without_firm_offer",
            severity: "high",
            regulation:
              "FCRA § 604(c) — firm offer of credit required to use 'pre-approved'",
            message:
              "'Pre-approved' implies a firm offer of credit under FCRA; nothing in the record establishes a qualifying firm offer.",
            matchText: "pre-approved",
          },
          {
            ruleId: "no_credit_check_claim",
            severity: "medium",
            regulation: "UDAAP — unsubstantiated claim likely to mislead",
            message:
              "'No credit check' is a claim compliance cannot substantiate for this product and is commonly used to bait unqualified applicants.",
            matchText: "no credit check",
          },
          {
            ruleId: "urgency_pressure_language",
            severity: "medium",
            regulation: "UDAAP — pressure tactics",
            message:
              "Urgency language pressures consumers into a quick decision on a credit product, a UDAAP risk factor.",
            matchText: "Apply now, this offer won't last.",
          },
        ],
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
            "Five separate issues — guaranteed approval, missing APR terminology, unsupported pre-approved/no-credit-check claims, and urgency language. Needs a full rewrite before resubmission.",
        },
      },
      {
        title: "Affiliate Email — QuickApprove Partners (Revised)",
        createdBy: "priya.shah@clearpathfinancial.com",
        changeSummary:
          "Removed guaranteed/pre-approved/no-credit-check language, added the required APR term and a representative example, removed urgency language.",
        content:
          "Ready for extra breathing room? ClearPath Financial personal loans offer fixed monthly payments with no prepayment penalty. See if you qualify with a soft credit check that won't affect your score — approval and rate depend on creditworthiness. Representative example: a $10,000 loan at 11.99% Annual Percentage Rate over 48 months has a monthly payment of $263. Apply online today.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["resubmission_addressed_prior_flags"],
          notes: "All prior issues resolved. Approved.",
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
        content:
          "Get prequalified for your dream home with ClearPath Financial. Competitive rates, fast decisions, and a simple online application. Start your prequalification today — no obligation.",
        flags: [
          {
            ruleId: "missing_equal_housing_nmls",
            severity: "high",
            regulation:
              "Reg N (12 CFR Part 1014) / NMLS disclosure requirements for mortgage advertising",
            message:
              "Mortgage advertisement is missing the required Equal Housing Lender designation and NMLS ID.",
            matchText: "Start your prequalification today — no obligation.",
          },
        ],
        review: {
          reviewer: ANALYST,
          decision: "rejected",
          reasonCodes: [
            "missing_required_disclosure",
            "mortgage_licensing_disclosure_missing",
          ],
          notes:
            "Mortgage ads must always carry Equal Housing Lender + NMLS ID. Please add and resubmit.",
        },
      },
    ],
  },

  // 6. Borderline urgency language, still sitting in the queue (unreviewed).
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
        content:
          "Lock in your rate before it's too late! ClearPath Financial personal loans — apply now and get funded as soon as tomorrow. Limited time offer.",
        flags: [
          {
            ruleId: "urgency_pressure_language",
            severity: "low",
            regulation: "UDAAP — pressure tactics",
            message:
              "Countdown/urgency framing may pressure consumers; consider softening 'before it's too late'.",
            matchText: "Lock in your rate before it's too late!",
          },
        ],
      },
    ],
  },

  // 7. False positive: "pre-qualified" used correctly, flag gets dismissed.
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
        content:
          "You're pre-qualified to check your rate for the ClearPath Rewards Card with no impact to your credit score. See your personalized rate in 60 seconds — final approval is subject to full underwriting.",
        flags: [
          {
            ruleId: "preapproved_without_firm_offer",
            severity: "low",
            regulation:
              "FCRA § 604(c) — distinguish 'pre-qualified' (soft, no firm offer) from 'pre-approved' (requires firm offer)",
            message:
              "'Pre-qualified' language detected near a credit offer — flagged for reviewer confirmation that no firm-offer claim is implied.",
            matchText: "pre-qualified",
            dismissed: {
              reason:
                "Correctly uses 'pre-qualified' with proper soft-inquiry and underwriting caveats — not a firm offer claim. Not a violation.",
              by: ANALYST,
            },
          },
        ],
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
          notes:
            "Flagged term reviewed and dismissed as a false positive — copy correctly distinguishes pre-qualified from pre-approved.",
        },
      },
    ],
  },

  // 8. Prescreened credit card offer missing the FCRA opt-out notice.
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
        content:
          "Because of your excellent credit history, you've been selected for this prescreened offer for the ClearPath Rewards Card with a 0% introductory APR for 12 months. Respond by the date on the enclosed letter.",
        flags: [
          {
            ruleId: "prescreen_optout_notice_missing",
            severity: "high",
            regulation:
              "FCRA § 615(d) — prescreened offers require a clear and conspicuous opt-out notice",
            message:
              "This is a prescreened offer of credit but does not include the required FCRA opt-out notice.",
            matchText: "you've been selected for this prescreened offer",
          },
        ],
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: [
            "missing_required_disclosure",
            "fcra_optout_notice_required",
          ],
          notes: "Add the FCRA prescreen opt-out notice before resubmitting.",
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
        content:
          "Compare personal loan options from ClearPath Financial. Checking your rate uses a soft credit pull and won't affect your credit score. Your actual rate, term, and payment depend on your credit profile and are shown before you accept any offer. ClearPath Financial is an Equal Opportunity Lender.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["meets_disclosure_requirements"],
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
        content:
          "Check your eligibility for this official government home buyer assistance program, offered through ClearPath Financial. Get connected with a government-backed rate today.",
        flags: [
          {
            ruleId: "implied_government_affiliation",
            severity: "high",
            regulation:
              "Reg N (12 CFR Part 1014.3) — prohibition on implying government affiliation in mortgage advertising",
            message:
              "Ad implies government affiliation/endorsement that does not exist.",
            matchText: "official government home buyer assistance program",
          },
          {
            ruleId: "implied_government_affiliation",
            severity: "medium",
            regulation: "Reg N (12 CFR Part 1014.3)",
            message:
              "'Government-backed rate' further implies a government affiliation ClearPath does not have.",
            matchText: "government-backed rate",
          },
          {
            ruleId: "missing_equal_housing_nmls",
            severity: "high",
            regulation:
              "Reg N (12 CFR Part 1014) / NMLS disclosure requirements for mortgage advertising",
            message:
              "Mortgage advertisement is missing the required Equal Housing Lender designation and NMLS ID.",
            matchText: "Get connected with a government-backed rate today.",
          },
        ],
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
        },
      },
    ],
  },

  // 11. Unsubstantiated superlative claim, still in the queue.
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
        content:
          "The ClearPath Rewards Card offers unbeatable rates and the best rewards program on the market, guaranteed. Terms and conditions apply.",
        flags: [
          {
            ruleId: "unsubstantiated_superlative_claim",
            severity: "medium",
            regulation:
              "FTC Act §5 — unsubstantiated superlative/comparative claims",
            message:
              "'Unbeatable rates' and 'best rewards program... guaranteed' are unsubstantiated superlative claims compliance cannot support.",
            matchText:
              "unbeatable rates and the best rewards program on the market, guaranteed",
          },
        ],
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
        content:
          "Get a ClearPath Financial personal loan with monthly payments as low as $199. Apply today and get funded fast.",
        flags: [
          {
            ruleId: "reg_z_triggering_terms",
            severity: "high",
            regulation:
              "Reg Z / TILA — 12 CFR § 1026.24(d) triggering terms require downpayment, repayment terms, and APR disclosure",
            message:
              "Stating a specific payment amount ('$199') is a Reg Z triggering term that requires disclosure of downpayment (if any), repayment terms, and the Annual Percentage Rate.",
            matchText: "monthly payments as low as $199",
          },
        ],
        review: {
          reviewer: ANALYST,
          decision: "changes_requested",
          reasonCodes: ["missing_apr_disclosure", "reg_z_triggering_terms"],
          notes:
            "Payment amount stated without required Reg Z disclosures. Add repayment terms and APR.",
        },
      },
      {
        title: "Personal Loan Email — Payment Callout (Revised)",
        createdBy: "jordan.ruiz@clearpathfinancial.com",
        changeSummary:
          "Added representative example with loan amount, APR, and repayment term per compliance feedback.",
        content:
          "Get a ClearPath Financial personal loan with monthly payments as low as $199. Representative example: a $6,000 loan at 13.49% Annual Percentage Rate repaid over 36 months has a monthly payment of $203; your actual rate and payment depend on creditworthiness. Apply today.",
        review: {
          reviewer: ANALYST,
          decision: "approved",
          reasonCodes: ["resubmission_addressed_prior_flags"],
          notes: "Reg Z disclosures now present. Approved.",
        },
      },
    ],
  },
];

export function locate(content: string, matchText: string) {
  const start = content.indexOf(matchText);
  if (start === -1) {
    throw new Error(
      `Seed data error: could not find "${matchText}" in content: ${content.slice(0, 60)}...`
    );
  }
  return { start, end: start + matchText.length };
}
