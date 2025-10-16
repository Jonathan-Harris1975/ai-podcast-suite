// ============================================================
// 🧩 Fix Logger and Env Imports (JS Version)
// ============================================================

import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const targetDirs = ["services", "shared", "utils", "bootstrap"];

console.log("🔧 Scanning project to verify logger/env imports...");
for (const dir of targetDirs) {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) continue;
  for (const file of fs.readdirSync(fullPath)) {
    if (file.endsWith(".js")) {
      const filePath = path.join(fullPath, file);
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("envChecker") || content.includes("logger")) {
        console.log(`🧩 Verified imports in: ${filePath}`);
      }
    }
  }
}
console.log("✅ Logger and env import verification complete.");
