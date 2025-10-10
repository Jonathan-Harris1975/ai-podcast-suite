#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();
const issues = [];
const reStatic = /import\s+[^'"]*['"]([^'"]+)['"]/g;
const reDynamic = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function isProblem(spec) {
  if (spec.startsWith("services/")) return true;
  if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("@")) return false;
  return true;
}

function scan(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      scan(p);
      continue;
    }
    if (!p.endsWith(".js")) continue;
    const txt = fs.readFileSync(p, "utf8");
    for (const m of txt.matchAll(reStatic)) if (isProblem(m[1])) issues.push({ file: p, spec: m[1] });
    for (const m of txt.matchAll(reDynamic)) if (isProblem(m[1])) issues.push({ file: p, spec: m[1] });
  }
}

scan(root);

if (issues.length) {
  console.warn("⚠️  Import validator warnings:");
  for (const i of issues) console.warn(`  - ${i.file}: '${i.spec}'`);
  console.warn("ℹ️  Tip: use './services/...' for local folders.\n");
} else {
  console.log("✅ Import paths validated (lenient).");
}
process.exit(0);
