#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const reports = path.join(root, "reports", "sources");

const skip = new Set(["tests", "generic", "utils", "_themes", "common", "migration"]);
const sources = fs.readdirSync(src).filter((name) => {
  if (skip.has(name) || name.startsWith(".")) return false;
  const folder = path.join(src, name);
  return (
    fs.statSync(folder).isDirectory() &&
    fs.existsSync(path.join(folder, "pbconfig.ts")) &&
    fs.existsSync(path.join(folder, "main.ts"))
  );
});

const ids = new Map();
const duplicates = [];
const missingStatic = [];
const missingIcon = [];

for (const id of sources) {
  if (ids.has(id)) duplicates.push(id);
  ids.set(id, true);
  const staticDir = path.join(src, id, "static");
  if (!fs.existsSync(staticDir)) missingStatic.push(id);
  else if (!fs.existsSync(path.join(staticDir, "icon.png"))) missingIcon.push(id);
}

const result = {
  sourceCount: sources.length,
  uniqueIds: ids.size,
  duplicates,
  missingStatic,
  missingIcon,
  ok: duplicates.length === 0,
};

fs.mkdirSync(reports, { recursive: true });
fs.writeFileSync(path.join(reports, "validation.json"), JSON.stringify(result, null, 2) + "\n");

if (duplicates.length) {
  console.error("duplicate source ids:", duplicates.join(", "));
  process.exit(1);
}

console.log(`validated ${sources.length} unique source ids`);
if (missingStatic.length) {
  console.warn(`missing static/: ${missingStatic.length}`);
}
if (missingIcon.length) {
  console.warn(`missing icon.png: ${missingIcon.length}`);
}
