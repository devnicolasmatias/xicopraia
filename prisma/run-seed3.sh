#!/bin/bash
# Executa seed3.ts na VPS via container temporário
# Necessário: estar no diretório /opt/sistemas/restaurante-gonzaga na VPS
#
# Para obter a DATABASE_URL atual:
#   docker exec restaurante_gonzaga_app env | grep DATABASE_URL

docker run --rm \
  --network restaurante-gonzaga_app-network \
  -e DATABASE_URL="postgresql://USER:PASSWORD@gonzaga-db:5432/bd_restaurante_gonzaga" \
  -v $(pwd):/workspace \
  -w /workspace \
  node:20-alpine \
  sh -c "apk add --no-cache openssl && npm ci && npx tsx prisma/seed3.ts"
