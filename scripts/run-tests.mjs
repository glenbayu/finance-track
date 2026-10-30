import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const testsDirectory = join(root, "tests");
const testFiles = existsSync(testsDirectory)
  ? readdirSync(testsDirectory)
  .filter((file) => file.endsWith(".test.mjs"))
  .sort()
  .map((file) => join(testsDirectory, file))
  : [];

if (testFiles.length === 0) {
  console.error("No test files found in tests/. Refusing to report a false-green test run.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", ...testFiles],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
