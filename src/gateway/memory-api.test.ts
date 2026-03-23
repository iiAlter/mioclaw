import type { IncomingMessage } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMemoryBoardBackend: vi.fn(),
}));

vi.mock("./memory-board-backend.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./memory-board-backend.js")>();
  return {
    ...actual,
    createMemoryBoardBackend: mocks.createMemoryBoardBackend,
  };
});

const { handleMemoryApi } = await import("./memory-api.js");
const { makeMockHttpResponse } = await import("./test-http-response.js");
const { MemoryBoardBackendError } = await import("./memory-board-backend.js");

describe("handleMemoryApi", () => {
  beforeEach(() => {
    mocks.createMemoryBoardBackend.mockReset();
  });

  it("returns backend errors instead of an empty array", async () => {
    mocks.createMemoryBoardBackend.mockReturnValue({
      list: vi.fn(async () => {
        throw new MemoryBoardBackendError("backend unavailable", 503);
      }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      export: vi.fn(),
      import: vi.fn(),
      stats: vi.fn(),
      categories: vi.fn(() => []),
    });

    const { res, end } = makeMockHttpResponse();
    const handled = await handleMemoryApi(
      { url: "/api/memory/memories", method: "GET" } as IncomingMessage,
      res,
      new URL("http://localhost/api/memory/memories"),
      {},
    );

    expect(handled).toBe(true);
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(String(end.mock.calls[0]?.[0] ?? ""))).toEqual({
      error: "backend unavailable",
    });
  });
});
