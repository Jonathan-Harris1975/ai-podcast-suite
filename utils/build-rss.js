import {s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText} from "../../r2-client.js";
// services/build-rss.js
import { log } from "../../../utils/logger.js";
import { putText } from "../utils/r2-client.js"; // ✅ fixed import
import { PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET_RSS || "rss-feeds";

function cdata(s = "") {
  return `<![CDATA[${String(s).replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export async function rebuildRss(items = []) {
  try {
    const rssItems = items
      .map(
        (item) => `
      <item>
        <guid isPermaLink="false">${item.guid}</guid>
        <title>${cdata(item.title || "Untitled")}</title>
        <link>${item.shortUrl || item.url}</link>
        <description>${cdata(item.rewrite || "")}</description>
        <pubDate>${new Date(item.ts || Date.now()).toUTCString()}</pubDate>
      </item>`
      )
      .join("\n");

    const feedUrl = `${process.env.R2_ENDPOINT}/${BUCKET}/feed.xml`;

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${cdata(process.env.PODCAST_TITLE || "AI Podcast")}</title>
    <link>${process.env.PODCAST_URL || "https://example.com"}</link>
    <description>${cdata(
      process.env.PODCAST_DESCRIPTION || "Weekly AI updates"
    )}</description>
    <language>en-gb</language>
    ${rssItems}
  </channel>
</rss>`;

    await putText(`${BUCKET}/feed.xml`, rssXml); // ✅ save feed to R2

    log.info(`✅ RSS feed rebuilt successfully → ${feedUrl}`);
    return { success: true, url: feedUrl };
  } catch (err) {
    log.error("❌ Failed to rebuild RSS feed:", err);
    throw err;
  }
                                    }
