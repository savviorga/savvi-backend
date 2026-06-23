# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 - production dependencies (con módulos nativos compilados para musl)
###############################################################################
FROM node:22-alpine AS deps
WORKDIR /app

# Toolchain solo para compilar dependencias nativas (bcrypt, pg). No queda
# en la imagen final.
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Solo dependencias de producción + tsconfig-paths (lo requiere register-paths.js
# en runtime). Reproducible gracias a package-lock.json.
RUN npm ci --omit=dev \
 && npm install --no-save tsconfig-paths@^4.2.0 \
 && npm cache clean --force

###############################################################################
# Stage 2 - build (compila TypeScript -> dist/)
###############################################################################
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

###############################################################################
# Stage 3 - runtime (imagen final mínima)
###############################################################################
FROM node:22-alpine AS runner

# Parches de seguridad del sistema + init para manejo de señales/zombies.
RUN apk upgrade --no-cache \
 && apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Solo lo necesario para ejecutar.
COPY --from=deps    /app/node_modules        ./node_modules
COPY --from=builder /app/dist                ./dist
COPY package.json register-paths.js ./

# Ejecutar como usuario sin privilegios (ya existe en la imagen oficial).
USER node

EXPOSE 3000

# tini como PID 1 -> reaping de procesos y forwarding de SIGTERM/SIGINT.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "-r", "./register-paths.js", "dist/main.js"]
