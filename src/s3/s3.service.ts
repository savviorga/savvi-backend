import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucket } from '../infrastructure/config/s3.config';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { PresignedUrlResponseDto } from './dto/presigned-url.dto';
import { UploadS3Response } from './types';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  constructor() {}

  async upload(
    folder: string,
    file: Express.Multer.File,
  ): Promise<UploadS3Response> {
    try {
      const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!fileBuffer) {
        throw new Error('No se proporcionó buffer ni path para el archivo a subir');
      }
      const contentType =
        mime.lookup(file.originalname) || 'application/octet-stream';
      const key = `${folder}/${file.originalname}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          ContentLength: fileBuffer.length,
        }),
      );

      if (file.path) {
        fs.unlinkSync(file.path);
      }

      console.log('Archivo subido exitosamente a:', key);
      return {
        message: 'Archivo CSV cargado correctamente a S3',
        filename: file.originalname,
        bucket,
        url: `https://${bucket}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`,
        key,
      };
    } catch (error: any) {
      console.log(error);
      throw new InternalServerErrorException({
        message: 'Error al subir el archivo a S3',
        detail: error?.message || error,
      });
    }
  }

  async getFileStream(bucketName: string, folder: string, key: string) {
    try {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: `${folder}/${key}`,
        }),
      );
      return result.Body as Readable;
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw new InternalServerErrorException('Error al descargar el archivo:', error);
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      const stream = result.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw new InternalServerErrorException('Error al descargar el archivo:', error);
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
    try {
      const result = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
        }),
      );
      return (result.Contents?.map((obj) => obj.Key).filter((k): k is string => k != null)) ?? [];
    } catch (error) {
      console.error('Error listando archivos:', error);
      throw new InternalServerErrorException('Error al listar archivos:', error);
    }
  }

  async generatePresignedUrl(
    folder: string,
    fileName: string,
    operation: 'putObject' | 'getObject' = 'putObject',
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResponseDto> {
    try {
      const key = `${folder}/${fileName}`;
      const contentType = mime.lookup(fileName) || 'application/octet-stream';

      const url =
        operation === 'putObject'
          ? await getSignedUrl(
              s3Client,
              new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentType: contentType,
              }),
              { expiresIn },
            )
          : await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: bucket,
                Key: key,
              }),
              { expiresIn },
            );

      return {
        url,
        key,
        bucket,
        expiresIn,
        operation,
      };
    } catch (error: any) {
      console.error(`Error generating presigned URL for ${operation}:`, error);
      throw new InternalServerErrorException({
        message: `Error al generar la URL firmada para ${operation}`,
        detail: error?.message || error,
      });
    }
  }

  async generateUploadUrl(
    folder: string,
    fileName: string,
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResponseDto> {
    return this.generatePresignedUrl(folder, fileName, 'putObject', expiresIn);
  }

  async generateDownloadUrl(
    folder: string,
    fileName: string,
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResponseDto> {
    return this.generatePresignedUrl(folder, fileName, 'getObject', expiresIn);
  }

  async getPresignedUrl(relativePath: string, expiresIn: number = 3600): Promise<string> {
    const [folder, ...fileParts] = relativePath.split('/');
    const fileName = fileParts.join('/');
    const presigned = await this.generatePresignedUrl(folder, fileName, 'getObject', expiresIn);
    return presigned.url;
  }
}
