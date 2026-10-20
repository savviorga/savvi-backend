import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucket } from '../infrastructure/config/s3.config';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { UploadS3Response } from './types';
import { Readable } from 'stream';
import {
  buildUserKey,
  resolveUploadModule,
  UPLOAD_URL_TTL_SECONDS,
} from './s3-keys';
import { getCorsOrigins } from '../config/cors';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);

  async onModuleInit() {
    await this.ensureBucketCors();
  }

  /**
   * Deja el CORS del bucket con los mismos orígenes de la API (`CORS_ORIGINS`)
   * para la subida directa con URL prefirmada. Con `S3_MANAGE_CORS=false` no
   * se toca y se administra desde la infraestructura.
   */
  private async ensureBucketCors(): Promise<void> {
    if (process.env.S3_MANAGE_CORS === 'false') return;
    try {
      await s3Client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['Content-Type'],
                AllowedMethods: ['PUT', 'GET', 'HEAD'],
                AllowedOrigins: getCorsOrigins(),
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
      this.logger.log(`CORS configurado correctamente en bucket "${bucket}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `No se pudo configurar CORS en bucket "${bucket}": ${message}. ` +
          'Configúralo manualmente en la consola de AWS si la subida directa falla.',
      );
    }
  }

  async upload(
    folder: string,
    file: Express.Multer.File,
  ): Promise<UploadS3Response> {
    try {
      const fileBuffer =
        file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!fileBuffer) {
        throw new Error(
          'No se proporcionó buffer ni path para el archivo a subir',
        );
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
      throw new InternalServerErrorException(
        'Error al descargar el archivo:',
        error,
      );
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
      throw new InternalServerErrorException(
        'Error al descargar el archivo:',
        error,
      );
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
      return (
        result.Contents?.map((obj) => obj.Key).filter(
          (k): k is string => k != null,
        ) ?? []
      );
    } catch (error) {
      console.error('Error listando archivos:', error);
      throw new InternalServerErrorException(
        'Error al listar archivos:',
        error,
      );
    }
  }

  /**
   * Elimina un objeto del bucket a partir de su key completa.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      this.logger.log(`Archivo eliminado de S3: ${key}`);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      throw new InternalServerErrorException({
        message: 'Error al eliminar el archivo de S3',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Elimina varios objetos del bucket en una sola petición (máx. 1000 keys).
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
      this.logger.log(`Archivos eliminados de S3: ${keys.length}`);
    } catch (error) {
      console.error('Error eliminando archivos:', error);
      throw new InternalServerErrorException({
        message: 'Error al eliminar los archivos de S3',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * URL prefirmada (PUT) para que el cliente suba directo a S3. La key la
   * genera el servidor dentro del prefijo del usuario; el tamaño y el tipo
   * quedan firmados, así que S3 rechaza un archivo distinto al declarado.
   */
  async createUserUploadUrl(
    userId: string,
    input: {
      filename: string;
      contentType: string;
      fileSize: number;
      folder?: string;
    },
  ): Promise<{ url: string; key: string; expiresIn: number }> {
    const module = resolveUploadModule(input.folder);
    const key = buildUserKey(userId, module, input.filename);
    try {
      const url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: input.contentType,
          ContentLength: input.fileSize,
        }),
        {
          expiresIn: UPLOAD_URL_TTL_SECONDS,
          signableHeaders: new Set(['content-type', 'content-length']),
        },
      );
      return { url, key, expiresIn: UPLOAD_URL_TTL_SECONDS };
    } catch (error: unknown) {
      this.logger.error('Error generando URL prefirmada de subida', error);
      throw new InternalServerErrorException(
        'Error al generar la URL firmada para subida',
      );
    }
  }

  /** Tamaño y tipo de un objeto, o `null` si no existe. */
  async getObjectInfo(
    key: string,
  ): Promise<{ size: number; contentType: string | null } | null> {
    try {
      const head = await s3Client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return {
        size: Number(head.ContentLength ?? 0),
        contentType: head.ContentType ?? null,
      };
    } catch (error: unknown) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 404 || status === 403) return null;
      this.logger.error(`Error consultando ${key} en S3`, error);
      throw new InternalServerErrorException(
        'No se pudo verificar el archivo en S3',
      );
    }
  }

  /** URL prefirmada de descarga (GET) para una key completa. */
  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      return await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn },
      );
    } catch (error: unknown) {
      this.logger.error(`Error generando URL de descarga para ${key}`, error);
      throw new InternalServerErrorException(
        'Error al generar la URL firmada de descarga',
      );
    }
  }
}
