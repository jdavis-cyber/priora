import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { aepExports, projects, users } from "@/db/schema";
import { generateAepFormAction } from "./actions";

export default async function AepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) return <p className="p-6">Project not found.</p>;

  const exports = await db
    .select({
      id: aepExports.id,
      packageSha256: aepExports.packageSha256,
      generatedAt: aepExports.generatedAt,
      generatedBy: users.name,
      manifest: aepExports.manifest,
    })
    .from(aepExports)
    .innerJoin(users, eq(aepExports.generatedById, users.id))
    .where(eq(aepExports.projectId, projectId))
    .orderBy(desc(aepExports.generatedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AEP Exports — {project.name}</h1>
        <Link
          href={`/projects/${projectId}/evidence`}
          className="text-sm text-blue-400 underline"
        >
          ← Evidence Locker
        </Link>
      </div>

      <form action={generateAepFormAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Generate Automated Evidence Package
        </button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="py-2 pr-3">Generated</th>
            <th className="py-2 pr-3">By</th>
            <th className="py-2 pr-3">Evidence entries</th>
            <th className="py-2 pr-3">Package SHA-256</th>
            <th className="py-2">Download</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((x) => (
            <tr key={x.id} className="border-b border-zinc-800">
              <td className="py-2 pr-3">{x.generatedAt.toLocaleString()}</td>
              <td className="py-2 pr-3">{x.generatedBy}</td>
              <td className="py-2 pr-3">
                {(x.manifest as { entries?: unknown[] }).entries?.length ?? "—"}
              </td>
              <td
                className="py-2 pr-3 font-mono text-xs"
                title={x.packageSha256}
              >
                {x.packageSha256.slice(0, 16)}…
              </td>
              <td className="py-2">
                <a href={`/api/aep/${x.id}`} className="text-blue-400 underline">
                  zip
                </a>
              </td>
            </tr>
          ))}
          {exports.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-zinc-500">
                No exports yet — generate the first audit package above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
