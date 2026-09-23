# ---- Stage 1: Build the React + Vite app ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci --legacy-peer-deps \
    && npm install --no-save --legacy-peer-deps lightningcss-linux-x64-musl

# Copy source code and config files needed for build
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/

# Build with VITE_API_URL set to relative path so Nginx proxies API calls
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
