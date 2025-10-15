// /scripts/fix-logger-and-env-imports.mjs
// Usage: node ./scripts/fix-logger-and-env-imports.mjs
// Recursively rewrites logger/envChecker imports and logger call sites across the repo.
// No external deps required.

import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const exts = new Set([".js", ".mjs", ".ts"]);
const ignoreDirs = new Set(["node_modules", ".git", "dist", "build", ".next", ".vercel", "coverage"]);

let filesTouched = 0;
let replacements = 0;

function walk(dir, out=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.has(ext)) out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function fixImportsAndCalls(code, filePath) {
  let updated = code;

  // 1) Normalize any import source that points to shared/utils/logger.js or shared/utils/envChecker.js
  //    Preserve leading ../ segments by only replacing the tail path.
  updated = updated.replace(/(['"])((?:\.\.\/)+)?shared\/utils\/logger\.js\1/g, (m, q, prefix) => {
    return `${q}${prefix || ""}utils/logger.js${q}`;
  });
  updated = updated.replace(/(['"])((?:\.\.\/)+)?shared\/utils\/envChecker\.js\1/g, (m, q, prefix) => {
    return `${q}${prefix || ""}utils/envChecker.js${q}`;
  });

  // 2) If file imports logger with named bindings, convert to { log }.
  //    Examples:
  //      import { info, error } from "../utils/logger.js"
  //      import { info, warn, debug, error } from "../../utils/logger.js"
  updated = updated.replace(
    /import\s*\{[^}]*\b(?:info|error|warn|debug)\b[^}]*\}\s*from\s*(['"][^'"]*utils\/logger\.js['"]);?/g,
    (m, src) => `import { log } from ${src};`
  );

  // 3) If file uses default import for logger, keep it but we'll also normalize call sites later.
  //    (No change here; just handle call sites below.)

  // 4) Replace call sites: info( → log.info(, error( → log.error(, warn( → log.warn(, debug( → log.debug(
  //    Avoid replacing things like object.info by requiring no dot before the name.
  const callPatterns = [
    { from: /(?<![\w.])info\s*\(/g, to: "log.info(" },
    { from: /(?<![\w.])error\s*\(/g, to: "log.error(" },
    { from: /(?<![\w.])warn\s*\(/g, to: "log.warn(" },
    { from: /(?<![\w.])debug\s*\(/g, to: "log.debug(" },
  ];
  for (const { from, to } of callPatterns) {
    updated = updated.replace(from, to);
  }

  // 5) Normalize any logger default import usage: logger.info( → log.info(
  updated = updated.replace(/(?<![\w.])logger\.info\s*\(/g, "log.info(");
  updated = updated.replace(/(?<![\w.])logger\.error\s*\(/g, "log.error(");
  updated = updated.replace(/(?<![\w.])logger\.warn\s*\(/g, "log.warn(");
  updated = updated.replace(/(?<![\w.])logger\.debug\s*\(/g, "log.debug(");

  // 6) Ensure there is an import { log } from ".../utils/logger.js" if we used log.*
  if (/log\.(info|error|warn|debug)\s*\(/.test(updated) && !/from\s+['"][^'"]*utils\/logger\.js['"]/.test(updated)) {
    // Try to detect an existing logger import source (any path depth to utils/logger.js)
    const anyImportMatch = updated.match(/from\s+(['"][^'"]*utils\/logger\.js['"])/);
    const importSource = anyImportMatch ? anyImportMatch[1] : "'../utils/logger.js'";

    // Insert at top after any "use strict" or first import.
    const insertion = `import { log } from ${importSource};\n`;
    if (/^['"]use strict['"];/.test(updated)) {
      updated = updated.replace(/^(['"]use strict['"];\s*)/, `$1${insertion}`);
    } else {
      updated = insertion + updated;
    }
  }

  // 7) Normalize envChecker path if it still points to shared.
  updated = updated.replace(/(['"][^'"]*)shared\/utils\/envChecker\.js(['"])/g, "$1utils/envChecker.js$2");

  return updated;
}

const files = walk(repoRoot);
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const next = fixImportsAndCalls(src, file);
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    filesTouched++;
    replacements++;
  }
}

console.log("ℹ️ INFO:", `Files touched: ${filesTouched}, replacements applied: ${replacements}`);
console.log("✅ Done. All logger/envChecker imports and logger calls normalized.");
