# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20.19-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
# Prisma schema + config are needed because the `postinstall` script runs
# `prisma generate` during `npm ci`.
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
# Skip Puppeteer's bundled Chrome — we use system Chromium on Alpine instead
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci
# Fail the build loudly if the native @node-rs/bcrypt prebuilt does not resolve on
# this Alpine/musl image — turns a silent runtime auth crash into a build error.
RUN node -e "require('@node-rs/bcrypt').hashSync('build-check',10)" && echo "native bcrypt OK"

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:20.19-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

# Build-time vars
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# NEXT_PUBLIC_* are inlined by `next build`, so they must be present at build time,
# not just at runtime. Umami's website id gates the analytics <script> in the root
# layout — without this ARG the gate compiles to nothing and no tracking loads.
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID

# DATABASE_URL is needed at build time because Next.js imports lib/db.ts during page data collection
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npm run build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:20.19-alpine AS runner
RUN apk add --no-cache \
  libc6-compat openssl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  udev
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# libuv threadpool — bcrypt (@node-rs) + fs/dns/crypto share it. Default is 4;
# raise it so concurrent logins (bcrypt) run in parallel instead of queueing.
ENV UV_THREADPOOL_SIZE=16
# Point Puppeteer to Alpine's system Chromium (avoids glibc vs musl mismatch)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + config + full node_modules for entrypoint (prisma db push needs all deps)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
