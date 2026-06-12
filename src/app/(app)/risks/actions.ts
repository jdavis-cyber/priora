"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, type Db } from "@/db";
import { riskControlLinks, risks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/modules/audit/record";
import { can } from "@/modules/identity/rbac";

const riskBaseSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).default(""),
  domain: z.enum([
    "technical",
    "ethical",
    "operational",
    "cybersecurity",
    "privacy",
    "regulatory",
    "mission_driven",
  ]),
  likelihood: z.enum(["low", "moderate", "high"]),
  impact: z.enum(["low", "moderate", "high"]),
  treatment: z.string().max(4000).default(""),
  ownerId: z.string().uuid(),
  soaEntryIds: z.array(z.string().uuid()).default([]),
});
const riskUpdateSchema = riskBaseSchema.extend({
  status: z.enum(["open", "mitigated", "accepted", "closed"]),
});

export type RiskInput = z.infer<typeof riskBaseSchema>;
export type RiskUpdateInput = z.infer<typeof riskUpdateSchema>;
export type RiskActionResult =
  | { ok: true; riskId: string }
  | { ok: false; error: string };

/** Testable core — used by the server action and integration tests. */
export async function createRiskRecord(
  dbc: Db,
  actorId: string,
  input: RiskInput,
): Promise<string> {
  return dbc.transaction(async (tx) => {
    const [risk] = await tx
      .insert(risks)
      .values({
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        domain: input.domain,
        likelihood: input.likelihood,
        impact: input.impact,
        treatment: input.treatment,
        ownerId: input.ownerId,
      })
      .returning();
    if (input.soaEntryIds.length > 0) {
      await tx.insert(riskControlLinks).values(
        input.soaEntryIds.map((soaEntryId) => ({
          riskId: risk.id,
          soaEntryId,
        })),
      );
    }
    await recordAudit(tx, {
      actorId,
      action: "risk.create",
      entityType: "risk",
      entityId: risk.id,
      after: { ...risk, soaEntryIds: input.soaEntryIds },
    });
    return risk.id;
  });
}

export async function updateRiskRecord(
  dbc: Db,
  actorId: string,
  riskId: string,
  input: RiskUpdateInput,
): Promise<void> {
  await dbc.transaction(async (tx) => {
    const [before] = await tx.select().from(risks).where(eq(risks.id, riskId));
    if (!before) throw new Error("Risk not found");
    const [after] = await tx
      .update(risks)
      .set({
        title: input.title,
        description: input.description,
        domain: input.domain,
        likelihood: input.likelihood,
        impact: input.impact,
        treatment: input.treatment,
        ownerId: input.ownerId,
        status: input.status,
      })
      .where(eq(risks.id, riskId))
      .returning();
    await tx.delete(riskControlLinks).where(eq(riskControlLinks.riskId, riskId));
    if (input.soaEntryIds.length > 0) {
      await tx.insert(riskControlLinks).values(
        input.soaEntryIds.map((soaEntryId) => ({ riskId, soaEntryId })),
      );
    }
    await recordAudit(tx, {
      actorId,
      action: "risk.edit",
      entityType: "risk",
      entityId: riskId,
      before,
      after: { ...after, soaEntryIds: input.soaEntryIds },
    });
  });
}

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
