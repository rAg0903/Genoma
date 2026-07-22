# CRM Genoma — Guia de Instalação

Este documento explica como instalar e arrancar o **CRM Genoma** num computador novo (Mac ou Windows), para avaliação ou uso interno.

---

## 1. O que precisa de instalar primeiro

| Software | Versão mínima | Mac | Windows |
|----------|---------------|-----|---------|
| **Node.js** | 18 ou superior | [nodejs.org](https://nodejs.org) ou `brew install node` | [nodejs.org](https://nodejs.org) |
| **MariaDB** ou **MySQL** | 10.6+ | `brew install mariadb` | [MariaDB](https://mariadb.org/download/) ou MySQL |
| **npm** | 10+ | Incluído com Node.js | Incluído com Node.js |

> A base de dados **não vem embutida** na aplicação. Tem de existir um serviço MariaDB/MySQL a correr no computador (tal como na versão original MAUI).

---

## 2. Descompactar o projecto

1. Descompacte o ficheiro `CRM-Genoma2026.zip` para uma pasta, por exemplo:
   - Mac: `~/Projects/CRM-Genoma2026`
   - Windows: `C:\Projects\CRM-Genoma2026`

2. Abra um terminal nessa pasta (no Mac: Terminal → `cd ~/Projects/CRM-Genoma2026`).

---

## 3. Instalar dependências Node.js

Na **raiz do projecto**, execute:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../desktop && npm install
cd ..
```

Ou, na raiz:

```bash
npm run desktop:install
cd backend && npm install
cd ../frontend && npm install
```

---

## 4. Configurar a base de dados

### 4.1 Arrancar o MariaDB/MySQL

**Mac (Homebrew):**
```bash
brew services start mariadb
```

**Windows (PowerShell como Administrador):**
```powershell
net start MariaDB
```
(ou `net start MySQL` consoante a instalação)

### 4.2 Criar ficheiro de configuração

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e ajuste pelo menos:

```env
DB_PASSWORD=sua_password_mariadb
JWT_SECRET=um_segredo_longo_e_aleatorio
```

> **Mac:** se instalou MariaDB via Homebrew sem password, `DB_PASSWORD` pode ficar vazio.

### 4.3 Importar dados de demonstração (recomendado)

```bash
mysql -u root -p < database/genoma_export.sql
```

Isto cria a base `genoma` com utilizadores e dados de exemplo.

**Alternativa** (base vazia + migrações):
```bash
npm run migrate --prefix backend
npm run seed:admin --prefix backend
```

---

## 5. Arrancar a aplicação

Existem **dois modos**:

### Modo A — Desktop (recomendado para utilizador final)

**Mac:** duplo clique em `Genoma.app` na raiz do projecto.

Na primeira execução a app pode demorar ~1 minuto a compilar a interface.

**Ou pela linha de comandos:**
```bash
npm run desktop:dev
```

A janela abre em `http://localhost:3847` (servida internamente pelo Electron).

### Modo B — Browser (desenvolvimento / servidor)

**Terminal 1 — API:**
```bash
npm run backend:dev
```

**Terminal 2 — Interface:**
```bash
npm run frontend:dev
```

Abrir no browser: **http://localhost:5173**

---

## 6. Credenciais de teste

Após importar `database/genoma_export.sql`:

| Perfil | Email | Password |
|--------|-------|----------|
| Administrador | `admin.teste@genoma.local` | `Teste1234!` |
| Médico | `anaclaraferreira@genoma.pt` | `Teste1234!` |

---

## 7. Gerar instalador (.dmg / .exe)

Para distribuir sem código-fonte visível:

```bash
# macOS — gera desktop/dist/*.dmg
npm run desktop:pack:mac

# Windows — executar num PC Windows
npm run desktop:pack:win
```

---

## 8. Resolução de problemas

| Problema | Solução |
|----------|---------|
| «Cannot connect to database» | Verificar se MariaDB está a correr e se `DB_PASSWORD` em `backend/.env` está correcta |
| «Port 3000 already in use» | Fechar outra instância da API ou alterar `PORT` em `backend/.env` |
| Genoma.app não abre | Executar `npm run desktop:install` e depois `npm run desktop:dev` no terminal para ver erros |
| Ecrã branco no desktop | Executar `npm run frontend:build` na raiz e voltar a abrir |
| PDF não gera | Usar «Gerar PDF» no separador Relatório; requer frontend compilado (`npm run frontend:build`) |

---

## 9. Repositório GitHub

Código-fonte actualizado:

- **Principal:** https://github.com/rAg0903/Genoma
- **Espelho PFC:** https://github.com/Males24/CRM-Genoma2026

Documentação completa: `README.md`

---

## Autores

Ricardo Rodrigues · Rafael Males · Daniel Pereira · Alberto Macieira

Projeto Final de Curso — ISLA · Engenharia Informática · 2025/2026
