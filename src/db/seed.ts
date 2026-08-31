import { db } from "./index";
import { submissions, submissionVersions, flags, reviews } from "./schema";
import { SUBMISSIONS, locate } from "./seed-data";

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(reviews);
  await db.delete(flags);
  await db.delete(submissionVersions);
  await db.delete(submissions);

  for (const def of SUBMISSIONS) {
    const lastVersion = def.versions[def.versions.length - 1];

    const [submission] = await db
      .insert(submissions)
      .values({
        title: lastVersion.title,
        content: lastVersion.content,
        productType: def.productType,
        channel: def.channel,
        source: def.source,
        affiliateName: def.affiliateName,
        status: def.status,
        submittedBy: def.submittedBy,
        currentVersion: def.versions.length,
      })
      .returning();

    for (let i = 0; i < def.versions.length; i++) {
      const versionDef = def.versions[i];
      const versionNumber = i + 1;

      const [version] = await db
        .insert(submissionVersions)
        .values({
          submissionId: submission.id,
          versionNumber,
          title: versionDef.title,
          content: versionDef.content,
          changeSummary: versionDef.changeSummary,
          createdBy: versionDef.createdBy,
        })
        .returning();

      if (versionDef.flags?.length) {
        await db.insert(flags).values(
          versionDef.flags.map((f) => {
            const { start, end } = locate(versionDef.content, f.matchText);
            return {
              submissionId: submission.id,
              submissionVersionId: version.id,
              ruleId: f.ruleId,
              severity: f.severity,
              regulation: f.regulation,
              message: f.message,
              startOffset: start,
              endOffset: end,
              dismissed: Boolean(f.dismissed),
              dismissedReason: f.dismissed?.reason,
              dismissedBy: f.dismissed?.by,
              dismissedAt: f.dismissed ? new Date() : undefined,
            };
          })
        );
      }

      if (versionDef.review) {
        await db.insert(reviews).values({
          submissionId: submission.id,
          submissionVersionId: version.id,
          reviewer: versionDef.review.reviewer,
          decision: versionDef.review.decision,
          reasonCodes: versionDef.review.reasonCodes,
          notes: versionDef.review.notes,
        });
      }
    }

    console.log(`Seeded submission #${submission.id}: ${lastVersion.title}`);
  }

  console.log(`Done. Seeded ${SUBMISSIONS.length} submissions.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
