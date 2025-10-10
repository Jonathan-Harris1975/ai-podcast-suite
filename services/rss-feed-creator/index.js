// /services/rss-feed-creator/index.js
import { generateFeed } from "./utils/feedGenerator.js"; // or whatever you use
import { writeFileSync } from "fs";

export async function startFeedCreator() {
  console.log("🟢 RSS Feed Creator is now active.");
  await generateFeed();
  // Example static file write, optional:
  writeFileSync("./public/rss.xml", "<rss>...</rss>");
}

// or, if simpler:
export default startFeedCreator;
