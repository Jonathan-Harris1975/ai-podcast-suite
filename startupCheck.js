// ============================================================
// 🧠 AI Podcast Suite — Startup Check (Bootstrap Version)
// ============================================================

import fs from "fs";
import path from "path";
import process from "process";

console.log("🚀 startupCheck.js reached — container runtime confirmed!");
console.log("---------------------------------------------");
console.log(`📂 Working directory: ${process.cwd()}`);
console.log(`📦 Node version: ${process.version}`);

const moduleType = process.env.npm_package_type || "module (from package.json)";
console.log(`📦 Module type: ${moduleType}`);

console.log("---------------------------------------------");
console.log("✅ Environment check completed successfully.");
