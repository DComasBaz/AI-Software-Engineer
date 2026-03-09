# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Dependency install
#   Separated from the build stage so that Docker can cache node_modules
#   independently from source-code changes.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only manifests first — this layer is invalidated only when deps change
COPY package.json package-lock.json* ./

RUN npm ci --frozen-lockfile


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Build
#   Vite embeds VITE_* variables at build time, so we accept them as ARGs here.
#   Pass them at build time:
#     docker build --build-arg VITE_API_BASE=https://api.example.com .
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE=http://localhost:8000/api/v1
ENV VITE_API_BASE=$VITE_API_BASE

# Reuse cached node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source (after node_modules to keep invalidation fast)
COPY . .

RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Production image
#   Minimal nginx:alpine — no Node runtime, no source code, no dev deps.
#   Final image is typically ~25 MB.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Install custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Run nginx as a non-root user for better security
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Verify nginx config is valid before starting
RUN nginx -t

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
