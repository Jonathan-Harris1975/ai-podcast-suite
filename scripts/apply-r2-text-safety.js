// ============================================================
// 🧠 AI Podcast Suite — R2 Text Safety Patch (Auto Bootstrap)
// ============================================================
//
// Converts all unsafe `getObject()` calls to `getObjectAsText()`
// to prevent Buffer/JSON parse issues in textual workflows.
//
// Runs automatically via bootstrap.js at container startup.
//
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
  log.info("🧠 Applying R2 Text Safety Patch...");
  walk(projectRoot);
  if (processed.length > 0) {
    log.info("✅ R2 Text Safety Patch applied to:", processed);
  } else {
    log.info("✨ No unsafe getObject() usages found — all safe!");
  }
} catch (err) {
  log.error("❌ Failed to apply R2 Text Safety Patch:", { error: err.message });
}
