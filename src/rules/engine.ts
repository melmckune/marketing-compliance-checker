import { RULES } from "./rules";
import type { EngineFlag, RuleContext } from "./types";

export interface RunRulesOptions {
  /** Rule ids the caller wants skipped (e.g. policies disabled by an admin). */
  excludedRuleIds?: ReadonlySet<string>;
}

export function runRules(
  content: string,
  context: RuleContext,
  options: RunRulesOptions = {}
): EngineFlag[] {
  const excluded = options.excludedRuleIds;
  const flags: EngineFlag[] = [];
  for (const rule of RULES) {
    if (excluded && excluded.has(rule.id)) continue;
    if (rule.appliesTo && !rule.appliesTo(context)) continue;
    for (const match of rule.evaluate(content, context)) {
      flags.push({
        ruleId: rule.id,
        severity: match.severity,
        regulation: rule.regulation,
        message: match.message,
        startOffset: match.start,
        endOffset: match.end,
      });
    }
  }
  return flags.sort((a, b) => a.startOffset - b.startOffset);
}
