// ============================================================
// 🧩 Fix Logger and Env Imports — Pino Edition
// ============================================================

import fs from "fs";
import path from "path";

const rootDir = "/app";
const targetFiles = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (file.endsWith(".js")) {
      targetFiles.push(full);
    }
  }
}

// Find JS files
walk(rootDir);

for (const file of targetFiles) {
  let content = fs.readFileSync(file, "utf8");

  // Replace any old logger import destructures
  if (content.includes("logger.js")) {
    const before = content;

    content = content
      .replace(
        /import\s*\{[^}]*\}\s*from\s*["']#?\.?\/?shared\/logger\.js["'];?/g,
        `import { log } from "#shared/logger.js";`
      )
      .replace(
        /import\s*\{[^}]*\}\s*from\s*["']\.{0,2}\/utils\/logger\.js["'];?/g,
        `import { log } from "./logger.js";`
      )
      .replace(/\binfo\(/g, "log.info(")
      .replace(/\berror\(/g, "log.error(")
      .replace(/\bwarn\(/g, "log.warn(")
      .replace(/\bdebug\(/g, "log.debug(");

    if (content !== before) {
      fs.writeFileSync(file, content, "utf8");
      console.log(`🧩 Updated logger imports in: ${file}`);
    }
  }
}

console.log("✅ Logger import and call updates complete.");
