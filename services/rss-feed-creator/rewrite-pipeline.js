// services/rss-feed-creator/rewrite-pipeline.js
import { getObjectAsText, putText, R2_BUCKETS } from "#shared/r2-client.js";
import { log } from "#shared/logger.js";
import { rebuildRss } from "./build-rss.js";
import { uploadRssDataFiles } from "./bootstrap.js";

const FEEDS_KEY = "feeds.txt";
const URLS_KEY  = "urls.txt";

function parseListFile(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

function rotate(list, n = 1) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const k = Math.min(n, list.length);
  return [...list.slice(k), ...list.slice(0, k)];
}

export async function runRewritePipeline() {
  const bucket = R2_BUCKETS.RSS_FEEDS;

  try {
    log.info("rewrite.pipeline.start", { bucket, feedsKey: FEEDS_KEY, urlsKey: URLS_KEY });

    // 1) Load files (self-heal if missing)
    let feedsTxt, urlsTxt;
    try {
      feedsTxt = await getObjectAsText(bucket, FEEDS_KEY);
      urlsTxt  = await getObjectAsText(bucket, URLS_KEY);
    } catch (e) {
      log.warn("rss.missing.textfiles", { bucket, error: e.message });
      await uploadRssDataFiles();
      feedsTxt = await getObjectAsText(bucket, FEEDS_KEY);
      urlsTxt  = await getObjectAsText(bucket, URLS_KEY);
    }

    // 2) Parse and validate
    const feeds = parseListFile(feedsTxt);
    const urls  = parseListFile(urlsTxt);
    if (feeds.length === 0) throw new Error("feeds.txt parsed to 0 usable lines");
    if (urls.length  === 0) throw new Error("urls.txt parsed to 0 usable lines");

    const batchFeeds = feeds.slice(0, 5);
    const batchUrl   = urls[0];

    if (batchFeeds.length < 5) {
      log.warn("rss.batch.feeds.lessThanFive", { count: batchFeeds.length });
    }

    log.info("rss.batch.selected", {
      feedsCount: batchFeeds.length,
      urlChosen: batchUrl
    });

    // 3) Build + upload RSS
    try {
      await rebuildRss(batchFeeds, batchUrl);
    } catch (e) {
      log.error("rss.build.fail", {
        error: e.message,
        stack: e.stack?.slice(0, 600),
        feedsCount: batchFeeds.length,
        url: batchUrl
      });
      throw e; // rethrow so caller marks pipeline failed
    }

    // 4) Rotate lists and persist back to R2
    const rotatedFeeds = rotate(feeds, 5);
    const rotatedUrls  = rotate(urls, 1);

    await putText(bucket, FEEDS_KEY, rotatedFeeds.join("\n") + "\n");
    await putText(bucket, URLS_KEY,  rotatedUrls.join("\n") + "\n");

    log.info("rss.rotate.persisted", {
      feedsTotal: rotatedFeeds.length,
      urlsTotal: rotatedUrls.length
    });

    log.info("rewrite.pipeline.complete");
  } catch (err) {
    log.error("rewrite.pipeline.fail", { error: err.message, stack: err.stack?.slice(0, 600) });
    throw err;
  }
}

export default runRewritePipeline;
