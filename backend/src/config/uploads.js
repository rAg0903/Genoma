const fs = require('fs');
const path = require('path');

const getUploadsRoot = () => {
  const configured = process.env.UPLOAD_DIR || process.env.UPLOADS_ROOT;
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(__dirname, '../../uploads');
};

const getAnexosDir = () => path.join(getUploadsRoot(), 'anexos');

const getRelatoriosDir = () => path.join(getAnexosDir(), 'relatorios');

const resolveUploadRelativePath = (relativeUrl) => {
  if (!relativeUrl?.startsWith('uploads/')) {
    throw new Error('Caminho de upload inválido');
  }
  const suffix = relativeUrl.slice('uploads/'.length);
  return path.join(getUploadsRoot(), suffix);
};

const ensureUploadDirs = () => {
  for (const dir of [getUploadsRoot(), getAnexosDir(), getRelatoriosDir()]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
};

ensureUploadDirs();

module.exports = {
  getUploadsRoot,
  getAnexosDir,
  getRelatoriosDir,
  resolveUploadRelativePath,
  ensureUploadDirs,
};
