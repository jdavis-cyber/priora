"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRisk, updateRisk, type RiskActionResult } from "./actions";

const DOMAINS = [
  "technical",
  "ethical",
  "operational",
  "cybersecurity",
  "privacy",
  "regulatory",
  "mission_driven",
] as const;
const LEVELS = ["low", "moderate", "high"] as const;
const STATUSES = ["open", "mitigated", "accepted", "closed"] as const;

const FIELD = "rounded border border-zinc-700 bg-zinc-950 px-2 py-1";

export type RiskFormProps = {
  projectId: string;
  users: { id: string; name: string }[];
  soaOptions: { id: string; label: string }[]; // project SoA entries: "A.5.2 — Establish a process..."
  existing?: {
    id: string;
    title: string;
    description: string;
    domain: (typeof DOMAINS)[number];
    likelihood: (typeof LEVELS)[number];
    impact: (typeof LEVELS)[number];
    treatment: string;
    ownerId: string;
    status: (typeof STATUSES)[number];
    soaEntryIds: string[];
  };
};

export function RiskForm({
  projectId,
  users,
  soaOptions,
  existing,
}: RiskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res: RiskActionResult = existing
            ? await updateRisk(existing.id, fd)
            : await createRisk(fd);
          if (!res.ok) setError(res.error);
          else router.push(`/projects/${projectId}/risks/${res.riskId}`);
        })
      }
      className="max-w-xl space-y-3 text-sm"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label className="block">
        Title
        <input
          name="title"
          defaultValue={existing?.title}
          required
          className={`${FIELD} w-full`}
        />
      </label>
      <label className="block">
        Description
        <textarea
          name="description"
          defaultValue={existing?.description}
          rows={3}
          className={`${FIELD} w-full`}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="block">
          Domain
          <select
            name="domain"
            defaultValue={existing?.domain ?? "technical"}
            className={`${FIELD} block`}
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Likelihood
          <select
            name="likelihood"
            defaultValue={existing?.likelihood ?? "moderate"}
            className={`${FIELD} block`}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Impact
          <select
            name="impact"
            defaultValue={existing?.impact ?? "moderate"}
            className={`${FIELD} block`}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {existing && (
          <label className="block">
            Status
            <select
              name="status"
              defaultValue={existing.status}
              className={`${FIELD} block`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="block">
        Treatment
        <textarea
          name="treatment"
          defaultValue={existing?.treatment}
          rows={2}
          className={`${FIELD} w-full`}
        />
      </label>
      <label className="block">
        Owner
        <select
          name="ownerId"
          defaultValue={existing?.ownerId}
          required
          className={`${FIELD} block`}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Linked controls (project SoA entries)
        <select
          name="soaEntryIds"
          multiple
          size={8}
          defaultValue={existing?.soaEntryIds ?? []}
          className={`${FIELD} w-full font-mono`}
        >
          {soaOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-700 px-3 py-1 disabled:opacity-50"
      >
        {existing ? "Save risk" : "Create risk"}
      </button>
      {error && <p className="text-red-400">{error}</p>}
    </form>
  );
}
