import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

export const bucket =
  process.env.AWS_S3_BUCKET ?? 'savvi-documents';