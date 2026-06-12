FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

ARG NEXT_PUBLIC_QZ_CERTIFICATE
ENV NEXT_PUBLIC_QZ_CERTIFICATE=$NEXT_PUBLIC_QZ_CERTIFICATE

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone precisa da pasta public e .next/static manualmente
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia os arquivos gerados pelo build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copia e configura o entrypoint e banco
COPY --from=builder --chown=nextjs:nodejs /app/src/generated/prisma ./src/generated/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

USER root
RUN chmod +x docker-entrypoint.sh
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
