export type Severity = "low" | "medium" | "high";

export type ProductType = "personal_loan" | "credit_card" | "mortgage";

export interface RuleContext {
  productType: ProductType;
}

export interface RuleMatch {
  start: number;
  end: number;
  severity: Severity;
  message: string;
}

export interface Rule {
  id: string;
  regulation: string;
  /** Restricts the rule to certain product types (e.g. mortgage-only disclosures). Applies to all when omitted. */
  appliesTo?: (context: RuleContext) => boolean;
  evaluate: (content: string, context: RuleContext) => RuleMatch[];
}

export interface EngineFlag {
  ruleId: string;
  severity: Severity;
  regulation: string;
  message: string;
  startOffset: number;
  endOffset: number;
}
