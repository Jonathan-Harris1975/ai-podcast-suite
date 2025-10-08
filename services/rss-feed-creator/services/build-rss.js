// services/build-rss.js
import { log } from "../../../utils/logger.js";

import { r2 } from "../utils/r2-client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET_RSS || "rss-feeds";

function cdata(s = "") {
  return `<![CDATA[${String(s).replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export async function rebuildRss(items = []) {
  try {
    const rssItems = items.map(item => `
      <item>
        <guid isPermaLink="false">${item.guid}</guid>
        <title>${cdata(item.title || "Untitled")}</title>
        <link>${item.shortUrl || item.url}</link>
        <description>${cdata(item.rewrite || "")}</description>
        <pubDate>${new Date(item.ts || Date.now()).toUTCString()}</pubDate>
      </item>`).join("\n");

    const feedUrl = `${process.env.R2_PUBLIC_BASE_URL_RSS || "https://jonathan-harris.online"}/rss.xml`;

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Newsletter with a Gen X flare to it</title>
    <link>https://jonathan-harris.online</link>
    <description>AI-powered RSS monitoring and rewriting system </description>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

    // ✅ Upload with correct Content-Type and UTF-8 charset
    for (const key of ["rss.xml", "data/rss.xml"]) {
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: Buffer.from(rss, "utf-8"),
          ContentType: "application/rss+xml; charset=utf-8",
        })
      );
      log.info({ key }, "📦 RSS feed uploaded to R2");
    }

    log.info("✅ rss.xml updated in R2");
  } catch (err) {
    log.error({ err }, "❌ Failed to rebuild RSS feed");
  }
}
