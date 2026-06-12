"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { soaEntries } from "@/db/schema";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/modules/audit/record";
import { validateSoaEntry } from "@/modules/controls/soa";
import { can } from "@/modules/identity/rbac";

const updateSoaSchema = z.object({
  soaEntryId: z.string().uuid(),
  applicability: z.enum(["applicable", "not_applicable"]),
  justification: z.string().max(4000).default(""),
  implementationStatus: z.enum([
    "not_implemented",
    "partially_implemented",
    "implemented",
    "inherited",
  ]),
});

export type SoaActionResult = { ok: true } | { ok: false; error: string };

export async function updateSoaEntry(
  formData: FormData,
): Promise<SoaActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authenticated" };
  if (!can(session.user.role, "soa.edit"))
    return { ok: false, error: "Not authorized" };

  const parsed = updateSoaSchema.safeParse({
    soaEntryId: formData.get("soaEntryId"),
    applicability: formData.get("applicability"),
    justification: formData.get("justification") ?? "",
    implementationStatus: formData.get("implementationStatus"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const input = parsed.data;

  const verdict = validateSoaEntry(input);
  if (!verdict.ok) {
    return {
      ok: false,
      error:
        "A written justification is required to mark a control Not Applicable.",
    };
  }

  const [before] = await db
    .select()
    .from(soaEntries)
    .where(eq(soaEntries.id, input.soaEntryId));
  if (!before) return { ok: false, error: "SoA entry not found" };

  const [after] = await db
    .update(soaEntries)
    .set({
      applicability: input.applicability,
      justification: input.justification,
      implementationStatus: input.implementationStatus,
    })
    .where(eq(soaEntries.id, input.soaEntryId))
    .returning();

  await recordAudit(db, {
    actorId: session.user.id,
    action: "soa.edit",
    entityType: "soa_entry",
    entityId: input.soaEntryId,
    before,
    after,
  });

  revalidatePath(`/projects/${before.projectId}/soa`);
  return { ok: true };
}
