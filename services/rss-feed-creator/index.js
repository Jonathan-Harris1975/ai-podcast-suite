// services/rss-feed-creator/index.js
export async function startFeedCreator() {
  const { runRewritePipeline } = await import("./services/rewrite-pipeline.js");
  return runRewritePipeline();
}
export default startFeedCreator;
