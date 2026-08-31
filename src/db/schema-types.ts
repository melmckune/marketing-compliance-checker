// Types + validation lists derived straight from the enum definitions in
// schema.ts, so the submission form's options/validation can never drift
// out of sync with what the database actually accepts.
import {
  productTypeEnum,
  channelEnum,
  sourceEnum,
  submissionStatusEnum,
  severityEnum,
} from "./schema";

export type ProductType = (typeof productTypeEnum.enumValues)[number];
export type Channel = (typeof channelEnum.enumValues)[number];
export type Source = (typeof sourceEnum.enumValues)[number];
export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
export type Severity = (typeof severityEnum.enumValues)[number];

export const PRODUCT_TYPES = productTypeEnum.enumValues;
export const CHANNELS = channelEnum.enumValues;
export const SOURCES = sourceEnum.enumValues;
export const SUBMISSION_STATUSES = submissionStatusEnum.enumValues;
export const SEVERITIES = severityEnum.enumValues;
