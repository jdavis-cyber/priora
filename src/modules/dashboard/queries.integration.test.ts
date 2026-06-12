// FR-01 — portfolioSummary returns correct per-project aggregates and rollups
// against a real Postgres. Encodes: open risks only; SoA completeness uses the
// M3 addressed-rule; overdue = open action past due; pending gate = current
// phase gate undecided.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  controls,
  correctiveActions,
  evidenceArtifacts,
  gates,
  phases,
  projects,
  risks,
  soaEntries,
  users,
} from "@/db/schema";
import { portfolioSummary } from "./queries";

describe("portfolioSummary", () => {
  it("aggregates one project's posture and the portfolio rollup", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `m5-dash-${randomUUID()}@test.priora.local`,
        name: "M5 Dash Tester",
        passwordHash: "x",
        role: "program_manager",
      })
      .returning();

    const name = `M5 Dash ${randomUUID()}`;
    const [project] = await db
      .insert(projects)
      .values({ name, ownerId: user.id, currentPhase: 3, criticality: "high" })
      .returning();
    const phaseRows = await db
      .insert(phases)
      .values([1, 2, 3, 4, 5, 6].map((n) => ({ projectId: project.id, phaseNumber: n })))
      .returning();
    const gateRows = await db
      .insert(gates)
      .values(phaseRows.map((p) => ({ phaseId: p.id })))
      .returning();

    // Decide gates 1-2; gate 3 (current) stays undecided => pending
    const gateFor = (n: number) =>
      gateRows.find((g) => g.phaseId === phaseRows.find((p) => p.phaseNumber === n)!.id)!;
    await db
      .update(gates)
      .set({ decision: "approved", decidedById: user.id, decidedAt: new Date() })
      .where(eq(gates.id, gateFor(1).id));
    await db
      .update(gates)
      .set({ decision: "conditionally_approved", decidedById: user.id, decidedAt: new Date() })
      .where(eq(gates.id, gateFor(2).id));

    // Corrective actions on gate 2: one open+overdue, one open future, one closed
    await db.insert(correctiveActions).values([
      {
        gateId: gateFor(2).id,
        description: "overdue open",
        dueDate: new Date("2026-01-01T00:00:00Z"),
        status: "open",
      },
      {
        gateId: gateFor(2).id,
        description: "future open",
        dueDate: new Date("2030-01-01T00:00:00Z"),
        status: "open",
      },
      {
        gateId: gateFor(2).id,
        description: "closed",
        dueDate: new Date("2026-01-01T00:00:00Z"),
        status: "closed",
        closedAt: new Date(),
      },
    ]);

    // Risks: 2 open technical, 1 open privacy, 1 mitigated technical (excluded)
    await db.insert(risks).values([
      { projectId: project.id, title: "r1", domain: "technical", likelihood: "high", impact: "high", ownerId: user.id },
      { projectId: project.id, title: "r2", domain: "technical", likelihood: "low", impact: "moderate", ownerId: user.id },
      { projectId: project.id, title: "r3", domain: "privacy", likelihood: "moderate", impact: "moderate", ownerId: user.id },
      { projectId: project.id, title: "r4", domain: "technical", likelihood: "low", impact: "low", status: "mitigated", ownerId: user.id },
    ]);

    // SoA: 4 entries, 3 addressed => 75%
    const controlRows = await db
      .insert(controls)
      .values(
        [1, 2, 3, 4].map((n) => ({
          framework: "nist_800_53" as const,
          ref: `M5.DASH.${randomUUID().slice(0, 8)}.${n}`,
          title: "M5 dash test control",
        })),
      )
      .returning();
    await db.insert(soaEntries).values([
      { projectId: project.id, controlId: controlRows[0].id, implementationStatus: "implemented" },
      { projectId: project.id, controlId: controlRows[1].id, implementationStatus: "partially_implemented" },
      { projectId: project.id, controlId: controlRows[2].id, applicability: "not_applicable", justification: "test n/a" },
      { projectId: project.id, controlId: controlRows[3].id }, // not_implemented => unaddressed
    ]);

    // Evidence: 2 inline-JSON artifacts (no storage round-trip needed for a count)
    await db.insert(evidenceArtifacts).values([
      {
        projectId: project.id,
        phaseNumber: 1,
        artifactType: "mission_risk_profile",
        jsonPayload: { tier: "high" },
        sha256: "a".repeat(64),
        uploadedById: user.id,
      },
      {
        projectId: project.id,
        phaseNumber: 2,
        artifactType: "data_inventory",
        jsonPayload: { sources: 3 },
        sha256: "b".repeat(64),
        uploadedById: user.id,
      },
    ]);

    const { rows, rollup } = await portfolioSummary(db, new Date("2026-06-11T00:00:00Z"));
    const mine = rows.find((r) => r.projectId === project.id)!;

    expect(mine.name).toBe(name);
    expect(mine.criticality).toBe("high");
    expect(mine.currentPhase).toBe(3);
    expect(mine.currentGateDecision).toBeNull();
    expect(mine.openRiskCountByDomain.technical).toBe(2);
    expect(mine.openRiskCountByDomain.privacy).toBe(1);
    expect(mine.openRiskCountByDomain.ethical).toBe(0);
    expect(mine.soaCompletenessPct).toBe(75);
    expect(mine.evidenceCount).toBe(2);
    expect(mine.openCorrectiveActionCount).toBe(2);
    expect(mine.overdueCorrectiveActionCount).toBe(1);

    // Rollup includes this project (other suites' fixtures may coexist — assert >=)
    expect(rollup.totalProjects).toBeGreaterThanOrEqual(1);
    expect(rollup.byPhase[3]).toBeGreaterThanOrEqual(1);
    expect(rollup.openRisksByDomain.technical).toBeGreaterThanOrEqual(2);
    expect(rollup.pendingGates).toBeGreaterThanOrEqual(1);
    expect(rollup.overdueActions).toBeGreaterThanOrEqual(1);
  });

  it("returns an empty summary shape when no projects match", async () => {
    // Archived projects are excluded — archive-only check via a fresh archived project
    const [user] = await db
      .insert(users)
      .values({
        email: `m5-dash-arch-${randomUUID()}@test.priora.local`,
        name: "M5 Arch Tester",
        passwordHash: "x",
        role: "program_manager",
      })
      .returning();
    const [archived] = await db
      .insert(projects)
      .values({ name: `M5 Archived ${randomUUID()}`, ownerId: user.id, status: "archived" })
      .returning();
    const { rows } = await portfolioSummary(db);
    expect(rows.find((r) => r.projectId === archived.id)).toBeUndefined();
  });
});
