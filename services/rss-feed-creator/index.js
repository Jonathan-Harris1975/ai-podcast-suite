// /services/rss-feed-creator/index.js — Fixed 2025-10-11
export async function startFeedCreator() {
  // Corrected relative path (remove redundant /services)
  const { runRewritePipeline } = await import("./rewrite-pipeline.js");
  if (typeof runRewritePipeline !== "function") {
    throw new Error("runRewritePipeline not exported correctly");
  }
  return await runRewritePipeline();
}

export default startFeedCreator;
