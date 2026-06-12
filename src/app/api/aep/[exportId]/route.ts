import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { aepExports } from "@/db/schema";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";

// Reads are role-unrestricted in v1 (contract §3) — auth required, all six
// roles incl. Auditor may download. The package hash rides along as a
// response header so an auditor can verify out-of-band.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ exportId: string }> },
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { exportId } = await params;
  const parsed = z.string().uuid().safeParse(exportId);
  if (!parsed.success)
    return new NextResponse("Invalid export id", { status: 400 });

  const [row] = await db
    .select()
    .from(aepExports)
    .where(eq(aepExports.id, parsed.data));
  if (!row) return new NextResponse("Not found", { status: 404 });

  const data = await storage.get(row.storagePath);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="aep_${row.projectId}_${row.id}.zip"`,
      "Content-Length": String(data.length),
      "X-Package-Sha256": row.packageSha256,
    },
  });
}
