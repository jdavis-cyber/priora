// Spec §4/§5 — residual-risk acceptance: creates a risk_acceptances row, flips the
// risk to accepted, audited. RBAC: only roles with can(role, "risk.accept")
// (governance_lead, executive_sponsor, risk_officer per the contract M1 matrix).
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { auditLog, riskAcceptances, risks, users } from "@/db/schema";
import { can } from "@/modules/identity/rbac";
import { createProject } from "@/modules/lifecycle/service";
import { acceptRiskRecord, createRiskRecord } from "@/modules/risk/service";
import { seedControls } from "../../seed/seed-controls";

describe("risk acceptance (integration)", () => {
  let riskId: string;
  let sponsorId: string;

  beforeAll(async () => {
    await seedControls(db);
    const [sponsor] = await db
      .insert(users)
      .values({
        email: `es-${randomUUID()}@test.priora.local`,
        name: "Acceptance Test Sponsor",
        passwordHash: "x",
        role: "executive_sponsor",
      })
      .returning();
    sponsorId = sponsor.id;
    const [pm] = await db
      .insert(users)
      .values({
        email: `pm-acc-${randomUUID()}@test.priora.local`,
        name: "Acceptance Test PM",
        passwordHash: "x",
        role: "program_manager",
      })
      .returning();
    const project = await createProject(
      db,
      { id: pm.id, role: "program_manager" },
      { name: "Risk Acceptance Test Project" },
    );
    riskId = await createRiskRecord(db, sponsorId, {
      projectId: project.id,
      title: "Residual bias after mitigation",
      description: "",
      domain: "ethical",
      likelihood: "low",
      impact: "moderate",
      treatment: "Mitigations exhausted; residual accepted",
      ownerId: sponsorId,
      soaEntryIds: [],
    });
  });

  it("RBAC matrix grants risk.accept to exactly governance_lead, executive_sponsor, risk_officer", () => {
    expect(can("governance_lead", "risk.accept")).toBe(true);
    expect(can("executive_sponsor", "risk.accept")).toBe(true);
    expect(can("risk_officer", "risk.accept")).toBe(true);
    expect(can("program_manager", "risk.accept")).toBe(false);
    expect(can("ml_engineer", "risk.accept")).toBe(false);
    expect(can("auditor", "risk.accept")).toBe(false);
  });

  it("creates the acceptance row, flips status to accepted, and audits", async () => {
    await acceptRiskRecord(db, sponsorId, riskId, {
      rationale: "Residual risk within tolerance for this mission profile.",
      reviewBy: new Date("2026-12-31T00:00:00Z"),
    });
    const [risk] = await db.select().from(risks).where(eq(risks.id, riskId));
    expect(risk.status).toBe("accepted");
    const acceptances = await db
      .select()
      .from(riskAcceptances)
      .where(eq(riskAcceptances.riskId, riskId));
    expect(acceptances).toHaveLength(1);
    expect(acceptances[0].acceptedById).toBe(sponsorId);
    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, riskId));
    expect(audits.some((a) => a.action === "risk.accept")).toBe(true);
  });
});
