import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { risks, users } from "@/db/schema";
import { RiskBadge } from "@/app/(app)/risks/risk-badge";

const DOMAINS = [
  "technical",
  "ethical",
  "operational",
  "cybersecurity",
  "privacy",
  "regulatory",
  "mission_driven",
] as const;
const STATUSES = ["open", "mitigated", "accepted", "closed"] as const;

export default async function ProjectRisksPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ domain?: string; status?: string }>;
}) {
  const { id: projectId } = await props.params;
  const { domain, status } = await props.searchParams;

  const conditions = [eq(risks.projectId, projectId)];
  if (domain && (DOMAINS as readonly string[]).includes(domain))
    conditions.push(eq(risks.domain, domain as (typeof DOMAINS)[number]));
  if (status && (STATUSES as readonly string[]).includes(status))
    conditions.push(eq(risks.status, status as (typeof STATUSES)[number]));

  const rows = await db
    .select({ risk: risks, ownerName: users.name })
    .from(risks)
    .innerJoin(users, eq(risks.ownerId, users.id))
    .where(and(...conditions))
    .orderBy(risks.createdAt);

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Risk Register</h1>
        <Link
          href={`/projects/${projectId}/risks/new`}
          className="rounded border border-zinc-700 px-2 py-1 text-sm"
        >
          New risk
        </Link>
      </header>

      <form method="get" className="flex gap-2 text-sm">
        <select
          name="domain"
          defaultValue={domain ?? ""}
          className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
        >
          <option value="">All domains</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded border border-zinc-700 px-2 py-0.5"
        >
          Filter
        </button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="py-1 pr-2">Risk</th>
            <th className="py-1 pr-2">Domain</th>
            <th className="py-1 pr-2">Score</th>
            <th className="py-1 pr-2">Status</th>
            <th className="py-1">Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ risk, ownerName }) => (
            <tr key={risk.id} className="border-b border-zinc-800">
              <td className="py-2 pr-2">
                <Link
                  href={`/projects/${projectId}/risks/${risk.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {risk.title}
                </Link>
              </td>
              <td className="py-2 pr-2">{risk.domain.replaceAll("_", " ")}</td>
              <td className="py-2 pr-2">
                <RiskBadge likelihood={risk.likelihood} impact={risk.impact} />
              </td>
              <td className="py-2 pr-2">{risk.status}</td>
              <td className="py-2">{ownerName}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-sm text-zinc-500">No risks match.</p>
      )}
    </div>
  );
}
