// Runs the rules engine against every version in the seed dataset — no
// database needed. Run with `npx tsx src/rules/try-rules.ts`.
//
// This is the main way to eyeball engine quality: the seed set was written
// to include clean, borderline, and multi-violation copy, so it doubles as
// a smoke test. Watch for two failure modes: a "clean" version that picks
// up a flag (false positive — the main product risk per CLAUDE.md), and a
// version written to trip a specific rule that comes back with zero flags
// (false negative).

import { SUBMISSIONS } from "../db/seed-data";
import { runRules } from "./index";

let totalFlags = 0;

for (const def of SUBMISSIONS) {
  for (let i = 0; i < def.versions.length; i++) {
    const version = def.versions[i];
    const flags = runRules(version.content, { productType: def.productType });
    totalFlags += flags.length;

    const label = `${version.title} (v${i + 1}, ${def.productType})`;
    console.log(`\n${label}`);
    console.log(`  "${version.content}"`);
    if (flags.length === 0) {
      console.log("  → no flags");
      continue;
    }
    for (const f of flags) {
      const span = version.content.slice(f.startOffset, f.endOffset);
      console.log(
        `  → [${f.severity}] ${f.ruleId}: "${span}" — ${f.message}`
      );
    }
  }
}

console.log(`\n${totalFlags} total flags across ${SUBMISSIONS.length} submissions.`);
