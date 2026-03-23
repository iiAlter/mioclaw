#!/usr/bin/env -S node --import tsx

import { pathToFileURL } from "node:url";
import { main } from "./mioclaw-npm-release-check.ts";

export * from "./mioclaw-npm-release-check.ts";

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(main());
}
