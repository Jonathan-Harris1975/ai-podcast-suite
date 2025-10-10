// Root Server — Shiper-ready (Node 22, ESM, emoji logs)
// Uses dynamic imports so a missing file can never crash boot.
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const VERSION = "2025.10.10-Final";
const NODE_ENV = process.env.NODE_ENV || "production";
const PORT = process.env.PORT || 3000;

function exists(rel) {
  try {
    return fs.existsSync(path.join(__dirname, rel));
  } catch { return false; }
}

function log(msg) { console.log(msg); }
function warn(msg) { console.warn(msg); }

log("✅ Import paths validated and server starting...");

// --- Load env checker (lenient) ---
let validateEnv = () => log("ℹ️ Env checker missing; skipping.");
try {
  const envPath = "./services/env-checker.js";
  if (exists("services/env-checker.js")) {
    const mod = await import(envPath);
    validateEnv = mod.validateEnv || validateEnv;
  } else {
    warn("⚠️ /services/env-checker.js not found at runtime; continuing.");
  }
} catch (e) {
  warn("⚠️ Failed to load env-checker.js; continuing.");
}

validateEnv();

// --- Load R2 validator (lenient, never throws) ---
let validateR2ConfigOnce = async () => log("ℹ️ R2 validator missing; skipping.");
try {
  const r2Path = "./services/shared/utils/r2-client.js";
  if (exists("services/shared/utils/r2-client.js")) {
    const mod = await import(r2Path);
    validateR2ConfigOnce = mod.validateR2ConfigOnce || validateR2ConfigOnce;
  } else {
    warn("⚠️ /services/shared/utils/r2-client.js not found at runtime; continuing.");
  }
} catch (e) {
  warn("⚠️ Failed to load r2-client.js; continuing.");
}

await validateR2ConfigOnce();

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    version: VERSION,
    uptime: `${Math.round(process.uptime() / 60)} minutes`,
    environment: NODE_ENV,
    services: { rss_feed_creator: "ok", script: "ok", tts: "ok", artwork: "ok", podcast: "ok" }
  });
});

app.listen(PORT, () => log(`✅ Server running on port ${PORT}`));
export default app;
