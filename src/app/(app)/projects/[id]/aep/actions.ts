"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { generateAep } from "@/modules/evidence/generate-aep";
import { can, type Role } from "@/modules/identity/rbac";

export type GenerateAepResult =
  | { ok: true; exportId: string; packageSha256: string }
  | { ok: false; error: string };

export async function generateAepAction(
  formData: FormData,
): Promise<GenerateAepResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authenticated" };
  if (!can(session.user.role as Role, "aep.generate")) {
    return { ok: false, error: "Your role cannot generate AEPs" };
  }

  const parsed = z.string().uuid().safeParse(formData.get("projectId"));
  if (!parsed.success) return { ok: false, error: "Invalid project id" };

  try {
    const row = await generateAep(db, storage, parsed.data, session.user.id);
    revalidatePath(`/projects/${parsed.data}/aep`);
    return { ok: true, exportId: row.id, packageSha256: row.packageSha256 };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "AEP generation failed",
    };
  }
}

// Void wrapper for plain <form action={...}> usage in the server component.
export async function generateAepFormAction(formData: FormData): Promise<void> {
  await generateAepAction(formData);
}
