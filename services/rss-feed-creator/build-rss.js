// ============================================================
// 🧠 AI Podcast Suite — Clean RSS Feed Builder
// ============================================================
//
// - Builds sanitized XML feeds for Make.com + readers
// - Removes "Title:" / "Description:" prefixes
// - Removes markdown & duplicates
// - Retains only one readable text block per entry
// - Compatible with R2 upload & Rewrite Pipeline
// ============================================================

import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { log } from "#shared/logger.js";
import { putText } from "#shared/r2-client.js";
import { R2_BUCKETS } from "#shared/r2-client.js";

const outputBucket = R2_BUCKETS.RSS_FEEDS || R2_BUCKETS.META || "podcast-meta";

// ------------------------------------------------------------
// 🧼 Sanitizer
// ------------------------------------------------------------
function sanitize(text = "") {
  return text
    .replace(/^Title:\s*/gi, "")
    .replace(/^Description:\s*/gi, "")
    .replace(/^Summary:\s*/gi, "")
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove markdown bold
    .replace(/\*(.*?)\*/g, "$1")     // remove markdown italics
    .replace(/<[^>]*>/g, "")         // strip HTML tags
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------------
// 🧩 Build Feed XML
// ------------------------------------------------------------
export async function buildRSSFeed({ items, outputFile, feedTitle, feedUrl }) {
  try {
    const safeTitle = sanitize(feedTitle || "AI News with a Gen-X Touch");
    const safeLink = feedUrl || "https://ai-news.jonathan-harris.online/feed.xml";

    // Header
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
    xml += `<channel>\n`;
    xml += `  <title><![CDATA[${safeTitle}]]></title>\n`;
    xml += `  <link>${safeLink}</link>\n`;
    xml += `  <description><![CDATA[AI news rewritten with a Gen-X touch — clean & ready for TTS.]]></description>\n`;
    xml += `  <language>en-gb</language>\n`;
    xml += `  <atom:link href="${safeLink}" rel="self" type="application/rss+xml"/>\n\n`;

    // Items
    for (const item of items) {
      const title = sanitize(item.title || "");
      const summary = sanitize(item.summary || item.contentSnippet || "");
      const link = item.link || item.url || "#";
      const pubDate = item.pubDate ? new Date(item.pubDate).toUTCString() : new Date().toUTCString();

      xml += `  <item>\n`;
      xml += `    <title><![CDATA[${title}]]></title>\n`;
      xml += `    <link>${link}</link>\n`;
      xml += `    <guid isPermaLink="false">${item.guid || "RSS-" + nanoid(8)}</guid>\n`;
      xml += `    <pubDate>${pubDate}</pubDate>\n`;

      // ✅ Only clean summary shown once
      xml += `    <description><![CDATA[${summary}]]></description>\n`;

      // Optional: full encoded content for advanced readers
      if (item.fullText) {
        const cleanFull = sanitize(item.fullText);
        xml += `    <content:encoded><![CDATA[${cleanFull}]]></content:encoded>\n`;
      }

      xml += `  </item>\n`;
    }

    // Footer
    xml += `</channel>\n</rss>\n`;

    // Write locally (for inspection)
    if (outputFile) {
      fs.writeFileSync(outputFile, xml, "utf-8");
    }

    // Upload to R2
    const key = path.basename(outputFile || "ai-news-feed.xml");
    await putText(outputBucket, key, xml, "application/rss+xml; charset=utf-8");

    log.info("✅ RSS Feed built & uploaded successfully", {
      items: items.length,
      key,
      bucket: outputBucket,
    });
    return { key, xml };
  } catch (err) {
    log.error("❌ RSS Feed build failed", { error: err.message });
    throw err;
  }
}
