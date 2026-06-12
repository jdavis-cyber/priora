"use client";

import { useState, useTransition } from "react";
import { updateSoaEntry } from "./actions";

const STATUSES = [
  "not_implemented",
  "partially_implemented",
  "implemented",
  "inherited",
] as const;

export function SoaRowForm(props: {
  entry: {
    id: string;
    applicability: "applicable" | "not_applicable";
    justification: string;
    implementationStatus: (typeof STATUSES)[number];
  };
  readOnly: boolean;
}) {
  const { entry, readOnly } = props;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (readOnly) {
    return (
      <div className="text-sm">
        <span>
          {entry.applicability === "applicable"
            ? "Applicable"
            : "Not applicable"}
        </span>
        {" · "}
        <span>{entry.implementationStatus.replaceAll("_", " ")}</span>
        {entry.justification && (
          <p className="mt-1 text-zinc-500">{entry.justification}</p>
        )}
      </div>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await updateSoaEntry(fd);
          setError(res.ok ? null : res.error);
        })
      }
      className="flex flex-wrap items-start gap-2 text-sm"
    >
      <input type="hidden" name="soaEntryId" value={entry.id} />
      <select
        name="applicability"
        defaultValue={entry.applicability}
        className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
      >
        <option value="applicable">Applicable</option>
        <option value="not_applicable">Not applicable</option>
      </select>
      <select
        name="implementationStatus"
        defaultValue={entry.implementationStatus}
        className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <textarea
        name="justification"
        defaultValue={entry.justification}
        placeholder="Justification (required for N/A)"
        className="w-64 rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
        rows={1}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-700 px-2 py-0.5 disabled:opacity-50"
      >
        Save
      </button>
      {error && <p className="w-full text-red-400">{error}</p>}
    </form>
  );
}
