// services/rss-feed-creator/build-rss.js
import { putText } from "../shared/utils/r2-client.js";
import { info } from "../shared/utils/logger.js";

const FEED_BUCKET = process.env.R2_BUCKET_RSS_FEEDS;
const PUBLIC_RSS_URL = process.env.R2_PUBLIC_BASE_URL_RSS;
const FEED_KEY = process.env.RSS_FEED_KEY || "ai-news.xml";

export async function rebuildRss(items) {
  const now = new Date().toUTCString();
  const xmlItems = items.map(it => {
    const esc = (s) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
      <item>
        <guid isPermaLink="false">${esc(it.id)}</guid>
        <title>${esc(it.title)}</title>
        ${it.link ? `<link>${esc(it.link)}</link>` : ""}
        <pubDate>${esc(it.pubDate || now)}</pubDate>
        <description>${esc(it.title)}</description>
      </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI News (Rewritten)</title>
    <link>${PUBLIC_RSS_URL || ""}</link>
    <description>Concise AI news rewrites.</description>
    <lastBuildDate>${now}</lastBuildDate>
    ${xmlItems}
  </channel>
</rss>`;

  if (!FEED_BUCKET) {
    throw new Error("R2_BUCKET_RSS_FEEDS is not set");
  }

  await putText(FEED_BUCKET, FEED_KEY, xml, "application/rss+xml; charset=utf-8");
  info("rss.uploaded", { bucket: FEED_BUCKET, key: FEED_KEY, publicUrl: PUBLIC_RSS_URL ? `${PUBLIC_RSS_URL}/${FEED_KEY}` : null });
}