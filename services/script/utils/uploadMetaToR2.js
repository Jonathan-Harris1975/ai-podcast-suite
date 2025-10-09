import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_META_BUCKET,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL_META
} = process.env;

if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_META_BUCKET || !R2_ENDPOINT || !R2_PUBLIC_BASE_URL_META) {
  throw new Error('Missing one or more required R2 environment variables for metadata uploads.');
}

const s3 = /* replaced: use shared s3 from services/r2-client.js */ s3;

export default async function uploadMetaToR2(sessionId, keySuffix, content) {
  const key = `${sessionId}-${keySuffix}.txt`;

  const command = new PutObjectCommand({
    Bucket: R2_META_BUCKET,
    Key: key,
    Body: content,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const base = R2_PUBLIC_BASE_URL_META.endsWith('/') ? R2_PUBLIC_BASE_URL_META.slice(0, -1) : R2_PUBLIC_BASE_URL_META;
  return `${base}/${key}`;
}
