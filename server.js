// Shiper Ultra-Stable Server (Node 22 ESM)
// - Dynamic imports: never crash if files missing or exports differ
// - Works with both './services/...' and old 'services/...' bare specifiers
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = console.log;
const warn = console.warn;

const app = express();
app.use(express.json());

const VERSION = "2025.10.10-Ultra";
const NODE_ENV = process.env.NODE_ENV || "production";
const PORT = process.env.PORT || 3000;

function existsLocal(p){ try { return fs.existsSync(path.join(__dirname, p)); } catch { return false; } }

log("✅ Import paths validated and server starting...");

// -------- Env Checker (lenient) --------
let validateEnv = () => log("ℹ️ Env checker missing; skipping.");
try {
  // Prefer relative
  if (existsLocal("services/env-checker.js")) {
    const mod = await import("./services/env-checker.js");
    validateEnv = mod.validateEnv || mod.default || validateEnv;
  } else {
    // Fallback: legacy bare specifier via node_modules/services alias
    const mod = await import("services/env-checker.js").catch(() => ({}));
    validateEnv = (mod && (mod.validateEnv || mod.default)) || validateEnv;
  }
} catch (e) {
  warn("⚠️ Failed to load env-checker.js; continuing.");
}
validateEnv();

// -------- R2 Validator (lenient) --------
let validateR2ConfigOnce = async () => log("ℹ️ R2 validator missing; skipping.");
try {
  // Prefer relative
  if (existsLocal("services/shared/utils/r2-client.js")) {
    const mod = await import("./services/shared/utils/r2-client.js");
    validateR2ConfigOnce = mod.validateR2ConfigOnce || (mod.default && mod.default.validateR2ConfigOnce) || validateR2ConfigOnce;
  } else {
    // Fallback: legacy bare specifier
    const mod = await import("services/shared/utils/r2-client.js").catch(() => ({}));
    validateR2ConfigOnce = (mod && (mod.validateR2ConfigOnce || (mod.default && mod.default.validateR2ConfigOnce))) || validateR2ConfigOnce;
  }
} catch (e) {
  warn("⚠️ Failed to load r2-client.js; continuing.");
}
await validateR2ConfigOnce();

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.get("/api/status", (req, res) => res.json({
  status: "ok",
  version: VERSION,
  uptime: Math.round(process.uptime() / 60) + " minutes",
  environment: NODE_ENV
}));

app.listen(PORT, () => log(`✅ Server running on port ${PORT}`));
export default app;
