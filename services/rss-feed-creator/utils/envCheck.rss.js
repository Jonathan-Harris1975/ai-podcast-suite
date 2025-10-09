import {s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText} from "../../r2-client.js";
import { log } from "../../../utils/logger.js";

const REQUIRED = [
  "R2_BUCKET_RSS_FEEDS",
  "R2_BUCKET_RSS_FEEDS",
  "R2_BUCKET_RAW_TEXT",
  "R2_BUCKET_RSS_FEEDS",
  "R2_PUBLIC_BASE_URL_RSS_FEEDS",
  "R2_PUBLIC_BASE_URL_RSS_FEEDS",
  "R2_PUBLIC_BASE_URL_RAW_TEXT",
  "R2_PUBLIC_BASE_URL_RSS_FEEDS",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ACCOUNT_ID",
  "R2_ENDPOINT"
];

export function checkEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    log.error({ missing }, "❌ Missing required env for rss-feed-creator");
    process.exit(1);
  }
  log.info("✅ rss-feed-creator env OK");
}
