// utils/s3client.js
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// -------------------- Bucket Constants --------------------
// Define once here so all utils can import consistently
export const R2_BUCKET_RAW = process.env.R2_BUCKET_RAW;             // raw TTS chunks
export const R2_BUCKET_MERGED = process.env.R2_BUCKET_MERGED;       // merged TTS chunks
export const R2_BUCKET_PODCAST = process.env.R2_BUCKET_PODCAST;     // final podcast files
