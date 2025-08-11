# Build stage
FROM node:18-alpine AS builder

# Install dependencies for building
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies for prisma
RUN apk add --no-cache openssl bash

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Create startup script  
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "=== Starting application ==="' >> /app/start.sh && \
    echo 'echo "DATABASE_URL: ${DATABASE_URL:0:40}..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Generate Prisma client and push schema' >> /app/start.sh && \
    echo 'echo "Generating Prisma client..."' >> /app/start.sh && \
    echo 'cd /app && npx prisma generate || echo "Prisma generate failed"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Pushing database schema..."' >> /app/start.sh && \
    echo 'npx prisma db push --skip-generate --accept-data-loss || echo "Schema push failed, continuing anyway"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh

RUN chmod +x /app/start.sh

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000

# Start the application with migration
CMD ["/app/start.sh"]