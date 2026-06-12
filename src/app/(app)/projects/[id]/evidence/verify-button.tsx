"use client";

import { useActionState } from "react";
import { verifyEvidenceAction, type VerifyActionResult } from "./actions";

export function VerifyButton({ evidenceId }: { evidenceId: string }) {
  const [state, formAction, pending] = useActionState<
    VerifyActionResult | null,
    FormData
  >(async (_prev, formData) => verifyEvidenceAction(formData), null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="evidenceId" value={evidenceId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
      {state &&
        (state.ok ? (
          state.match ? (
            <span
              className="text-xs text-emerald-400"
              title={`computed ${state.computedSha256}`}
            >
              ✅ Integrity verified {new Date(state.verifiedAt).toLocaleString()}
            </span>
          ) : (
            <span
              className="text-xs font-semibold text-red-400"
              title={`stored ${state.storedSha256} ≠ computed ${state.computedSha256}`}
            >
              ⚠️ HASH MISMATCH — possible tampering (
              {new Date(state.verifiedAt).toLocaleString()})
            </span>
          )
        ) : (
          <span className="text-xs text-red-400">{state.error}</span>
        ))}
    </form>
  );
}
