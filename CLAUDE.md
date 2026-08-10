@AGENTS.md

## Deploy / Migração para nova VPS (ajustado 2026-08-10)

- **Tipo de deploy**: Docker **Swarm service** (`xicopraia_app`), deployado via `docker stack deploy -c xicopraia.yaml xicopraia` (stack file na raiz deste repo, não usado pelo `docker-compose.yml` — esse é só referência local de dev). Imagem `xicopraia:latest` buildada localmente.
- **Domínio**: `xicopraia.com.br`
- **Rede Traefik**: `SousaNet` (overlay attachable)
- **Certresolver**: `letsencryptresolver`
- **Porta interna**: 3000
- **Banco de dados**: **NÃO tem banco próprio** — usa o Postgres compartilhado do Swarm (`postgres_postgres`), banco `xicopraia_db`, usuário `xicopraia_user`. Mesmo padrão do projeto `pdv`.
- **Env vars**: estavam definidas direto no `xicopraia.yaml` (não em `.env` separado) — inclui `DATABASE_URL` com senha, `SESSION_SECRET`, `EVOLUTION_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE_NAME`. Trocar os segredos após a migração.
- **Dump do banco**: `/migration/db_dump_20260810.sql` (gerado via `pg_dump -U xicopraia_user xicopraia_db`). Restaurar na nova VPS com `psql -U xicopraia_user xicopraia_db < db_dump_20260810.sql`.
- **Nota**: este projeto (`/root/xicopraia`) não estava documentado na memória de infraestrutura antes desta migração — é o 6º projeto rodando em produção nesta VPS.
