import {
  addEvidenceLinkFormAction,
  removeEvidenceLinkFormAction,
} from "./actions";

export type ExistingLink = { id: string; label: string };
export type TargetOption = { value: string; label: string }; // value = "<type>:<uuid>"

export function LinkEditor({
  evidenceId,
  projectId,
  existing,
  options,
}: {
  evidenceId: string;
  projectId: string;
  existing: ExistingLink[];
  options: TargetOption[];
}) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-blue-400">
        {existing.length} link{existing.length === 1 ? "" : "s"} — edit
      </summary>
      <div className="mt-1 space-y-1">
        {existing.map((l) => (
          <form
            key={l.id}
            action={removeEvidenceLinkFormAction}
            className="flex items-center gap-1"
          >
            <input type="hidden" name="linkId" value={l.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <span>{l.label}</span>
            <button type="submit" className="text-red-400" title="Remove link">
              ✕
            </button>
          </form>
        ))}
        <form action={addEvidenceLinkFormAction} className="flex items-center gap-1">
          <input type="hidden" name="evidenceId" value={evidenceId} />
          <input type="hidden" name="projectId" value={projectId} />
          <select
            name="target"
            className="rounded border border-zinc-700 bg-zinc-950 p-0.5"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded border border-zinc-700 px-1"
          >
            + Link
          </button>
        </form>
      </div>
    </details>
  );
}
