// services/rss-feed-creator/build-rss.js
// Builds valid RSS 2.0 XML with proper formatting and uploads as text/xml

import { putObject } from "../shared/utils/r2-client.js"; // ✅ ensures text upload
import { info, error } from "../shared/utils/logger.js";

const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL_RSS;
const FEED_TITLE = process.env.RSS_FEED_TITLE || "AI News (Rewritten)";
const FEED_DESC = process.env.RSS_FEED_DESCRIPTION || "Concise AI news rewrites.";
const FEED_LINK = PUBLIC_BASE || "https://rss-feeds.jonathan-harris.online";

/** Clean and sanitize text for RSS XML */
function sanitize(str = "") {
  return str
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove markdown bold
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a valid RSS XML document */
export async function rebuildRss(items = []) {
  try {
    const now = new Date().toUTCString();

    const rssItems = items
      .map((it) => {
        const title = sanitize(it.title);
        const description = sanitize(it.original || it.title);
        const link = (it.link || "").toLowerCase();
        const pubDate = new Date(it.pubDate || now).toUTCString();

        return `
      <item>
        <guid isPermaLink="false">${it.id}</guid>
        <title>${title}</title>
        <link>${link}</link>
        <pubDate>${pubDate}</pubDate>
        <description>${description}</description>
      </item>`;
      })
      .join("\n");

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

    // ✅ Upload to R2 as plain XML
    await putObject(RSS_BUCKET, "feed.xml", xml, "application/rss+xml");

    info("rss.build.success", {
      bucket: RSS_BUCKET,
      items: items.length,
      url: `${FEED_LINK}/feed.xml`,
    });

    return xml;
  } catch (err) {
    error("rss.build.fail", { error: err.message });
    throw err;
  }
}
