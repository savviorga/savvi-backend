export class PresignedUrlResponseDto {
  url: string;
  key: string;
  bucket: string;
  expiresIn: number;
  operation: 'putObject' | 'getObject';
} 