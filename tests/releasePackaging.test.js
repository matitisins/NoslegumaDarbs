import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("release preparation keeps required templates and excludes local/runtime files", async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "flow-release-test-"));
  const outputDirectory = path.join(temporaryRoot, "Flow-Football-Analytics");

  try {
    const result = spawnSync(
      process.execPath,
      [path.join(projectRoot, "scripts", "prepare-release.mjs"), outputDirectory],
      { cwd: projectRoot, encoding: "utf8" }
    );

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

    for (const requiredPath of [
      "package.json",
      "package-lock.json",
      "README.md",
      ".env.example",
      "backend/.env.example",
      "backend/src/api/config.php",
    ]) {
      await fs.access(path.join(outputDirectory, requiredPath));
    }

    for (const excludedPath of [
      ".env",
      ".env.local",
      "backend/.env",
      "node_modules",
      "dist",
      ".git",
      "backend/cache",
      "backend/logs",
    ]) {
      await assert.rejects(
        fs.access(path.join(outputDirectory, excludedPath)),
        { code: "ENOENT" },
        `${excludedPath} should not be included in a release`
      );
    }
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});
