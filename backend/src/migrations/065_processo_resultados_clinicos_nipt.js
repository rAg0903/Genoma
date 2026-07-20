/** Campos clínicos NIPT alinhados com o editor de resultados (grelha C1–C23). */
module.exports.up = async (db) => {
  const tryExec = async (label, sql) => {
    try {
      await db.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || String(error.message).includes('Duplicate column')) {
        console.log(`  ℹ ${label} (já existe)`);
        return;
      }
      throw error;
    }
  };

  const columns = [
    ['resultados_cromossomas', 'TEXT NULL COMMENT "JSON {1:Negativo,13:Positivo,...}"'],
    ['sugerir_repeticao', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['cromossomas_sexuais', 'VARCHAR(20) NULL'],
    ['resultado_cromossomas_sexuais', 'VARCHAR(20) NULL'],
    ['id_amostra', 'VARCHAR(80) NULL'],
    ['data_relatorio_laboratorio', 'DATE NULL'],
  ];

  for (const [column, definition] of columns) {
    await tryExec(`Coluna processos.${column}`, `ALTER TABLE processos ADD COLUMN ${column} ${definition}`);
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};
