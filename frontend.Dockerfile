# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install deps first (better cache)
COPY package*.json ./
RUN npm install --legacy-peer-deps --loglevel=error

# Copy the rest of the frontend source
COPY . .

# Build the production assets
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:stable-alpine AS runtime

# Remove default Nginx static assets config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (adds proxy for /api and websocket upgrade)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 