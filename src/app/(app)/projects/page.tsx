import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { PHASE_NAMES } from "@/lib/phases";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const CRITICALITY_STYLES: Record<string, string> = {
  low: "bg-zinc-800 text-zinc-300",
  medium: "bg-blue-950 text-blue-300",
  high: "bg-amber-950 text-amber-300",
  mission_critical: "bg-red-950 text-red-300",
};

export default async function ProjectsPage() {
  const rows = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.updatedAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New project
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Criticality</th>
            <th className="px-3 py-2">Current phase</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr
              key={p.id}
              className="border-b border-zinc-800 hover:bg-zinc-900"
            >
              <td className="px-3 py-2">
                <Link
                  href={`/projects/${p.id}`}
                  className="font-medium text-blue-400 hover:underline"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${CRITICALITY_STYLES[p.criticality]}`}
                >
                  {p.criticality.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2">
                Phase {ROMAN[p.currentPhase - 1]} — {PHASE_NAMES[p.currentPhase]}
              </td>
              <td className="px-3 py-2">{p.status}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                No projects yet. Create the first governed AI project.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
