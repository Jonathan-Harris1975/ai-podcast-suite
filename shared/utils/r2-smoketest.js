// services/shared/utils/r2-smoketest.js
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2 } from "./r2-client.js";

const buckets = [
  { name: "R2_BUCKET_RSS_FEEDS", value: process.env.R2_BUCKET_RSS_FEEDS },
  { name: "R2_BUCKET_ARTWORK", value: process.env.R2_BUCKET_ARTWORK },
  { name: "R2_BUCKET_RAW_TEXT", value: process.env.R2_BUCKET_RAW_TEXT },
  { name: "R2_BUCKET_PODCAST_CHUNKS", value: process.env.R2_BUCKET_PODCAST_CHUNKS },
  { name: "R2_BUCKET_MERGED", value: process.env.R2_BUCKET_MERGED },
  { name: "R2_BUCKET_META", value: process.env.R2_BUCKET_META },
];

export async function runR2SmokeTest() {
  console.log("\n🧪 Running R2 smoke test (read-only)...");
  for (const b of buckets) {
    if (!b.value) {
      console.warn(`⚠️  ${b.name} not set; skipping.`);
      continue;
    }
    try {
      const data = await r2.send(new ListObjectsV2Command({ Bucket: b.value, MaxKeys: 3 }));
      const items = (data.Contents || []).map(o => o.Key).slice(0, 3);
      console.log(`✅ ${b.value} reachable (${items.length} objects)`);
      if (items.length) console.log(`   → ${items.join(", ")}`);
    } catch (err) {
      const msg = (err && (err.$metadata && err.$metadata.httpStatusCode)) || err?.name || err?.message;
      console.warn(`⚠️  Could not list ${b.value}: ${msg}`);
    }
  }
  console.log("🧪 R2 smoke test complete.\n");
}
