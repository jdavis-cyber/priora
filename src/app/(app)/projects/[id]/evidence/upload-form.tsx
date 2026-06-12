"use client";

import { useActionState } from "react";
import { ARTIFACT_TYPES } from "@/lib/artifact-types";
import { ingestEvidenceAction, type ActionResult } from "./actions";

export type LinkOption = { id: string; label: string };

const FIELD = "mt-1 block w-full rounded border border-zinc-700 bg-zinc-950 p-1";

export function UploadForm({
  projectId,
  currentPhase,
  controlOptions,
  gateOptions,
  riskOptions,
}: {
  projectId: string;
  currentPhase: number;
  controlOptions: LinkOption[];
  gateOptions: LinkOption[];
  riskOptions: LinkOption[];
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(async (_prev, formData) => ingestEvidenceAction(formData), null);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded border border-zinc-800 p-4"
    >
      <h2 className="font-semibold">Add evidence</h2>
      <input type="hidden" name="projectId" value={projectId} />

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Artifact type
          <select name="artifactType" required className={FIELD}>
            {ARTIFACT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Phase
          <select
            name="phaseNumber"
            defaultValue={currentPhase}
            className={FIELD}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                Phase {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        File (max 25 MB)
        <input type="file" name="file" className="mt-1 block w-full text-sm" />
      </label>
      <label className="block text-sm">
        …or inline JSON payload
        <textarea
          name="jsonPayload"
          rows={3}
          placeholder='{"key": "value"}'
          className={`${FIELD} font-mono text-xs`}
        />
      </label>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <label className="block">
          Link controls (SoA)
          <select name="linkControls" multiple size={4} className={FIELD}>
            {controlOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Link gates
          <select name="linkGates" multiple size={4} className={FIELD}>
            {gateOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Link risks
          <select name="linkRisks" multiple size={4} className={FIELD}>
            {riskOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Ingesting…" : "Ingest evidence"}
      </button>
      {state && !state.ok && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-emerald-400">Evidence ingested and hashed.</p>
      )}
    </form>
  );
}
