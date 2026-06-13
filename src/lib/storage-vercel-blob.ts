// Vercel Blob driver (M6). Vercel's serverless filesystem is ephemeral, so the
// local-fs driver would silently drop demo evidence between invocations. Token
// comes from BLOB_READ_WRITE_TOKEN (auto-injected by Vercel when the store is
// connected; set explicitly in GitHub Actions). Read lazily inside each call so
// constructing the driver needs no token.
//
// addRandomSuffix:false + allowOverwrite:true => the blob pathname === our storage
// path, so the daily seed reset overwrites deterministically and SHA-256 hashes
// keep verifying after each reset.
//
// NOTE: Vercel Blob URLs are public-but-unguessable; acceptable for fictional demo
// fixtures only — documented in SECURITY.md.
import { del, list, put } from "@vercel/blob";
import type { Storage } from "./storage";

export function createVercelBlobStorage(): Storage {
  async function findBlob(filePath: string) {
    const { blobs } = await list({ prefix: filePath, limit: 10 });
    return blobs.find((b) => b.pathname === filePath) ?? null;
  }

  return {
    async put(filePath, data) {
      await put(filePath, data, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async get(filePath) {
      const blob = await findBlob(filePath);
      if (!blob) throw new Error(`blob not found: ${filePath}`);
      const res = await fetch(blob.url);
      if (!res.ok) {
        throw new Error(`blob fetch failed (${res.status}): ${filePath}`);
      }
      return Buffer.from(await res.arrayBuffer());
    },
    async delete(filePath) {
      const blob = await findBlob(filePath);
      if (blob) await del(blob.url);
    },
  };
}
