import { eq } from "drizzle-orm";
import { db } from "@/db";
import { controls, soaEntries, users } from "@/db/schema";
import { RiskForm } from "@/app/(app)/risks/risk-form";

export default async function NewRiskPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await props.params;
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Risk</h1>
      <RiskForm
        projectId={projectId}
        users={userRows}
        soaOptions={soaRows.map((r) => ({
          id: r.id,
          label: `${r.ref} — ${r.title}`,
        }))}
      />
    </div>
  );
}
