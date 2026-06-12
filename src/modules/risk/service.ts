// FR-09 — risk register orchestration: transactional CRUD with atomic control-link
// replacement, audited. Framework-free (no next/auth imports) so integration
// tests exercise it directly; server actions are thin wrappers.
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { riskAcceptances, riskControlLinks, risks } from "@/db/schema";
import { recordAudit } from "@/modules/audit/record";

export const riskBaseSchema = z.object({
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
export const riskUpdateSchema = riskBaseSchema.extend({
  status: z.enum(["open", "mitigated", "accepted", "closed"]),
});

export type RiskInput = z.infer<typeof riskBaseSchema>;
export type RiskUpdateInput = z.infer<typeof riskUpdateSchema>;

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
    await tx
      .delete(riskControlLinks)
      .where(eq(riskControlLinks.riskId, riskId));
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

// ---------------------------------------------------------------------------
// Residual risk acceptance (thin v1 — spec §4/§5). Accepting authority only;
// full review-cycle workflow is v2.
// ---------------------------------------------------------------------------

export async function acceptRiskRecord(
  dbc: Db,
  actorId: string,
  riskId: string,
  input: { rationale: string; reviewBy?: Date },
): Promise<void> {
  await dbc.transaction(async (tx) => {
    const [before] = await tx.select().from(risks).where(eq(risks.id, riskId));
    if (!before) throw new Error("Risk not found");
    const [acceptance] = await tx
      .insert(riskAcceptances)
      .values({
        riskId,
        rationale: input.rationale,
        acceptedById: actorId,
        reviewBy: input.reviewBy ?? null,
      })
      .returning();
    const [after] = await tx
      .update(risks)
      .set({ status: "accepted" })
      .where(eq(risks.id, riskId))
      .returning();
    await recordAudit(tx, {
      actorId,
      action: "risk.accept",
      entityType: "risk",
      entityId: riskId,
      before,
      after: { ...after, acceptanceId: acceptance.id },
    });
  });
}
