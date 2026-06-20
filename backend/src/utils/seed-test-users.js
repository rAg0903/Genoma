require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const TEST_USERS = [
  {
    role: 'Administrador',
    nome: 'Administrador Teste',
    email: 'admin.teste@genoma.local',
    password: 'Teste1234!',
    telefone: '+351900000001'
  },
  {
    role: 'Assistente',
    nome: 'Assistente Teste',
    email: 'assistente.teste@genoma.local',
    password: 'Teste1234!',
    telefone: '+351900000003'
  }
];

async function ensurePerfil(nome) {
  const [rows] = await pool.execute('SELECT id FROM perfis WHERE nome = ?', [nome]);
  if (rows.length > 0) return rows[0].id;

  const id = uuidv4();
  await pool.execute('INSERT INTO perfis (id, nome) VALUES (?, ?)', [id, nome]);
  return id;
}

async function ensureUser(user, perfilId) {
  const [rows] = await pool.execute('SELECT id FROM utilizadores WHERE email = ?', [user.email]);
  if (rows.length > 0) return rows[0].id;

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(user.password, 10);

  await pool.execute(
    'INSERT INTO utilizadores (id, perfil_id, empresa_id, nome, email, telefone, password_hash, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      perfilId,
      null,
      user.nome,
      user.email,
      user.telefone || null,
      passwordHash,
      true
    ]
  );

  return id;
}

async function main() {
  try {
    for (const user of TEST_USERS) {
      const perfilId = await ensurePerfil(user.role);
      const userId = await ensureUser(user, perfilId);

      console.log(`OK: ${user.role} -> ${user.email}`);
    }
  } catch (error) {
    console.error('Erro ao criar utilizadores de teste:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
