// /services/rss-feed-creator/services/rewrite-pipeline.js
// 🔁 Integrated mono-repo version with R2 bootstrap + OpenRouter rewrite

import fetch from "node-fetch";
import Parser from "rss-parser";
import { log } from "../../../utils/logger.js";
import { getObject, putJson, putText } from "../../shared/utils/r2-client.js";
import { callOpenRouterModel } from "../utils/models.js";
import { rebuildRss } from "./build-rss.js";
import { createShortLink } from "../utils/shortio.js";

const parser = new Parser();

// ── R2 Keys
const ITEMS_KEY = "items.json";
const FEEDS_KEY = "feeds.txt";
const URLS_KEY = "urls.txt";
const CURSOR_KEY = "cursor.json";

// ── Config
const FEEDS_PER_RUN = 5;
const URLS_PER_RUN = 1;
const MAX_ITEMS_PER_FEED = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

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
// Bootstrap — ensure feeds.txt, urls.txt, cursor.json exist
// ────────────────────────────────────────────────
async function ensureR2Bootstrap() {
  const defaults = {
    feeds: [
      "https://venturebeat.com/category/ai/feed/",
      "https://syncedreview.com/feed/",
      "https://the-decoder.com/feed/"
    ],
    urls: [
      "https://blog.google/technology/ai/",
      "https://towardsdatascience.com/"
    ],
    cursor: { feedIndex: 0, urlIndex: 0 }
  };

  const existingFeeds = await getObject(FEEDS_KEY);
  const existingUrls = await getObject(URLS_KEY);
  const existingCursor = await getObject(CURSOR_KEY);

  if (!existingFeeds) {
    await putText(FEEDS_KEY, defaults.feeds.join("\n"));
    log.info("🪄 Bootstrap: feeds.txt created in R2");
  }
  if (!existingUrls) {
    await putText(URLS_KEY, defaults.urls.join("\n"));
    log.info("🪄 Bootstrap: urls.txt created in R2");
  }
  if (!existingCursor) {
    await putJson(CURSOR_KEY, defaults.cursor);
    log.info("🪄 Bootstrap: cursor.json created in R2");
  }
}

// ────────────────────────────────────────────────
// Main Pipeline
// ────────────────────────────────────────────────
export async function runRewritePipeline() {
  log.info("🚀 Starting rewrite pipeline");

  try {
    await ensureR2Bootstrap();

    // 1️⃣ Load data from R2
    const [feedsText, urlsText, cursorRaw] = await Promise.all([
      getObject(FEEDS_KEY),
      getObject(URLS_KEY),
      getObject(CURSOR_KEY)
    ]);

    const feeds = parseList(feedsText);
    const urls = parseList(urlsText);
    const cursor = cursorRaw ? JSON.parse(cursorRaw) : { feedIndex: 0, urlIndex: 0 };

    if (!feeds.length && !urls.length) {
      log.error("❌ No feeds.txt or urls.txt content found in R2 — cannot continue.");
      throw new Error("feeds.txt and urls.txt are empty or missing in R2");
    }

    log.info(`[Stage 1] Parsed feeds:${feeds.length}, urls:${urls.length}`);

    // 2️⃣ Select rotation slice
    const feedsSlice = wrapIndex(cursor.feedIndex, FEEDS_PER_RUN, feeds);
    const urlsSlice = wrapIndex(cursor.urlIndex, URLS_PER_RUN, urls);
    log.info(`[Stage 2] Feeds slice: ${feedsSlice.length}, URLs slice: ${urlsSlice.length}`);

    // 3️⃣ Fetch and parse RSS feeds
    const fetchedFeeds = [];
    for (const feedUrl of feedsSlice) {
      try {
        log.info(`Fetching RSS feed: ${feedUrl}`);
        const xml = await fetch(feedUrl).then(r => r.text());
        const parsed = await parser.parseString(xml);
        fetchedFeeds.push(parsed);
        log.info(`Fetched ${parsed.items?.length || 0} items from ${feedUrl}`);
      } catch (err) {
        log.error(`❌ Failed to fetch ${feedUrl}: ${err.message}`);
      }
    }

    // 4️⃣ Generate rewrites
    const rewrittenItems = [];
    for (const feed of fetchedFeeds) {
      for (const item of (feed.items || []).slice(0, MAX_ITEMS_PER_FEED)) {
        const prompt = `Rewrite this AI news headline and summary in a concise British Gen-X tone:\n\n${item.title}\n${item.contentSnippet}`;
        try {
          const modelResp = await callOpenRouterModel(prompt);
          const rewritten = clampRewrite(modelResp);
          rewrittenItems.push({
            id: guid(),
            title: rewritten,
            link: item.link,
            pubDate: item.pubDate || new Date().toUTCString(),
            original: item.title
          });
          log.info(`🧩 Rewrote: ${item.title.slice(0, 60)}...`);
        } catch (err) {
          log.error(`❌ Rewrite failed for '${item.title}': ${err.message}`);
        }
      }
    }

    // 5️⃣ Update cursor
    const nextCursor = {
      feedIndex: (cursor.feedIndex + FEEDS_PER_RUN) % (feeds.length || 1),
      urlIndex: (cursor.urlIndex + URLS_PER_RUN) % (urls.length || 1)
    };
    await putJson(CURSOR_KEY, nextCursor);
    log.info(`[Stage 5] Cursor updated: ${JSON.stringify(nextCursor)}`);

    // 6️⃣ Save rewritten data
    await putJson(ITEMS_KEY, rewrittenItems);
    log.info(`[Stage 6] Saved ${rewrittenItems.length} rewritten items to ${ITEMS_KEY}`);

    // 7️⃣ Rebuild RSS and upload
    try {
      await rebuildRss(rewrittenItems);
      log.info("✅ RSS successfully rebuilt and uploaded");
    } catch (err) {
      log.error(`⚠️ RSS rebuild failed: ${err.message}`);
    }

    log.info("🎯 Rewrite pipeline completed successfully");
    return { ok: true, count: rewrittenItems.length };

  } catch (err) {
    log.error(`❌ runRewritePipeline failed: ${err.message}`);
    log.error(err.stack);
    throw err;
  }
      }
