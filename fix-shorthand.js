// fix-shorthand.js — Expands { error } → { error: error } across all JS files
import fs from "fs";
import path from "path";

function walkAndFix(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkAndFix(full);
    else if (entry.endsWith(".js")) {
      let content = fs.readFileSync(full, "utf-8");
      const replaced = content.replace(
        /\{ *([a-zA-Z_][a-zA-Z0-9_]*) *\}/g,
        "{ $1: $1 }"
      );
      if (replaced !== content) {
        fs.writeFileSync(full, replaced, "utf-8");
        console.log("🛠️  Fixed shorthand in", full);
      }
    }
  }
}

walkAndFix("./");
console.log("✅ All shorthand object literals expanded");
