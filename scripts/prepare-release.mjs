import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = path.join(projectRoot, "release");
const defaultOutput = path.join(releaseRoot, "Flow-Football-Analytics");
const outputDirectory = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : defaultOutput;

const isProjectRoot = outputDirectory === projectRoot;
const isParentOfProject = projectRoot.startsWith(`${outputDirectory}${path.sep}`);
const isInsideProject = outputDirectory.startsWith(`${projectRoot}${path.sep}`);
const isInsideReleaseFolder = outputDirectory.startsWith(`${releaseRoot}${path.sep}`);
if (isProjectRoot || isParentOfProject || (isInsideProject && !isInsideReleaseFolder)) {
  throw new Error("Release output must be separate from source files; inside the project, use the release/ folder.");
}

function shouldExclude(relativePath, entryName, isDirectory) {
  const normalized = relativePath.split(path.sep).join("/");
  const segments = normalized.split("/");

  if (segments.includes(".git") || segments.includes("node_modules")) return true;
  if (["dist", "build", "release"].includes(segments[0])) return true;
  if (normalized === "backend/cache" || normalized.startsWith("backend/cache/")) return true;
  if (normalized === "backend/logs" || normalized.startsWith("backend/logs/")) return true;
  if (entryName === ".DS_Store" || entryName === "Thumbs.db") return true;
  if (/\.(log|tmp)$/i.test(entryName)) return true;
  if (/^(npm-debug|yarn-debug|yarn-error)\.log/i.test(entryName)) return true;

  // Keep example templates, but never copy machine-specific environment files.
  if (entryName.startsWith(".env") && entryName !== ".env.example") return true;
  if (entryName === ".env" || entryName === ".env.local") return true;

  return false;
}

async function copyDirectory(sourceDirectory, targetDirectory, relativeDirectory = "") {
  await fs.mkdir(targetDirectory, { recursive: true });
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = relativeDirectory
      ? path.join(relativeDirectory, entry.name)
      : entry.name;
    if (shouldExclude(relativePath, entry.name, entry.isDirectory())) continue;

    const sourcePath = path.join(sourceDirectory, entry.name);
    const targetPath = path.join(targetDirectory, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, relativePath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function verifyRelease(directory) {
  const requiredFiles = [
    "package.json",
    "package-lock.json",
    "README.md",
    ".env.example",
    "backend/.env.example",
    "backend/src/api/config.php",
  ];

  for (const relativePath of requiredFiles) {
    try {
      await fs.access(path.join(directory, relativePath));
    } catch {
      throw new Error(`Required release file is missing: ${relativePath}`);
    }
  }

  async function scan(directoryPath, relativeDirectory = "") {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? path.join(relativeDirectory, entry.name)
        : entry.name;
      if (shouldExclude(relativePath, entry.name, entry.isDirectory())) {
        throw new Error(`Excluded file unexpectedly found in release: ${relativePath}`);
      }
      if (entry.isDirectory()) {
        await scan(path.join(directoryPath, entry.name), relativePath);
      }
    }
  }
  await scan(directory);
}

try {
  const outputIsDefaultRelease = outputDirectory === defaultOutput;
  try {
    await fs.access(outputDirectory);
    if (!outputIsDefaultRelease) {
      throw new Error(`Output directory already exists: ${outputDirectory}. Choose a new output path.`);
    }
    await fs.rm(outputDirectory, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await copyDirectory(projectRoot, outputDirectory);
  await verifyRelease(outputDirectory);

  console.log("PASS: clean release folder prepared.");
  console.log(`Location: ${outputDirectory}`);
  console.log("Excluded: .env files (except .env.example), node_modules, dist, backend/cache, backend/logs and .git.");
  console.log("Next: compress the prepared folder and submit that ZIP, not the original working folder.");
} catch (error) {
  console.error(`Release preparation failed: ${error.message}`);
  process.exitCode = 1;
}
