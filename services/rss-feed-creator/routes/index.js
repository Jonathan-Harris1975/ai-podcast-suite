// services/rss-feed-creator/index.js
import { uploadRssDataFiles } from "./bootstrap.js";
import { runRewritePipeline } from "./rewrite-pipeline.js";
import { log } from "#shared/logger.js";

export async function startFeedCreator() {
  log.info("rss.pipeline.start");
  await uploadRssDataFiles();     // 1) seed R2 with feeds.txt and urls.txt
  await runRewritePipeline();     // 2) rotate + build
  log.info("rss.pipeline.complete");
}

export default startFeedCreator;
