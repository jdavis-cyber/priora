// Contract §4 — storage abstraction: local-fs driver, swap-ready for S3
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLocalStorage, type Storage } from "./storage";

let root: string;
let storage: Storage;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "priora-storage-"));
  storage = createLocalStorage(root);
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("local-fs storage driver", () => {
  it("put writes bytes under the root, creating directories", async () => {
    await storage.put(
      "projects/p1/phase_1/e1/report.txt",
      Buffer.from("hello"),
    );
    const onDisk = await readFile(
      path.join(root, "projects/p1/phase_1/e1/report.txt"),
    );
    expect(onDisk.toString()).toBe("hello");
  });

  it("get round-trips the exact bytes", async () => {
    const data = Buffer.from([0x00, 0xff, 0x10, 0x80]);
    await storage.put("bin/blob.bin", data);
    expect((await storage.get("bin/blob.bin")).equals(data)).toBe(true);
  });

  it("delete removes the object; get then rejects", async () => {
    await storage.put("tmp/x.txt", Buffer.from("x"));
    await storage.delete("tmp/x.txt");
    await expect(storage.get("tmp/x.txt")).rejects.toThrow();
  });

  it("rejects path traversal out of the root", async () => {
    await expect(
      storage.put("../escape.txt", Buffer.from("no")),
    ).rejects.toThrow(/escapes storage root/);
    await expect(storage.get("a/../../escape.txt")).rejects.toThrow(
      /escapes storage root/,
    );
  });
});
