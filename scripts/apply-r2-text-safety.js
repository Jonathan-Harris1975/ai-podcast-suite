// ============================================================
// 🧠 AI Podcast Suite — R2 Text Safety Patch (Safe Mode)
// ============================================================
//
// Automatically ensures all unsafe getObject() calls use
// getObjectAsText() — but *only if not already defined*.
// ============================================================

import fs from "fs";
import path from "path";
import { log } from "#shared/logger.js";

const projectRoot = "/app";
const patternImport = /getObject(?!AsText)/g;
const patternCall = /getObject\(/g;
const processed = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (
        fullPath.includes("node_modules") ||
        fullPath.includes(".git") ||
        fullPath.includes("tmp")
      )
        continue;
      walk(fullPath);
    } else if (file.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf-8");

      // Skip patch if getObjectAsText already defined
      if (/function\s+getObjectAsText/.test(content)) {
        continue;
      }

      if (patternImport.test(content) || patternCall.test(content)) {
        const updated = content
          .replace(patternImport, "getObjectAsText")
          .replace(patternCall, "getObjectAsText(");

        if (updated !== content) {
          fs.writeFileSync(fullPath, updated, "utf-8");
          processed.push(fullPath);
        }
      }
    }
  }
}

try {
  log.info("🧠 Applying R2 Text Safety Patch (Safe Mode)...");
  walk(projectRoot);
  if (processed.length > 0) {
    log.info("✅ R2 Text Safety Patch applied to:", processed);
  } else {
    log.info("✨ No updates required — safe definitions already exist.");
  }
} catch (err) {
  log.error("❌ Failed to apply R2 Text Safety Patch:", { error: err.message });
}
