# Builds the static site and serves it with nginx. The site is static on purpose:
# guides must be indexable and must render even when the API is down.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY web/package.json web/
RUN pnpm install --frozen-lockfile
COPY web web
ARG PUBLIC_SITE_URL=http://localhost:8080
ARG PUBLIC_API_URL=
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
