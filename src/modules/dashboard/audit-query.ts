// NFR-01 read side — keyset-paginated audit browsing. Read-only by construction.
import { and, desc, eq, gte, lt, lte, or, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { auditLog, users } from "@/db/schema";

export type AuditCursor = { createdAt: string; id: string }; // ISO timestamp + row id tiebreak

export type AuditFilter = {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
  limit: number; // page size, 1..100
  cursor?: AuditCursor;
};

export type AuditPageEntry = {
  id: string;
  createdAt: Date;
  actorEmail: string | null; // null = system
  action: string;
  entityType: string;
  entityId: string | null;
};

export type AuditPage = { entries: AuditPageEntry[]; nextCursor: AuditCursor | null };

export function encodeCursor(c: AuditCursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeCursor(s: string): AuditCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    if (typeof parsed?.createdAt === "string" && typeof parsed?.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function queryAuditLog(db: Db, filter: AuditFilter): Promise<AuditPage> {
  const limit = Math.min(Math.max(filter.limit, 1), 100);
  const conditions: SQL[] = [];
  if (filter.actorId) conditions.push(eq(auditLog.actorId, filter.actorId));
  if (filter.action) conditions.push(eq(auditLog.action, filter.action));
  if (filter.entityType) conditions.push(eq(auditLog.entityType, filter.entityType));
  if (filter.from) conditions.push(gte(auditLog.createdAt, filter.from));
  if (filter.to) conditions.push(lte(auditLog.createdAt, filter.to));
  if (filter.cursor) {
    const at = new Date(filter.cursor.createdAt);
    conditions.push(
      or(
        lt(auditLog.createdAt, at),
        and(eq(auditLog.createdAt, at), lt(auditLog.id, filter.cursor.id)),
      )!,
    );
  }

  const rows = await db
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      actorEmail: users.email,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit + 1); // sentinel row reveals whether a next page exists

  const hasMore = rows.length > limit;
  const entries = hasMore ? rows.slice(0, limit) : rows;
  const last = entries[entries.length - 1];
  return {
    entries,
    nextCursor: hasMore && last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null,
  };
}
