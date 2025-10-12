// /services/rss-feed-creator/rewrite-pipeline.js
// ✅ Fixed 2025-10-12 — Complete, balanced, no syntax gaps
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import Parser from "rss-parser";
import { getObject, putJson, putText } from "../shared/utils/r2-client.js";
import { callOpenRouterModel } from "./utils/models.js";
import { rebuildRss } from "./build-rss.js";

const parser = new Parser();

function log(level, message, meta = null) {
  const entry = { time: new Date().toISOString(), level: level, message: message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// Keys
const ITEMS_KEY = "items.json";
const FEEDS_KEY = "feeds.txt";
const URLS_KEY = "urls.txt";
const CURSOR_KEY = "cursor.json";

// Rotation
const FEEDS_PER_RUN = 5;
const URLS_PER_RUN = 1;
const MAX_ITEMS_PER_FEED = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

function parseList(text) {
  return (text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"));
}

function clampRewrite(s) {
  if (!s) return "";
  s = s
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*[^*]+\*\*/g, "")
    .replace(/(?:^|\n)(?:Podcast|Intro|Headline)[:\-]/gi, "")
    .replace(/\n+/g, " ")
    .trim();
  const max = 400;
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return last > 200 ? cut.slice(0, last + 1) : cut + "…";
}

function guid() {
  return "RSS-" + Math.random().toString(36).slice(2, 10);
}

function wrapIndex(start, count, arr) {
  if (!arr.length) return [];
  return Array.from({ length: Math.min(count, arr.length) }, (_, i) => arr[(start + i) % arr.length]);
}

async function ensureBootstrap() {
  const baseDir = path.resolve("services/rss-feed-creator/data");
  const feedsPath = path.join(baseDir, "feeds.txt");
  const urlsPath = path.join(baseDir, "urls.txt");
  let changed = false;

  try {
    const [f, u, c] = await Promise.all([getObject(FEEDS_KEY), getObject(URLS_KEY), getObject(CURSOR_KEY)]);

    if (!f && fs.existsSync(feedsPath)) {
      await putText(FEEDS_KEY, fs.readFileSync(feedsPath, "utf-8"));
      log("info", "Uploaded feeds.txt → R2");
      changed = true;
    }
    if (!u && fs.existsSync(urlsPath)) {
      await putText(URLS_KEY, fs.readFileSync(urlsPath, "utf-8"));
      log("info", "Uploaded urls.txt → R2");
      changed = true;
    }
    if (!c) {
      await putJson(CURSOR_KEY, { feedIndex: 0, urlIndex: 0 });
      log("info", "Created cursor.json in R2");
      changed = true;
    }
  } catch (err) {
    log("error", "Bootstrap failed", { error: err.message });
  }

  return changed;
}

// ────────────────────────────────────────────────
// 🚀 Main rewrite pipeline
// ────────────────────────────────────────────────
export async function runRewritePipeline() {
  log("info", "🚀 Starting rewrite pipeline");
  try {
    await ensureBootstrap();
    const [feedsText, urlsText, cursorRaw] = await Promise.all([
      getObject(FEEDS_KEY),
      getObject(URLS_KEY),
      getObject(CURSOR_KEY),
    ]);

    const feeds = parseList(feedsText);
    const urls = parseList(urlsText);
    const cursor = cursorRaw ? JSON.parse(cursorRaw) : { feedIndex: 0, urlIndex: 0 };

    if (!feeds.length && !urls.length) throw new Error("feeds.txt and urls.txt are empty or missing");

    const feedsSlice = wrapIndex(cursor.feedIndex, FEEDS_PER_RUN, feeds);
    log("info", "📡 Selected feeds", { count: feedsSlice.length });

    const fetched = [];
    for (const url of feedsSlice) {
      try {
        const resp = await fetch(url);
        const xml = await resp.text();
        const parsed = await parser.parseString(xml);
        fetched.push(parsed);
        log("info", "✅ Parsed feed", { url, items: parsed.items?.length || 0 });
      } catch (err) {
        log("error", "❌ Feed parse failed", { url, error: err.message });
      }
    }

    const rewritten = [];
    for (const feed of fetched) {
      for (const item of (feed.items || []).slice(0, MAX_ITEMS_PER_FEED)) {
        const title = item.title || "(untitled)";
        const content = item.contentSnippet || item.content || "";
        const prompt = `Rewrite this AI news story in a concise British Gen-X tone:\nTitle: ${title}\n${content}`;
        try {
          const text = await callOpenRouterModel(prompt);
          rewritten.push({
            id: guid(),
            title: clampRewrite(text),
            link: item.link,
            pubDate: item.pubDate || new Date().toUTCString(),
            original: title,
          });
          log("info", "🧠 Rewrote", { title: title.slice(0, 60) });
        } catch (err) {
          log("error", "Rewrite failed", { title, error: err.message });
        }
      }
    }

    const next = {
      feedIndex: (cursor.feedIndex + FEEDS_PER_RUN) % (feeds.length || 1),
      urlIndex: (cursor.urlIndex + URLS_PER_RUN) % (urls.length || 1),
    };
    await putJson(CURSOR_KEY, next);
    await putJson(ITEMS_KEY, rewritten);
    await rebuildRss(rewritten);
    log("info", "📢 RSS feed rebuilt");

    return { ok: true, count: rewritten.length };
  } catch (err) {
    log("error", "Pipeline failed", { error: err.message });
    return { ok: false, error: err.message };
  }
}

export default runRewritePipeline;
