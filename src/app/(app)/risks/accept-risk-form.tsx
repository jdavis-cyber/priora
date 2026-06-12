"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptRisk } from "./actions";

export function AcceptRiskForm({ riskId }: { riskId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await acceptRisk(riskId, fd);
          if (!res.ok) setError(res.error);
          else router.refresh();
        })
      }
      className="space-y-2 rounded border border-zinc-800 p-3 text-sm"
    >
      <h3 className="font-medium">Accept residual risk</h3>
      <textarea
        name="rationale"
        required
        rows={2}
        placeholder="Acceptance rationale"
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
      />
      <label className="block">
        Review by
        <input
          type="date"
          name="reviewBy"
          className="block rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-700 px-3 py-1 disabled:opacity-50"
      >
        Accept risk
      </button>
      {error && <p className="text-red-400">{error}</p>}
    </form>
  );
}
