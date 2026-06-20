require('dotenv').config();
const pool = require('../src/config/database');

(async () => {
  const c = await pool.getConnection();
  const [testes] = await c.execute('SELECT id, nome, tipo_kit, tipo_teste FROM testes');
  const [tipos] = await c.execute('SELECT id, nome FROM tipos_kit');
  const [empresas] = await c.execute('SELECT id, nome, tipo_empresa FROM empresas WHERE ativo = TRUE OR ativo IS NULL');
  const [kits] = await c.execute(`
    SELECT k.id, k.codigo_barras, p.nome AS posto, tk.nome AS tipo_kit, l.teste_id, te.nome AS teste_nome
    FROM kits k
    LEFT JOIN postos p ON p.id = k.posto_id
    LEFT JOIN tipos_kit tk ON tk.id = k.tipo_kit_id
    LEFT JOIN lotes l ON l.id = k.lote_id
    LEFT JOIN testes te ON te.id = l.teste_id
    WHERE k.status = 'Disponivel' AND k.localizacao = 'Posto'
    LIMIT 15
  `);
  console.log('testes:', JSON.stringify(testes, null, 2));
  console.log('tipos_kit:', JSON.stringify(tipos, null, 2));
  console.log('empresas:', JSON.stringify(empresas, null, 2));
  console.log('kits:', JSON.stringify(kits, null, 2));
  c.release();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
