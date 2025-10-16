// /scripts/startupCheck.mjs
console.log("🚀 StartupCheck.js is executing inside Shiper container!");
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import process from "process";

function step(label, fn) {
  console.log(`\n🔹 [STEP] ${label}`);
  const start = Date.now();
  try {
    fn();
    console.log(`✅ [DONE] ${label} (${Date.now() - start} ms)`);
  } catch (err) {
    console.error(`❌ [FAIL] ${label} (${Date.now() - start} ms)`);
    console.error(err.stack || err.message);
    process.exit(1);
  }
}

console.log("=============================================");
console.log("🧠 AI Podcast Suite — Shiper Deep Diagnostic Startup");
console.log("=============================================");
console.log(`🧩 Node.js version: ${process.version}`);
console.log(`📦 Module type: ${process.env.npm_package_type || "unknown"}`);
console.log(`📂 CWD: ${process.cwd()}`);
console.log(`💾 Mem total/free: ${(os.totalmem()/1e9).toFixed(2)} GB / ${(os.freemem()/1e9).toFixed(2)} GB`);
console.log(`🧭 CPU cores: ${os.cpus()?.length}`);
console.log("=============================================");

step("Checking critical directories", () => {
  for (const d of ["./utils", "./bootstrap", "./services"]) {
    if (!fs.existsSync(d)) throw new Error(`Missing directory: ${d}`);
  }
});

step("Running codemod", () => {
  const res = spawnSync("node", ["./scripts/fix-logger-and-env-imports.js"], { stdio: "inherit" });
  if (res.status !== 0) throw new Error("Codemod failed");
});

step("Environment validation", () => {
  const res = spawnSync("node", ["-e", "import('./bootstrap/envBootstrap.js')"], { stdio: "inherit" });
  if (res.status !== 0) throw new Error("envBootstrap failed");
});

step("Preloading routes", () => {
  const res = spawnSync("node", ["-e",
    "import('./server.js').then(()=>console.log('✅ Routes imported OK')).catch(e=>{console.error('❌ Route import failed:',e);process.exit(1);})"
  ], { stdio: "inherit" });
  if (res.status !== 0) throw new Error("Route preload failed");
});

step("Launching server.js", () => {
  console.log("🌍 Starting main server with verbose logging...");
  const res = spawnSync("node", ["--trace-uncaught", "--trace-warnings", "./server.js"], { stdio: "inherit" });
  if (res.status !== 0) throw new Error(`Server exited with code ${res.status}`);
});

console.log("✅ All startup checks complete.");
