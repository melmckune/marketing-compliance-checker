"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CHANNELS, PRODUCT_TYPES, SOURCES } from "@/db/schema-types";
import { createSubmission } from "@/lib/submissions";

export type NewSubmissionState = {
  errors: Record<string, string>;
  values: Record<string, string>;
};

const MIN_CONTENT_LENGTH = 20;

export async function submitNewAsset(
  _prevState: NewSubmissionState,
  formData: FormData
): Promise<NewSubmissionState> {
  const values = {
    title: String(formData.get("title") ?? "").trim(),
    productType: String(formData.get("productType") ?? ""),
    channel: String(formData.get("channel") ?? ""),
    source: String(formData.get("source") ?? ""),
    affiliateName: String(formData.get("affiliateName") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
  };

  const errors: Record<string, string> = {};

  if (!values.title) errors.title = "Title is required.";
  if (!PRODUCT_TYPES.includes(values.productType as (typeof PRODUCT_TYPES)[number])) {
    errors.productType = "Choose a product type.";
  }
  if (!CHANNELS.includes(values.channel as (typeof CHANNELS)[number])) {
    errors.channel = "Choose a channel.";
  }
  if (!SOURCES.includes(values.source as (typeof SOURCES)[number])) {
    errors.source = "Choose a source.";
  }
  if (values.source === "affiliate" && !values.affiliateName) {
    errors.affiliateName = "Affiliate name is required when the source is Affiliate.";
  }
  if (!values.content) {
    errors.content = "Paste the ad copy to be reviewed.";
  } else if (values.content.length < MIN_CONTENT_LENGTH) {
    errors.content = `Content is too short to review meaningfully (min ${MIN_CONTENT_LENGTH} characters).`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const submission = await createSubmission({
    title: values.title,
    content: values.content,
    productType: values.productType as (typeof PRODUCT_TYPES)[number],
    channel: values.channel as (typeof CHANNELS)[number],
    source: values.source as (typeof SOURCES)[number],
    affiliateName: values.source === "affiliate" ? values.affiliateName : null,
  });

  // A new submission lands directly in the reviewer's queue.
  revalidatePath("/submissions");
  revalidatePath("/reviewer");
  redirect(`/submissions/${submission.id}`);
}
