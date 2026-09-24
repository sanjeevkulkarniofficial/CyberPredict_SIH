# Multi-stage build for React/Vite with Node 22 (LTS)
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build static production assets
COPY . .
RUN npm run build

# Serve with lightweight Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]