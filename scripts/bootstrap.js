// ============================================================
// 🧠 AI Podcast Suite — Bootstrap Runner (Fixed)
// ============================================================
// Runs environment, logger, R2, and server checks sequentially.
// ============================================================

import { execSync } from "child_process";

function run(command, label) {
  console.log(`🚀 Running ${label}...`);
  execSync(command, { stdio: "inherit" });
}

console.log("🧩 Starting AI Podcast Suite bootstrap sequence...");
console.log("---------------------------------------------");

run("node ./scripts/fix-logger-and-env-imports.js", "Fix Logger and Env Imports");
run("node ./scripts/startupCheck.js", "Startup Check");
run("node ./scripts/tempStorage.js", "R2 Check");
run("node server.js", "Start Server");

console.log("---------------------------------------------");
console.log("💤 Bootstrap complete — container entering idle mode.");
