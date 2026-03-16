import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#mioclaw",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#mioclaw",
      rawTarget: "#mioclaw",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "mioclaw-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "mioclaw-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "mioclaw-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "mioclaw-bot",
      rawTarget: "mioclaw-bot",
    });
  });
});
