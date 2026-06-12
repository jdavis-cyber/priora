// FR-09 — risk register CRUD with control linkage, audited. Self-contained
// fixtures (own user + project), per the repo's integration-test convention.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { auditLog, riskControlLinks, risks, soaEntries, users } from "@/db/schema";
import { createProject } from "@/modules/lifecycle/service";
import { createRiskRecord, updateRiskRecord } from "@/modules/risk/service";
import { seedControls } from "../../seed/seed-controls";

describe("risk CRUD core (integration)", () => {
  let projectId: string;
  let ownerId: string;
  let soaIds: string[];

  beforeAll(async () => {
    await seedControls(db);
    const [pm] = await db
      .insert(users)
      .values({
        email: `pm-risk-${randomUUID()}@test.priora.local`,
        name: "Risk Test PM",
        passwordHash: "x",
        role: "program_manager",
      })
      .returning();
    ownerId = pm.id;
    const project = await createProject(
      db,
      { id: pm.id, role: "program_manager" },
      { name: "Risk CRUD Test Project" },
    );
    projectId = project.id;
    soaIds = (
      await db
        .select({ id: soaEntries.id })
        .from(soaEntries)
        .where(eq(soaEntries.projectId, projectId))
        .limit(2)
    ).map((r) => r.id);
  });

  it("creates a risk with control links and an audit entry", async () => {
    const riskId = await createRiskRecord(db, ownerId, {
      projectId,
      title: "Training data drift degrades model accuracy",
      description: "",
      domain: "technical",
      likelihood: "moderate",
      impact: "high",
      treatment: "Quarterly drift evaluation",
      ownerId,
      soaEntryIds: soaIds,
    });
    const [risk] = await db.select().from(risks).where(eq(risks.id, riskId));
    expect(risk.status).toBe("open");
    const links = await db
      .select()
      .from(riskControlLinks)
      .where(eq(riskControlLinks.riskId, riskId));
    expect(links).toHaveLength(2);
    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, riskId));
    expect(audits.some((a) => a.action === "risk.create")).toBe(true);
  });

  it("updates a risk and replaces its control links atomically", async () => {
    const riskId = await createRiskRecord(db, ownerId, {
      projectId,
      title: "Prompt injection via user-supplied content",
      description: "",
      domain: "cybersecurity",
      likelihood: "high",
      impact: "high",
      treatment: "",
      ownerId,
      soaEntryIds: soaIds,
    });
    await updateRiskRecord(db, ownerId, riskId, {
      projectId,
      title: "Prompt injection via user-supplied content",
      description: "Scope: all ingest paths",
      domain: "cybersecurity",
      likelihood: "moderate",
      impact: "high",
      treatment: "Input validation per SI-10",
      ownerId,
      status: "mitigated",
      soaEntryIds: [soaIds[0]],
    });
    const [risk] = await db.select().from(risks).where(eq(risks.id, riskId));
    expect(risk.status).toBe("mitigated");
    const links = await db
      .select()
      .from(riskControlLinks)
      .where(eq(riskControlLinks.riskId, riskId));
    expect(links).toHaveLength(1);
  });
});
