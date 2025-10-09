// services/utils/r2-validate.js
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
} = process.env;

export async function validateR2Once() {
  console.log("🌐 ...");
  const s3 = /* replaced: use shared s3 from services/r2-client.js */ s3;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET_RSS_FEEDS }));
    
  } catch (err) {
    
    console.error("   Error:", err.name);
    console.error("   Message:", err.message);
    if (err.$metadata?.httpStatusCode) console.error("   HTTP:", err.$metadata.httpStatusCode);
    throw err;
  }
  console.log("🧩 .");
}

await validateR2Once();
