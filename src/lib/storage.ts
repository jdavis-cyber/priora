import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** Contract §4: the only interface M4+ uses to touch files. S3 driver = a swap, not a rewrite. */
export interface Storage {
  put(filePath: string, data: Buffer): Promise<void>;
  get(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
}

export function createLocalStorage(root: string): Storage {
  const absRoot = path.resolve(root);

  const resolveSafe = async (p: string): Promise<string> => {
    const full = path.resolve(absRoot, p);
    if (full !== absRoot && !full.startsWith(absRoot + path.sep)) {
      throw new Error(`Path escapes storage root: ${p}`);
    }
    return full;
  };

  return {
    async put(filePath, data) {
      const full = await resolveSafe(filePath);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, data);
    },
    async get(filePath) {
      return readFile(await resolveSafe(filePath));
    },
    async delete(filePath) {
      await rm(await resolveSafe(filePath));
    },
  };
}

/** App-wide default instance: ./var/storage (gitignored), overridable for live profile. */
export const storage: Storage = createLocalStorage(
  process.env.STORAGE_ROOT ?? path.join(process.cwd(), "var", "storage"),
);
