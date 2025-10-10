// AI Podcast Suite Server – Shiper Optimized v2025.10.10-RSS-Auto
// Stable /health + JSON logging + auto-detect RSS Feed Creator location

import express from "express";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10-RSS-Auto";
const NODE_ENV = process.env.NODE_ENV || "production";

// ---- LOGGING (instant flush to stdout for Shiper) ----
function log(message, data = null) {
  const line =
    `[${new Date().toISOString()}] ${message}` +
    (data ? " " + JSON.stringify(data) : "");
  process.stdout.write(line + "\n");
}

// ---- UTILS ----
const exists = (p) => {
  try { return fs.existsSync(p); } catch { return false; }
};

// Candidate paths to try quickly (relative to server.js dir)
const QUICK_CANDIDATES = [
  "./services/rss-feed-creator/index.js",
  "./services/rss-feed-creator/index.mjs",
  "./services/rss-feed/index.js",
  "./services/rss-feed/index.mjs",
  "./services/rss/index.js",
  "./src/services/rss-feed-creator/index.js",
  "./src/services/rss-feed/index.js",
  "./src/rss-feed-creator/index.js",
  "./src/rss/index.js",
  "./apps/rss-feed-creator/index.js",
  "./packages/rss-feed-creator/index.js",
  // Common bare-specifier style (copied into node_modules/services)
  "services/rss-feed-creator/index.js",
  "services/rss-feed/index.js",
];

// Light recursive scan if quick candidates miss (avoids node_modules)
function findByScan(rootDir, nameHints = ["rss-feed-creator", "rss-feed", "rss"]) {
  const maxDepth = 5;
  const maxEntries = 5000;
  let visited = 0;

  function scan(dir, depth) {
    if (depth > maxDepth || visited > maxEntries) return null;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return null; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      visited++;
      if (e.isDirectory()) {
        // Prefer exact folder hits first
        if (nameHints.some(h => e.name === h || e.name.includes(h))) {
          const tryFiles = [
            path.join(full, "index.js"),
            path.join(full, "index.mjs"),
          ];
          for (const f of tryFiles) if (exists(f)) return f;
        }
        const found = scan(full, depth + 1);
        if (found) return found;
      } else if (e.isFile()) {
        // direct file hit (rare)
        if (/rss.*feed.*\.m?js$/i.test(e.name)) return full;
      }
      if (visited > maxEntries) break;
    }
    return null;
  }

  return scan(rootDir, 0);
}

async function importIfExists(candidate) {
  // Support bare specifiers OR relative paths
  if (!candidate.startsWith(".") && !candidate.startsWith("/")) {
    try { return await import(candidate); } catch { return null; }
  }
  const abs = path.resolve(__dirname, candidate);
  if (!exists(abs)) return null;
  try { return await import(pathToFileURL(abs).href); } catch { return null; }
}

async function startRssFeedCreatorAuto() {
  log("🧩 Attempting to initialize RSS Feed Creator...");

  // 1) quick candidates
  for (const rel of QUICK_CANDIDATES) {
    const mod = await importIfExists(rel);
    if (mod) {
      await startFromModule(mod, rel);
      return;
    }
  }

  // 2) fallback: scan project
  const found = findByScan(path.resolve(__dirname));
  if (found) {
    const mod = await import(pathToFileURL(found).href).catch(() => null);
    if (mod) {
      await startFromModule(mod, path.relative(__dirname, found));
      return;
    }
  }

  log("⚠️ RSS Feed Creator module not found in any expected paths.");
}

async function startFromModule(mod, where) {
  try {
    if (typeof mod.default === "function") {
      await mod.default();
      log("📰 RSS Feed Creator initialized successfully (default).", { from: where });
    } else if (typeof mod.startFeedCreator === "function") {
      await mod.startFeedCreator();
      log("📰 RSS Feed Creator started successfully (named).", { from: where });
    } else {
      log("⚠️ RSS Feed Creator loaded but no start function was found.", { from: where });
    }
  } catch (e) {
    log("❌ RSS Feed Creator failed during startup.", { from: where, error: e.message });
  }
}

// ---- HEALTH ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit!");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV
  });
});

// ---- REWRITE ----
app.post("/api/rewrite", (req, res) => {
  log("✏️ Rewrite endpoint hit!");
  const text = req.body?.text || "";
  const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  res.json({ success: true, rewritten });
});

// ---- PODCAST ----
app.post("/api/podcast", (req, res) => {
  const script = req.body?.script || "";
  const voice = req.body?.voice || "default";
  log("🎙️ Podcast endpoint hit!", { chars: script.length, voice });
  res.json({
    success: true,
    message: "Podcast request received",
    chars: script.length,
    voice
  });
});

// ---- START ----
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await startRssFeedCreatorAuto();
});

// ---- HEARTBEAT LOG (every 5 min) ----
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 5 * 60 * 1000);

// ---- CLEAN EXIT ----
process.on("SIGTERM", () => { log("🛑 SIGTERM – exiting"); process.exit(0); });
process.on("SIGINT",  () => { log("🛑 SIGINT – exiting");  process.exit(0); });
