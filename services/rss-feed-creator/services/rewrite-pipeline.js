// /services/rss-feed-creator/services/rewrite-pipeline.js
// Built-in fetch version (Node 18+/22+ on Shiper)
// Removes node-fetch import completely.

import Parser from "rss-parser";
import { log } from "../../../utils/logger.js";
import { s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText } from "../../shared/utils/r2-client.js";
import { getObject, putJson } from "../../shared/utils/r2-client.js";
import { callOpenRouterModel } from "../utils/models.js";
import { rebuildRss } from "./build-rss.js";
import { createShortLink } from "../utils/shortio.js";

// ✅ Use native fetch available in Node 18+
const fetch = globalThis.fetch;

const parser = new Parser();

// R2 keys
const ITEMS_KEY = "items.json";
const FEEDS_KEY = "feeds.txt";
const URLS_KEY = "urls.txt";
const CURSOR_KEY = "cursor.json";

// Batch limits
const FEEDS_PER_RUN = 5;
const URLS_PER_RUN = 1;
const MAX_ITEMS_PER_FEED = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

// Helpers
function parseList(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith("#"));
}

function clampRewrite(s) {
  if (!s) return "";
  s = s
    .replace(/^#+\s*/gm, "")
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

async function readJson(key, fallback) {
  const raw = await getObject(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); }
  catch { return fallback; }
}

function wrapIndex(start, count, arr) {
  if (arr.length === 0) return [];
  const out = [];
  for (let i = 0; i < count && i < arr.length; i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}

// Main pipeline
export async function runRewritePipeline() {
  log.info("🚀 Starting rewrite pipeline");

  try {
    // 1️⃣ Load sources
    const [feedsText, urlsText, cursorRaw] = await Promise.all([
      getObject(FEEDS_KEY),
      getObject(URLS_KEY),
      getObject(CURSOR_KEY)
    ]);

    log.debug(`[Stage 1] R2 objects loaded — feeds:${!!feedsText}, urls:${!!urlsText}, cursor:${!!cursorRaw}`);

    const feeds = parseList(feedsText);
    const urls = parseList(urlsText);
    const cursor = cursorRaw ? JSON.parse(cursorRaw) : { feedIndex: 0, urlIndex: 0 };

    if (!feeds.length && !urls.length) {
      log.error("❌ No feeds.txt or urls.txt content found in R2 — cannot continue.");
      throw new Error("feeds.txt and urls.txt are empty or missing in R2");
    }

    // 2️⃣ Select rotation slice
    const feedsSlice = wrapIndex(cursor.feedIndex, FEEDS_PER_RUN, feeds);
    const urlsSlice = wrapIndex(cursor.urlIndex, URLS_PER_RUN, urls);
    log.debug(`[Stage 2] Using feedsSlice:${JSON.stringify(feedsSlice)} urlsSlice:${JSON.stringify(urlsSlice)}`);

    // 3️⃣ Fetch feed data
    const fetchedFeeds = [];
    for (const feedUrl of feedsSlice) {
      try {
        log.debug(`Fetching RSS feed: ${feedUrl}`);
        const xml = await fetch(feedUrl).then(r => r.text());
        const parsed = await parser.parseString(xml);
        fetchedFeeds.push(parsed);
        log.debug(`Fetched ${parsed.items?.length || 0} items from ${feedUrl}`);
      } catch (err) {
        log.error(`❌ Failed to fetch or parse ${feedUrl}: ${err.message}`);
      }
    }

    // 4️⃣ Generate rewrites
    const rewrittenItems = [];
    for (const feed of fetchedFeeds) {
      for (const item of (feed.items || []).slice(0, MAX_ITEMS_PER_FEED)) {
        const prompt = `Rewrite this news headline and summary in a concise British Gen-X tone:\n\n${item.title}\n${item.contentSnippet}`;
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
          log.debug(`Rewrote item: ${item.title.slice(0, 50)}...`);
        } catch (err) {
          log.error(`❌ Model rewrite failed for item '${item.title}': ${err.message}`);
        }
      }
    }

    log.info(`[Stage 4] Rewritten items generated: ${rewrittenItems.length}`);

    // 5️⃣ Update cursor
    const nextCursor = {
      feedIndex: (cursor.feedIndex + FEEDS_PER_RUN) % (feeds.length || 1),
      urlIndex: (cursor.urlIndex + URLS_PER_RUN) % (urls.length || 1)
    };

    await putJson(CURSOR_KEY, nextCursor);
    log.debug(`[Stage 5] Cursor updated: ${JSON.stringify(nextCursor)}`);

    // 6️⃣ Save rewritten data back to R2
    await putJson(ITEMS_KEY, rewrittenItems);
    log.info(`[Stage 6] Saved ${rewrittenItems.length} rewritten items to ${ITEMS_KEY}`);

    // 7️⃣ Rebuild RSS
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
