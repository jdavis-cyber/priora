"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { can } from "@/modules/identity/rbac";
import {
  createRiskRecord,
  riskBaseSchema,
  riskUpdateSchema,
  updateRiskRecord,
} from "@/modules/risk/service";

export type RiskActionResult =
  | { ok: true; riskId: string }
  | { ok: false; error: string };

function parseRiskForm(formData: FormData) {
  return {
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    domain: formData.get("domain"),
    likelihood: formData.get("likelihood"),
    impact: formData.get("impact"),
    treatment: formData.get("treatment") ?? "",
    ownerId: formData.get("ownerId"),
    soaEntryIds: formData.getAll("soaEntryIds"),
  };
}

export async function createRisk(
  formData: FormData,
): Promise<RiskActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authenticated" };
  if (!can(session.user.role, "risk.create"))
    return { ok: false, error: "Not authorized" };
  const parsed = riskBaseSchema.safeParse(parseRiskForm(formData));
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const riskId = await createRiskRecord(db, session.user.id, parsed.data);
  revalidatePath(`/projects/${parsed.data.projectId}/risks`);
  revalidatePath("/risks");
  return { ok: true, riskId };
}

export async function updateRisk(
  riskId: string,
  formData: FormData,
): Promise<RiskActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authenticated" };
  if (!can(session.user.role, "risk.edit"))
    return { ok: false, error: "Not authorized" };
  const parsed = riskUpdateSchema.safeParse({
    ...parseRiskForm(formData),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await updateRiskRecord(db, session.user.id, riskId, parsed.data);
  revalidatePath(`/projects/${parsed.data.projectId}/risks`);
  revalidatePath("/risks");
  return { ok: true, riskId };
}
