import { RULES } from "@/rules";
import type { Severity } from "@/rules/types";

// Admin-facing metadata that enriches the code-defined rules in
// src/rules/rules.ts with the human-readable fields the Policies table shows.
// `regulation`, `id`, and `appliesTo` come from the rule itself; everything
// else (display name, scope, representative severity, plain-English summary)
// is declared here so the engine code stays untouched while the admin catalog
// reads cleanly.

export interface PolicyDetails {
  ruleId: string;
  name: string;
  productScope: string;
  severity: Severity;
  summary: string;
}

const POLICY_DETAILS: Record<string, PolicyDetails> = {
  guaranteed_approval_claim: {
    ruleId: "guaranteed_approval_claim",
    name: "Guaranteed Approval Claim",
    productScope: "all products",
    severity: "high",
    summary:
      "Flags ads claiming approval is guaranteed prior to underwriting, which is never true and is treated as a deceptive claim.",
  },
  preapproved_without_firm_offer: {
    ruleId: "preapproved_without_firm_offer",
    name: "Pre-Approved Without Firm Offer",
    productScope: "all products",
    severity: "high",
    summary:
      "Flags 'pre-approved' language that implies a firm offer of credit under FCRA when no qualifying firm offer is established.",
  },
  no_credit_check_claim: {
    ruleId: "no_credit_check_claim",
    name: "No Credit Check Claim",
    productScope: "all products",
    severity: "medium",
    summary:
      "Flags 'no credit check' claims compliance cannot substantiate and that are commonly used to bait unqualified applicants.",
  },
  unqualified_free_claim: {
    ruleId: "unqualified_free_claim",
    name: "Unqualified Free Claim",
    productScope: "all products",
    severity: "medium",
    summary:
      "Flags 'free' without a nearby qualifying disclosure; the FTC Free Guides require all conditions to be clearly stated.",
  },
  representative_example_required: {
    ruleId: "representative_example_required",
    name: "Representative Example Required",
    productScope: "all products",
    severity: "medium",
    summary:
      "Flags advertised rate ranges or 'as low as' rates that lack a representative example showing a typical APR, fee, and term.",
  },
  apr_term_required: {
    ruleId: "apr_term_required",
    name: "APR Term Required",
    productScope: "all products",
    severity: "high",
    summary:
      "Flags stated rates that omit the required term 'Annual Percentage Rate' anywhere in the ad.",
  },
  reg_z_triggering_terms: {
    ruleId: "reg_z_triggering_terms",
    name: "Reg Z Triggering Terms",
    productScope: "all products",
    severity: "high",
    summary:
      "Flags specific payment amounts or down payment terms that are Reg Z triggering terms and require full disclosure.",
  },
  missing_equal_housing_nmls: {
    ruleId: "missing_equal_housing_nmls",
    name: "Missing Equal Housing / NMLS Disclosure",
    productScope: "mortgage",
    severity: "high",
    summary:
      "Flags mortgage ads missing the Equal Housing Lender designation and/or the NMLS ID disclosure.",
  },
  implied_government_affiliation: {
    ruleId: "implied_government_affiliation",
    name: "Implied Government Affiliation",
    productScope: "mortgage",
    severity: "medium",
    summary:
      "Flags language implying government affiliation or endorsement that does not exist in mortgage advertising.",
  },
  unsubstantiated_superlative_claim: {
    ruleId: "unsubstantiated_superlative_claim",
    name: "Unsubstantiated Superlative Claim",
    productScope: "all products",
    severity: "medium",
    summary:
      "Flags superlative or comparative claims (e.g. 'best', '#1', 'unbeatable') that compliance cannot support with evidence.",
  },
  urgency_pressure_language: {
    ruleId: "urgency_pressure_language",
    name: "Urgency / Pressure Language",
    productScope: "all products",
    severity: "medium",
    summary:
      "Flags pressure or urgency tactics that push consumers into a quick decision on a credit product, a UDAAP risk factor.",
  },
  prescreen_optout_notice_missing: {
    ruleId: "prescreen_optout_notice_missing",
    name: "Missing Prescreened Opt-Out Notice",
    productScope: "all products",
    severity: "high",
    summary:
      "Flags prescreened offers of credit that lack the required FCRA clear and conspicuous opt-out notice.",
  },
};

export interface PolicyRowInput {
  ruleId: string;
  name: string;
  regulation: string;
  severity: Severity;
  productScope: string;
  description: string;
  active: boolean;
}

// Build the full policy catalog from the engine's rule list so the admin view
// always reflects exactly what the engine is checking. Rules without explicit
// details still get sensible row fields derived from the rule itself.
export function buildPolicyRows(): PolicyRowInput[] {
  return RULES.map((rule) => {
    const details = POLICY_DETAILS[rule.id];
    return {
      ruleId: rule.id,
      name: details?.name ?? humanize(rule.id),
      regulation: rule.regulation,
      severity: details?.severity ?? ("medium" as Severity),
      productScope: details?.productScope ?? "all products",
      description:
        details?.summary ??
        `Automated check shipped with the rule engine (rule id "${rule.id}").`,
      active: true,
    };
  });
}

function humanize(ruleId: string): string {
  return ruleId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
