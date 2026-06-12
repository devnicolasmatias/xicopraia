#!/bin/sh
set -e

echo "Aguardando o banco de dados ficar pronto..."

# Forçamos a variável DATABASE_URL diretamente no comando usando --url
# Isso garante que o Prisma ignore falhas na leitura do prisma.config.ts ou .env
until npx prisma db push --schema=./prisma/schema.prisma --url="$DATABASE_URL" --accept-data-loss; do
  echo "Banco ainda não disponível ou erro de conexão - tentando novamente em 2 segundos..."
  sleep 2
done

echo "Tabelas sincronizadas com sucesso!"

echo "Iniciando a aplicação Next.js..."
exec node server.js
