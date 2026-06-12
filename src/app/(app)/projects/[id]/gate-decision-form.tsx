"use client";

import { useActionState, useState } from "react";
import { decideGateAction, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

type CaRow = { description: string; dueDate: string };

export function GateDecisionForm({
  gateId,
  projectId,
  phaseLabel,
}: {
  gateId: string;
  projectId: string;
  phaseLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    decideGateAction,
    initialState,
  );
  const [decision, setDecision] = useState("approved");
  const [cas, setCas] = useState<CaRow[]>([{ description: "", dueDate: "" }]);
  const conditional = decision === "conditionally_approved";

  return (
    <form
      action={formAction}
      data-testid="gate-decide-form"
      className="rounded border border-zinc-800 bg-zinc-900 p-4"
    >
      <h3 className="mb-3 text-sm font-semibold">
        Gate decision — {phaseLabel}
      </h3>
      <input type="hidden" name="gateId" value={gateId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input
        type="hidden"
        name="correctiveActions"
        value={conditional ? JSON.stringify(cas) : "[]"}
      />
      <div className="mb-3">
        <label htmlFor="decision" className="mb-1 block text-xs font-medium">
          Decision
        </label>
        <select
          id="decision"
          name="decision"
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="approved">Approved</option>
          <option value="conditionally_approved">Conditionally approved</option>
          <option value="not_approved">Not approved</option>
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="rationale" className="mb-1 block text-xs font-medium">
          Rationale (required)
        </label>
        <textarea
          id="rationale"
          name="rationale"
          required
          rows={2}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          placeholder="Why this decision was made"
        />
      </div>
      {conditional && (
        <fieldset className="mb-3 rounded border border-amber-700 bg-amber-950/40 p-3">
          <legend className="px-1 text-xs font-semibold text-amber-400">
            Corrective actions (at least one required)
          </legend>
          {cas.map((ca, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                value={ca.description}
                onChange={(e) =>
                  setCas(
                    cas.map((c, j) =>
                      j === i ? { ...c, description: e.target.value } : c,
                    ),
                  )
                }
                placeholder="Corrective action description"
                className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={ca.dueDate}
                onChange={(e) =>
                  setCas(
                    cas.map((c, j) =>
                      j === i ? { ...c, dueDate: e.target.value } : c,
                    ),
                  )
                }
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
              />
              {cas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCas(cas.filter((_, j) => j !== i))}
                  className="text-sm text-red-400"
                  aria-label="Remove corrective action"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCas([...cas, { description: "", dueDate: "" }])}
            className="text-xs font-medium text-amber-400 underline"
          >
            + Add another corrective action
          </button>
        </fieldset>
      )}
      {state.error && (
        <p className="mb-3 rounded bg-red-950 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Recording…" : "Record gate decision"}
      </button>
    </form>
  );
}
