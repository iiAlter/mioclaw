import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withTempHome } from "../../test/helpers/temp-home.js";
import {
  detectPluginInstallPathIssue,
  formatPluginInstallPathIssue,
} from "./plugin-install-path-warnings.js";

describe("plugin install path warnings", () => {
  it("detects stale custom plugin install paths", async () => {
    const issue = await detectPluginInstallPathIssue({
      pluginId: "matrix",
      install: {
        source: "path",
        sourcePath: "/tmp/mioclaw-matrix-missing",
        installPath: "/tmp/mioclaw-matrix-missing",
      },
    });

    expect(issue).toEqual({
      kind: "missing-path",
      pluginId: "matrix",
      path: "/tmp/mioclaw-matrix-missing",
    });
    expect(
      formatPluginInstallPathIssue({
        issue: issue!,
        pluginLabel: "Matrix",
        defaultInstallCommand: "mioclaw plugins install @mioclaw/matrix",
        repoInstallCommand: "mioclaw plugins install ./extensions/matrix",
      }),
    ).toEqual([
      "Matrix is installed from a custom path that no longer exists: /tmp/mioclaw-matrix-missing",
      'Reinstall with "mioclaw plugins install @mioclaw/matrix".',
      'If you are running from a repo checkout, you can also use "mioclaw plugins install ./extensions/matrix".',
    ]);
  });

  it("detects active custom plugin install paths", async () => {
    await withTempHome(async (home) => {
      const pluginPath = path.join(home, "matrix-plugin");
      await fs.mkdir(pluginPath, { recursive: true });

      const issue = await detectPluginInstallPathIssue({
        pluginId: "matrix",
        install: {
          source: "path",
          sourcePath: pluginPath,
          installPath: pluginPath,
        },
      });

      expect(issue).toEqual({
        kind: "custom-path",
        pluginId: "matrix",
        path: pluginPath,
      });
    });
  });
});
