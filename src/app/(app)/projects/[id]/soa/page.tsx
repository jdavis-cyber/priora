import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { controls, projects, soaEntries } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  controlFamily,
  soaCompleteness,
} from "@/modules/controls/completeness";
import { can } from "@/modules/identity/rbac";
import { SoaRowForm } from "./soa-row-form";

const FRAMEWORK_LABEL = {
  iso_42001: "ISO/IEC 42001 Annex A",
  nist_800_53: "NIST SP 800-53 Rev 5",
} as const;

export default async function SoaPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ family?: string; status?: string }>;
}) {
  const { id: projectId } = await props.params;
  const { family, status } = await props.searchParams;
  const session = await auth();
  const readOnly = !session?.user || !can(session.user.role, "soa.edit");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) notFound();

  const rows = await db
    .select({ entry: soaEntries, control: controls })
    .from(soaEntries)
    .innerJoin(controls, eq(soaEntries.controlId, controls.id))
    .where(eq(soaEntries.projectId, projectId))
    .orderBy(controls.framework, controls.ref);

  const completeness = soaCompleteness(rows.map((r) => r.entry));
  const families = [
    ...new Set(rows.map((r) => controlFamily(r.control.framework, r.control.ref))),
  ];

  const visible = rows.filter(
    (r) =>
      (!family ||
        controlFamily(r.control.framework, r.control.ref) === family) &&
      (!status || r.entry.implementationStatus === status),
  );
  const byFramework = Map.groupBy(visible, (r) => r.control.framework);

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-blue-400 hover:underline"
          >
            ← {project.name}
          </Link>
          <h1 className="mt-1 text-xl font-semibold">
            Statement of Applicability
          </h1>
        </div>
        <span className="text-sm font-medium">
          SoA completeness: {completeness}%
        </span>
      </header>

      <form method="get" className="flex gap-2 text-sm">
        <select
          name="family"
          defaultValue={family ?? ""}
          className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
        >
          <option value="">All families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5"
        >
          <option value="">All statuses</option>
          <option value="not_implemented">not implemented</option>
          <option value="partially_implemented">partially implemented</option>
          <option value="implemented">implemented</option>
          <option value="inherited">inherited</option>
        </select>
        <button
          type="submit"
          className="rounded border border-zinc-700 px-2 py-0.5"
        >
          Filter
        </button>
      </form>

      {[...byFramework.entries()].map(([framework, group]) => (
        <section key={framework}>
          <h2 className="mb-2 font-medium">{FRAMEWORK_LABEL[framework]}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="py-1 pr-2">Ref</th>
                <th className="py-1 pr-2">Control</th>
                <th className="py-1 pr-2">Mappings</th>
                <th className="py-1">Posture</th>
              </tr>
            </thead>
            <tbody>
              {group.map(({ entry, control }) => (
                <tr
                  key={entry.id}
                  className="border-b border-zinc-800 align-top"
                >
                  <td className="whitespace-nowrap py-2 pr-2 font-mono">
                    {control.ref}
                  </td>
                  <td className="py-2 pr-2">{control.title}</td>
                  <td className="whitespace-nowrap py-2 pr-2 text-zinc-500">
                    {[
                      control.isoClause,
                      control.aiRmfFunction,
                      control.csrmcElement,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td className="py-2">
                    <SoaRowForm
                      entry={{
                        id: entry.id,
                        applicability: entry.applicability,
                        justification: entry.justification,
                        implementationStatus: entry.implementationStatus,
                      }}
                      readOnly={readOnly}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
