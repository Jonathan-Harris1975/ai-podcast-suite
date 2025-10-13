// services/rss-feed-creator/rewrite-pipeline.js
// AI Podcast Suite – RSS Feed Rewrite Pipeline (with feed limit)
// Rewrites RSS feeds using OpenRouter models and uploads rewritten feed to R2

import fetch from "node-fetch";
import Parser from "rss-parser";
import { getObject, putJson } from "../shared/utils/r2-client.js";
import { info, error } from "../shared/utils/logger.js";
import { rewriteItem } from "./utils/models.js";
import { rebuildRss } from "./build-rss.js";
import { ensureR2Bootstrap } from "./bootstrap.js";

const parser = new Parser();

// ────────────────────────────────────────────────
// Constants & Environment
// ────────────────────────────────────────────────
const ITEMS_KEY = process.env.REWRITTEN_ITEMS_KEY || "items.json";
const FEEDS_LIST_KEY = process.env.FEEDS_LIST_KEY || "feeds.txt";
const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;
const MAX_ITEMS_PER_FEED = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);
const MAX_FEEDS_PER_RUN = parseInt(process.env.MAX_FEEDS_PER_RUN || "12", 10); // ✅ New hard limit

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function parseList(text) {
  return (text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("#"));
}

function guid() {
  return "RSS-" + Math.random().toString(36).slice(2, 10);
}

function clamp(text, min = 200, max = 400) {
  const s = (text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  const end = Math.max(
    cut.lastIndexOf("."),
    cut.lastIndexOf("!"),
    cut.lastIndexOf("?")
  );
  return (end >= min ? cut.slice(0, end + 1) : cut) + (end >= min ? "" : "…");
}

// ────────────────────────────────────────────────
// Main Pipeline
// ────────────────────────────────────────────────
export async function runRewritePipeline() {
  info("rewrite.pipeline.start", {});

  if (!RSS_BUCKET)
    throw new Error("R2_BUCKET_RSS_FEEDS is required in environment");

  // 🪄 Ensure R2 bucket has feeds.txt, urls.txt, and cursor.json
  await ensureR2Bootstrap();

  // Load feeds list from R2
  const feedsTxt = await getObject(RSS_BUCKET, FEEDS_LIST_KEY);
  if (!feedsTxt)
    throw new Error(`feeds.txt not found in bucket ${RSS_BUCKET}`);

  let feeds = parseList(feedsTxt);

  if (!feeds.length) throw new Error("feeds.txt is empty – no feeds defined");

  // ✅ Enforce max feed limit
  if (feeds.length > MAX_FEEDS_PER_RUN) {
    info("rewrite.pipeline.limit", {
      total: feeds.length,
      limitedTo: MAX_FEEDS_PER_RUN,
    });
    feeds = feeds.slice(0, MAX_FEEDS_PER_RUN);
  }

  const itemsOut = [];

  // ── Process each feed
  for (const feedUrl of feeds) {
    try {
      const resp = await fetch(feedUrl);
      if (!resp.ok)
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      const xml = await resp.text();
      const parsed = await parser.parseString(xml);
      const items = (parsed.items || []).slice(0, MAX_ITEMS_PER_FEED);

      for (const it of items) {
        const title = it.title || "(untitled)";
        const summary = it.contentSnippet || it.content || "";
        try {
          const rewritten = await rewriteItem(title, summary);
          itemsOut.push({
            id: guid(),
            title: clamp(rewritten),
            link: it.link || "",
            pubDate: it.pubDate || new Date().toUTCString(),
            original: title,
          });
        } catch (err) {
          error("rewrite.item.fail", {
            title: title.slice(0, 100),
            error: err.message,
          });
        }
      }

      info("rewrite.feed.done", {
        url: feedUrl,
        items: itemsOut.length,
      });
    } catch (err) {
      error("rewrite.feed.fail", { url: feedUrl, error: err.message });
    }
  }

  // ── Save to R2 and rebuild RSS
  await putJson(RSS_BUCKET, ITEMS_KEY, itemsOut);
  await rebuildRss(itemsOut);
  info("rewrite.pipeline.done", { count: itemsOut.length });

  return { ok: true, count: itemsOut.length };
          }
