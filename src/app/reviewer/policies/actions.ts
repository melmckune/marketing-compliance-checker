"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { policies } from "@/db/schema";
import type { Severity } from "@/rules/types";

export async function setPolicyActive(formData: FormData) {
  const id = Number(formData.get("policyId"));
  const active = formData.get("active");
  if (!Number.isInteger(id) || id < 1) throw new Error("Invalid policy.");

  await db
    .update(policies)
    .set({ active: active === "true", updatedAt: new Date() })
    .where(eq(policies.id, id));

  revalidatePath("/reviewer/policies");
}

export async function createPolicy(formData: FormData) {
  const ruleId = (formData.get("ruleId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const regulation = (formData.get("regulation") as string)?.trim();
  const severity = formData.get("severity") as Severity;
  const productScope = (formData.get("productScope") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const active = formData.get("active") !== "false";

  if (!ruleId || !name || !regulation || !description) {
    throw new Error("Rule id, name, regulation, and description are required.");
  }
  if (severity !== "low" && severity !== "medium" && severity !== "high") {
    throw new Error("Invalid severity.");
  }

  await db.insert(policies).values({
    ruleId,
    name,
    regulation,
    severity,
    productScope: productScope || "all products",
    description,
    active,
  });

  revalidatePath("/reviewer/policies");
  redirect("/reviewer/policies");
}
