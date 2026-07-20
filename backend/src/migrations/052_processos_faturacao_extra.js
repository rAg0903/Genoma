/** Campos de faturação alinhados com o CRM legacy (multibanco, comissão, envios). */
module.exports.up = async (db) => {
  const columns = [
    ['entidade_multibanco', 'VARCHAR(20) NULL'],
    ['referencia_multibanco', 'VARCHAR(20) NULL'],
    ['nao_gera_comissao', 'BOOLEAN DEFAULT FALSE'],
    ['fatura_envio_email', 'DATE NULL'],
    ['fatura_envio_sms', 'DATE NULL'],
  ];

  for (const [name, def] of columns) {
    await db.execute(`ALTER TABLE processos ADD COLUMN ${name} ${def}`).catch((err) => {
      if (!String(err.message || '').includes('Duplicate column')) throw err;
    });
  }
  console.log('  ✓ Colunas extra de faturação adicionadas em processos');
};

module.exports.down = async () => {};
