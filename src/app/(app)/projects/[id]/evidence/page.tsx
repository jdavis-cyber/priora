import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import {
  controls,
  evidenceArtifacts,
  evidenceLinks,
  gates,
  phases,
  projects,
  risks,
  soaEntries,
  users,
} from "@/db/schema";
import { UploadForm, type LinkOption } from "./upload-form";
import { VerifyButton } from "./verify-button";

export default async function EvidencePage({
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

  const evidence = await db
    .select({
      id: evidenceArtifacts.id,
      artifactType: evidenceArtifacts.artifactType,
      fileName: evidenceArtifacts.fileName,
      phaseNumber: evidenceArtifacts.phaseNumber,
      version: evidenceArtifacts.version,
      sha256: evidenceArtifacts.sha256,
      uploadedAt: evidenceArtifacts.uploadedAt,
      uploadedBy: users.name,
    })
    .from(evidenceArtifacts)
    .innerJoin(users, eq(evidenceArtifacts.uploadedById, users.id))
    .where(eq(evidenceArtifacts.projectId, projectId))
    .orderBy(evidenceArtifacts.uploadedAt);

  const links = await db
    .select({
      id: evidenceLinks.id,
      evidenceId: evidenceLinks.evidenceId,
      targetType: evidenceLinks.targetType,
      targetId: evidenceLinks.targetId,
    })
    .from(evidenceLinks)
    .innerJoin(
      evidenceArtifacts,
      eq(evidenceLinks.evidenceId, evidenceArtifacts.id),
    )
    .where(eq(evidenceArtifacts.projectId, projectId));

  const soaRows = await db
    .select({ id: soaEntries.id, ref: controls.ref, title: controls.title })
    .from(soaEntries)
    .innerJoin(controls, eq(soaEntries.controlId, controls.id))
    .where(eq(soaEntries.projectId, projectId))
    .orderBy(controls.ref);

  const gateRows = await db
    .select({ id: gates.id, phaseNumber: phases.phaseNumber })
    .from(gates)
    .innerJoin(phases, eq(gates.phaseId, phases.id))
    .where(eq(phases.projectId, projectId))
    .orderBy(phases.phaseNumber);

  const riskRows = await db
    .select({ id: risks.id, title: risks.title })
    .from(risks)
    .where(eq(risks.projectId, projectId))
    .orderBy(risks.createdAt);

  const refByTarget = new Map<string, string>([
    ...soaRows.map((r) => [r.id, `Control ${r.ref}`] as const),
    ...gateRows.map((g) => [g.id, `Phase ${g.phaseNumber} gate`] as const),
    ...riskRows.map((r) => [r.id, `Risk: ${r.title}`] as const),
  ]);

  const controlOptions: LinkOption[] = soaRows.map((r) => ({
    id: r.id,
    label: `${r.ref} — ${r.title}`,
  }));
  const gateOptions: LinkOption[] = gateRows.map((g) => ({
    id: g.id,
    label: `Phase ${g.phaseNumber} gate`,
  }));
  const riskOptions: LinkOption[] = riskRows.map((r) => ({
    id: r.id,
    label: r.title,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-blue-400 hover:underline"
          >
            ← {project.name}
          </Link>
          <h1 className="mt-1 text-xl font-semibold">Evidence Locker</h1>
        </div>
        <Link
          href={`/projects/${projectId}/aep`}
          className="text-sm text-blue-400 underline"
        >
          AEP exports →
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="py-2 pr-3">Type</th>
            <th className="py-2 pr-3">File</th>
            <th className="py-2 pr-3">Phase</th>
            <th className="py-2 pr-3">v</th>
            <th className="py-2 pr-3">SHA-256</th>
            <th className="py-2 pr-3">Uploaded</th>
            <th className="py-2 pr-3">Links</th>
            <th className="py-2">Integrity</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((e) => (
            <tr key={e.id} className="border-b border-zinc-800 align-top">
              <td className="py-2 pr-3">{e.artifactType}</td>
              <td className="py-2 pr-3">{e.fileName ?? <em>JSON payload</em>}</td>
              <td className="py-2 pr-3">{e.phaseNumber}</td>
              <td className="py-2 pr-3">{e.version}</td>
              <td className="py-2 pr-3 font-mono text-xs" title={e.sha256}>
                {e.sha256.slice(0, 12)}…
              </td>
              <td className="py-2 pr-3">
                {e.uploadedBy}
                <br />
                <span className="text-xs text-zinc-500">
                  {e.uploadedAt.toLocaleString()}
                </span>
              </td>
              <td className="py-2 pr-3 text-xs">
                {links
                  .filter((l) => l.evidenceId === e.id)
                  .map((l) => (
                    <div key={l.id}>
                      {refByTarget.get(l.targetId) ??
                        `${l.targetType}:${l.targetId.slice(0, 8)}`}
                    </div>
                  ))}
              </td>
              <td className="py-2">
                <VerifyButton evidenceId={e.id} />
              </td>
            </tr>
          ))}
          {evidence.length === 0 && (
            <tr>
              <td colSpan={8} className="py-4 text-center text-zinc-500">
                No evidence yet — the locker is empty.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <UploadForm
        projectId={projectId}
        currentPhase={project.currentPhase}
        controlOptions={controlOptions}
        gateOptions={gateOptions}
        riskOptions={riskOptions}
      />
    </div>
  );
}
