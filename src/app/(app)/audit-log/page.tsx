// NFR-01 read side — the browsable audit trail. Read-only: a filter form (GET)
// and a table. No mutations exist on this page by design.
import Link from "next/link";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  decodeCursor,
  encodeCursor,
  queryAuditLog,
} from "@/modules/dashboard/audit-query";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const filterSchema = z.object({
  actor: z.string().uuid().optional(),
  action: z.string().trim().min(1).max(200).optional(),
  entity: z.string().trim().min(1).max(200).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cursor: z.string().optional(),
});

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};

  const actorOptions = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .orderBy(users.email);

  const page = await queryAuditLog(db, {
    actorId: f.actor,
    action: f.action,
    entityType: f.entity,
    from: f.from,
    to: f.to,
    limit: PAGE_SIZE,
    cursor: f.cursor ? (decodeCursor(f.cursor) ?? undefined) : undefined,
  });

  const baseFilter = {
    actor: f.actor,
    action: f.action,
    entity: f.entity,
    from: raw.from,
    to: raw.to,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Append-only record of every mutation. Read-only — entries cannot be
          edited or deleted.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
      >
        <label className="text-xs font-medium text-zinc-400">
          Actor
          <select
            name="actor"
            defaultValue={f.actor ?? ""}
            className="mt-1 block rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          >
            <option value="">All actors</option>
            {actorOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-400">
          Action
          <input
            name="action"
            defaultValue={f.action ?? ""}
            placeholder="e.g. gate.decide"
            className="mt-1 block rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </label>
        <label className="text-xs font-medium text-zinc-400">
          Entity type
          <input
            name="entity"
            defaultValue={f.entity ?? ""}
            placeholder="e.g. gate"
            className="mt-1 block rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </label>
        <label className="text-xs font-medium text-zinc-400">
          From
          <input
            type="date"
            name="from"
            defaultValue={raw.from ?? ""}
            className="mt-1 block rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs font-medium text-zinc-400">
          To
          <input
            type="date"
            name="to"
            defaultValue={raw.to ?? ""}
            className="mt-1 block rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Filter
        </button>
        <Link href="/audit-log" className="text-sm text-zinc-500 hover:underline">
          Clear
        </Link>
      </form>

      {page.entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
          <p className="text-sm font-medium text-zinc-100">
            No audit entries match
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Adjust the filters or clear them to see the full trail.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left text-sm" data-testid="audit-table">
            <thead className="bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Timestamp (UTC)</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Entity</th>
                <th className="px-4 py-2 font-medium">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {page.entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 tabular-nums text-zinc-400">
                    {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-2 text-zinc-100">
                    {e.actorEmail ?? "system"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-300">
                    {e.action}
                  </td>
                  <td className="px-4 py-2 text-zinc-400">{e.entityType}</td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-600">
                    {e.entityId ? `${e.entityId.slice(0, 8)}…` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {page.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/audit-log${queryString({ ...baseFilter, cursor: encodeCursor(page.nextCursor) })}`}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Older entries →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
