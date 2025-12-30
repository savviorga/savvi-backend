import { Controller, Get, Query } from '@nestjs/common';
import { S3Service } from './s3.service';
import { PresignedUrlResponseDto } from './dto/presigned-url.dto';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Get('presigned-url')
  async generatePresignedUrl(
    @Query('folder') folder: string,
    @Query('fileName') fileName: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<PresignedUrlResponseDto> {
    return this.s3Service.generatePresignedUrl(folder, fileName, 'putObject', expiresIn);
  }

} 