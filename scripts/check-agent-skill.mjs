#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsRoot = resolve(repositoryRoot, "skills");
const expectedSkillDirectory = resolve(skillsRoot, "org-tools");
const expectedSkillPath = resolve(expectedSkillDirectory, "SKILL.md");

const fail = (message) => {
  throw new Error(`Agent skill check failed: ${message}`);
};

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (entry.isFile()) files.push(path);
    else fail(`unsupported filesystem entry ${path}`);
  }
  return files.sort();
};

const files = await collectFiles(skillsRoot);
if (files.length !== 1 || files[0] !== expectedSkillPath) {
  fail("skills/ must contain only org-tools/SKILL.md for the public instruction-only skill");
}

const mode = (await stat(expectedSkillPath)).mode;
if ((mode & 0o111) !== 0) fail("SKILL.md must not be executable");

const source = await readFile(expectedSkillPath, "utf8");
const frontmatterMatch = /^---\n([\s\S]*?)\n---\n/u.exec(source);
if (!frontmatterMatch) fail("SKILL.md must start with YAML frontmatter");

const frontmatter = frontmatterMatch[1] ?? "";
const name = /^name:\s*(.+)$/mu.exec(frontmatter)?.[1]?.trim();
const description = /^description:\s*(.+)$/mu.exec(frontmatter)?.[1]?.trim();
if (name !== "org-tools") fail("frontmatter name must be org-tools");
if (!description || description.length < 20) fail("frontmatter description must be discriminating");
if (/^\s*(?:metadata|allowed-tools|scripts?):/mu.test(frontmatter)) {
  fail("the public skill must remain instruction-only without executable declarations");
}
if (/[\u0400-\u04ff]/u.test(source)) fail("Cyrillic source text is not allowed");
if (/ot_mcp_[A-Za-z0-9_-]{16,}/u.test(source)) fail("credential-like token found");
if (/\b(?:TODO|TBD|FIXME)\b|<!--|<token>|example\.com/iu.test(source)) {
  fail("unfinished placeholder found");
}
for (const requiredInstruction of [
  "get_domain_guide",
  "preview_change",
  "apply_change",
  "preview_undo",
  "explicit approval",
]) {
  if (!source.includes(requiredInstruction))
    fail(`missing required instruction ${requiredInstruction}`);
}

console.log("Agent skill check passed (org-tools, instruction-only, no credentials).");
