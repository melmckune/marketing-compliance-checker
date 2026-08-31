// Standalone sanity check for seed-data.ts — no database needed. Run with
// `npx tsx src/db/verify-seed-data.ts`. Confirms every flag's matchText
// actually appears in its version's content (so offsets/highlighting will be
// correct) and prints a summary of what the seed set covers.

import { SUBMISSIONS, locate } from "./seed-data";

let flagCount = 0;
let dismissedCount = 0;
let versionCount = 0;
let reviewCount = 0;
const statusCounts: Record<string, number> = {};

for (const def of SUBMISSIONS) {
  statusCounts[def.status] = (statusCounts[def.status] ?? 0) + 1;

  for (const version of def.versions) {
    versionCount++;
    if (version.review) reviewCount++;

    for (const flag of version.flags ?? []) {
      flagCount++;
      if (flag.dismissed) dismissedCount++;
      // Throws if matchText isn't found in content.
      locate(version.content, flag.matchText);
    }
  }
}

console.log(`Submissions: ${SUBMISSIONS.length}`);
console.log(`Versions: ${versionCount}`);
console.log(`Reviews: ${reviewCount}`);
console.log(`Flags: ${flagCount} (${dismissedCount} dismissed)`);
console.log(`Status breakdown:`, statusCounts);
console.log("All matchText spans resolved correctly.");
