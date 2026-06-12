"use client";

import { useActionState } from "react";
import { advancePhaseAction, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

export function AdvancePhaseForm({
  projectId,
  isFinal,
}: {
  projectId: string;
  isFinal: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    advancePhaseAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending || isFinal}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        title={isFinal ? "Phase VI is the final phase" : "Advance to next phase"}
      >
        {pending ? "Advancing…" : "Advance phase"}
      </button>
      {state.error && (
        <p className="rounded bg-red-950 px-3 py-1 text-sm text-red-300">
          {state.error}
        </p>
      )}
    </form>
  );
}
