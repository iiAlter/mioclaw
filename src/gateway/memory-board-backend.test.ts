import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runExec: vi.fn(),
  resolveOpenClawPackageRootSync: vi.fn(() => "/repo"),
}));

vi.mock("../process/exec.js", () => ({
  runExec: mocks.runExec,
}));

vi.mock("../infra/openclaw-root.js", () => ({
  resolveOpenClawPackageRootSync: mocks.resolveOpenClawPackageRootSync,
}));

const { createMemoryBoardBackend, MemoryBoardBackendError } =
  await import("./memory-board-backend.js");

describe("createMemoryBoardBackend", () => {
  beforeEach(() => {
    mocks.runExec.mockReset();
    mocks.resolveOpenClawPackageRootSync.mockReset();
    mocks.resolveOpenClawPackageRootSync.mockReturnValue("/repo");
  });

  it("rejects memory-core because it has no board backend", async () => {
    const backend = createMemoryBoardBackend({
      config: { plugins: { slots: { memory: "memory-core" } } },
    });

    await expect(backend.list({})).rejects.toMatchObject({
      statusCode: 501,
      message: expect.stringContaining("does not expose Memory Board"),
    });
  });

  it("delegates list calls to the active memory plugin backend", async () => {
    const backend = createMemoryBoardBackend({
      config: { plugins: { slots: { memory: "memory-lancedb-pro" } } },
      argv1: "/repo/openclaw.mjs",
      cwd: "/repo",
      pluginRootResolver: () => "/home/test/memory-lancedb-pro",
      lanceDbProRuntimeResolver: () => ({
        jitiUrl: "file:///home/test/memory-lancedb-pro/node_modules/jiti/lib/jiti.mjs",
        storePath: "/home/test/memory-lancedb-pro/src/store.ts",
      }),
      lanceDbProStoreFactoryLoader: async () =>
        class FakeMemoryStore {
          async list() {
            return [
              {
                id: "m1",
                text: "Remember mioclaw",
                category: "fact",
                scope: "global",
                importance: 0.9,
                timestamp: 1,
                metadata: '{"l0_abstract":"Remember mioclaw"}',
              },
            ];
          }
          async stats() {
            return { totalCount: 1, categoryCounts: { fact: 1 } };
          }
          async delete() {
            return true;
          }
          async importEntry(entry: Record<string, unknown>) {
            return entry;
          }
          async hasId() {
            return false;
          }
        },
    });

    const memories = await backend.list({ q: "mioclaw" });

    expect(memories).toHaveLength(1);
    expect(memories[0]).toMatchObject({
      id: "m1",
      category: "fact",
      abstract: "Remember mioclaw",
    });
    expect(mocks.runExec).not.toHaveBeenCalled();
  });

  it("turns backend execution failures into backend errors", async () => {
    const backend = createMemoryBoardBackend({
      config: { plugins: { slots: { memory: "memory-lancedb-pro" } } },
      pluginRootResolver: () => "/home/test/memory-lancedb-pro",
      lanceDbProRuntimeResolver: () => ({
        jitiUrl: "file:///home/test/memory-lancedb-pro/node_modules/jiti/lib/jiti.mjs",
        storePath: "/home/test/memory-lancedb-pro/src/store.ts",
      }),
      lanceDbProStoreFactoryLoader: async () => {
        throw new Error("boom");
      },
    });

    await expect(backend.list({})).rejects.toBeInstanceOf(MemoryBoardBackendError);
    await expect(backend.list({})).rejects.toMatchObject({ statusCode: 503 });
  });
});
