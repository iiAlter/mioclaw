import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("mioclaw", 16)).toBe("mioclaw");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("mioclaw-status-output", 10)).toBe("mioclaw-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
