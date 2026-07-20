/** Guarda data prevista de colheita no processo (snapshot do contacto). */
module.exports.up = async (db) => {
  try {
    await db.execute(
      "ALTER TABLE processos ADD COLUMN data_colheita_prevista DATE NULL COMMENT 'Data prevista de colheita (snapshot do contacto)'"
    );
    console.log('  ✓ Coluna data_colheita_prevista adicionada em processos');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Coluna data_colheita_prevista já existe em processos');
    } else {
      throw error;
    }
  }
};
