import { RULES } from "./rules";
import type { EngineFlag, RuleContext } from "./types";

export function runRules(content: string, context: RuleContext): EngineFlag[] {
  const flags: EngineFlag[] = [];
  for (const rule of RULES) {
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
