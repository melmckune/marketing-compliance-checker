import "dotenv/config";
import { db } from "./index";
import { submissions, submissionVersions, flags, reviews } from "./schema";
import { SUBMISSIONS } from "./seed-data";
import { runRules } from "../rules";

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

      const engineFlags = runRules(versionDef.content, {
        productType: def.productType,
      });

      // Each dismissFlags entry dismisses the first not-yet-dismissed flag
      // with a matching ruleId. Track consumption so a stale/typo'd ruleId
      // in seed data fails loudly instead of silently doing nothing.
      const pendingDismissals = [...(versionDef.dismissFlags ?? [])];

      if (engineFlags.length > 0) {
        await db.insert(flags).values(
          engineFlags.map((f) => {
            const dismissalIndex = pendingDismissals.findIndex(
              (d) => d.ruleId === f.ruleId
            );
            const dismissal =
              dismissalIndex === -1
                ? undefined
                : pendingDismissals.splice(dismissalIndex, 1)[0];

            return {
              submissionId: submission.id,
              submissionVersionId: version.id,
              ruleId: f.ruleId,
              severity: f.severity,
              regulation: f.regulation,
              message: f.message,
              startOffset: f.startOffset,
              endOffset: f.endOffset,
              dismissed: Boolean(dismissal),
              dismissedReason: dismissal?.reason,
              dismissedBy: dismissal?.by,
              dismissedAt: dismissal ? new Date() : undefined,
            };
          })
        );
      }

      if (pendingDismissals.length > 0) {
        throw new Error(
          `Seed data error: dismissFlags on "${versionDef.title}" referenced rule(s) [${pendingDismissals
            .map((d) => d.ruleId)
            .join(", ")}] that the engine never flagged for this content.`
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

    console.log(
      `Seeded submission #${submission.id}: ${lastVersion.title}`
    );
  }

  console.log(`Done. Seeded ${SUBMISSIONS.length} submissions.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
