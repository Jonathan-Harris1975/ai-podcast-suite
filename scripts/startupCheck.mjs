// /scripts/startupCheck.mjs
import { execSync } from "child_process";
import fs from "fs";
import os from "os";

const run = (cmd, label) => {
  try {
    console.log(`🔹 ${label}...`);
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ ${label} complete.`);
  } catch (err) {
    console.error(`❌ ${label} failed:`);
    console.error(err.message || err);
    process.exit(1);
  }
};

try {
  console.log("=============================================");
  console.log("🧠 AI Podcast Suite — Shiper Startup Routine");
  console.log("=============================================");

  // 🧩 Basic diagnostics
  console.log(`🧩 Node.js version: ${process.version}`);
  console.log(`📦 Module type: ${process.env.npm_package_type || "unknown"}`);
  console.log(`📂 Working directory: ${process.cwd()}`);
  console.log(`💾 Total memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`💾 Free memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`🧭 CPU cores: ${os.cpus()?.length}`);
  console.log("=============================================");

  // Check critical directories
  const requiredDirs = ["./utils", "./bootstrap", "./services"];
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`✅ Found ${dir}`);
    } else {
      console.error(`❌ Missing required directory: ${dir}`);
      process.exit(1);
    }
  }

  // 1️⃣ Fix imports
  run("node ./scripts/fix-logger-and-env-imports.mjs", "Logger/env import codemod");

  // 2️⃣ Validate environment
  run("node -e \"import('./bootstrap/envBootstrap.js')\"", "Environment validation");

  // 3️⃣ Route import preflight
  console.log("🧩 Checking route imports...");
  run("node -e \"import('./server.js').then(()=>console.log('✅ Routes imported successfully')).catch(e=>{console.error('❌ Route import failed:',e);process.exit(1);})\"", "Route preload");

  // 4️⃣ Start server
  console.log("🌍 Starting main server...");
  run("node ./server.js", "Server startup");

} catch (e) {
  console.error("❌ Startup routine failed:");
  console.error(e.message || e);
  process.exit(1);
}
