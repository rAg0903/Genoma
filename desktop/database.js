const net = require('net');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function portaAberta(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

function executar(ficheiro, args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const child = spawn(ficheiro, args, {
        stdio: 'ignore',
        detached: false,
        shell: false,
      });
      if (timeoutMs <= 0) {
        child.unref();
        resolve(true);
        return;
      }
      const timer = setTimeout(() => {
        try { child.kill('SIGTERM'); } catch { /* ignore */ }
        resolve(false);
      }, timeoutMs);
      child.on('exit', () => {
        clearTimeout(timer);
        resolve(true);
      });
      child.on('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function tentarIniciarMac() {
  const prefixes = [
    '/opt/homebrew/opt/mariadb',
    '/usr/local/opt/mariadb',
    '/opt/homebrew/opt/mysql',
    '/usr/local/opt/mysql',
  ];

  for (const prefix of prefixes) {
    const script = path.join(prefix, 'bin', 'mysql.server');
    if (fs.existsSync(script)) {
      await executar(script, ['start']);
    }
  }

  const brews = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'];
  for (const brew of brews) {
    if (!fs.existsSync(brew)) continue;
    await executar(brew, ['services', 'start', 'mariadb']);
    await executar(brew, ['services', 'start', 'mysql']);
  }

  await new Promise((resolve) => {
    execFile('/bin/bash', ['-lc', 'launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.mariadb 2>/dev/null || true'], () => resolve());
  });
  await new Promise((resolve) => {
    execFile('/bin/bash', ['-lc', 'launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.mysql 2>/dev/null || true'], () => resolve());
  });
}

async function tentarIniciarWindows() {
  const servicos = ['MariaDB', 'MySQL', 'MySQL80', 'MySQL57'];
  for (const servico of servicos) {
    await executar('cmd.exe', ['/c', 'net', 'start', servico], 15000);
  }
}

async function tentarIniciarServico() {
  if (process.platform === 'darwin') {
    await tentarIniciarMac();
    return;
  }
  if (process.platform === 'win32') {
    await tentarIniciarWindows();
  }
}

/**
 * Garante MariaDB/MySQL acessível (como DatabaseStartupService no MAUI).
 */
async function ensureDatabaseRunning({ host = '127.0.0.1', port = 3306 } = {}) {
  if (await portaAberta(host, port)) {
    return { ok: true };
  }

  await tentarIniciarServico();

  for (let i = 0; i < 60; i += 1) {
    if (await portaAberta(host, port)) {
      return { ok: true };
    }
    await sleep(500);
  }

  return {
    ok: false,
    message: `Não foi possível ligar ao MariaDB em ${host}:${port}. Instale MariaDB/MySQL ou inicie o serviço manualmente.`,
  };
}

module.exports = {
  ensureDatabaseRunning,
  portaAberta,
};
