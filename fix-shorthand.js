// sanitize-shorthand.js — Safe Sanitizer for Over-Expanded Objects (2025.10.11 Final)
import fs from "fs";
import path from "path";

const EXCLUDED_DIRS = ["node_modules", ".git", "dist", "build"];
let sanitizedCount = 0;

function shouldSkipDir(dir) {
  return EXCLUDED_DIRS.some(skip => dir.includes(skip));
}

function sanitizeFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // 🧽 Remove triple expansions like "{ key: key: key }"
    const before = content;
    content = content
      .replace(/\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\1\s*:\s*\1\s*\}/g, "{ $1: $1 }")
      .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\1/g, ": $1")
      .replace(/\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\1\s*\}/g, "{ $1: $1 }");

    if (content !== before) {
      fs.writeFileSync(filePath, content, "utf8");
      sanitizedCount++;
      console.log(`🧽 Sanitized ${filePath}`);
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
    else if (entry.endsWith(".js")) sanitizeFile(fullPath);
  }
}

walk("./");
console.log(`✅ Sanitization complete – ${sanitizedCount} files cleaned of double-colon patterns`);
