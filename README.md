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

Copia `.env.example` a `.env` y complétalo. Las principales:

```env
PORT=3000

# PostgreSQL (esquema "finance")
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=savvi
# DB_SSL=false   # opcional, ver nota abajo

# Firma de los JWT: OBLIGATORIO, mínimo 32 caracteres (openssl rand -base64 48)
JWT_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=savvi-bucket

# Dominios del frontend, separados por comas: OBLIGATORIO en producción
CORS_ORIGINS=https://app.savvi.co

# Email
EMAIL_PROVIDER=resend
EMAIL_FROM=
RESEND_API_KEY=
```

Opcionales:

| Variable | Para qué |
|---|---|
| `TRUST_PROXY=1` | La API está detrás de Nginx/Caddy: toma la IP real del cliente (límites de intentos de login). |
| `S3_MANAGE_CORS=false` | No reescribir el CORS del bucket al arrancar (si se administra desde la infraestructura). |
| `AI_DAILY_LIMIT_USD`, `AI_MONTHLY_LIMIT_USD`, `AI_REQUESTS_PER_MINUTE` | Topes de Savvi IA por usuario (por defecto 1 USD/día, 10 USD/mes, 20 peticiones/min). |
| `SWAGGER_ENABLED=true` | Expone `/docs` aunque `NODE_ENV=production`. |
| `DB_LOGGING=true` | Registra todas las queries SQL (solo para depurar). |

> Sin `JWT_SECRET` (o con `CORS_ORIGINS` vacío en producción) la API no arranca y lo dice en el log.

> El `.env` está excluido de Git y de la imagen Docker. Nunca lo subas al repositorio.

### SSL de la base de datos (`DB_SSL`)

- **Sin definir:** se usa SSL automáticamente si `DB_HOST` no es `localhost` ni `127.0.0.1`.
- **`DB_SSL=true` o `1`:** fuerza SSL.
- **`DB_SSL=false` o `0`:** desactiva SSL, aunque el host sea remoto.

Si al desplegar aparece `The server does not support SSL connections`, el Postgres de ese entorno no tiene SSL: agrega `DB_SSL=false` en las variables del despliegue.

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

La API queda disponible en `http://localhost:3000` y la documentación Swagger en **`http://localhost:3000/docs`** (en producción `/docs` está apagado salvo que definas `SWAGGER_ENABLED=true`).

## Migraciones

El esquema se cambia **solo con migraciones** (`synchronize` está apagado). La API no las aplica sola al arrancar: hay que correrlas en cada despliegue que las traiga.

### En desarrollo (TypeScript, con `ts-node`)

```bash
npm run migration:show       # lista las migraciones: [X] aplicada, [ ] pendiente
npm run migration:run        # aplica las pendientes
npm run migration:revert     # revierte la última
npm run migration:generate   # genera una migración a partir de las entidades
```

### En producción (sobre `dist/`)

En producción solo existe el código compilado en `dist/`: no hay `src/` ni `ts-node`
(son dependencias de desarrollo), así que `npm run migration:run` **no funciona ahí**.
Usa las variantes `:prod`, que corren el CLI de TypeORM con
`dist/config/typeorm.config.js` y las migraciones compiladas en `dist/migrations/`:

```bash
npm run build                  # solo fuera de Docker: compila src/ -> dist/ (borra dist/ antes)
npm run migration:show:prod    # qué falta aplicar (sale con código 1 si hay pendientes)
npm run migration:run:prod     # aplica las pendientes
npm run migration:revert:prod  # revierte la última, si algo salió mal
```

Equivalen a:

```bash
node -r ./register-paths.js ./node_modules/typeorm/cli.js migration:run -d dist/config/typeorm.config.js
```

- Toman la base de las variables de entorno (`DB_*`); si existe un `.env` en la carpeta también lo leen, pero **no pisan** variables ya definidas.
- Una migración que no está compilada en `dist/` no existe para estos comandos: compila (o reconstruye la imagen) antes de migrar.
- Las pendientes se aplican en una sola transacción: si una falla, no queda ninguna a medias.
- **Haz un respaldo de la base antes de migrar en producción** (`pg_dump`), sobre todo si la migración transforma datos.

Para Docker, ver [Desplegar una versión nueva](#desplegar-una-versión-nueva-git-pull).

## Datos de ejemplo (seed)

```bash
npm run seed            # puebla la base con ~5.100 registros de ejemplo
npm run seed -- --purge # vacía TODAS las tablas antes de sembrar
```

Genera un escenario completo y coherente: 5 usuarios con perfiles distintos
(empleado, freelance, comerciante, docente y practicante), sus cuentas y
categorías, ~24 meses de transacciones con comercios y montos reales en pesos,
presupuestos por mes con partidas, deudas con abonos enlazados a su transacción,
plantillas de transferencia con recordatorios, adjuntos y jobs de IA.

- **Determinista:** la misma semilla produce siempre los mismos datos.
- **Repetible:** antes de sembrar borra lo de la corrida anterior (los usuarios
  con dominio `@savvi.demo`), así nunca duplica. El resto de la base no se toca,
  salvo que uses `--purge`.
- **Usuarios de prueba:** `juan.hernandez@savvi.demo`, `valentina.rios@savvi.demo`,
  `andres.mejia@savvi.demo`, `laura.gomez@savvi.demo`, `santiago.castano@savvi.demo`
  — todos con la contraseña `Savvi2026*`.

> Los adjuntos son registros en `documents` de archivos que no existen en S3: la
> lista de documentos funciona, pero descargar la URL prefirmada responde 404.

Apunta a la base del `.env`, así que revisa `DB_NAME` antes de ejecutarlo. Si las
tablas no existen, corre primero `npm run migration:run`. Es solo para desarrollo:
usa `ts-node`, que no está en la imagen de producción.

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
# Primera vez: crear las tablas con la misma imagen
docker run --rm --env-file .env savvi-backed npm run migration:run:prod

# Toma las variables del .env local
docker run -d --name savvi-backed --env-file .env --restart unless-stopped -p 4051:3000 savvi-backed
```

La API quedará en `http://localhost:4051` (el puerto de la derecha en `-p` debe ser el `PORT` del `.env`; la imagen usa 3000 si no lo defines).

### ¿Modifiqué el archivo `.env`?

Las variables de entorno se leen **al arrancar el contenedor**, no en caliente. No hace falta reconstruir la imagen: detén el contenedor y vuelve a lanzarlo para que tome los nuevos valores.

```bash
docker stop savvi-backed && docker rm savvi-backed
docker run -d --name savvi-backed --env-file .env --restart unless-stopped -p 4051:3000 savvi-backed

```

### Desplegar una versión nueva (`git pull`)

Si los cambios tocan el código fuente, dependencias (`package.json`/`package-lock.json`), migraciones o el `Dockerfile`, hay que **reconstruir la imagen**, **migrar con la imagen nueva** y recrear el contenedor:

```bash
git pull
docker build -t savvi-backed .

# 1. Respaldo de la base (recomendado si hay migraciones)
pg_dump -h <DB_HOST> -U <DB_USERNAME> -d <DB_NAME> -n finance -Fc -f savvi-$(date +%F).dump

# 2. Ver y aplicar las migraciones con la imagen NUEVA (contenedor temporal)
docker run --rm --env-file .env savvi-backed npm run migration:show:prod
docker run --rm --env-file .env savvi-backed npm run migration:run:prod

# 3. Reemplazar el contenedor
docker stop savvi-backed && docker rm savvi-backed
docker run -d --name savvi-backed --env-file .env --restart unless-stopped -p 4051:3000 savvi-backed
```

> **No uses `docker exec savvi-backed npm run migration:run`**: dentro del contenedor no existen `src/` ni `ts-node`, y además el contenedor en ejecución tiene el `dist/` de la versión **anterior**, sin las migraciones nuevas. Migra siempre con la imagen recién construida, antes de reemplazar el contenedor.

Si algo sale mal después de migrar:

```bash
docker run --rm --env-file .env savvi-backed npm run migration:revert:prod   # revierte la última; repítelo para ir más atrás
```

> Si solo cambió el `.env` → recrear el contenedor (sin reconstruir ni migrar).
> Si cambió el código, las dependencias, las migraciones o el `Dockerfile` → reconstruir la imagen, migrar y recrear.

### Migraciones recientes

Se aplican en este orden con `migration:run:prod`:

| Migración | Qué hace |
|---|---|
| `1776000000000-AddLoginLockoutToUsers` | Contador de intentos fallidos y bloqueo temporal del login. |
| `1776100000000-CreateAiUsageTable` | Tabla `ai_usage` para los topes de gasto de Savvi IA. |
| `1776200000000-LinkTransactionsToAccounts` | La cuenta de cada transacción pasa de texto a `account_id` (FK). Enlaza las filas existentes por id o por nombre único; el texto viejo queda en `legacy_account`. **Transforma datos: respalda antes.** |
| `1776300000000-AddSessionSecurity` | `tokenVersion` en usuarios (cerrar sesiones al cambiar contraseña o email) y datos del reto 2FA. |
| `1776400000000-AddTransferDestinationToTransactions` | `to_account_id`: cuenta destino de las transferencias entre cuentas propias. |

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
├── seeds/                # Seeder de datos de ejemplo (npm run seed)
├── infrastructure/       # Código transversal / utilidades
├── migrations/           # Migraciones de base de datos
└── main.ts               # Bootstrap de la aplicación
```
