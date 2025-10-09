import { validateR2Once, s3, R2_BUCKETS } from "../../r2-client.js";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const {
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_TRANSCRIPTS,
  R2_ENDPOINT,
  R2_PUBLIC_BASE_URL_TRANSCRIPT
} = process.env;

if (!R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_TRANSCRIPTS || !R2_ENDPOINT || !R2_PUBLIC_BASE_URL_TRANSCRIPT) {
  throw new Error('Missing one or more required R2 environment variables for transcripts.');
}

const s3 = /* replaced: use shared s3 from services/r2-client.js */ s3;

export default async function uploadToR2(filePath, key) {
  const fs = await import('fs');
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_TRANSCRIPTS,
    Key: key,
    Body: fileContent,
    ContentType: 'text/plain'
  });

  await s3.send(command);

  const base = R2_PUBLIC_BASE_URL_TRANSCRIPT.endsWith('/') ? R2_PUBLIC_BASE_URL_TRANSCRIPT.slice(0, -1) : R2_PUBLIC_BASE_URL_TRANSCRIPT;
  return `${base}/${key}`;
}

await validateR2Once();
