/**
 * Genoma CRM — aplicação desktop (Mac / Windows)
 * Arranca MariaDB (se necessário), API Node e abre a interface numa janela nativa.
 */
delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork } = require('child_process');
const dotenv = require('dotenv');

const { ensureDatabaseRunning } = require('./database');
const {
  getBackendDir,
  getFrontendDist,
  getUserDataDir,
  ensureUserEnv,
} = require('./paths');

const DESKTOP_PORT = 3847;
let mainWindow = null;
let backendProcess = null;
let isQuitting = false;

function loadEnv() {
  const envPath = ensureUserEnv(app);
  if (envPath) {
    dotenv.config({ path: envPath });
  }
  dotenv.config({ path: path.join(getBackendDir(app), '.env') });
}

function buildBackendEnv() {
  const userData = getUserDataDir(app);
  const backendDir = getBackendDir(app);
  const frontendDist = getFrontendDist(app);
  const uploadsDir = path.join(userData, 'uploads');
  const logsDir = path.join(userData, 'logs');

  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  return {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production',
    DESKTOP_MODE: '1',
    PORT: String(DESKTOP_PORT),
    SERVE_FRONTEND: frontendDist,
    UPLOAD_DIR: uploadsDir,
    DB_HOST: process.env.DB_HOST || '127.0.0.1',
    DB_PORT: process.env.DB_PORT || '3306',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'genoma',
    JWT_SECRET: process.env.JWT_SECRET || 'genoma_desktop_change_me',
    CORS_ORIGIN: `http://127.0.0.1:${DESKTOP_PORT}`,
    SWAGGER_ENABLED: 'false',
    LOG_DIR: logsDir,
    BACKUP_DIR: path.join(userData, 'backups'),
    PWD: backendDir,
  };
}

function waitForBackend(maxAttempts = 90) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tick = () => {
      attempts += 1;
      const req = http.get(`http://127.0.0.1:${DESKTOP_PORT}/health/live`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });

      function retry() {
        if (attempts >= maxAttempts) {
          reject(new Error('A API não respondeu a tempo.'));
          return;
        }
        setTimeout(tick, 500);
      }
    };

    tick();
  });
}

function runMigrations(env) {
  return new Promise((resolve, reject) => {
    const migrateScript = path.join(getBackendDir(app), 'migrate.js');
    if (!fs.existsSync(migrateScript)) {
      resolve();
      return;
    }

    const child = fork(migrateScript, [], {
      env,
      execPath: process.execPath,
      cwd: getBackendDir(app),
      stdio: 'ignore',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Migrações falharam (código ${code}).`));
    });
    child.on('error', reject);
  });
}

function startBackend(env) {
  const serverEntry = path.join(getBackendDir(app), 'server.js');
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Backend não encontrado: ${serverEntry}`);
  }

  backendProcess = fork(serverEntry, [], {
    env,
    execPath: process.execPath,
    cwd: getBackendDir(app),
    stdio: 'pipe',
  });

  backendProcess.stdout?.on('data', (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });
  backendProcess.stderr?.on('data', (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });
}

function stopBackend() {
  if (!backendProcess) return;
  backendProcess.kill('SIGTERM');
  backendProcess = null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Genoma',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  await mainWindow.loadURL(`http://127.0.0.1:${DESKTOP_PORT}/`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootstrap() {
  loadEnv();

  const frontendDist = getFrontendDist(app);
  if (!fs.existsSync(path.join(frontendDist, 'index.html'))) {
    throw new Error(
      'Frontend não compilado. Execute: npm run frontend:build (na raiz do projecto).',
    );
  }

  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbStatus = await ensureDatabaseRunning({ host: dbHost, port: dbPort });
  if (!dbStatus.ok) {
    throw new Error(dbStatus.message);
  }

  const env = buildBackendEnv();
  await runMigrations(env);
  startBackend(env);
  await waitForBackend();
  await createWindow();
}

app.whenReady().then(async () => {
  try {
    await bootstrap();
  } catch (error) {
    dialog.showErrorBox(
      'Genoma — erro ao arrancar',
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null && !isQuitting) {
    try {
      await createWindow();
    } catch (error) {
      dialog.showErrorBox('Genoma', error instanceof Error ? error.message : String(error));
    }
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

process.on('SIGINT', () => {
  stopBackend();
  app.quit();
});
