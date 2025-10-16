// ============================================================
// 🧩 AI Podcast Suite — Fix Logger and Env Imports (Pino Edition)
// ============================================================
//
// 🚀 This script scans your repo and ensures all logger usage
// is unified under Pino (`log.info`, `log.error`, etc.).
//
// 🔧 Features:
// - Replaces legacy destructured imports ({ info, error }) with `import { log }`
// - Converts console.* calls to `log.*`
// - Converts any Winston, Bunyan, or old logger references to `log.*`
// - Skips node_modules and binary directories
// ============================================================

import fs from "fs";
import path from "path";

const ROOT_DIR = "/app";
const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", "__pycache__"];
const LOG_FILE = "/app/scripts/_logger-fix-report.txt";

const updatedFiles = [];
const changes = [];

// ------------------------------------------------------------
// 🧭 Recursive File Walker
// ------------------------------------------------------------
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(file)) continue;
      walk(fullPath);
    } else if (file.endsWith(".js") || file.endsWith(".mjs")) {
      fixFile(fullPath);
    }
  }
}

// ------------------------------------------------------------
// 🛠️ Apply Fixes to a File
// ------------------------------------------------------------
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // 1️⃣ — Replace logger imports (winston, old utils, etc.)
  content = content
    // Replace any old logger.js imports
    .replace(
      /import\s*\{[^}]*\}\s*from\s*["']#?\.?\/?shared\/logger\.js["'];?/g,
      `import { log } from "#shared/logger.js";`
    )
    .replace(
      /import\s*\{[^}]*\}\s*from\s*["']\.{0,2}\/utils\/logger\.js["'];?/g,
      `import { log } from "./logger.js";`
    )
    // Remove Winston imports entirely
    .replace(/import\s*.*winston.*;?/g, "")
    .replace(/require\(['"]winston['"]\)/g, "log");

  // 2️⃣ — Replace old logging function names
  content = content
    .replace(/\binfo\(/g, "log.info(")
    .replace(/\berror\(/g, "log.error(")
    .replace(/\bwarn\(/g, "log.warn(")
    .replace(/\bdebug\(/g, "log.debug(");

  // 3️⃣ — Replace console.* calls
  content = content
    .replace(/\bconsole\.log\(/g, "log.info(")
    .replace(/\bconsole\.error\(/g, "log.error(")
    .replace(/\bconsole\.warn\(/g, "log.warn(")
    .replace(/\bconsole\.debug\(/g, "log.debug(");

  // 4️⃣ — Replace Winston/Bunyan style calls
  content = content
    .replace(/\blogger\.info\(/g, "log.info(")
    .replace(/\blogger\.error\(/g, "log.error(")
    .replace(/\blogger\.warn\(/g, "log.warn(")
    .replace(/\blogger\.debug\(/g, "log.debug(")
    .replace(/\blog\.info\(/g, "log.info(")
    .replace(/\blog\.error\(/g, "log.error(")
    .replace(/\blog\.warn\(/g, "log.warn(")
    .replace(/\blog\.debug\(/g, "log.debug(");

  // 5️⃣ — Add import if file uses log.* but has no import
  if (content.match(/\blog\.(info|error|warn|debug)\(/) && !content.includes("logger.js")) {
    content = `import { log } from "#shared/logger.js";\n${content}`;
  }

  // ✅ Write back if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    updatedFiles.push(filePath);
  }
}

// ------------------------------------------------------------
// 🚀 Run Script
// ------------------------------------------------------------
console.log("🔧 Scanning project to modernize logger imports...");
walk(ROOT_DIR);

const report = [
  "=============================================",
  "🧩 LOGGER MIGRATION REPORT",
  "=============================================",
  `Updated files: ${updatedFiles.length}`,
  ...updatedFiles.map(f => `  - ${f}`),
].join("\n");

fs.writeFileSync(LOG_FILE, report, "utf8");

console.log(report);
console.log("✅ Pino logger migration complete.");
