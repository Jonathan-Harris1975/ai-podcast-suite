import { putText, BUCKETS } from "../../shared/utils/r2-client.js";
import { log } from "../../shared/utils/logger.js";

export async function rebuildRss(items, { title = "AI Podcast Suite — Rewrites", link = "https://ai-podcast-suite", description = "Fresh AI/tech news, rewritten crisp." } = {}) {
  const now = new Date().toUTCString();
  const xmlItems = (items || []).map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link || ""}</link>
      <guid>${item.id}</guid>
      <pubDate>${new Date(item.pubDate || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${item.title}]]></description>
    </item>
  `).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <description><![CDATA[${description}]]></description>
      <lastBuildDate>${now}</lastBuildDate>
      ${xmlItems}
    </channel>
  </rss>`;

  const bucket = BUCKETS.PODCAST_RSS_FEEDS || BUCKETS.RSS_FEEDS;
  if (!bucket) {
    log("⚠️ No RSS bucket configured (R2_BUCKET_PODCAST_RSS_FEEDS or R2_BUCKET_RSS_FEEDS). RSS not uploaded.");
    return { uploaded: false };
  }
  const key = "ai-rewrites.xml";
  await putText(bucket, key, xml, "application/rss+xml; charset=utf-8");
  log("📢 RSS rebuilt & uploaded", { bucket, key, count: items?.length || 0 });
  return { uploaded: true, bucket, key };
}
