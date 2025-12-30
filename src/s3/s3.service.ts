import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { bucket, getS3Client } from '@infrastructure/config/s3.config';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { PresignedUrlResponseDto } from './dto/presigned-url.dto';
import { UploadS3Response } from './types';

@Injectable()
export class S3Service {
  constructor() { }
  
  async upload(
    folder: string,
    file: Express.Multer.File,
  ): Promise<UploadS3Response> {
    const s3 = getS3Client;
    try {
      const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!fileBuffer) {
        throw new Error('No se proporcionó buffer ni path para el archivo a subir');
      }
      const contentType =
        mime.lookup(file.originalname) || 'application/octet-stream';

      const params = {
        Bucket: bucket,
        Key: `${folder}/${file.originalname}`,
        Body: fileBuffer,
        ContentType: contentType,
        ContentLength: fileBuffer.length,
      };
      const result = await s3.upload(params).promise();

      if (file.path) {
        fs.unlinkSync(file.path);
      }

      if (result && result.Location) {
        console.log('Archivo subido exitosamente a:', result.Location);
        return {
          message: 'Archivo CSV cargado correctamente a S3',
          filename: file.originalname,
          bucket: bucket,
          url: `https://${bucket}.s3.us-east-1.amazonaws.com/${folder}/${file.originalname}`,
          key: params.Key,
        };
      } else {
        throw new Error('La subida no fue exitosa');
      }
    } catch (error: any) {
      console.log(error);
      throw new InternalServerErrorException({
        message: 'Error al subir el archivo a S3',
        detail: error?.message || error,
      });
    }
  }

  async getFileStream(bucket: string, folder: string, key: string) {
    const s3 = getS3Client;
    const params = {
      Bucket: bucket,
      Key: `${folder}/${key}`,
    };
    try {
      return s3.getObject(params).createReadStream();
    } catch (error) {
      console.error('Error descargando archivo:', error);
      new InternalServerErrorException('Error al descargar el archivo:', error);
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    const s3 = getS3Client;
    const params = {
      Bucket: bucket,
      Key: key,
    };
    try {
      const result = await s3.getObject(params).promise();
      return result.Body as Buffer;
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw new InternalServerErrorException('Error al descargar el archivo:', error);
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
    const s3 = getS3Client;
    const params = {
      Bucket: bucket,
      Prefix: prefix,
    };
    try {
      const result = await s3.listObjectsV2(params).promise();
      return result.Contents?.map(obj => obj.Key).filter((key): key is string => key !== undefined) || [];
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
      const s3 = getS3Client;
      const key = `${folder}/${fileName}`;
      const contentType = mime.lookup(fileName) || 'application/octet-stream';

      const params = {
        Bucket: bucket,
        Key: key,
        ...(operation === 'putObject' && { ContentType: contentType }),
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise(operation, params);

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

  // Método específico para generar URL de subida (PUT)
  async generateUploadUrl(
    folder: string,
    fileName: string,
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResponseDto> {
    return this.generatePresignedUrl(folder, fileName, 'putObject', expiresIn);
  }

  // Método específico para generar URL de descarga (GET)
  async generateDownloadUrl(
    folder: string,
    fileName: string,
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResponseDto> {
    return this.generatePresignedUrl(folder, fileName, 'getObject', expiresIn);
  }

  // Devuelve una URL prefirmada de descarga para una ruta relativa
  async getPresignedUrl(relativePath: string, expiresIn: number = 3600): Promise<string> {
    const [folder, ...fileParts] = relativePath.split('/');
    const fileName = fileParts.join('/');
    const presigned = await this.generatePresignedUrl(folder, fileName, 'getObject', expiresIn);
    return presigned.url;
  }
}
