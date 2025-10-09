import { validateR2Once, s3, R2_BUCKETS } from "../../r2-client.js";
// utils/r2-artwork-client.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = /* replaced: use shared s3 from services/r2-client.js */ s3;

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

await validateR2Once();
