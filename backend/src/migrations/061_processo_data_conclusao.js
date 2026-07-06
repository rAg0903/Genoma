/** Data em que o processo foi concluído (faturado ou cancelado) — histórico / arquivo. */
module.exports.up = async (db) => {
  try {
    await db.execute(
      'ALTER TABLE processos ADD COLUMN data_conclusao DATE NULL COMMENT "Data conclusão (faturado/cancelado)"'
    );
    console.log('  ✓ Coluna data_conclusao adicionada em processos');
  } catch (error) {
    if (String(error.message).includes('Duplicate column')) {
      console.log('  ℹ Coluna data_conclusao já existe em processos');
    } else {
      throw error;
    }
  }

  try {
    const [result] = await db.execute(`
      UPDATE processos
      SET data_conclusao = COALESCE(
        data_anulacao,
        fatura_data_emissao,
        data_validacao,
        DATE(data_entrada)
      )
      WHERE status_id IN ('Faturado', 'Cancelado')
        AND data_conclusao IS NULL
    `);
    console.log(`  ✓ data_conclusao preenchida em processos concluídos: ${result.affectedRows || 0}`);
  } catch (error) {
    console.log('  ⚠ Erro ao preencher data_conclusao:', error.message);
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};
