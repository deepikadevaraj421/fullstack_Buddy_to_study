# ---- Build stage: Node 20 Alpine ----
FROM node:20-alpine AS base

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
