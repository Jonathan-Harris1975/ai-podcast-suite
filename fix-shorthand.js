// fix-shorthand.js — Safe Shorthand Expander (2025.10.11 Final)
import fs from "fs";
import path from "path";

const EXCLUDED_DIRS = ["node_modules", ".git", "dist", "build"];
let expandedCount = 0;
let skippedCount = 0;

function shouldSkipDir(dir) {
  return EXCLUDED_DIRS.some(skip => dir.includes(skip));
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Skip files with template literals (to avoid breaking `${}` expressions)
    if (content.includes("`")) {
      skippedCount++;
      return;
    }

    const shorthandRegex = /\{ *([a-zA-Z_][a-zA-Z0-9_]*) *\}/g;
    const matches = [...content.matchAll(shorthandRegex)];

    if (matches.length > 0) {
      expandedCount += matches.length;
      const newContent = content.replace(shorthandRegex, "{ $1: $1 }");

      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`🛠️  Fixed shorthand in: ${filePath} → ${matches.map(m => m[1]).join(", ")}`);
    }
  } catch (err) {
    console.warn(`⚠️  Skipped ${filePath}: ${err.message}`);
  }
}

function walk(dir) {
  if (shouldSkipDir(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) walk(fullPath);
    else if (entry.endsWith(".js")) fixFile(fullPath);
  }
}

walk("./");
console.log(`✅ Expanded ${expandedCount} shorthand entries (skipped ${skippedCount} files with template literals)`);
