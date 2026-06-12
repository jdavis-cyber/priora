// Contract §3 — AepManifest. The manifest is the auditor's index into the package.

export type AepManifestEntry = {
  evidenceId: string;
  artifactType: string;
  fileName: string | null;
  sha256: string;
  version: number;
  phaseNumber: number;
  links: {
    targetType: "control" | "gate" | "risk";
    targetId: string;
    ref?: string;
  }[];
};

export type AepManifest = {
  schemaVersion: 1;
  projectId: string;
  projectName: string;
  generatedAt: string; // ISO 8601
  generatedBy: string; // user id
  gateRegister: unknown[]; // snapshot rows (gate, phase, decision, decidedBy, decidedAt)
  soaSnapshot: unknown[]; // snapshot rows (ref, applicability, justification, implementationStatus)
  entries: AepManifestEntry[];
};

export type AepBuildInput = {
  project: { id: string; name: string };
  generatedBy: string;
  generatedAt: string;
  evidence: {
    id: string;
    artifactType: string;
    fileName: string | null;
    sha256: string;
    version: number;
    phaseNumber: number;
  }[];
  links: {
    evidenceId: string;
    targetType: "control" | "gate" | "risk";
    targetId: string;
    ref?: string;
  }[];
  gateRegister: unknown[];
  soaSnapshot: unknown[];
};

export function buildAepManifest(input: AepBuildInput): AepManifest {
  const entries: AepManifestEntry[] = input.evidence
    .map((e) => ({
      evidenceId: e.id,
      artifactType: e.artifactType,
      fileName: e.fileName,
      sha256: e.sha256,
      version: e.version,
      phaseNumber: e.phaseNumber,
      links: input.links
        .filter((l) => l.evidenceId === e.id)
        .map((l) => ({
          targetType: l.targetType,
          targetId: l.targetId,
          ...(l.ref !== undefined ? { ref: l.ref } : {}),
        })),
    }))
    .sort(
      (a, b) =>
        a.phaseNumber - b.phaseNumber ||
        a.artifactType.localeCompare(b.artifactType) ||
        a.version - b.version,
    );

  return {
    schemaVersion: 1,
    projectId: input.project.id,
    projectName: input.project.name,
    generatedAt: input.generatedAt,
    generatedBy: input.generatedBy,
    gateRegister: input.gateRegister,
    soaSnapshot: input.soaSnapshot,
    entries,
  };
}
