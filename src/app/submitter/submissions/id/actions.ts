"use server";

import { revalidatePath } from "next/cache";
import { resubmitSubmission } from "@/lib/submissions";

export type ResubmitState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  success?: boolean;
};

const MIN_CONTENT_LENGTH = 20;

export async function resubmitAction(
  submissionId: number,
  _prevState: ResubmitState,
  formData: FormData
): Promise<ResubmitState> {
  const values = {
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    changeSummary: String(formData.get("changeSummary") ?? "").trim(),
  };

  const errors: Record<string, string> = {};
  if (!values.title) errors.title = "Title is required.";
  if (!values.content) {
    errors.content = "Ad copy is required.";
  } else if (values.content.length < MIN_CONTENT_LENGTH) {
    errors.content = `Content is too short to review meaningfully (min ${MIN_CONTENT_LENGTH} characters).`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  await resubmitSubmission(submissionId, {
    title: values.title,
    content: values.content,
    changeSummary: values.changeSummary || null,
  });

  // A resubmit puts this submission back in front of the reviewer, both in
  // their queue and on this specific item's review view. Both detail routes
  // are single static paths now (id is a query param), so one call each
  // covers every submission, not just this one.
  revalidatePath("/submitter/submissions/id");
  revalidatePath("/submitter/submissions");
  revalidatePath("/reviewer");
  revalidatePath("/reviewer/id");
  return { errors: {}, values: {}, success: true };
}
