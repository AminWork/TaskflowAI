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



# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 