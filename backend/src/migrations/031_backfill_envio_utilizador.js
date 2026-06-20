module.exports.up = async (db) => {
  try {
    const [pending] = await db.execute(
      'SELECT id FROM requisicoes_kits WHERE utilizador_id IS NULL ORDER BY data ASC, numero_envio ASC',
    );
    if (!pending.length) {
      console.log('  ℹ Nenhum envio sem utilizador para preencher');
      return;
    }

    const [logs] = await db.execute(
      `SELECT utilizador_id
       FROM logs_auditoria
       WHERE tabela_afetada = 'requisicoes_kits'
         AND acao LIKE 'Criou requisicao%'
         AND utilizador_id IS NOT NULL
       ORDER BY data ASC`,
    );

    let updated = 0;
    const pairs = Math.min(pending.length, logs.length);
    for (let i = 0; i < pairs; i += 1) {
      await db.execute(
        'UPDATE requisicoes_kits SET utilizador_id = ? WHERE id = ?',
        [logs[i].utilizador_id, pending[i].id],
      );
      updated += 1;
    }

    if (updated) {
      console.log(`  ✓ utilizador_id preenchido em ${updated} envio(s) a partir dos logs de auditoria`);
    } else {
      console.log('  ℹ Nao foi possivel associar utilizadores aos envios existentes (sem logs correspondentes)');
    }
  } catch (error) {
    console.log('  ⚠ Erro ao preencher utilizador_id nos envios:', error.message);
  }
};
