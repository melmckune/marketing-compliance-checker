// Structured reason codes for reviewer decisions — chips, not free text, per
// CLAUDE.md's design principle. IDs match the reasonCodes already used in
// src/db/seed-data.ts so seeded review history stays consistent with what
// the UI can actually produce.

export const APPROVE_REASON_CODES = [
  { id: "meets_disclosure_requirements", label: "Meets disclosure requirements" },
  { id: "resubmission_addressed_prior_flags", label: "Resubmission addressed prior flags" },
] as const;

export const REJECT_REASON_CODES = [
  { id: "prohibited_claim", label: "Prohibited / deceptive claim" },
  { id: "fcra_firm_offer_required", label: "FCRA firm offer required" },
  { id: "fcra_optout_notice_required", label: "FCRA opt-out notice required" },
  { id: "missing_apr_disclosure", label: "Missing APR disclosure" },
  { id: "reg_z_triggering_terms", label: "Reg Z triggering terms" },
  { id: "missing_representative_example", label: "Missing representative example" },
  { id: "missing_required_disclosure", label: "Missing required disclosure" },
  {
    id: "mortgage_licensing_disclosure_missing",
    label: "Mortgage licensing disclosure missing",
  },
  { id: "implied_government_affiliation", label: "Implied government affiliation" },
  { id: "pressure_language", label: "Pressure / urgency language" },
] as const;

export const DISMISS_REASON_CODES = [
  { id: "false_positive", label: "False positive" },
  { id: "acceptable_in_context", label: "Acceptable in context" },
  { id: "duplicate_flag", label: "Duplicate of another flag" },
  { id: "compliance_pre_approved_exception", label: "Pre-approved exception on file" },
] as const;

export const CURRENT_REVIEWER = "compliance-analyst@clearpathfinancial.com";
