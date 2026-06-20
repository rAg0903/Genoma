# 🚀 Guia de Início Rápido

## Prerequisitos

- **Node.js**: v18.0.0 ou superior
- **NPM**: v9.0.0 ou superior  
- **MariaDB**: v10.x ou PostgreSQL v13.x
- **Git**: Para controle de versão

## 📦 Instalação

### 1. Clonar Repositório
```bash
git clone <repository-url> app_genoma
cd app_genoma/backend
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Copiar template
cp .env.example .env

# Editar arquivo .env com suas credenciais
# Exemplo:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=genoma
# JWT_SECRET=seu_segredo_muito_secreto_aqui
```

### 4. Executar Migrations
```bash
npm run migrate
```

Isso criará todas as tabelas necessárias no banco de dados.

## ⚡ Executar Aplicação

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

Saída esperada:
```
╔════════════════════════════════════════════════════════════╗
║        🧬 API Genoma - Sistema de Laboratório Genómico    ║
╠════════════════════════════════════════════════════════════╣
║ Status:    ✅ Online e operacional                        ║
║ Porta:     🔌 3000                                         ║
║ Ambiente:  🌍 development                                 ║
║ Hora:      ⏰ 04/03/2026, 10:30:45                         ║
╠════════════════════════════════════════════════════════════╣
║ Documentação da API:                                       ║
║   📖 http://localhost:3000/api-docs                        ║
║                                                            ║
║ Health Check:                                              ║
║   ❤️  http://localhost:3000/health                         ║
║                                                            ║
║ API Base URL:                                              ║
║   🔗 http://localhost:3000/api                             ║
╚════════════════════════════════════════════════════════════╝
```

### Modo Produção
```bash
npm start
```

## 🧪 Testar API

### Health Check
```bash
curl http://localhost:3000/health
```

### Acessar Swagger Documentation
```
http://localhost:3000/api-docs
```

### Fazer Requisição Autenticada
```bash
# 1. Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@genoma.lab",
    "password": "password123"
  }'

# 2. Usar token recebido
curl http://localhost:3000/api/pacientes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 Estrutura do Projeto

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes completos sobre:
- Arquitetura da aplicação
- Fluxo de requisições
- Padrões de desenvolvimento
- Boas práticas implementadas

## 🔧 Scripts Disponíveis

```bash
# Iniciar servidor (produção)
npm start

# Iniciar servidor (desenvolvimento com reload)
npm run dev

# Executar migrations
npm run migrate

# Deletar todas as tabelas (CUIDADO!)
npm run drop

# Executar testes
npm test

# Executar testes contínuos
npm run test:watch

# Lint (verificar código)
npm run lint

# Formatar código
npm run format
```

## 📋 Variáveis de Ambiente Necessárias

```env
# Servidor
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=genoma
DB_CHARSET=utf8mb4

# JWT
JWT_SECRET=seu_segredo_jwt_muito_secreto_aqui_123456789
JWT_EXPIRE=7d

# Logs
LOG_LEVEL=development
LOG_DIR=./logs

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🐛 Troubleshooting

### Erro: "Porta 3000 já está em uso"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro: "Variáveis de ambiente faltando"
- Verifique se arquivo `.env` existe na raiz do `backend/`
- Compare com `.env.example`
- Garanta que `dotenv` está instalado: `npm install dotenv`

### Erro: "Connection refused" ao banco de dados
- Verifique se MariaDB está rodando
- Confirme credenciais em `.env`
- Teste conexão: `mysql -h localhost -u root -p`

### Erro: "JWT_SECRET não definido"
- Adicione `JWT_SECRET` no arquivo `.env`
- Exemplo: `JWT_SECRET=$(openssl rand -hex 32)`

## 📞 Support

Para sugestões ou problemas:
1. Verifique [README.md](./README.md)
2. Consulte [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Abra issue no GitHub

---

**Última atualização**: Março 2026  
**Versão**: 1.0.0
