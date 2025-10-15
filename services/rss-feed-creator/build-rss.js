// services/rss-feed-creator/build-rss.js
// Builds and uploads the main RSS feed to Cloudflare R2

import { putText, putJson } from "#shared/r2-client.js";
import { info, error } from "#shared/logger.js";

const RSS_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;
const FEED_TITLE = process.env.RSS_FEED_TITLE || "AI News (Rewritten)";
const FEED_DESC = process.env.RSS_FEED_DESC || "Concise AI news rewrites for professionals.";
const FEED_LINK = process.env.R2_PUBLIC_BASE_URL_RSS || "https://ai-news.jonathan-harris.online";
const MAX_FEED_ITEMS = parseInt(process.env.MAX_FEED_ITEMS || "50", 10);

export async function rebuildRss(itemsOut = []) {
  try {
    if (!Array.isArray(itemsOut) || itemsOut.length === 0) {
      error("rss.build.empty", {});
      return;
    }

    // Sort newest first and trim old items
    const items = itemsOut
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, MAX_FEED_ITEMS);

    const now = new Date().toUTCString();

    const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${FEED_TITLE}</title>
    <link>${FEED_LINK}</link>
    <description>${FEED_DESC}</description>
    <lastBuildDate>${now}</lastBuildDate>
${items.map(it => `
    <item>
      <guid isPermaLink="false">${it.id}</guid>
      <title><![CDATA[${it.title}]]></title>
      <link>${it.link}</link>
      <pubDate>${it.pubDate}</pubDate>
      <description><![CDATA[${it.title}]]></description>
    </item>`).join("\n")}
  </channel>
</rss>`;

    // Save both XML and JSON versions to R2
    await putText(RSS_BUCKET, "feed.xml", xml, "application/rss+xml; charset=utf-8");
    await putJson(RSS_BUCKET, "feed.json", items);

    info("rss.build.success", {
      bucket: RSS_BUCKET,
      count: items.length,
      url: `${FEED_LINK}/feed.xml`
    });

  } catch (err) {
    error("rss.build.fail", { error: err.message, stack: err.stack });
    throw err;
  }
}
