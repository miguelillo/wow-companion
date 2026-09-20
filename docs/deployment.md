# Despliegue

## Qué se despliega

Cuatro servicios en un VPS propio (OVH, Ubuntu), con Docker Compose:

- `proxy` — Caddy, único puerto abierto. Enruta `/api/*` a la API y el resto al sitio.
- `web` — nginx sirviendo el build estático de Astro.
- `api` — .NET 8.
- `postgres` — datos de cuenta y progreso (fase 6 en adelante).

Al ir todo detrás del mismo origen, el navegador llama a `/api/...` sin CORS y sin URL
absoluta compilada en el build. Por eso `PUBLIC_API_URL` va vacío en producción.

## Primer despliegue

```bash
git clone https://github.com/miguelillo/wow-companion.git
cd wow-companion
cp .env.example .env         # rellena POSTGRES_PASSWORD y PUBLIC_SITE_URL
docker compose -f docker-compose.yml up -d --build
```

`docker-compose.override.yml` es sólo para desarrollo local: **no** lo uses en el VPS, por
eso el comando pasa `-f docker-compose.yml` de forma explícita.

Para TLS, pon en `.env` `SITE_ADDRESS=wowcompanion.tudominio` (sin esquema) y publica el
puerto 443: Caddy pide y renueva el certificado solo.

## Actualizaciones

El build lo hace GitHub Actions (`.github/workflows/ci.yml`: formato, lint, tipos, build del
sitio, build de la API y build de las imágenes). En el VPS, un `git pull` y
`docker compose up -d --build` bastan mientras no publiquemos imágenes a un registro.

## Cliente de escritorio

Se distribuirá sin firmar de momento. Windows mostrará el aviso de SmartScreen: hay que
pulsar en «Más información» y luego en «Ejecutar de todas formas». Se documentará en el
README del cliente cuando llegue la fase 8.
