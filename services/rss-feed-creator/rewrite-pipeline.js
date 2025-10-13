import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import Parser from "rss-parser";

import { getObjectText, putJson, putText, BUCKETS, checkBuckets } from "../shared/utils/r2-client.js";
import { callOpenRouterModel } from "../shared/utils/ai-service.js";
import { buildRewritePrompt } from "./utils/rss-prompts.js";
import { rebuildRss } from "./utils/build-rss.js";
import { log } from "../shared/utils/logger.js";

const parser = new Parser();

const ITEMS_KEY = "items.json";
const FEEDS_KEY = "feeds.txt";
const URLS_KEY  = "urls.txt";
const CURSOR_KEY = "cursor.json";

const FEEDS_PER_RUN = 5;
const URLS_PER_RUN = 1;
const MAX_ITEMS_PER_FEED = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

function parseList(text) {
  return (text || "").split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"));
}
function guid() { return "RSS-" + Math.random().toString(36).slice(2, 10); }
function clamp(s) {
  if (!s) return "";
  const min = 200, max = 400;
  s = s.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  const p = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return (p >= min ? cut.slice(0, p+1) : cut) + (p >= min ? "" : "…");
}

async function ensureBootstrap() {
  const base = path.resolve("services/rss-feed-creator/data");
  const feedsFile = path.join(base, "feeds.txt");
  const urlsFile = path.join(base, "urls.txt");

  const [rFeeds, rUrls, rCursor] = await Promise.all([
    getObjectText(BUCKETS.RSS_FEEDS || BUCKETS.PODCAST_RSS_FEEDS || BUCKETS.RAW_TEXT, FEEDS_KEY).catch(() => null),
    getObjectText(BUCKETS.RAW_TEXT || BUCKETS.RSS_FEEDS, URLS_KEY).catch(() => null),
    getObjectText(BUCKETS.META || BUCKETS.RAW_TEXT, CURSOR_KEY).catch(() => null),
  ]);

  if (!rFeeds && fs.existsSync(feedsFile) && BUCKETS.RSS_FEEDS) {
    await putText(BUCKETS.RSS_FEEDS, FEEDS_KEY, fs.readFileSync(feedsFile, "utf8"));
    log("🪄 Uploaded local feeds.txt to R2");
  }
  if (!rUrls && fs.existsSync(urlsFile) && BUCKETS.RAW_TEXT) {
    await putText(BUCKETS.RAW_TEXT, URLS_KEY, fs.readFileSync(urlsFile, "utf8"));
    log("🪄 Uploaded local urls.txt to R2");
  }
  if (!rCursor && (BUCKETS.META || BUCKETS.RAW_TEXT)) {
    const bucket = BUCKETS.META || BUCKETS.RAW_TEXT;
    await putJson(bucket, CURSOR_KEY, { feedIndex: 0, urlIndex: 0 });
    log("🪄 Created cursor.json in R2");
  }
}

export async function runRewritePipeline() {
  log("🚀 rewrite pipeline: start");
  checkBuckets();
  await ensureBootstrap();

  const feedsText = await getObjectText(BUCKETS.RSS_FEEDS || BUCKETS.PODCAST_RSS_FEEDS || BUCKETS.RAW_TEXT, FEEDS_KEY).catch(() => "");
  const urlsText  = await getObjectText(BUCKETS.RAW_TEXT || BUCKETS.RSS_FEEDS, URLS_KEY).catch(() => "");
  const cursorRaw = await getObjectText(BUCKETS.META || BUCKETS.RAW_TEXT, CURSOR_KEY).catch(() => "");

  const feeds = parseList(feedsText);
  const urls = parseList(urlsText);
  const cursor = cursorRaw ? JSON.parse(cursorRaw) : { feedIndex: 0, urlIndex: 0 };

  if (!feeds.length && !urls.length) {
    throw new Error("No feeds or urls configured in R2");
  }

  const feedsSlice = feeds.slice(cursor.feedIndex, cursor.feedIndex + FEEDS_PER_RUN).concat(
    feeds.length && cursor.feedIndex + FEEDS_PER_RUN > feeds.length ? feeds.slice(0, (cursor.feedIndex + FEEDS_PER_RUN) % feeds.length) : []
  );
  const urlsSlice = urls.slice(cursor.urlIndex, cursor.urlIndex + URLS_PER_RUN).concat(
    urls.length && cursor.urlIndex + URLS_PER_RUN > urls.length ? urls.slice(0, (cursor.urlIndex + URLS_PER_RUN) % urls.length) : []
  );

  const fetched = [];
  for (const u of feedsSlice) {
    try {
      const r = await fetch(u);
      const xml = await r.text();
      const parsed = await parser.parseString(xml);
      fetched.push(parsed);
      log("✅ parsed feed", { url: u, items: parsed.items?.length || 0 });
    } catch (err) {
      log("❌ feed parse failed", { url: u, error: err.message });
    }
  }

  const rewritten = [];
  for (const feed of fetched) {
    const items = (feed.items || []).slice(0, MAX_ITEMS_PER_FEED);
    for (const it of items) {
      const prompt = buildRewritePrompt({ title: it.title || "", summary: it.contentSnippet || it.content || "" });
      try {
        const out = await callOpenRouterModel(prompt, { temperature: 0.3, max_tokens: 220 });
        rewritten.push({
          id: guid(),
          title: clamp(out),
          link: it.link || "",
          pubDate: it.pubDate || new Date().toUTCString(),
          original: it.title || ""
        });
        log("🧠 rewrote", { title: (it.title || "").slice(0, 80) });
      } catch (err) {
        log("⚠️ rewrite failed", { error: err.message });
      }
    }
  }

  const metaBucket = BUCKETS.META || BUCKETS.RAW_TEXT;
  if (metaBucket) {
    const next = {
      feedIndex: feeds.length ? (cursor.feedIndex + FEEDS_PER_RUN) % feeds.length : 0,
      urlIndex: urls.length ? (cursor.urlIndex + URLS_PER_RUN) % urls.length : 0
    };
    await putJson(metaBucket, CURSOR_KEY, next);
    log("🧭 cursor updated", { next });
  }

  const itemsBucket = BUCKETS.RAW_TEXT || BUCKETS.META || BUCKETS.RSS_FEEDS;
  if (itemsBucket) {
    await putJson(itemsBucket, ITEMS_KEY, rewritten);
    log("💾 saved items", { count: rewritten.length, bucket: itemsBucket, key: ITEMS_KEY });
  }

  await rebuildRss(rewritten);
  log("🎯 pipeline complete", { count: rewritten.length });
  return { ok: true, count: rewritten.length };
}
