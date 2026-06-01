#!/bin/bash
# Instalar MariaDB no Mac e criar a base de dados Genoma
set -euo pipefail

GENOMA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="${GENOMA_DIR}/scripts/genoma_db.sql"

echo "=== Genoma — MariaDB no Mac ==="
echo ""

if ! command -v mysql >/dev/null 2>&1; then
  echo "MariaDB/MySQL não encontrado."
  echo ""
  echo "Opção A — Homebrew (recomendado):"
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo "  brew install mariadb"
  echo "  brew services start mariadb"
  echo ""
  echo "Opção B — Instalador oficial:"
  echo "  https://mariadb.org/download/"
  echo "  Escolhe macOS → pkg → instala"
  echo ""
  exit 1
fi

echo "A importar schema e dados de exemplo..."

# Homebrew MariaDB: root usa autenticação por socket (sem password)
if mysql -u root < "${SQL_FILE}" 2>/dev/null; then
  echo "Importado com: mysql -u root"
elif sudo mysql < "${SQL_FILE}" 2>/dev/null; then
  echo "Importado com: sudo mysql"
else
  echo ""
  echo "Não foi possível ligar automaticamente. Tenta manualmente:"
  echo "  mysql -u root < scripts/genoma_db.sql"
  echo "  ou: sudo mysql < scripts/genoma_db.sql"
  exit 1
fi

echo ""
echo "Base de dados genoma_db criada com 3 contactos de exemplo."
echo "Confirma a password em MauiProgram.cs (atualmente: root)."
