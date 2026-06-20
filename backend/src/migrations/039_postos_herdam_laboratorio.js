module.exports.up = async (db) => {
  const tryExec = async (label, sql, ignoreCodes = []) => {
    try {
      await db.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      if (ignoreCodes.includes(error.code)) {
        console.log(`  ℹ ${label} (ignorado)`);
        return;
      }
      console.log(`  ⚠ ${label}:`, error.message);
    }
  };

  await tryExec(
    'Condições comerciais de postos com laboratório removidas',
    `DELETE pct FROM posto_condicoes_testes pct
     INNER JOIN postos p ON p.id = pct.posto_id
     WHERE p.laboratorio_id IS NOT NULL;`,
    ['ER_NO_SUCH_TABLE']
  );
};
