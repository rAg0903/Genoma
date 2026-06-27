# Base de dados — CRM Genoma

Este directório contém exportações SQL da base de dados `genoma` para partilha entre ambientes.

## Ficheiro principal

| Ficheiro | Descrição |
|---|---|
| `genoma_export.sql` | Schema + dados completos (exportação actual) |

## Como importar (colega)

### Pré-requisitos

- MariaDB 10.x ou MySQL 8.x instalado
- Cliente `mysql` na linha de comandos (ou HeidiSQL / DBeaver)

### Opção A — Linha de comandos

```bash
# Criar/importar (ajustar user e password)
mysql -u root -p < database/genoma_export.sql
```

### Opção B — Só recriar a BD `genoma`

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS genoma;"
mysql -u root -p < database/genoma_export.sql
```

### Depois de importar

1. Copiar `backend/.env.example` para `backend/.env` e ajustar credenciais da BD
2. Na raiz do projecto: `npm install`
3. `npm run migrate` (opcional — o dump já inclui schema e dados)
4. `npm run backend:dev` e `npm run frontend:dev`

### Credenciais de teste (se incluídas no dump)

| Perfil | Email | Password |
|---|---|---|
| Admin | `admin.teste@genoma.local` | `Teste1234!` |
| Médico | `anaclaraferreira@genoma.pt` | `Teste1234!` |

> Se o login falhar, executar `npm run seed:admin --prefix backend` após importar.

## Regenerar exportação (autor do projecto)

```bash
npm run export:database --prefix backend
```

O ficheiro `genoma_export.sql` será actualizado com o estado actual da BD local.
