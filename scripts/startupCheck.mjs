// /scripts/startupCheck.mjs
// Runs repo-wide sanity checks, validates environment, and starts the server cleanly.

import { execSync } from "child_process";

const run = (cmd, label) => {
  try {
    console.log(`🔹 ${label}...`);
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ ${label} complete.`);
  } catch (err) {
    console.error(`❌ ${label} failed:`, err.message);
    process.exit(1);
  }
};

try {
  console.log("=============================================");
  console.log("🧠 AI Podcast Suite — Shiper Startup Routine");
  console.log("=============================================");

  // 1️⃣ Fix imports
  run("node ./scripts/fix-logger-and-env-imports.mjs", "Logger/env import codemod");

  // 2️⃣ Validate environment
  run("node -e \"import('./bootstrap/envBootstrap.js')\"", "Environment validation");

  // 3️⃣ Route import preflight
  run("node -e \"import('./server.js').then(()=>console.log('✅ Routes imported successfully')).catch(e=>{console.error('❌ Route import failed:',e);process.exit(1);})\"", "Route preload");

  // 4️⃣ Start server
  console.log("🌍 Starting main server...");
  run("node ./server.js", "Server startup");
} catch (e) {
  console.error("❌ Startup routine failed:", e.message);
  process.exit(1);
}
