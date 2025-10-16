// services/rss-feed-creator/rewrite-pipeline.js
import { getObjectAsText, putText, R2_BUCKETS } from "#shared/r2-client.js";
import { log } from "#shared/logger.js";
import { rebuildRss } from "./build-rss.js";

export async function runRewritePipeline() {
  try {
    log.info("rewrite.pipeline.start");

    const bucket = R2_BUCKETS.RSS_FEEDS;

    // 1️⃣  Load both text files from R2
    const feedsTxt = await getObjectAsText(bucket, "feeds.txt");
    const urlsTxt = await getObjectAsText(bucket, "urls.txt");

    if (!feedsTxt || !urlsTxt) {
      throw new Error("Missing feeds.txt or urls.txt in R2 bucket");
    }

    // 2️⃣  Parse and rotate — 5 feeds + 1 URL per batch
    const feedList = feedsTxt.split(/\r?\n/).filter(Boolean);
    const urlList = urlsTxt.split(/\r?\n/).filter(Boolean);

    const nextFeeds = feedList.splice(0, 5);
    const nextUrl = urlList.splice(0, 1)[0];

    // Rotate lists for next run
    const rotatedFeeds = [...feedList, ...nextFeeds].join("\n");
    const rotatedUrls = [...urlList, nextUrl].join("\n");

    await putText(bucket, "feeds.txt", rotatedFeeds);
    await putText(bucket, "urls.txt", rotatedUrls);

    log.info("rss.rotation.complete", {
      feedsUsed: nextFeeds.length,
      nextUrl,
    });

    // 3️⃣  Rebuild feed
    await rebuildRss(nextFeeds, nextUrl);
    log.info("rewrite.pipeline.complete");
  } catch (err) {
    log.error("rewrite.pipeline.fail", { error: err.message });
    throw err;
  }
}
