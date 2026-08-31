// Standalone sanity check for seed-data.ts against the real rules engine —
// no database needed. Run with `npx tsx src/db/verify-seed-data.ts`.
//
// Confirms every `dismissFlags` entry actually matches a flag the engine
// produces for that version's content (so seed.ts won't silently no-op on a
// stale ruleId), and prints a summary of what the seed set covers.

import { SUBMISSIONS } from "./seed-data";
import { runRules } from "../rules";

let flagCount = 0;
let dismissedCount = 0;
let versionCount = 0;
let reviewCount = 0;
const statusCounts: Record<string, number> = {};
const errors: string[] = [];

for (const def of SUBMISSIONS) {
  statusCounts[def.status] = (statusCounts[def.status] ?? 0) + 1;

  for (const version of def.versions) {
    versionCount++;
    if (version.review) reviewCount++;

    const engineFlags = runRules(version.content, {
      productType: def.productType,
    });
    flagCount += engineFlags.length;

    const remainingRuleIds = engineFlags.map((f) => f.ruleId);
    for (const dismissal of version.dismissFlags ?? []) {
      const index = remainingRuleIds.indexOf(dismissal.ruleId);
      if (index === -1) {
        errors.push(
          `"${version.title}": dismissFlags references ruleId "${dismissal.ruleId}", but the engine found [${engineFlags.map((f) => f.ruleId).join(", ") || "nothing"}] for this content.`
        );
        continue;
      }
      remainingRuleIds.splice(index, 1);
      dismissedCount++;
    }
  }
}

console.log(`Submissions: ${SUBMISSIONS.length}`);
console.log(`Versions: ${versionCount}`);
console.log(`Reviews: ${reviewCount}`);
console.log(`Flags (engine-generated): ${flagCount} (${dismissedCount} dismissed)`);
console.log(`Status breakdown:`, statusCounts);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("All dismissFlags entries matched a real engine flag.");
