import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*', // o especifica ["http://127.0.0.1:5500"] si usas Live Server
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Listening on ${port} — Swagger: http://localhost:${port}/docs`);
}
void bootstrap();
