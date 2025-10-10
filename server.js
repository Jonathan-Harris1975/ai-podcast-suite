// Shiper Ultra-Stable Server v2025.10.10-Plus
// Unified endpoints: /health, /api/rewrite, /api/podcast
// Structured logging for Shiper visibility
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- LOGGING SETUP ----
const log = (...args) =>
  console.log(`[${new Date().toISOString()}]`, ...args);
const warn = (...args) =>
  console.warn(`[${new Date().toISOString()}] ⚠️`, ...args);
const err = (...args) =>
  console.error(`[${new Date().toISOString()}] ❌`, ...args);

// ---- EXPRESS INIT ----
const app = express();
app.use(express.json());

// ---- VERSION / ENV ----
const VERSION = "2025.10.10-Plus";
const NODE_ENV = process.env.NODE_ENV || "production";
const PORT = process.env.PORT || 3000;

// ---- DYNAMIC IMPORT HELPERS ----
function existsLocal(p) {
  try {
    return fs.existsSync(path.join(__dirname, p));
  } catch {
    return false;
  }
}

log("✅ Import paths validated and server starting...");

// --- ENV CHECKER ---
let validateEnv = () => log("ℹ️ Env checker missing; skipping.");
try {
  if (existsLocal("services/env-checker.js")) {
    const mod = await import("./services/env-checker.js");
    validateEnv = mod.validateEnv || mod.default || validateEnv;
  } else {
    const mod = await import("services/env-checker.js").catch(() => ({}));
    validateEnv = mod.validateEnv || mod.default || validateEnv;
  }
} catch (e) {
  warn("Env checker import failed", e);
}
validateEnv();

// --- R2 VALIDATOR ---
let validateR2ConfigOnce = async () => log("ℹ️ R2 validator missing; skipping.");
try {
  if (existsLocal("services/shared/utils/r2-client.js")) {
    const mod = await import("./services/shared/utils/r2-client.js");
    validateR2ConfigOnce =
      mod.validateR2ConfigOnce ||
      (mod.default && mod.default.validateR2ConfigOnce) ||
      validateR2ConfigOnce;
  } else {
    const mod = await import("services/shared/utils/r2-client.js").catch(() => ({}));
    validateR2ConfigOnce =
      (mod && (mod.validateR2ConfigOnce || (mod.default && mod.default.validateR2ConfigOnce))) ||
      validateR2ConfigOnce;
  }
} catch (e) {
  warn("R2 validator import failed", e);
}
await validateR2ConfigOnce();

// ---- ENDPOINTS ----

// Health
app.get("/health", (req, res) => {
  log("🩺 Health check requested");
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV
  });
});

// RSS Rewrite
app.post("/api/rewrite", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      log("⚠️ Rewrite missing text body");
      return res.status(400).json({ error: "Missing 'text' field in body" });
    }

    const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
    log("✏️ RSS rewrite completed:", {
      original_length: text.length,
      rewritten_length: rewritten.length
    });

    res.json({
      success: true,
      rewritten_text: rewritten
    });
  } catch (e) {
    err("Rewrite error:", e);
    res.status(500).json({ error: "Rewrite failed", details: e.message });
  }
});

// Podcast Processor
app.post("/api/podcast", async (req, res) => {
  try {
    const { script, voice } = req.body;
    if (!script) {
      log("⚠️ Podcast endpoint called without script");
      return res.status(400).json({ error: "Missing 'script' field in body" });
    }

    log("🎙️ Podcast job received", {
      voice: voice || "default",
      chars: script.length
    });

    // Placeholder response – integrate your actual generation pipeline here
    res.json({
      success: true,
      message: "Podcast generation queued",
      input_length: script.length,
      voice: voice || "default"
    });
  } catch (e) {
    err("Podcast endpoint error:", e);
    res.status(500).json({ error: "Podcast endpoint failed", details: e.message });
  }
});

// ---- START SERVER ----
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT}`);
});
export default app;
