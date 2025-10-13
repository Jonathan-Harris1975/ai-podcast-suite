// services/rss-feed-creator/build-rss.js
// Properly writes raw XML to R2 with correct MIME type

import { info, error } from "../shared/utils/logger.js";
import { r2Client } from "../shared/utils/r2-client.js"; // ensure r2Client is exported

const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL_RSS;
const FEED_TITLE = process.env.RSS_FEED_TITLE || "AI News (Rewritten)";
const FEED_DESC = process.env.RSS_FEED_DESCRIPTION || "Concise AI news rewrites.";
const FEED_LINK = PUBLIC_BASE || "https://ai-news.jonathan-harris.online";

function sanitize(str = "") {
  return str
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\s+/g, " ")
    .trim();
}

export async function rebuildRss(items = []) {
  try {
    const now = new Date().toUTCString();

    const rssItems = items.map(it => `
      <item>
        <guid isPermaLink="false">${it.id}</guid>
        <title>${sanitize(it.title)}</title>
        <link>${it.link}</link>
        <pubDate>${new Date(it.pubDate || now).toUTCString()}</pubDate>
        <description>${sanitize(it.original || it.title)}</description>
      </item>`).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${sanitize(FEED_TITLE)}</title>
    <link>${FEED_LINK}</link>
    <description>${sanitize(FEED_DESC)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>AI Podcast Suite (OpenRouter Rewrite Engine)</generator>
    <atom:link href="${FEED_LINK}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

    // ✅ Upload raw XML (NOT JSON-stringified)
    const encoder = new TextEncoder();
    const body = encoder.encode(xml);

    await r2Client.putObject({
      Bucket: RSS_BUCKET,
      Key: "feed.xml",
      Body: body,
      ContentType: "application/rss+xml; charset=utf-8",
    });

    info("rss.build.success", { bucket: RSS_BUCKET, items: items.length, url: `${FEED_LINK}/feed.xml` });
    return xml;
  } catch (err) {
    error("rss.build.fail", { error: err.message });
    throw err;
  }
}
