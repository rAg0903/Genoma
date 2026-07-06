# Operação — Genoma CRM

Guia rápido para deploy, backups, logs e monitorização (Prioridade 3).

## Deploy com Docker

```bash
cp .env.docker.example .env
# Editar JWT_SECRET e passwords

docker compose up -d --build
```

Serviços:
- **frontend** — nginx na porta 80 (ou `FRONTEND_PORT`)
- **backend** — API Node na porta 3000 (interna); corre migrações no arranque
- **mariadb** — base de dados persistente

## Migrações

```bash
cd backend
npm run migrate
```

- Tabela `schema_migrations` regista ficheiros já aplicados
- Bases existentes sem tracking recebem **baseline** automático (sem reexecutar ALTERs)
- Falha em migração → exit code 1 (CI/deploy falha)

## Backups

```bash
# Manual (export completo)
cd backend && npm run export:database

# Backup com retenção (preferência mysqldump)
cd backend && npm run backup:database
```

Variáveis:
- `BACKUP_DIR` — pasta de destino (defeito: `database/backups`)
- `BACKUP_RETENTION_DAYS` — retenção (defeito: 30)

**Cron diário (produção Linux):**

```bash
0 2 * * * cd /opt/genoma/backend && BACKUP_DIR=/backups npm run backup:database >> /var/log/genoma-backup.log 2>&1
```

## Logging

- **Desenvolvimento:** Pino pretty no terminal
- **Produção:** JSON estruturado em stdout + `LOG_DIR/app.log`

Variáveis: `LOG_LEVEL` (info|warn|error|debug), `LOG_DIR`

## Health checks

| Endpoint | Uso |
|---|---|
| `GET /health/live` | Liveness — processo activo |
| `GET /health` | Readiness — inclui ping à BD (`503` se BD down) |

## Monitorização

- **Sentry (opcional):** definir `SENTRY_DSN` no backend
- **Uptime:** monitorizar `GET /health` externamente (UptimeRobot, etc.)

## Produção — checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` forte e único
- [ ] `SWAGGER_ENABLED=false` (defeito em produção)
- [ ] `KIT_AUTO_DESCARTE_ENABLED=true`
- [ ] Rate limit activo (desactivado só em `development`)
- [ ] Backup diário + teste de restore
- [ ] HTTPS via reverse proxy (nginx/traefik)

## Rollback

1. `docker compose down`
2. Restaurar backup: `mysql -u user -p genoma < /backups/genoma_YYYYMMDD.sql`
3. Deploy da imagem/tag anterior: `docker compose up -d`
