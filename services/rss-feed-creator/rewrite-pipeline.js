// /services/rss-feed-creator/rewrite-pipeline.js
// Clean, shorthand-safe, Node 22 compatible

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";
import { RSS_PROMPTS } from "./utils/rss-prompts.js";

// Use Node's global fetch (no node-fetch)
const parser = new Parser();

// R2 + helpers - Fixed import paths
import { getObject, putJson, putText } from '../shared/utils/r2-client.js';
import { callOpenRouterModel } from './utils/models.js';

// Remove duplicate import - already imported RSS_PROMPTS above
// import { buildRssSummaryPrompt } from './utils/rss-prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeLog(level, message, meta) {
  const entry = { time: new Date().toISOString(), level, message };
  if (meta && typeof meta === "object") entry.meta = meta;
  try {
    process.stdout.write(JSON.stringify(entry) + "\n");
  } catch {
    process.stdout.write(JSON.stringify({ time: new Date().toISOString(), level, message }) + "\n");
  }
}

const ITEMS_KEY  = "items.json";
const FEEDS_KEY  = "feeds.txt";
const URLS_KEY   = "urls.txt";
const CURSOR_KEY = "cursor.json";

const FEEDS_PER_RUN       = 5;
const URLS_PER_RUN        = 1;
const MAX_ITEMS_PER_FEED  = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

function parseList(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith("#"));
}

function clampRewrite(s) {
  if (!s) return "";
  let out = s
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*[^*]+\*\*/g, "")
    .replace(/(?:^|\n)(?:Podcast|Intro|Headline)[:\-]/gi, "")
    .replace(/\n+/g, " ")
    .trim();
  const min = 200, max = 400;
  if (out.length <= max) return out;
  let cut = out.slice(0, max);
  const lastPunct = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (lastPunct >= min) return cut.slice(0, lastPunct + 1).trim();
  return cut.trim() + "…";
}

function guid() {
  return "RSS-" + Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);
}

function wrapIndex(start, count, arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out = [];
  for (let i = 0; i < count && i < arr.length; i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}

async function ensureR2Bootstrap() {
  // Fixed path resolution to be more reliable
  const baseDir = path.resolve(__dirname, "data");
  const feedsPath = path.join(baseDir, "feeds.txt");
  const urlsPath = path.join(baseDir, "urls.txt");

  try {
    const [existingFeeds, existingUrls, existingCursor] = await Promise.all([
      getObject(FEEDS_KEY).catch(() => null),
      getObject(URLS_KEY).catch(() => null),
      getObject(CURSOR_KEY).catch(() => null),
    ]);

    if (!existingFeeds) {
      try {
        if (fs.existsSync(feedsPath)) {
          const localFeeds = fs.readFileSync(feedsPath, "utf-8");
          await putText(FEEDS_KEY, localFeeds);
          safeLog("info", "🪄 Bootstrap: Uploaded local feeds.txt → R2");
        }
      } catch (err) {
        safeLog("warn", "Could not bootstrap feeds.txt", { error: err.message });
      }
    }

    if (!existingUrls) {
      try {
        if (fs.existsSync(urlsPath)) {
          const localUrls = fs.readFileSync(urlsPath, "utf-8");
          await putText(URLS_KEY, localUrls);
          safeLog("info", "🪄 Bootstrap: Uploaded local urls.txt → R2");
        }
      } catch (err) {
        safeLog("warn", "Could not bootstrap urls.txt", { error: err.message });
      }
    }

    if (!existingCursor) {
      const cursor = { feedIndex: 0, urlIndex: 0 };
      await putJson(CURSOR_KEY, cursor);
      safeLog("info", "🪄 Bootstrap: cursor.json created in R2");
    }
  } catch (err) {
    safeLog("error", "❌ Bootstrap to R2 failed", { error: err.message });
  }
}

async function rebuildRss(items) {
  // Fixed: Added missing rebuildRss function implementation
  if (!items || items.length === 0) {
    safeLog("warn", "No items to rebuild RSS feed");
    return;
  }

  try {
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Rewritten RSS Feed</title>
  <description>AI-rewritten news summaries</description>
  <link>https://example.com/rss</link>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid>${item.id}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.title}]]></description>
    </item>
  `).join('')}
</channel>
</rss>`;

    await putText("rss.xml", rssContent);
    safeLog("info", "✅ RSS feed rebuilt", { items: items.length });
  } catch (err) {
    safeLog("error", "❌ Failed to rebuild RSS", { error: err.message });
    throw err;
  }
}

// PUBLIC API
export async function runRewritePipeline() {
  safeLog("info", "🚀 Starting rewrite pipeline");

  try {
    await ensureR2Bootstrap();

    const [feedsText, urlsText, cursorRaw] = await Promise.all([
      getObject(FEEDS_KEY).catch(() => ""),
      getObject(URLS_KEY).catch(() => ""),
      getObject(CURSOR_KEY).catch(() => null),
    ]);

    const feeds  = parseList(feedsText);
    const urls   = parseList(urlsText);
    const cursor = cursorRaw ? JSON.parse(cursorRaw) : { feedIndex: 0, urlIndex: 0 };

    if (feeds.length === 0 && urls.length === 0) {
      safeLog("warn", "feeds.txt and urls.txt are empty or missing");
      return { ok: true, count: 0, reason: "No feeds or URLs to process" };
    }

    const feedsSlice = wrapIndex(cursor.feedIndex, FEEDS_PER_RUN, feeds);
    const urlsSlice  = wrapIndex(cursor.urlIndex,  URLS_PER_RUN,  urls);

    safeLog("info", "📡 Selection", {
      feedsSelected: feedsSlice.length,
      urlsSelected: urlsSlice.length,
      totalFeeds: feeds.length,
      totalUrls: urls.length
    });

    // Fetch + parse feeds
    const fetchedFeeds = [];
    for (const feedUrl of feedsSlice) {
      try {
        const resp = await fetch(feedUrl, { 
          method: "GET",
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS-Rewriter/1.0)'
          },
          timeout: 10000
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const xml = await resp.text();
        const parsed = await parser.parseString(xml);
        fetchedFeeds.push(parsed);
        safeLog("info", "✅ Parsed feed", { 
          url: feedUrl, 
          items: (parsed.items || []).length 
        });
      } catch (err) {
        safeLog("error", "❌ Failed to fetch/parse feed", { 
          url: feedUrl, 
          error: err.message 
        });
      }
    }

    const rewrittenItems = [];
    for (const feed of fetchedFeeds) {
      const items = (feed.items || []).slice(0, MAX_ITEMS_PER_FEED);
      for (const item of items) {
        const title = item.title || "(untitled)";
        const snippet = item.contentSnippet || item.content || "";
        
        // Fixed: Use proper prompt construction
        const prompt = RSS_PROMPTS.newsletterQuality ? 
          RSS_PROMPTS.newsletterQuality({ title, snippet }) : 
          `Rewrite this news item concisely: ${title} - ${snippet.substring(0, 200)}`;

        try {
          const modelResp = await callOpenRouterModel(prompt);
          const rewritten = clampRewrite(modelResp);
          rewrittenItems.push({
            id: guid(),
            title: rewritten,
            link: item.link || "",
            pubDate: item.pubDate || new Date().toUTCString(),
            original: title,
          });
          safeLog("info", "🧠 Rewrote item", { 
            original: title.slice(0, 80),
            rewritten: rewritten.slice(0, 80)
          });
        } catch (err) {
          safeLog("error", "❌ Rewrite failed", { 
            title: title.slice(0, 80), 
            error: err.message 
          });
        }
      }
    }

    // Update cursor only if we have items to process
    if (feeds.length > 0 || urls.length > 0) {
      const nextCursor = {
        feedIndex: feeds.length > 0 ? (cursor.feedIndex + FEEDS_PER_RUN) % feeds.length : 0,
        urlIndex: urls.length > 0 ? (cursor.urlIndex + URLS_PER_RUN) % urls.length : 0,
      };
      await putJson(CURSOR_KEY, nextCursor);
      safeLog("info", "🧭 Cursor updated", { nextCursor });
    }

    if (rewrittenItems.length > 0) {
      await putJson(ITEMS_KEY, rewrittenItems);
      safeLog("info", "💾 Saved rewritten items", { 
        count: rewrittenItems.length, 
        key: ITEMS_KEY 
      });

      await rebuildRss(rewrittenItems);
      safeLog("info", "📢 RSS feed rebuilt and uploaded successfully");
    } else {
      safeLog("info", "💤 No items rewritten, skipping RSS rebuild");
    }

    safeLog("info", "🎯 Rewrite pipeline completed successfully");
    return { ok: true, count: rewrittenItems.length };
  } catch (err) {
    safeLog("error", "❌ runRewritePipeline failed", { 
      error: err?.message || String(err) 
    });
    if (err?.stack && (process.env.NODE_ENV || "").toLowerCase() === "development") {
      safeLog("error", "stack", { stack: err.stack });
    }
    throw err;
  }
            }
