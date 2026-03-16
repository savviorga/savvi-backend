/**
 * Registra los path aliases para que Node resuelva @infrastructure/* y src/*
 * al ejecutar el código compilado en dist/.
 * Uso: node -r ./register-paths.js dist/main.js
 */
const path = require('path');

const distDir = path.resolve(__dirname, 'dist');

require('tsconfig-paths').register({
  baseUrl: distDir,
  paths: {
    '@infrastructure/*': [path.join(distDir, 'infrastructure', '*')],
    'src/*': [path.join(distDir, '*')],
  },
});
