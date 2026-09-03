# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY apps/web/package*.json ./
RUN npm install

COPY apps/web/ ./
RUN npm run build

# Production Serving Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA Nginx config to support client-side routing
RUN echo 'server { \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://api:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
