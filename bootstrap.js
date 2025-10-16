// ============================================================
// 🧠 AI Podcast Suite — Bootstrap Startup Runner
// ============================================================

import { execSync } from "child_process";

const run = (cmd, label) => {
  try {
    console.log(`🚀 Running ${label}...`);
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ ${label} completed successfully.`);
  } catch (err) {
    console.error(`❌ ${label} failed:\n`, err);
  }
};

console.log("🧩 Starting AI Podcast Suite bootstrap sequence...");
console.log("---------------------------------------------");

run("node ./scripts/fix-logger-and-env-imports.js", "Fix Logger and Env Imports");
run("node ./scripts/startupCheck.js", "Startup Check");

console.log("---------------------------------------------");
console.log("💤 Bootstrap complete — container entering idle mode.");
setInterval(() => {}, 10_000); // keep container alive for Shiper logs
