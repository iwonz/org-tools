#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const manifest = JSON.parse(await readFile("docs/screenshot-demo.json", "utf8"));
if (!Array.isArray(manifest) || manifest.length !== 56) {
  throw new Error(`Expected the maintained 56-screenshot manifest, received ${manifest.length}.`);
}
const declaredFiles = manifest.map((scenario) => scenario.file).sort();
const diagnosticsDirectory = "test-results/screenshot-determinism";

async function generate(pass) {
  const startedAt = performance.now();
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["screenshots:generate"], { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
  if (exitCode !== 0) throw new Error(`Screenshot pass ${pass} failed with exit code ${exitCode}.`);
  const generatedFiles = (await readdir("docs/screenshots"))
    .filter((file) => file.endsWith(".png"))
    .sort();
  if (JSON.stringify(declaredFiles) !== JSON.stringify(generatedFiles)) {
    throw new Error("The screenshot directory must exactly match the maintained 56-file manifest.");
  }
  const buffers = new Map();
  const hashes = new Map();
  for (const scenario of manifest) {
    const path = `docs/screenshots/${scenario.file}`;
    const buffer = await readFile(path);
    buffers.set(scenario.file, buffer);
    hashes.set(scenario.file, createHash("sha256").update(buffer).digest("hex"));
  }
  console.log(
    `Screenshot pass ${pass}: ${hashes.size} files in ${((performance.now() - startedAt) / 1000).toFixed(2)}s`,
  );
  return { buffers, hashes };
}

await rm(diagnosticsDirectory, { force: true, recursive: true });
const first = await generate(1);
const second = await generate(2);
const mismatches = [...first.hashes].flatMap(([file, hash]) =>
  second.hashes.get(file) === hash ? [] : [file],
);
if (mismatches.length > 0) {
  await mkdir(diagnosticsDirectory, { recursive: true });
  console.error(`Screenshot determinism failed for ${mismatches.length} file(s):`);
  for (const file of mismatches) {
    console.error(`- ${file}`);
    const stem = file.replace(/\.png$/u, "");
    await Promise.all([
      writeFile(`${diagnosticsDirectory}/${stem}-pass-1.png`, first.buffers.get(file)),
      writeFile(`${diagnosticsDirectory}/${stem}-pass-2.png`, second.buffers.get(file)),
    ]);
  }
  process.exitCode = 1;
} else {
  console.log("Screenshot determinism passed: all 56 SHA-256 hashes match.");
}
