// /services/rss-feed-creator/services/rewrite-pipeline.js
// 🔁 AI Podcast Suite – RSS Feed Rewrite Pipeline (2025.10.11)
// Bootstrap from local /data/*.txt to R2 if missing
// Rotation: 5 feeds + 1 URL per run

import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import Parser from "rss-parser";
import { getObject, putJson, putText } from "../../shared/utils/r2-client.js";
import { callOpenRouterModel } from "../utils/models.js";
import { rebuildRss } from "./build-rss.js";

const parser = new Parser();

// ────────────────────────────────────────────────
// Safe structured logger (Render-compatible)
// ────────────────────────────────────────────────
function safeLog(level, message, meta = null) {
  try {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...(meta && typeof meta === "object" ? { meta } : {}),
    };
    process.stdout.write(JSON.stringify(entry) + "\n");
  } catch {
    process.stdout.write(
      JSON.stringify({ time: new Date().toISOString(), level, message }) + "\n"
    );
  }
}

// ── R2 Keys
const ITEMS_KEY  = "items.json";
const FEEDS_KEY  = "feeds.txt";
const URLS_KEY   = "urls.txt";
const CURSOR_KEY = "cursor.json";

// ── Rotation config
const FEEDS_PER_RUN       = 5;
const URLS_PER_RUN        = 1;
const MAX_ITEMS_PER_FEED  = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function parseList(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith("#"));
}

function clampRewrite(s) {
  if (!s) return "";
  s = s.replace(/^#+\s*/gm, "")
       .replace(/\*\*[^*]+\*\*/g, "")
       .replace(/(?:^|\n)(?:Podcast|Intro|Headline)[:\-]/gi, "")
       .replace(/\n+/g, " ")
       .trim();
  const min = 200, max = 400;
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  const lastPunct = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (lastPunct >= min) return cut.slice(0, lastPunct + 1).trim();
  return cut.trim() + "…";
}

function guid() {
  return "RSS-" + Math.random().toString(36).slice(2, 8);
}

function wrapIndex(start, count, arr) {
  if (arr.length === 0) return [];
  const out = [];
  for (let i = 0; i < count && i < arr.length; i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}

// ────────────────────────────────────────────────
/** 🪄 Bootstrap: upload local data files to R2 if missing */
// ────────────────────────────────────────────────
async function ensureR2Bootstrap() {
  const baseDir   = path.resolve("services/rss-feed-creator/data");
  const feedsPath = path.join(baseDir, "feeds.txt");
  const urlsPath  = path.join(baseDir, "urls.txt");

  let changed = false;

  try {
    const [existingFeeds, existingUrls, existingCursor] = await Promise.all([
      getObject(FEEDS_KEY),
      getObject(URLS_KEY),
      getObject(CURSOR_KEY)
    ]);

    if (!existingFeeds && fs.existsSync(feedsPath)) {
      const localFeeds = fs.readFileSync(feedsPath, "utf-8");
      await putText(FEEDS_KEY, localFeeds);
      safeLog("info", "🪄 Bootstrap: Uploaded local feeds.txt → R2");
      changed = true;
    }

    if (!existingUrls && fs.existsSync(urlsPath)) {
      const localUrls = fs.readFileSync(urlsPath, "utf-8");
      await putText(URLS_KEY, localUrls);
      safeLog("info", "🪄 Bootstrap: Uploaded local urls.txt → R2");
      changed = true;
    }

    if (!existingCursor) {
      const cursor = { feedIndex: 0, urlIndex: 0 };
      await putJson(CURSOR_KEY, cursor);
      safeLog("info", "🪄 Bootstrap: cursor.json created in R2");
      changed = true;
    }
  } catch (err) {
    safeLog("error", "❌ Bootstrap to R2 failed", { error: err.message });
  }

  return changed;
}

// ────────────────────────────────────────────────
/** 🚀 Main Rewrite Pipeline */
// ────────────────────────────────────────────────
export async function runRewritePipeline() {
  safeLog("info", "🚀 Starting rewrite pipeline");

  try {
    await ensureR2Bootstrap();

    // 1️⃣ Load feeds + URLs + cursor from R2
    const [feedsText, urlsText, cursorRaw] = await Promise.all([
      getObject(FEEDS_KEY),
      getObject(URLS_KEY),
      getObject(CURSOR_KEY)
    ]);

    const feeds  = parseList(feedsText);
    const urls   = parseList(urlsText);
    const cursor = cursorRaw ? JSON.parse(cursorRaw) : { feedIndex: 0, urlIndex: 0 };

    if (!feeds.length && !urls.length) {
      safeLog("error", "❌ No feeds.txt or urls.txt content found — cannot continue.");
      throw new Error("feeds.txt and urls.txt are empty or missing");
    }

    // 2️⃣ Select slices (5 feeds, 1 URL)
    const feedsSlice = wrapIndex(cursor.feedIndex, FEEDS_PER_RUN, feeds);
    const urlsSlice  = wrapIndex(cursor.urlIndex,  URLS_PER_RUN,  urls);
    safeLog("info", "📡 Selection", { feeds: feedsSlice.length, urls: urlsSlice.length });

    // 3️⃣ Fetch and parse feeds
    const fetchedFeeds = [];
    for (const feedUrl of feedsSlice) {
      try {
        const resp = await fetch(feedUrl);
        const xml  = await resp.text();
        const parsed = await parser.parseString(xml);
        fetchedFeeds.push(parsed);
        safeLog("info", "✅ Parsed feed", { url: feedUrl, items: parsed.items?.length || 0 });
      } catch (err) {
        safeLog("error", "❌ Failed to fetch/parse feed", { url: feedUrl, error: err.message });
      }
    }

    // 4️⃣ Generate rewrites using OpenRouter model
    const rewrittenItems = [];
    for (const feed of fetchedFeeds) {
      const items = (feed.items || []).slice(0, MAX_ITEMS_PER_FEED);
      for (const item of items) {
        const title = item.title || "(untitled)";
        const snippet = item.contentSnippet || item.content || "";
        const prompt =
          `Rewrite this AI news headline and summary in a concise British Gen-X tone.\n\n` +
          `Title: ${title}\n` +
          `Summary: ${snippet}\n\n` +
          `— Keep it punchy. No hashtags or emojis.`;

        try {
          const modelResp = await callOpenRouterModel(prompt);
          const rewritten = clampRewrite(modelResp);
          rewrittenItems.push({
            id: guid(),
            title: rewritten,
            link: item.link,
            pubDate: item.pubDate || new Date().toUTCString(),
            original: title
          });
          safeLog("info", "🧠 Rewrote item", { title: title.slice(0, 80) });
        } catch (err) {
          safeLog("error", "❌ Rewrite failed", { title: title.slice(0, 80), error: err.message });
        }
      }
    }

    // 5️⃣ Update cursor for rotation
    const nextCursor = {
      feedIndex: (cursor.feedIndex + FEEDS_PER_RUN) % (feeds.length || 1),
      urlIndex:  (cursor.urlIndex  + URLS_PER_RUN)  % (urls.length  || 1)
    };
    await putJson(CURSOR_KEY, nextCursor);
    safeLog("info", "🧭 Cursor updated", { nextCursor });

    // 6️⃣ Save rewritten items
    await putJson(ITEMS_KEY, rewrittenItems);
    safeLog("info", "💾 Saved rewritten items", { count: rewrittenItems.length, key: ITEMS_KEY });

    // 7️⃣ Build + upload RSS
    await rebuildRss(rewrittenItems);
    safeLog("info", "📢 RSS feed rebuilt and uploaded successfully");

    safeLog("info", "🎯 Rewrite pipeline completed successfully");
    return { ok: true, count: rewrittenItems.length };

  } catch (err) {
    safeLog("error", "❌ runRewritePipeline failed", { error: err.message });
    if (err?.stack) safeLog("error", err.stack);
    throw err;
  }
      }
