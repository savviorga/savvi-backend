# syntax=docker/dockerfile:1

###############################################################################
# Stage 1 - build (instala dependencias y compila TypeScript -> dist/)
###############################################################################
# Un solo `npm ci` para todo. Antes había dos etapas independientes —una con
# las dependencias de producción y otra con el árbol completo— que BuildKit
# lanzaba EN PARALELO: dos instalaciones de node_modules escribiendo en el
# mismo disco a la vez, y el árbol entero por duplicado.
FROM node:22-alpine AS builder
WORKDIR /app

# Toolchain solo para compilar dependencias nativas (bcrypt, pg). No queda
# en la imagen final.
RUN apk add --no-cache python3 make g++

COPY package*.json ./
# Reproducible gracias a package-lock.json. La caché de npm sobrevive entre
# builds (no se vuelve a descargar todo) y `sharing=locked` hace que dos builds
# simultáneos se turnen en vez de saturar el disco a la vez.
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci

COPY . .
RUN npm run build

###############################################################################
# Stage 2 - dependencias de producción
###############################################################################
# Se RECORTA el árbol ya instalado en vez de instalarlo otra vez: los módulos
# nativos siguen compilados para musl y no hay una segunda descarga. Lo que
# el runtime necesita de las antiguas devDependencies —tsconfig-paths, que
# carga register-paths.js— está declarado como dependencia de producción en
# package.json, así que sobrevive al recorte.
FROM builder AS prod-deps
RUN npm prune --omit=dev

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
COPY --from=prod-deps /app/node_modules        ./node_modules
COPY --from=builder   /app/dist                ./dist
COPY package.json register-paths.js ./

# Ejecutar como usuario sin privilegios (ya existe en la imagen oficial).
USER node

EXPOSE 3000

# tini como PID 1 -> reaping de procesos y forwarding de SIGTERM/SIGINT.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "-r", "./register-paths.js", "dist/main.js"]
