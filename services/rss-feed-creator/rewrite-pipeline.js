// services/rss-feed-creator/rewrite-pipeline.js
import fetch from "node-fetch";
import Parser from "rss-parser";
import { getObject, putJson } from "../shared/utils/r2-client.js";
import { info, error } from "../shared/utils/logger.js";
import { rewriteItem } from "./utils/models.js";
import { rebuildRss } from "./build-rss.js";

const parser = new Parser();

const ITEMS_KEY = process.env.REWRITTEN_ITEMS_KEY || "items.json";
const FEEDS_LIST_KEY = process.env.FEEDS_LIST_KEY || "feeds.txt";
const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;

function parseList(text) {
  return (text || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !s.startsWith("#"));
}

function guid() {
  return "RSS-" + Math.random().toString(36).slice(2, 10);
}

function clamp(text, min=200, max=400) {
  const s = (text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return (end >= min ? cut.slice(0, end + 1) : cut) + (end >= min ? "" : "…");
}

export async function runRewritePipeline() {
  info("rewrite.pipeline.start", {});

  if (!RSS_BUCKET) throw new Error("R2_BUCKET_RSS_FEEDS is required");

  const feedsTxt = await getObject(RSS_BUCKET, FEEDS_LIST_KEY);
  if (!feedsTxt) throw new Error(`Missing ${FEEDS_LIST_KEY} in bucket ${RSS_BUCKET}`);
  const feeds = parseList(feedsTxt);
  if (!feeds.length) throw new Error("No feeds defined");

  const itemsOut = [];

  for (const url of feeds) {
    try {
      const resp = await fetch(url);
      const xml = await resp.text();
      const parsed = await parser.parseString(xml);
      const items = (parsed.items || []).slice(0, 3);
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
            original: title
          });
        } catch (e) {
          error("rewrite.item.fail", { title: title.slice(0, 80), error: e.message });
        }
      }
    } catch (e) {
      error("rewrite.feed.fail", { url, error: e.message });
    }
  }

  await putJson(RSS_BUCKET, ITEMS_KEY, itemsOut);
  await rebuildRss(itemsOut);
  info("rewrite.pipeline.done", { count: itemsOut.length });

  return { ok: true, count: itemsOut.length };
}