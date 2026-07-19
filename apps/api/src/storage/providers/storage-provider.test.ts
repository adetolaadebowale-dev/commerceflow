import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { LocalStorageProvider } from "./local-storage.provider";
import { MemoryStorageProvider } from "./memory-storage.provider";

describe("StorageProvider", () => {
  it("stores and deletes objects in memory", async () => {
    const storage = new MemoryStorageProvider("http://cdn.example/media");
    await storage.upload({
      key: "stores/a/products/b/file.png",
      body: Buffer.from("png"),
      contentType: "image/png",
    });

    expect(storage.has("stores/a/products/b/file.png")).toBe(true);
    expect(storage.getPublicUrl("stores/a/products/b/file.png")).toBe(
      "http://cdn.example/media/stores/a/products/b/file.png",
    );

    await storage.delete("stores/a/products/b/file.png");
    expect(storage.has("stores/a/products/b/file.png")).toBe(false);
  });

  it("writes files under a configurable local root", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "cf-media-"));
    const storage = new LocalStorageProvider({
      rootDir,
      publicBaseUrl: "http://localhost:3000/media",
    });

    try {
      const key = "stores/a/products/b/hello.png";
      await storage.upload({
        key,
        body: Buffer.from("hello"),
        contentType: "image/png",
      });
      expect(storage.getPublicUrl(key)).toContain("hello.png");
      await storage.delete(key);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });
});
