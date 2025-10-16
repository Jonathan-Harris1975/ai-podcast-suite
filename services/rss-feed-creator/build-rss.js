// ============================================================
// 🧠 AI Podcast Suite — Clean RSS Feed Builder (Minimal Layout)
// ============================================================
//
// Generates a valid RSS feed with no visible title/description
// Each item includes only GUID, link, and optional content.
// Works with Make.com + FeedFlow + TTS ingestion.
//
// ============================================================

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { log } from "#shared/logger.js";
import { R2_BUCKETS, putText } from "#shared/r2-client.js";

// ------------------------------------------------------------
// Helper: Build RSS XML
// ------------------------------------------------------------
function buildMinimalRSS(items, feedInfo = {}) {
  const now = new Date().toUTCString();
  const {
    title = "AI Feed Stream",
    link = "https://ai-news.jonathan-harris.online",
    description = "Automated AI Feed Stream",
  } = feedInfo;

  const rssItems = items
    .map((item) => {
      const guid = item.guid || `AI-${nanoid(8)}`;
      const pubDate = new Date(item.pubDate || Date.now()).toUTCString();

      return `
        <item>
          <guid>${guid}</guid>
          <link>${item.url || ""}</link>
          <pubDate>${pubDate}</pubDate>
          ${
            item.content
              ? `<content:encoded><![CDATA[${item.content}]]></content:encoded>`
              : ""
          }
        </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <language>en-gb</language>
      <lastBuildDate>${now}</lastBuildDate>
      ${rssItems}
    </channel>
  </rss>`;
}

// ------------------------------------------------------------
// 🧩 Build + Upload Feed
// ------------------------------------------------------------
export async function buildAndUploadMinimalFeed(activeData) {
  try {
    const { feeds = [], url = "" } = activeData;

    if (!feeds.length || !url) {
      log.error("rss.build.missingData", { feeds: feeds.length, url });
      return;
    }

    log.info("rss.build.start", { feedsUsed: feeds.length, outputUrl: url });

    const items = feeds.map((feed) => ({
      url: feed.link || feed.url || "",
      guid: feed.guid || `RSS-${nanoid(8)}`,
      pubDate: feed.pubDate || new Date().toISOString(),
      content: feed.summary || feed.contentSnippet || "",
    }));

    const rssXml = buildMinimalRSS(items, {
      title: "AI News Stream",
      link: url,
      description: "Automated minimal feed for AI Podcast Suite",
    });

    const filename = path.basename(url).replace(".xml", "") + ".xml";
    const bucket = R2_BUCKETS.RSS_FEEDS || R2_BUCKETS.META;

    await putText(bucket, filename, rssXml, "application/rss+xml");

    log.info("rss.build.uploaded", { bucket, filename });
    return { success: true, bucket, filename };
  } catch (err) {
    log.error("rss.build.failed", { error: err.message });
    throw err;
  }
}

// ------------------------------------------------------------
// 🧩 Backward Compatibility Export (Legacy Alias)
// ------------------------------------------------------------
export const rebuildRss = buildAndUploadMinimalFeed;
