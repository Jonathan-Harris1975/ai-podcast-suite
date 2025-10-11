// fix-shorthand.js — Debug mode
import fs from "fs";
import path from "path";

let shorthandCount = 0;
let skipCount = 0;

function walkAndFix(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkAndFix(full);
    else if (entry.endsWith(".js")) {
      let content = fs.readFileSync(full, "utf-8");
      if (content.includes("`")) {
        skipCount++;
        continue; // skip template literal files
      }

      const matches = [...content.matchAll(/\{ *([a-zA-Z_][a-zA-Z0-9_]*) *\}/g)];
      if (matches.length > 0) {
        shorthandCount += matches.length;
        console.log("⚠️  Found shorthand in:", full, "→", matches.map(m => m[1]).join(", "));
      }

      const replaced = content.replace(
        /\{ *([a-zA-Z_][a-zA-Z0-9_]*) *\}/g,
        "{ $1: $1 }"
      );

      if (replaced !== content) fs.writeFileSync(full, replaced, "utf-8");
    }
  }
}

walkAndFix("./");
console.log(`✅ Expanded ${shorthandCount} shorthand entries (skipped ${skipCount} files with template literals)`);
