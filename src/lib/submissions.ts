import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { flags, submissionVersions, submissions } from "@/db/schema";
import type {
  Channel,
  ProductType,
  Severity,
  Source,
} from "@/db/schema-types";
import { runRules } from "@/rules";
import type { EngineFlag } from "@/rules";
import { CURRENT_SUBMITTER } from "@/lib/current-user";
import { RESUBMITTABLE_STATUSES } from "@/lib/labels";

type Version = { id: number; versionNumber: number };

/** The version currently in force for a submission — the one its denormalized title/content/flags reflect. */
export function currentVersionOf<V extends Version>(versions: V[]): V {
  return versions.reduce((latest, v) =>
    v.versionNumber > latest.versionNumber ? v : latest
  );
}

type Flag = { submissionVersionId: number; dismissed: boolean; severity: Severity };

/** Flags belonging to a specific version that haven't been dismissed by a reviewer — i.e. what still counts against it. */
export function activeFlagsForVersion<F extends Flag>(
  allFlags: F[],
  versionId: number
): F[] {
  return allFlags.filter(
    (f) => f.submissionVersionId === versionId && !f.dismissed
  );
}

const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

export function highestSeverity(flagList: { severity: Severity }[]): Severity | null {
  if (flagList.length === 0) return null;
  return flagList.reduce<Severity>(
    (worst, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[worst] ? f.severity : worst),
    flagList[0].severity
  );
}

async function insertFlagsForVersion(
  submissionId: number,
  submissionVersionId: number,
  engineFlags: EngineFlag[]
) {
  if (engineFlags.length === 0) return;
  await db.insert(flags).values(
    engineFlags.map((f) => ({
      submissionId,
      submissionVersionId,
      ruleId: f.ruleId,
      severity: f.severity,
      regulation: f.regulation,
      message: f.message,
      startOffset: f.startOffset,
      endOffset: f.endOffset,
    }))
  );
}

export type NewSubmissionInput = {
  title: string;
  content: string;
  productType: ProductType;
  channel: Channel;
  source: Source;
  affiliateName: string | null;
};

export async function createSubmission(input: NewSubmissionInput) {
  const [submission] = await db
    .insert(submissions)
    .values({
      title: input.title,
      content: input.content,
      productType: input.productType,
      channel: input.channel,
      source: input.source,
      affiliateName: input.affiliateName,
      submittedBy: CURRENT_SUBMITTER,
      status: "pending",
      currentVersion: 1,
    })
    .returning();

  const [version] = await db
    .insert(submissionVersions)
    .values({
      submissionId: submission.id,
      versionNumber: 1,
      title: input.title,
      content: input.content,
      createdBy: CURRENT_SUBMITTER,
    })
    .returning();

  const engineFlags = runRules(input.content, { productType: input.productType });
  await insertFlagsForVersion(submission.id, version.id, engineFlags);

  return submission;
}

export type ResubmitInput = {
  title: string;
  content: string;
  changeSummary: string | null;
};

export async function resubmitSubmission(submissionId: number, input: ResubmitInput) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });
  if (!submission) throw new Error("Submission not found");
  if (!RESUBMITTABLE_STATUSES.includes(submission.status)) {
    throw new Error(
      `Cannot resubmit a submission with status "${submission.status}"`
    );
  }

  const nextVersionNumber = submission.currentVersion + 1;

  const [version] = await db
    .insert(submissionVersions)
    .values({
      submissionId,
      versionNumber: nextVersionNumber,
      title: input.title,
      content: input.content,
      changeSummary: input.changeSummary,
      createdBy: CURRENT_SUBMITTER,
    })
    .returning();

  await db
    .update(submissions)
    .set({
      title: input.title,
      content: input.content,
      currentVersion: nextVersionNumber,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, submissionId));

  const engineFlags = runRules(input.content, {
    productType: submission.productType,
  });
  await insertFlagsForVersion(submissionId, version.id, engineFlags);
}

export function listMySubmissions() {
  return db.query.submissions.findMany({
    where: eq(submissions.submittedBy, CURRENT_SUBMITTER),
    orderBy: desc(submissions.updatedAt),
    with: {
      versions: { columns: { id: true, versionNumber: true } },
      flags: {
        columns: { submissionVersionId: true, severity: true, dismissed: true },
      },
    },
  });
}

export function getSubmissionDetail(id: number) {
  return db.query.submissions.findFirst({
    where: and(eq(submissions.id, id), eq(submissions.submittedBy, CURRENT_SUBMITTER)),
    with: {
      versions: { orderBy: (v, { asc }) => asc(v.versionNumber) },
      flags: { orderBy: (f, { asc }) => asc(f.startOffset) },
      reviews: { orderBy: (r, { desc }) => desc(r.createdAt) },
    },
  });
}
