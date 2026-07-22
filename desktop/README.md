# Genoma — Aplicação Desktop (Mac / Windows)

Aplicação nativa que arranca automaticamente:

1. **MariaDB/MySQL** (tenta iniciar o serviço do sistema, como a app MAUI)
2. **Migrações** da base de dados
3. **API Node** (backend)
4. **Interface** numa janela Electron (frontend compilado)

## Pré-requisitos

- Node.js ≥ 18
- MariaDB ou MySQL instalado (Homebrew no Mac, serviço Windows)
- Credenciais em `backend/.env` (copie de `.env.example`)

## Desenvolvimento (app desktop)

### Abrir com duplo clique (recomendado)

Na pasta do projecto existe **`Genoma.app`**. Pode:

1. Dar **duplo clique** em `Genoma.app`, ou
2. Arrastar `Genoma.app` para o **Dock** / **Aplicações** e abrir de lá

Na primeira execução pode compilar o frontend automaticamente (demora ~1 min).

### Abrir pela linha de comandos

```bash
# Na raiz do projecto
npm run app             # abre Genoma.app (macOS)
npm run desktop:install # primeira vez — instala Electron
npm run desktop:dev     # compila frontend + abre via terminal
```

**Não abrir** `desktop/node_modules/electron/dist/Electron.app` — isso mostra o ecrã genérico do Electron, não a Genoma.

## Gerar instalador

```bash
# macOS (.dmg)
npm run desktop:pack:mac

# Windows (.exe) — executar numa máquina Windows
npm run desktop:pack:win
```

Os instaladores ficam em `desktop/dist/`.

## Configuração

- **Desenvolvimento:** usa `backend/.env`
- **App empacotada:** na primeira execução copia config para  
  `~/Library/Application Support/genoma-desktop/.env` (Mac) ou equivalente Windows

Edite a password da BD (`DB_PASSWORD`) nesse ficheiro se necessário.

## Notas

- A MariaDB **não vem embutida** — o arranque tenta `brew services` (Mac) ou `net start MariaDB` (Windows), tal como o projecto MAUI.
- Uploads e logs da app empacotada ficam na pasta de dados do utilizador.
- Para distribuição sem instalar MariaDB manualmente, será necessário fase 2 (MariaDB portable embutida).
