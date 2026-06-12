"use client";

import { useActionState } from "react";
import { closeCorrectiveActionAction, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

export type CaView = {
  id: string;
  description: string;
  dueDate: string; // ISO
  status: "open" | "closed";
  closedAt: string | null; // ISO
  phaseLabel: string;
};

function CloseButton({ caId, projectId }: { caId: string; projectId: string }) {
  const [state, formAction, pending] = useActionState(
    closeCorrectiveActionAction,
    initialState,
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="correctiveActionId" value={caId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-950 disabled:opacity-50"
      >
        {pending ? "Closing…" : "Close"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-red-400">{state.error}</span>
      )}
    </form>
  );
}

export function CorrectiveActionsList({
  items,
  projectId,
  canClose,
}: {
  items: CaView[];
  projectId: string;
  canClose: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No corrective actions recorded.</p>
    );
  }
  const now = Date.now();
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
          <th className="px-3 py-2">Description</th>
          <th className="px-3 py-2">Gate</th>
          <th className="px-3 py-2">Due</th>
          <th className="px-3 py-2">Status</th>
          {canClose && <th className="px-3 py-2" />}
        </tr>
      </thead>
      <tbody>
        {items.map((ca) => {
          const overdue =
            ca.status === "open" && new Date(ca.dueDate).getTime() < now;
          return (
            <tr
              key={ca.id}
              className={`border-b border-zinc-800 ${overdue ? "bg-red-950/40" : ""}`}
            >
              <td className="px-3 py-2">{ca.description}</td>
              <td className="px-3 py-2">{ca.phaseLabel}</td>
              <td
                className={`px-3 py-2 ${overdue ? "font-semibold text-red-400" : ""}`}
              >
                {new Date(ca.dueDate).toLocaleDateString()}
                {overdue && " (overdue)"}
              </td>
              <td className="px-3 py-2">
                {ca.status === "closed"
                  ? `closed ${ca.closedAt ? new Date(ca.closedAt).toLocaleDateString() : ""}`
                  : "open"}
              </td>
              {canClose && (
                <td className="px-3 py-2">
                  {ca.status === "open" && (
                    <CloseButton caId={ca.id} projectId={projectId} />
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
