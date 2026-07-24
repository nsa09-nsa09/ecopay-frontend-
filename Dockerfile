FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_APP_NAME=EcoPay
ARG VITE_SUPPORT_EMAIL
ARG VITE_INSTAGRAM_URL
ARG VITE_TIKTOK_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_SUPPORT_EMAIL=${VITE_SUPPORT_EMAIL}
ENV VITE_INSTAGRAM_URL=${VITE_INSTAGRAM_URL}
ENV VITE_TIKTOK_URL=${VITE_TIKTOK_URL}

COPY package.json ./

RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

# nginx official entrypoint runs envsubst on /etc/nginx/templates/*.template
# at container start, writing the result to /etc/nginx/conf.d/. We whitelist
# BACKEND_HOST so other "$variable" tokens in the config (Host, remote_addr,
# proxy_add_x_forwarded_for, scheme, http_upgrade) are NOT substituted at
# startup — nginx resolves them at request time.
ENV BACKEND_HOST=backend:8080
ENV NGINX_ENVSUBST_FILTER='^BACKEND_HOST$'

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
