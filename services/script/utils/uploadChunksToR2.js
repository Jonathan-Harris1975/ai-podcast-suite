import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_CHUNKS,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL_CHUNKS
} = process.env;

if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_CHUNKS || !R2_ENDPOINT || !R2_PUBLIC_BASE_URL_CHUNKS) {
  throw new Error('Missing one or more required R2 environment variables for chunks.');
}

const s3 = /* replaced: use shared s3 from services/r2-client.js */ s3;

export default async function uploadChunksToR2(filePath, key) {
  const fs = await import('fs');
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_CHUNKS,
    Key: key,
    Body: fileContent,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const base = R2_PUBLIC_BASE_URL_CHUNKS.endsWith('/') ? R2_PUBLIC_BASE_URL_CHUNKS.slice(0, -1) : R2_PUBLIC_BASE_URL_CHUNKS;
  return `${base}/${key}`;
}
