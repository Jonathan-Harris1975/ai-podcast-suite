// ============================================================
// 🧠 AI Podcast Suite — Safe Bootstrap + RSS Feed Rotation
// ============================================================
//
// 1️⃣ Ensures all unsafe getObject() calls use getObjectAsText()
// 2️⃣ Reads feeds.txt + urls.txt, rotates batches of 5 feeds + 1 URL
// 3️⃣ Writes active-feeds.json for build-rss.js
// 4️⃣ Keeps state in feed-state.json
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
// 🧠 Step 1: Apply Safe R2 Patch
// ------------------------------------------------------------
function applySafeR2Patch() {
  const patternImport = /getObject(?!AsText)/g;
  const patternCall = /getObject\(/g;
  const processed = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (
          fullPath.includes("node_modules") ||
          fullPath.includes(".git") ||
          fullPath.includes("tmp")
        )
          continue;
        walk(fullPath);
      } else if (file.endsWith(".js")) {
        let content = fs.readFileSync(fullPath, "utf-8");
        if (/function\s+getObjectAsText/.test(content)) continue;

        if (patternImport.test(content) || patternCall.test(content)) {
          const updated = content
            .replace(patternImport, "getObjectAsText")
            .replace(patternCall, "getObjectAsText(");

          if (updated !== content) {
            fs.writeFileSync(fullPath, updated, "utf-8");
            processed.push(fullPath);
          }
        }
      }
    }
  }

  try {
    log.info("🧠 Applying R2 Text Safety Patch (Safe Mode)...");
    walk(projectRoot);
    if (processed.length > 0)
      log.info("✅ R2 Text Safety Patch applied to:", processed);
    else log.info("✨ No updates required — safe definitions already exist.");
  } catch (err) {
    log.error("❌ Failed to apply R2 Text Safety Patch", { error: err.message });
  }
}

// ------------------------------------------------------------
// 🌀 Step 2: Feed Rotation Logic
// ------------------------------------------------------------
function rotateFeeds() {
  try {
    const feedsPath = path.join(dataDir, "feeds.txt");
    const urlsPath = path.join(dataDir, "urls.txt");

    if (!fs.existsSync(feedsPath) || !fs.existsSync(urlsPath)) {
      log.error("❌ Missing feeds.txt or urls.txt in data directory");
      return;
    }

    const feeds = fs
      .readFileSync(feedsPath, "utf-8")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const urls = fs
      .readFileSync(urlsPath, "utf-8")
      .split("\n")
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
    const end = start + batchSize;
    const currentFeeds = feeds.slice(start, end);
    const currentUrl = urls[Math.floor(start / batchSize) % urls.length];

    const nextIndex = end >= feeds.length ? 0 : end;

    const activeData = {
      feeds: currentFeeds,
      url: currentUrl,
      batchStart: start,
      batchEnd: end,
      totalFeeds: feeds.length,
    };

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
// 🚀 Execute Both
// ------------------------------------------------------------
try {
  applySafeR2Patch();
  rotateFeeds();
} catch (err) {
  log.error("❌ Failed during bootstrap sequence", { error: err.message });
      }
