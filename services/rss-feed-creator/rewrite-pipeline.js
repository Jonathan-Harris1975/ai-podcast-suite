// services/rss-feed-creator/rewrite-pipeline.js
import { getObjectAsText, putText, R2_BUCKETS } from "#shared/r2-client.js";
import { log } from "#shared/logger.js";
import { rebuildRss } from "./build-rss.js";
import { uploadRssDataFiles } from "./bootstrap.js"; // ⬅ add this

export async function runRewritePipeline() {
  try {
    log.info("rewrite.pipeline.start");

    const bucket = R2_BUCKETS.RSS_FEEDS;

    // 1️⃣ Load both text files from R2, with auto-repair if missing
    let feedsTxt, urlsTxt;
    try {
      feedsTxt = await getObjectAsText(bucket, "feeds.txt");
      urlsTxt  = await getObjectAsText(bucket, "urls.txt");
    } catch (e) {
      log.warn("rss.missing.textfiles", { bucket, error: e.message });
      await uploadRssDataFiles(); // ⬅ re-upload
      feedsTxt = await getObjectAsText(bucket, "feeds.txt");
      urlsTxt  = await getObjectAsText(bucket, "urls.txt");
    }

    if (!feedsTxt || !urlsTxt) {
      throw new Error("feeds.txt or urls.txt missing after bootstrap");
    }

    // … keep your rotation logic and at the end:
    await rebuildRss(nextFeeds, nextUrl);
    log.info("rewrite.pipeline.complete");
  } catch (err) {
    log.error("rewrite.pipeline.fail", { error: err.message });
    throw err;
  }
}
