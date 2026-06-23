# Savvi Backend

API REST de **Savvi**, construida con [NestJS 11](https://nestjs.com/) + [TypeORM](https://typeorm.io/) sobre PostgreSQL. Incluye autenticación JWT, gestión de cuentas, presupuestos, transacciones, planificador de pagos y almacenamiento de archivos en AWS S3.

## Stack

- **Runtime:** Node.js 22
- **Framework:** NestJS 11
- **Base de datos:** PostgreSQL (TypeORM)
- **Auth:** JWT (Passport)
- **Almacenamiento:** AWS S3 (URLs prefirmadas)
- **Docs:** Swagger / OpenAPI

## Requisitos

- Node.js >= 22
- PostgreSQL
- (Opcional) Docker

## Variables de entorno

Crea un archivo `.env` en la raíz:

```env
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=savvi

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=savvi-bucket
```

> El `.env` está excluido de Git y de la imagen Docker. Nunca lo subas al repositorio.

## Instalación

```bash
npm install
```

## Ejecución (desarrollo)

```bash
npm run start:dev      # con hot-reload
npm run start          # sin watch
npm run start:prod     # producción (sobre dist/)
```

La API queda disponible en `http://localhost:3000` y la documentación Swagger en **`http://localhost:3000/docs`**.

## Migraciones

```bash
npm run migration:generate   # genera una migración a partir de las entidades
npm run migration:run        # aplica las migraciones pendientes
npm run migration:revert     # revierte la última migración
```

## Build

```bash
npm run build        # compila TypeScript -> dist/
```

El arranque en producción usa los alias de rutas vía `register-paths.js`:

```bash
node -r ./register-paths.js dist/main.js
```

## Docker

La imagen es multi-stage (build + runtime), basada en `node:22-alpine`, corre como usuario sin privilegios y usa `tini` como init. El `.dockerignore` evita copiar `node_modules`, `.env`, dumps y demás artefactos.

### Construir la imagen

```bash
docker build -t savvi-backed .
```

### Ejecutar el contenedor

```bash
# Toma las variables del .env local
docker run -d --name savvi-backed --env-file .env --restart unless-stopped -p 4051:3000 savvi-backed
```

La API quedará en `http://localhost:3000` y Swagger en `http://localhost:3000/docs`.

### ¿Modifiqué el archivo `.env`?

Las variables de entorno se leen **al arrancar el contenedor**, no en caliente. No hace falta reconstruir la imagen: detén el contenedor y vuelve a lanzarlo para que tome los nuevos valores.

```bash
docker stop savvi-backed && docker rm savvi-backed
docker run -d --name savvi-backed --env-file .env --restart unless-stopped -p 4051:3000 savvi-backed

```

### ¿Traje cambios nuevos del repositorio? (`git pull`)

Si los cambios tocan el código fuente, dependencias (`package.json`/`package-lock.json`) o el `Dockerfile`, hay que **reconstruir la imagen** y recrear el contenedor:

```bash
git pull
docker build -t savvi-backed .

docker stop savvi-backed && docker rm savvi-backed
docker run -d --name savvi-backed --env-file .env --restart unless-stopped -p 4051:3000 savvi-backed
```

Si los cambios incluyen **migraciones de base de datos**, ejecútalas dentro del contenedor en ejecución:

```bash
docker exec savvi-backed npm run migration:run
```

> Si solo cambió el `.env` → recrear el contenedor (sin reconstruir).
> Si cambió el código, las dependencias o el `Dockerfile` → reconstruir la imagen (`docker build`).

## Tests

```bash
npm run test          # unitarios
npm run test:e2e      # end-to-end
npm run test:cov      # cobertura
```

## Estructura

```text
src/
├── auth/                 # Registro, login y emisión de JWT
├── accounts/             # Cuentas del usuario
├── categories/           # Categorías de ingreso/egreso
├── budgets/              # Presupuestos mensuales y partidas
├── transactions/         # Transacciones y adjuntos
├── payment-planner/      # Deudas y registro de pagos
├── transfer-templates/   # Plantillas de transferencias recurrentes
├── waitinglist/          # Lista de espera pública
├── s3/                   # URLs prefirmadas para S3
├── ai-register/          # Registro asistido por IA
├── config/               # Configuración (TypeORM, etc.)
├── infrastructure/       # Código transversal / utilidades
├── migrations/           # Migraciones de base de datos
└── main.ts               # Bootstrap de la aplicación
```
