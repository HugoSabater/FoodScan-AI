# ============================================
# FoodScan AI Frontend - Production Dockerfile
# Multi-stage build with Nginx
# ============================================

# ── Stage 1: Build Angular App ─────────────
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build Angular app for production
RUN npm run build -- --configuration production

# ── Stage 2: Serve with Nginx ──────────────
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from build stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
