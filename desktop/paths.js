const fs = require('fs');
const path = require('path');

/** Raiz do projecto (dev) ou pasta resources (app empacotada). */
function getProjectRoot(app) {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.join(__dirname, '..');
}

function getBackendDir(app) {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', 'backend');
}

function getFrontendDist(app) {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'frontend-dist')
    : path.join(__dirname, '..', 'frontend', 'dist');
}

function getUserDataDir(app) {
  return app.getPath('userData');
}

function ensureUserEnv(app) {
  const userData = getUserDataDir(app);
  const targetEnv = path.join(userData, '.env');
  if (fs.existsSync(targetEnv)) {
    return targetEnv;
  }

  const candidates = [
    path.join(__dirname, '.env.desktop.example'),
    path.join(getBackendDir(app), '.env'),
    path.join(getBackendDir(app), '.env.example'),
  ];

  for (const source of candidates) {
    if (!fs.existsSync(source)) continue;
    fs.mkdirSync(userData, { recursive: true });
    fs.copyFileSync(source, targetEnv);
    return targetEnv;
  }

  return null;
}

module.exports = {
  getProjectRoot,
  getBackendDir,
  getFrontendDist,
  getUserDataDir,
  ensureUserEnv,
};
