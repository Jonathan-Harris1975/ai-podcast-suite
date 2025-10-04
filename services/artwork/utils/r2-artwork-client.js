// utils/r2-artwork-client.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload base64 PNG to R2 and return public URL.
 * @param {string} imageBase64 - Base64 encoded PNG
 * @param {string} filename - Target filename
 * @returns {Promise<string>} Public URL to image
 */
export async function uploadToR2(imageBase64, filename) {
  const buffer = Buffer.from(imageBase64, "base64");

  if (!buffer.length) {
    throw new Error("Empty image buffer");
  }

  const putCommand = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: "image/png",
  });

  await r2.send(putCommand);

  return `${process.env.R2_PUBLIC_BASE_URL}/${filename}`;
}
