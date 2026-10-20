import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertRequiredEnv } from './config/env';
import { getCorsOrigins } from './config/cors';
import { QueryFailedFilter } from './common/filters/query-failed.filter';

async function bootstrap() {
  assertRequiredEnv();
  getCorsOrigins();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  // Swagger solo fuera de producción (o con SWAGGER_ENABLED=true).
  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV !== 'production';

  // Cabeceras de seguridad. La CSP estricta rompe la UI de Swagger (scripts
  // en línea), así que solo se desactiva cuando Swagger está activo.
  app.use(
    helmet({ contentSecurityPolicy: swaggerEnabled ? false : undefined }),
  );

  // Detrás de un proxy (Nginx, Caddy…) la IP real llega en X-Forwarded-For:
  // TRUST_PROXY indica cuántos saltos confiar. Sin proxy no se define.
  const trustProxy = Number(process.env.TRUST_PROXY);
  if (Number.isInteger(trustProxy) && trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }

  app.useGlobalFilters(new QueryFailedFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Savvi API')
      .setDescription(
        'Documentación de la API REST de Savvi. Para probar endpoints protegidos: 1) obtén un token en POST /auth/login, 2) pulsa Authorize y pega el token.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT',
      )
      .addTag('auth', 'Registro, login y emisión de JWT')
      .addTag('profile', 'Perfil del usuario y resumen de métricas')
      .addTag('accounts', 'Gestión de cuentas del usuario')
      .addTag('categories', 'Categorías de ingreso/egreso')
      .addTag('budgets', 'Presupuestos mensuales y partidas')
      .addTag('transactions', 'Transacciones y archivos adjuntos')
      .addTag('payment-planner', 'Deudas y registro de pagos')
      .addTag('transfer-templates', 'Plantillas de transferencias recurrentes')
      .addTag('reminders', 'Recordatorios generados por las plantillas')
      .addTag('s3', 'URLs prefirmadas para S3')
      .addTag('waitinglist', 'Lista de espera pública')
      .addTag('app', 'Endpoints generales / health')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
      },
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `Listening on ${port}${swaggerEnabled ? ` — Swagger: http://localhost:${port}/docs` : ''}`,
  );
}
void bootstrap();
