import { writeFileSync } from 'node:fs';

const configuredApiUrl = process.env.API_URL?.trim();

if (!configuredApiUrl && process.env.VERCEL) {
  console.error('Falta configurar API_URL en las variables del proyecto de Vercel.');
  process.exit(1);
}

const apiUrl = (configuredApiUrl || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const parsedUrl = new URL(apiUrl);

if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
  console.error('API_URL debe ser una URL HTTP o HTTPS válida.');
  process.exit(1);
}

if (process.env.VERCEL && parsedUrl.protocol !== 'https:') {
  console.error('API_URL debe utilizar HTTPS al compilar en Vercel.');
  process.exit(1);
}

writeFileSync(
  new URL('../src/environments/environment.production.generated.ts', import.meta.url),
  `export const environment = {\n  production: true,\n  apiUrl: ${JSON.stringify(apiUrl)}\n};\n`,
);

console.log(`Environment de producción generado para ${parsedUrl.origin}.`);
