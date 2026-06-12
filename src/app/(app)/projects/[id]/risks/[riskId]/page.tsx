import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  controls,
  riskControlLinks,
  risks,
  soaEntries,
  users,
} from "@/db/schema";
import { RiskBadge } from "@/app/(app)/risks/risk-badge";
import { RiskForm } from "@/app/(app)/risks/risk-form";

export default async function RiskDetailPage(props: {
  params: Promise<{ id: string; riskId: string }>;
}) {
  const { id: projectId, riskId } = await props.params;
  const [risk] = await db.select().from(risks).where(eq(risks.id, riskId));
  if (!risk || risk.projectId !== projectId) notFound();

  const userRows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.isActive, true));
  const soaRows = await db
    .select({ id: soaEntries.id, ref: controls.ref, title: controls.title })
    .from(soaEntries)
    .innerJoin(controls, eq(soaEntries.controlId, controls.id))
    .where(eq(soaEntries.projectId, projectId))
    .orderBy(controls.framework, controls.ref);
  const linkRows = await db
    .select({ soaEntryId: riskControlLinks.soaEntryId })
    .from(riskControlLinks)
    .where(eq(riskControlLinks.riskId, riskId));

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{risk.title}</h1>
        <RiskBadge likelihood={risk.likelihood} impact={risk.impact} />
        <span className="text-sm text-zinc-500">{risk.status}</span>
      </header>
      <RiskForm
        projectId={projectId}
        users={userRows}
        soaOptions={soaRows.map((r) => ({
          id: r.id,
          label: `${r.ref} — ${r.title}`,
        }))}
        existing={{
          id: risk.id,
          title: risk.title,
          description: risk.description,
          domain: risk.domain,
          likelihood: risk.likelihood,
          impact: risk.impact,
          treatment: risk.treatment,
          ownerId: risk.ownerId,
          status: risk.status,
          soaEntryIds: linkRows.map((l) => l.soaEntryId),
        }}
      />
      {/* Risk acceptance section lands in Task 9 */}
    </div>
  );
}
