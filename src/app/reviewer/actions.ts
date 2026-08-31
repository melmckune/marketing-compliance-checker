"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { flags, reviews, submissions } from "@/db/schema";
import { CURRENT_REVIEWER } from "@/lib/reason-codes";

export async function decideSubmission(formData: FormData) {
  const submissionId = Number(formData.get("submissionId"));
  const submissionVersionId = Number(formData.get("submissionVersionId"));
  const decision = formData.get("decision");
  const reasonCodes = formData.getAll("reasonCodes").map(String);
  const notes = formData.get("notes");

  if (decision !== "approved" && decision !== "rejected" && decision !== "changes_requested") {
    throw new Error("Invalid decision.");
  }
  if (reasonCodes.length === 0) {
    throw new Error("Select at least one reason code.");
  }

  await db.insert(reviews).values({
    submissionId,
    submissionVersionId,
    reviewer: CURRENT_REVIEWER,
    decision,
    reasonCodes,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
  });

  await db
    .update(submissions)
    .set({ status: decision, updatedAt: new Date() })
    .where(eq(submissions.id, submissionId));

  revalidatePath("/reviewer");
  redirect("/reviewer");
}

export async function dismissFlag(formData: FormData) {
  const flagId = Number(formData.get("flagId"));
  const submissionId = Number(formData.get("submissionId"));
  const reasonCode = formData.get("reasonCode");

  if (typeof reasonCode !== "string" || !reasonCode) {
    throw new Error("Select a reason for dismissing this flag.");
  }

  await db
    .update(flags)
    .set({
      dismissed: true,
      dismissedReason: reasonCode,
      dismissedBy: CURRENT_REVIEWER,
      dismissedAt: new Date(),
    })
    .where(eq(flags.id, flagId));

  revalidatePath(`/reviewer/${submissionId}`);
  revalidatePath("/reviewer");
}
