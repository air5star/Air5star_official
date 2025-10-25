# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# Ensure Prisma client and engines are available at runtime
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Include Prisma CLI so start script can run `npx prisma db push` without network fetch
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
# Include transitive dependency used by @prisma/config at runtime
COPY --from=builder /app/node_modules/jiti ./node_modules/jiti
COPY --from=builder /app/start.js ./start.js

EXPOSE 8080
CMD ["node", "start.js"]