require('dotenv').config();
const { wipeCrmData } = require('./wipe-crm-data');
const { seedAdmin } = require('./seed-admin');
const { seedInventory } = require('./seed-inventory');
const pool = require('../config/database');

async function resetCrm() {
  console.log('=== Reset CRM: limpar + seed Administração + Inventário ===\n');
  await wipeCrmData();
  await seedAdmin();
  await seedInventory();
  console.log('\n=== Concluído ===');
  console.log('IMPORTANTE: faça logout e login novamente (a sessão anterior deixou de ser válida).');
  console.log('Credenciais: admin.teste@genoma.local / Teste1234!');
  console.log('             assistente.teste@genoma.local / Teste1234!');
  console.log('             medicos@genoma.pt / Teste1234!');
  console.log('Inventário: 1 lote, kits no escritório + envios concluídos para cada posto.');
}

resetCrm()
  .catch((error) => {
    console.error('Erro no reset:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
