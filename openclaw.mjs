#!/usr/bin/env node

import { fileURLToPath } from "node:url";

// Legacy entrypoint kept so older scripts can keep invoking `openclaw`.
process.argv[1] = fileURLToPath(new URL("./mioclaw.mjs", import.meta.url));

await import("./mioclaw.mjs");
