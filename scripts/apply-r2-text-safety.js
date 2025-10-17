// ============================================================
// 🧠 AI Podcast Suite — Safe Bootstrap + RSS Feed Rotation
// ============================================================
//
// 1) Safely rewrites only raw getObject() calls → getObjectAsText()
//    • Does NOT touch import statements
//    • Skips files that already reference getObjectAsText
// 2) Reads feeds.txt + urls.txt
//    • Rotates 5 feeds + 1 URL per batch
//    • Writes utils/active-feeds.json for build-rss.js
//    • Persists utils/feed-state.json for next cycle
// ============================================================

import fs from "fs";
import path from "path";
import { log } from "#shared/logger.js";

const projectRoot = "/app";
const dataDir = path.join(projectRoot, "services/rss-feed-creator/data");
const utilsDir = path.join(projectRoot, "services/rss-feed-creator/utils");
const stateFile = path.join(utilsDir, "feed-state.json");
const activeFile = path.join(utilsDir, "active-feeds.json");

// ------------------------------------------------------------
// Step 1: Apply Safe R2 Patch
// ------------------------------------------------------------
function applySafeR2Patch() {
  // Replace only *function calls* "getObject(" with "getObjectAsText("
  // The leading capture avoids matching identifiers like mygetObject(
  const patternCall = /(^|[^a-zA-Z0-9_])getObject\(/g;
  const processed = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          fullPath.includes("node_modules") ||
          fullPath.includes(".git") ||
          fullPath.includes("tmp")
        ) {
          continue;
        }
        walk(fullPath);
        continue;
      }

      if (!entry.endsWith(".js")) continue;

      const content = fs.readFileSync(fullPath, "utf-8");

      // If the file already references getObjectAsText anywhere, skip.
      if (content.includes("getObjectAsText")) continue;

      // Never touch import lines.
      const updated = content
        .split("\n")
        .map((line) => (line.trim().startsWith("import") ? line : line.replace(patternCall, "$1getObjectAsText(")))
        .join("\n");

      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, "utf-8");
        processed.push(fullPath);
      }
    }
  }

  try {
    log.info("🧠 Applying R2 Text Safety Patch (Safe Mode)...");
    walk(projectRoot);
    if (processed.length > 0) {
      log.info("✅ R2 Text Safety Patch applied to:", { files: processed.length });
    } else {
      log.info("✨ No updates required — safe definitions already exist.");
    }
  } catch (err) {
    log.error("❌ Failed to apply R2 Text Safety Patch", { error: err.message });
  }
}

// ------------------------------------------------------------
// Step 2: Feed Rotation Logic (5 feeds + 1 URL)
// ------------------------------------------------------------
function rotateFeeds() {
  try {
    const feedsPath = path.join(dataDir, "feeds.txt");
    const urlsPath = path.join(dataDir, "urls.txt");

    if (!fs.existsSync(feedsPath) || !fs.existsSync(urlsPath)) {
      log.error("❌ Missing feeds.txt or urls.txt in data directory", { feedsPath, urlsPath });
      return;
    }

    const feeds = fs
      .readFileSync(feedsPath, "utf-8")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

    const urls = fs
      .readFileSync(urlsPath, "utf-8")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

    const batchSize = 5;
    let state = { index: 0 };

    if (fs.existsSync(stateFile)) {
      try {
        state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
      } catch {
        state = { index: 0 };
      }
    }

    const start = state.index;
    const end = Math.min(start + batchSize, feeds.length);
    const currentFeeds = feeds.slice(start, end);

    // If we wrapped, still pick a valid URL by batch group
    const batchNumber = Math.floor(start / batchSize);
    const currentUrl = urls[urls.length > 0 ? batchNumber % urls.length : 0] || "";

    const nextIndex = end >= feeds.length ? 0 : end;

    const activeData = {
      feeds: currentFeeds,
      url: currentUrl,
      batchStart: start,
      batchEnd: end,
      totalFeeds: feeds.length,
      totalUrls: urls.length,
      generatedAt: new Date().toISOString(),
    };

    fs.mkdirSync(utilsDir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify({ index: nextIndex }, null, 2));
    fs.writeFileSync(activeFile, JSON.stringify(activeData, null, 2));

    log.info("🔁 RSS Feed Rotation Complete", {
      feedsUsed: currentFeeds.length,
      nextIndex,
      currentUrl,
    });
  } catch (err) {
    log.error("❌ RSS Feed Rotation failed", { error: err.message });
  }
}

// ------------------------------------------------------------
// Execute
// ------------------------------------------------------------
try {
  applySafeR2Patch();
  rotateFeeds();
} catch (err) {
  log.error("❌ Failed during bootstrap sequence", { error: err.message });
}
