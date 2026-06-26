/** Faturação gerida no contacto desde a criação; copiada para o processo na colheita. */
module.exports.up = async (db) => {
  const columns = [
    ['fatura_emitida', 'BOOLEAN DEFAULT FALSE'],
    ['fatura_numero', 'VARCHAR(50) NULL'],
    ['fatura_data_emissao', 'DATE NULL'],
    ['valor_base', 'DECIMAL(10,2) DEFAULT 0.00'],
    ['desconto_percentual', 'DECIMAL(5,2) DEFAULT 0.00'],
    ['valor_final', 'DECIMAL(10,2) DEFAULT 0.00'],
    ['pagamento_data', 'DATE NULL'],
    ['recibo_numero', 'VARCHAR(50) NULL'],
    ['pago', 'BOOLEAN DEFAULT FALSE'],
    ['entidade_multibanco', 'VARCHAR(20) NULL'],
    ['referencia_multibanco', 'VARCHAR(20) NULL'],
    ['nao_gera_comissao', 'BOOLEAN DEFAULT FALSE'],
    ['fatura_envio_email', 'DATE NULL'],
    ['fatura_envio_sms', 'DATE NULL'],
  ];

  for (const [name, def] of columns) {
    await db.execute(`ALTER TABLE pacientes ADD COLUMN ${name} ${def}`).catch((err) => {
      if (!String(err.message || '').includes('Duplicate column')) throw err;
    });
  }
  console.log('  ✓ Colunas de faturação adicionadas em pacientes');
};

module.exports.down = async () => {};
