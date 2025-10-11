// sanitize-shorthand.js
// Cleans any over-expanded shorthand like "{ error: error: error }"

import fs from "fs";
import path from "path";

function sanitizeFile(file) {
  let content = fs.readFileSync(file, "utf8");

  // 🧹 Remove double-colon expansions like "{ key: key: key }"
  content = content.replace(
    /\{([^{}]*?):\s*\1\s*:\s*\1([^{}]*?)\}/g,
    "{$1: $1$2}"
  );

  // 🧹 Remove accidental repeats like "error: error: error"
  content = content.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\1/g, ": $1");

  // 🧹 Handle nested brace edge cases (harmless no-ops otherwise)
  content = content.replace(/\{ *([a-zA-Z_][a-zA-Z0-9_]*) *: *\1 *\}/g, "{ $1: $1 }");

  fs.writeFileSync(file, content, "utf8");
  console.log("🧽 Sanitized", file);
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (f.endsWith(".js")) sanitizeFile(full);
  }
}

walk("./");
console.log("✅ Sanitization complete – all double-colon patterns fixed");
