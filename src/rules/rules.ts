import { findAll, hasPhrase, lastSentenceSpan } from "./helpers";
import type { Rule } from "./types";

// ---------------------------------------------------------------------------
// Each rule is a pure function over ad text (+ product type) that returns
// zero or more matches. Kept deliberately simple (regex + a handful of
// "is X disclosed anywhere in the ad" checks) — see CLAUDE.md: this tool
// triages, it does not decide, and false positives are the main product
// risk, so rules should be specific rather than clever.
// ---------------------------------------------------------------------------

const RATE_PATTERN = /\b\d{1,3}(?:\.\d{1,2})?%/g;

export const RULES: Rule[] = [
  {
    id: "guaranteed_approval_claim",
    regulation:
      "UDAAP / FTC Act §5 — deceptive claim; no approval is guaranteed prior to underwriting",
    evaluate: (content) =>
      findAll(
        content,
        /\bguarantee(?:d)?\s+approval\b|\bapproval\s+is\s+guaranteed\b|\bguaranteed\s+to\s+be\s+approved\b/gi
      ).map((m) => ({
        start: m.index!,
        end: m.index! + m[0].length,
        severity: "high",
        message:
          "Ad guarantees approval, which is never true prior to underwriting and is a deceptive claim.",
      })),
  },

  {
    id: "preapproved_without_firm_offer",
    regulation:
      "FCRA § 604(c) — firm offer of credit required to use 'pre-approved'",
    evaluate: (content) =>
      findAll(content, /\bpre-?approved\b/gi).map((m) => ({
        start: m.index!,
        end: m.index! + m[0].length,
        severity: "high",
        message:
          "'Pre-approved' implies a firm offer of credit under FCRA; nothing in the record establishes a qualifying firm offer.",
      })),
  },

  {
    id: "no_credit_check_claim",
    regulation: "UDAAP — unsubstantiated claim likely to mislead",
    evaluate: (content) =>
      findAll(content, /\bno\s+credit\s+check\b/gi).map((m) => ({
        start: m.index!,
        end: m.index! + m[0].length,
        severity: "medium",
        message:
          "'No credit check' is a claim compliance cannot substantiate for this product and is commonly used to bait unqualified applicants.",
      })),
  },

  {
    id: "unqualified_free_claim",
    regulation: "FTC Guides Concerning the Use of the Word 'Free' (16 CFR Part 251)",
    evaluate: (content) =>
      findAll(content, /(?<!-)\bfree\b(?!-)/gi)
        .filter((m) => {
          const window = content.slice(m.index!, m.index! + m[0].length + 120);
          return !/terms?\s+(?:and\s+conditions\s+)?apply|conditions\s+apply|restrictions\s+apply|see\s+(?:terms|details)/i.test(
            window
          );
        })
        .map((m) => ({
          start: m.index!,
          end: m.index! + m[0].length,
          severity: "medium",
          message:
            "'Free' is used without a nearby qualifying disclosure (e.g. 'terms apply'); the FTC's Free Guide requires all conditions to be clearly stated.",
        })),
  },

  {
    id: "representative_example_required",
    regulation: "Reg Z / TILA – 12 CFR § 1026.16(b)(1) representative example",
    evaluate: (content) => {
      const matches = findAll(
        content,
        /\bas\s+low\s+as\s+\d{1,3}(?:\.\d{1,2})?%|\b\d{1,3}(?:\.\d{1,2})?%\s*(?:-|–|to)\s*\d{1,3}(?:\.\d{1,2})?%/gi
      );
      if (matches.length === 0 || hasPhrase(content, "representative example")) {
        return [];
      }
      const m = matches[0];
      return [
        {
          start: m.index!,
          end: m.index! + m[0].length,
          severity: "medium",
          message:
            "A rate range or 'as low as' rate is advertised without a representative example showing a typical APR, fee, and repayment term.",
        },
      ];
    },
  },

  {
    id: "apr_term_required",
    regulation:
      "Reg Z / TILA — 12 CFR § 1026.24(d) — stating a rate requires the term 'Annual Percentage Rate'",
    evaluate: (content) => {
      const matches = findAll(content, RATE_PATTERN);
      if (matches.length === 0 || hasPhrase(content, "annual percentage rate")) {
        return [];
      }
      const m = matches[0];
      return [
        {
          start: m.index!,
          end: m.index! + m[0].length,
          severity: "high",
          message:
            "A rate is stated without using the required term 'Annual Percentage Rate' anywhere in the ad.",
        },
      ];
    },
  },

  {
    id: "reg_z_triggering_terms",
    regulation:
      "Reg Z / TILA — 12 CFR § 1026.24(d) triggering terms require downpayment, repayment terms, and APR disclosure",
    evaluate: (content) => {
      const matches = findAll(
        content,
        /\$\d[\d,]*(?:\.\d{2})?\s*(?:\/|\s*per\s+)?month\b|monthly\s+payments?\s+(?:of|as\s+low\s+as|starting\s+at)\s*\$\d[\d,]*(?:\.\d{2})?|down\s*payment\s+of\s*\$\d[\d,]*(?:\.\d{2})?|\b\d{2,3}\s+(?:monthly\s+)?payments\b/gi
      );
      if (matches.length === 0 || hasPhrase(content, "annual percentage rate")) {
        return [];
      }
      const m = matches[0];
      return [
        {
          start: m.index!,
          end: m.index! + m[0].length,
          severity: "high",
          message: `Stating a specific payment amount ('${m[0]}') is a Reg Z triggering term that requires disclosure of downpayment (if any), repayment terms, and the Annual Percentage Rate.`,
        },
      ];
    },
  },

  {
    id: "missing_equal_housing_nmls",
    regulation:
      "Reg N (12 CFR Part 1014) / NMLS disclosure requirements for mortgage advertising",
    appliesTo: (context) => context.productType === "mortgage",
    evaluate: (content) => {
      const hasEqualHousing =
        hasPhrase(content, "equal housing lender") ||
        hasPhrase(content, "equal housing opportunity");
      const hasNmls = /\bnmls\b/i.test(content);
      if (hasEqualHousing && hasNmls) return [];
      const missing = [
        !hasEqualHousing && "Equal Housing Lender designation",
        !hasNmls && "NMLS ID",
      ]
        .filter(Boolean)
        .join(" and ");
      const { start, end } = lastSentenceSpan(content);
      return [
        {
          start,
          end,
          severity: "high",
          message: `Mortgage advertisement is missing the required ${missing}.`,
        },
      ];
    },
  },

  {
    id: "implied_government_affiliation",
    regulation:
      "Reg N (12 CFR Part 1014.3) — prohibition on implying government affiliation in mortgage advertising",
    appliesTo: (context) => context.productType === "mortgage",
    evaluate: (content) =>
      findAll(
        content,
        /\bofficial government\b|\bgovernment[- ]backed\b|\bgovernment[- ]sponsored\b|\bgovernment\s+assistance\s+program\b|\bfederally[- ]backed\b/gi
      ).map((m) => ({
        start: m.index!,
        end: m.index! + m[0].length,
        severity: /official government/i.test(m[0]) ? "high" : "medium",
        message: "Ad implies government affiliation/endorsement that does not exist.",
      })),
  },

  {
    id: "unsubstantiated_superlative_claim",
    regulation: "FTC Act §5 — unsubstantiated superlative/comparative claims",
    evaluate: (content) =>
      findAll(
        content,
        /\bunbeatable\b|\bunmatched\b|\btop-rated\b|#1\b|\bbest in (?:the )?(?:industry|market)\b|\bbest rewards? program\b|\bguaranteed best\b|\bguaranteed lowest\b/gi
      ).map((m) => ({
        start: m.index!,
        end: m.index! + m[0].length,
        severity: "medium",
        message: `'${m[0]}' is an unsubstantiated superlative/comparative claim compliance cannot support without evidence.`,
      })),
  },

  {
    id: "urgency_pressure_language",
    regulation: "UDAAP — pressure tactics",
    evaluate: (content) =>
      findAll(
        content,
        /\bact now\b|\bapply now\b|\bdon'?t wait\b|\bdon'?t miss\b|\bhurry\b|\blimited time\b|\bbefore it'?s too late\b|\bwon'?t last\b|\boffer expires\b|\blast chance\b|\bexpires soon\b/gi
      ).map((m) => ({
        start: m.index!,
        end: m.index! + m[0].length,
        severity: "medium",
        message: `'${m[0]}' pressures consumers into a quick decision on a credit product, a UDAAP risk factor.`,
      })),
  },

  {
    id: "prescreen_optout_notice_missing",
    regulation:
      "FCRA § 615(d) — prescreened offers require a clear and conspicuous opt-out notice",
    evaluate: (content) => {
      const matches = findAll(
        content,
        /\bprescreen(?:ed)?\b|\bpre-screened\b|\byou'?ve been selected\b|\bselected for this (?:offer|pre-?approved offer)\b/gi
      );
      if (matches.length === 0) return [];
      if (hasPhrase(content, "opt out") || hasPhrase(content, "opt-out")) return [];
      const m = matches[0];
      return [
        {
          start: m.index!,
          end: m.index! + m[0].length,
          severity: "high",
          message:
            "This is a prescreened offer of credit but does not include the required FCRA opt-out notice.",
        },
      ];
    },
  },
];
