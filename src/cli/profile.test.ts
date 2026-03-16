import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "mioclaw",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "mioclaw", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "mioclaw", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "mioclaw", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "mioclaw", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "mioclaw", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "mioclaw", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "mioclaw", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "mioclaw", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".mioclaw-dev");
    expect(env.OPENCLAW_PROFILE).toBe("dev");
    expect(env.OPENCLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.OPENCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "mioclaw.json"));
    expect(env.OPENCLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      OPENCLAW_STATE_DIR: "/custom",
      OPENCLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.OPENCLAW_STATE_DIR).toBe("/custom");
    expect(env.OPENCLAW_GATEWAY_PORT).toBe("19099");
    expect(env.OPENCLAW_CONFIG_PATH).toBe(path.join("/custom", "mioclaw.json"));
  });

  it("uses OPENCLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      OPENCLAW_HOME: "/srv/mioclaw-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/mioclaw-home");
    expect(env.OPENCLAW_STATE_DIR).toBe(path.join(resolvedHome, ".mioclaw-work"));
    expect(env.OPENCLAW_CONFIG_PATH).toBe(path.join(resolvedHome, ".mioclaw-work", "mioclaw.json"));
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "mioclaw doctor --fix",
      env: {},
      expected: "mioclaw doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "mioclaw doctor --fix",
      env: { OPENCLAW_PROFILE: "default" },
      expected: "mioclaw doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "mioclaw doctor --fix",
      env: { OPENCLAW_PROFILE: "Default" },
      expected: "mioclaw doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "mioclaw doctor --fix",
      env: { OPENCLAW_PROFILE: "bad profile" },
      expected: "mioclaw doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "mioclaw --profile work doctor --fix",
      env: { OPENCLAW_PROFILE: "work" },
      expected: "mioclaw --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "mioclaw --dev doctor",
      env: { OPENCLAW_PROFILE: "dev" },
      expected: "mioclaw --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("mioclaw doctor --fix", { OPENCLAW_PROFILE: "work" })).toBe(
      "mioclaw --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("mioclaw doctor --fix", { OPENCLAW_PROFILE: "  jbopenclaw  " })).toBe(
      "mioclaw --profile jbopenclaw doctor --fix",
    );
  });

  it("handles command with no args after mioclaw", () => {
    expect(formatCliCommand("mioclaw", { OPENCLAW_PROFILE: "test" })).toBe(
      "mioclaw --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm mioclaw doctor", { OPENCLAW_PROFILE: "work" })).toBe(
      "pnpm mioclaw --profile work doctor",
    );
  });
});
