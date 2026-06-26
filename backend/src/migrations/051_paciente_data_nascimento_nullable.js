/** Permite criar contactos sem data de nascimento (obrigatórios: nome + telemóvel). */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE pacientes
      MODIFY COLUMN data_nascimento DATE NULL
  `).catch(async () => {
    await db.execute(`ALTER TABLE pacientes CHANGE COLUMN data_nascimento data_nascimento DATE NULL`);
  });
  console.log('  ✓ pacientes.data_nascimento passou a aceitar NULL');
};

module.exports.down = async () => {};
