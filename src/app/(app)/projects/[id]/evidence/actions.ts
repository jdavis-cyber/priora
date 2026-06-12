"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { isArtifactTypeId } from "@/lib/artifact-types";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { can, type Role } from "@/modules/identity/rbac";
import {
  ingestEvidence,
  MAX_UPLOAD_BYTES,
  type EvidenceLinkInput,
} from "@/modules/evidence/ingest";
import { verifyEvidence, type VerifyResult } from "@/modules/evidence/verify";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type VerifyActionResult =
  | ({ ok: true } & VerifyResult)
  | { ok: false; error: string };

const ingestFields = z.object({
  projectId: z.string().uuid(),
  phaseNumber: z.coerce.number().int().min(1).max(6),
  artifactType: z.string().refine(isArtifactTypeId, "Unknown artifact type"),
  jsonPayload: z.string().optional(),
  linkControls: z.array(z.string().uuid()),
  linkGates: z.array(z.string().uuid()),
  linkRisks: z.array(z.string().uuid()),
});

export async function ingestEvidenceAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authenticated" };
  if (!can(session.user.role as Role, "evidence.ingest")) {
    return { ok: false, error: "Your role cannot ingest evidence" };
  }

  const parsed = ingestFields.safeParse({
    projectId: formData.get("projectId"),
    phaseNumber: formData.get("phaseNumber"),
    artifactType: formData.get("artifactType"),
    jsonPayload: (formData.get("jsonPayload") as string | null) || undefined,
    linkControls: formData.getAll("linkControls"),
    linkGates: formData.getAll("linkGates"),
    linkRisks: formData.getAll("linkRisks"),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const f = parsed.data;

  const links: EvidenceLinkInput[] = [
    ...f.linkControls.map((id) => ({
      targetType: "control" as const,
      targetId: id,
    })),
    ...f.linkGates.map((id) => ({ targetType: "gate" as const, targetId: id })),
    ...f.linkRisks.map((id) => ({ targetType: "risk" as const, targetId: id })),
  ];

  const base = {
    projectId: f.projectId,
    phaseNumber: f.phaseNumber,
    artifactType: f.artifactType,
    actorId: session.user.id,
    links,
  };

  const file = formData.get("file");
  try {
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, error: "File exceeds the 25 MB upload limit" };
      }
      await ingestEvidence(db, storage, {
        ...base,
        kind: "file",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        data: Buffer.from(await file.arrayBuffer()),
      });
    } else if (f.jsonPayload) {
      let payload: unknown;
      try {
        payload = JSON.parse(f.jsonPayload);
      } catch {
        return { ok: false, error: "JSON payload is not valid JSON" };
      }
      await ingestEvidence(db, storage, { ...base, kind: "json", payload });
    } else {
      return { ok: false, error: "Provide a file or a JSON payload" };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Ingest failed",
    };
  }

  revalidatePath(`/projects/${f.projectId}/evidence`);
  return { ok: true };
}

export async function verifyEvidenceAction(
  formData: FormData,
): Promise<VerifyActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authenticated" };
  if (!can(session.user.role as Role, "evidence.verify")) {
    return { ok: false, error: "Your role cannot run integrity verification" };
  }

  const parsed = z.string().uuid().safeParse(formData.get("evidenceId"));
  if (!parsed.success) return { ok: false, error: "Invalid evidence id" };

  try {
    const result = await verifyEvidence(
      db,
      storage,
      parsed.data,
      session.user.id,
    );
    return { ok: true, ...result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Verification failed",
    };
  }
}
