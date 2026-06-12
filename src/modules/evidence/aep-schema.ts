import { z } from "zod";

const sha256Hex = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "lowercase 64-char hex sha256");

export const aepManifestEntrySchema = z.object({
  evidenceId: z.string().uuid(),
  artifactType: z.string().min(1),
  fileName: z.string().nullable(),
  sha256: sha256Hex,
  version: z.number().int().min(1),
  phaseNumber: z.number().int().min(1).max(6),
  links: z.array(
    z.object({
      targetType: z.enum(["control", "gate", "risk"]),
      targetId: z.string().uuid(),
      ref: z.string().optional(),
    }),
  ),
});

export const aepManifestSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string().uuid(),
  projectName: z.string().min(1),
  generatedAt: z.string().datetime(),
  generatedBy: z.string().uuid(),
  gateRegister: z.array(z.unknown()),
  soaSnapshot: z.array(z.unknown()),
  entries: z.array(aepManifestEntrySchema),
});

export type AepManifestParsed = z.infer<typeof aepManifestSchema>;
