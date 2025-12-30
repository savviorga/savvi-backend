import { S3 } from 'aws-sdk';

export const getS3Client = new S3();

export const bucket =
  process.env.AWS_S3_BUCKET ?? 'savvi-documents';