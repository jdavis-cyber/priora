import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { projects, risks } from "@/db/schema";
import { RiskBadge } from "./risk-badge";

export default async function PortfolioRisksPage() {
  const rows = await db
    .select({ risk: risks, projectName: projects.name })
    .from(risks)
    .innerJoin(projects, eq(risks.projectId, projects.id))
    .orderBy(projects.name, risks.createdAt);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Portfolio Risks</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="py-1 pr-2">Project</th>
            <th className="py-1 pr-2">Risk</th>
            <th className="py-1 pr-2">Domain</th>
            <th className="py-1 pr-2">Score</th>
            <th className="py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ risk, projectName }) => (
            <tr key={risk.id} className="border-b border-zinc-800">
              <td className="py-2 pr-2">{projectName}</td>
              <td className="py-2 pr-2">
                <Link
                  href={`/projects/${risk.projectId}/risks/${risk.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {risk.title}
                </Link>
              </td>
              <td className="py-2 pr-2">{risk.domain.replaceAll("_", " ")}</td>
              <td className="py-2 pr-2">
                <RiskBadge likelihood={risk.likelihood} impact={risk.impact} />
              </td>
              <td className="py-2">{risk.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-sm text-zinc-500">No risks recorded yet.</p>
      )}
    </div>
  );
}
