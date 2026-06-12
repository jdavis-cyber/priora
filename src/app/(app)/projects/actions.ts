"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { Role } from "@/modules/identity/rbac";
import {
  advancePhase,
  closeCorrectiveAction,
  createProject,
  decideGate,
  type Actor,
} from "@/modules/lifecycle/service";

export type ActionState = { error: string | null };

async function requireActor(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  return { id: session.user.id, role: session.user.role as Role };
}

function toMessage(e: unknown): string {
  if (e instanceof ZodError) {
    return e.issues.map((i) => i.message).join("; ");
  }
  return e instanceof Error ? e.message : "unexpected error";
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let projectId: string;
  try {
    const actor = await requireActor();
    const project = await createProject(db, actor, {
      name: formData.get("name"),
      description: formData.get("description") ?? "",
      criticality: formData.get("criticality") ?? "medium",
    });
    projectId = project.id;
  } catch (e) {
    return { error: toMessage(e) };
  }
  revalidatePath("/projects");
  redirect(`/projects/${projectId}`); // outside try: redirect() throws by design
}

export async function decideGateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const rawCas = formData.get("correctiveActions");
    const correctiveActions =
      typeof rawCas === "string" && rawCas.trim().length > 0
        ? (JSON.parse(rawCas) as unknown)
        : [];
    await decideGate(db, actor, {
      gateId: formData.get("gateId"),
      decision: formData.get("decision"),
      rationale: formData.get("rationale"),
      correctiveActions,
    });
  } catch (e) {
    return { error: toMessage(e) };
  }
  revalidatePath(`/projects/${formData.get("projectId")}`);
  return { error: null };
}

export async function advancePhaseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requireActor();
    const result = await advancePhase(db, actor, {
      projectId: formData.get("projectId"),
    });
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        gate_not_decided:
          "The current phase gate has not been decided yet — a gate review is required before advancing.",
        gate_not_approved:
          "The current phase gate was Not Approved — the project cannot advance.",
        already_final:
          "Phase VI (Operationalization) is the final phase — there is nowhere to advance.",
        not_authorized: "Your role is not authorized to advance phases.",
      };
      return { error: messages[result.reason] };
    }
  } catch (e) {
    return { error: toMessage(e) };
  }
  revalidatePath(`/projects/${formData.get("projectId")}`);
  return { error: null };
}

export async function closeCorrectiveActionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requireActor();
    await closeCorrectiveAction(db, actor, {
      correctiveActionId: formData.get("correctiveActionId"),
    });
  } catch (e) {
    return { error: toMessage(e) };
  }
  revalidatePath(`/projects/${formData.get("projectId")}`);
  return { error: null };
}
