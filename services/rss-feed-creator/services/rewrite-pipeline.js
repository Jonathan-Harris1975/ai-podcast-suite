// /services/rss-feed-creator/services/rewrite-pipeline.js
import fetch from "node-fetch";
import Parser from "rss-parser";
import { log } from "../../../utils/logger.js";
import { getObject, putJson } from "../../shared/utils/r2-client.js";
import { rebuildRss } from "./build-rss.js";

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
  return text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"));
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

// Main pipeline
export async function runRewritePipeline() {
  log.info("🚀 Starting rewrite pipeline");
// ---- Bootstrap check: ensure essential R2 files exist ----
const bootstrapDefaults = {
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

async function ensureR2Bootstrap() {
  const existingFeeds = await getObject(FEEDS_KEY);
  const existingUrls = await getObject(URLS_KEY);
  const existingCursor = await getObject(CURSOR_KEY);

  if (!existingFeeds) {
    await putJson(FEEDS_KEY, bootstrapDefaults.feeds.join("\n"));
    log.info("🪄 Bootstrap: feeds.txt created in R2");
  }
  if (!existingUrls) {
    await putJson(URLS_KEY, bootstrapDefaults.urls.join("\n"));
    log.info("🪄 Bootstrap: urls.txt created in R2");
  }
  if (!existingCursor) {
    await putJson(CURSOR_KEY, bootstrapDefaults.cursor);
    log.info("🪄 Bootstrap: cursor.json created in R2");
  }
}
await ensureR2Bootstrap();
  try {
    // Load sources
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

    // Select slice
    const feedsSlice = wrapIndex(cursor.feedIndex, FEEDS_PER_RUN, feeds);
    const urlsSlice = wrapIndex(cursor.urlIndex, URLS_PER_RUN, urls);

    // Fetch feeds
    const fetchedFeeds = [];
    for (const feedUrl of feedsSlice) {
      try {
        const xml = await fetch(feedUrl).then(r => r.text());
        const parsed = await parser.parseString(xml);
        fetchedFeeds.push(parsed);
      } catch (err) {
        log.error(`❌ Failed to fetch or parse ${feedUrl}: ${err.message}`);
      }
    }

    // Produce placeholder rewrites (no OpenRouter in this minimal pack)
    const rewrittenItems = [];
    for (const feed of fetchedFeeds) {
      for (const item of (feed.items || []).slice(0, MAX_ITEMS_PER_FEED)) {
        const rewritten = clampRewrite(`${item.title || ""} — ${item.contentSnippet || ""}`);
        rewrittenItems.push({
          id: guid(),
          title: rewritten || (item.title || "Untitled"),
          link: item.link,
          pubDate: item.pubDate || new Date().toUTCString(),
          original: item.title
        });
      }
    }

    // Update cursor
    const nextCursor = {
      feedIndex: (cursor.feedIndex + FEEDS_PER_RUN) % (feeds.length || 1),
      urlIndex: (cursor.urlIndex + URLS_PER_RUN) % (urls.length || 1)
    };
    await putJson(CURSOR_KEY, nextCursor);

    // Save items
    await putJson(ITEMS_KEY, rewrittenItems);

    // Rebuild RSS
    await rebuildRss(rewrittenItems);
    log.info("✅ RSS successfully rebuilt and uploaded");

    return { ok: true, count: rewrittenItems.length };
  } catch (err) {
    log.error(`❌ runRewritePipeline failed: ${err.message}`);
    throw err;
  }
}
