require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const {
  PROCESSO_STATUS,
  PERFIS,
  STOCK_SUBMODULES,
  EMPRESAS,
  TIPOS_KIT,
  LABORATORIOS,
  TESTE_PAI,
  SUB_TESTES,
  ENTIDADES,
  POSTOS,
  UTILIZADORES_STAFF,
  MEDICOS,
  MOTIVOS_ANULACAO,
  entidadeContactos,
  entidadeCondicoes,
} = require('../seeds/seed-admin-data');

const ids = {
  perfis: {},
  empresas: {},
  tiposKit: {},
  laboratorios: {},
  testes: {},
  entidades: {},
  postos: {},
  utilizadores: {},
};

async function insertContactos(conn, table, ownerColumn, ownerId, contactos) {
  const list = (contactos || []).slice(0, 3);
  for (let i = 0; i < list.length; i += 1) {
    const c = list[i];
    if (!c?.nome && !c?.email && !c?.telefone) continue;
    await conn.execute(
      `INSERT INTO ${table} (id, ${ownerColumn}, ordem, nome, funcao, email, telefone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), ownerId, i + 1, c.nome || null, c.funcao || null, c.email || null, c.telefone || null],
    );
  }
}

async function insertCondicoes(conn, table, ownerColumn, ownerId, condicoes, subTesteIds) {
  for (const row of condicoes || []) {
    const testeId = row.teste_id || subTesteIds[row.sub_codigo];
    if (!testeId) continue;
    await conn.execute(
      `INSERT INTO ${table} (id, ${ownerColumn}, teste_id, comissao, prazo_pagamento_dias)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), ownerId, testeId, row.comissao ?? null, row.prazo_pagamento_dias ?? null],
    );
  }
}

async function seedProcessoStatus(conn) {
  for (const [nome, ordem] of PROCESSO_STATUS) {
    await conn.execute(
      'INSERT INTO processo_status (nome, ordem, ativo) VALUES (?, ?, TRUE)',
      [nome, ordem],
    );
  }
  console.log(`  ✓ processo_status (${PROCESSO_STATUS.length})`);
}

async function seedPerfis(conn) {
  for (const nome of PERFIS) {
    const id = uuidv4();
    await conn.execute('INSERT INTO perfis (id, nome, ativo) VALUES (?, ?, TRUE)', [id, nome]);
    ids.perfis[nome] = id;

    for (const sub of STOCK_SUBMODULES) {
      await conn.execute(
        'INSERT INTO perfil_stock_submodulos (perfil_id, submodulo, permitido) VALUES (?, ?, TRUE)',
        [id, sub],
      );
    }
  }
  console.log(`  ✓ perfis (${PERFIS.length}) + stock submodulos`);
}

async function seedEmpresas(conn) {
  for (const e of EMPRESAS) {
    const id = uuidv4();
    await conn.execute(
      `INSERT INTO empresas (id, nome, morada, codigo_postal, telefone, email, tipo_empresa, nif, pais, contacto, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, e.nome, e.morada, e.codigo_postal, e.telefone, e.email, e.tipo_empresa, e.nif, e.pais, e.contacto, e.ativo ? 1 : 0],
    );
    ids.empresas[e.key] = id;
  }
  console.log(`  ✓ empresas (${EMPRESAS.length})`);
}

async function seedTiposKit(conn) {
  for (const t of TIPOS_KIT) {
    const id = uuidv4();
    await conn.execute('INSERT INTO tipos_kit (id, nome, ativo) VALUES (?, ?, ?)', [id, t.nome, t.ativo ? 1 : 0]);
    ids.tiposKit[t.key] = id;
  }
  console.log(`  ✓ tipos_kit (${TIPOS_KIT.length})`);
}

async function seedLaboratorios(conn) {
  for (const lab of LABORATORIOS) {
    const id = uuidv4();
    await conn.execute(
      `INSERT INTO laboratorios (id, nome, codigo, morada, codigo_postal, cidade, distrito, pais, contacto, email, notas, ativo, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, lab.nome, lab.codigo, lab.morada, lab.codigo_postal, lab.cidade, lab.distrito, lab.pais,
        lab.contacto, lab.email, lab.notas, lab.ativo ? 1 : 0, lab.tipo,
      ],
    );
    ids.laboratorios[lab.key] = id;
    await insertContactos(conn, 'laboratorio_contactos_secundarios', 'laboratorio_id', id, lab.contactos_secundarios);
  }
  console.log(`  ✓ laboratorios (${LABORATORIOS.length}) + contactos`);
}

async function seedTestes(conn) {
  const paiId = uuidv4();
  await conn.execute(
    `INSERT INTO testes (
      id, nome, codigo, preco, preco_compra, preco_venda, descricao, ativo,
      tipo_teste, empresa, tipo_kit, teste_pai_id, laboratorio_processamento_id
    ) VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, NULL, NULL)`,
    [
      paiId, TESTE_PAI.nome, TESTE_PAI.codigo, TESTE_PAI.descricao, TESTE_PAI.ativo ? 1 : 0,
      TESTE_PAI.tipo_teste, TESTE_PAI.empresa, TESTE_PAI.tipo_kit,
    ],
  );
  ids.testes[TESTE_PAI.key] = paiId;

  for (const sub of SUB_TESTES) {
    const id = uuidv4();
    const labId = ids.laboratorios[sub.lab_key];
    await conn.execute(
      `INSERT INTO testes (
        id, nome, codigo, preco, preco_compra, preco_venda, descricao, ativo,
        tipo_teste, empresa, tipo_kit, teste_pai_id, laboratorio_processamento_id,
        tempo_resposta_dias, gestacao_minima_semanas, cromossomas,
        delecoes_duplicacoes, microdelecoes_microduplicacoes, gemeos,
        determinacao_sexo_fetal, incluir_fracao_fetal
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, TRUE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, sub.nome, sub.codigo, sub.preco, sub.preco_compra, sub.preco_venda,
        sub.tipo_teste, TESTE_PAI.empresa, TESTE_PAI.tipo_kit, paiId, labId,
        sub.tempo_resposta_dias, sub.gestacao_minima_semanas, sub.cromossomas,
        sub.delecoes_duplicacoes ? 1 : 0, sub.microdelecoes_microduplicacoes ? 1 : 0,
        sub.gemeos ? 1 : 0, sub.determinacao_sexo_fetal ? 1 : 0, sub.incluir_fracao_fetal ? 1 : 0,
      ],
    );
    ids.testes[sub.codigo] = id;
  }

  for (const lab of LABORATORIOS) {
    if (!lab.condicoes_testes?.length) continue;
    await insertCondicoes(
      conn,
      'laboratorio_condicoes_testes',
      'laboratorio_id',
      ids.laboratorios[lab.key],
      lab.condicoes_testes,
      ids.testes,
    );
  }

  console.log(`  ✓ testes (1 pai + ${SUB_TESTES.length} sub-testes) + condições lab`);
}

async function seedEntidades(conn) {
  const subTesteIds = {
    'MT-001': ids.testes['MT-001'],
    'MT-002': ids.testes['MT-002'],
    'MT-003': ids.testes['MT-003'],
  };

  ENTIDADES.forEach((ent, index) => {
    // eslint-disable-next-line no-param-reassign
    ent._index = index;
  });

  for (const ent of ENTIDADES) {
    const id = uuidv4();
    await conn.execute(
      `INSERT INTO entidades (id, nome, codigo, morada, codigo_postal, cidade, distrito, pais, contacto, email, notas, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        id, ent.nome, ent.codigo, ent.morada, ent.codigo_postal, ent.cidade, ent.distrito,
        'Portugal',
        `+351 ${String(210000000 + ent._index).slice(0, 9)}`,
        `contacto.${ent.codigo.replace('ENT-', '').toLowerCase()}@clinica.pt`,
        `Entidade de referência — ${ent.nome}.`,
      ],
    );
    ids.entidades[ent.codigo] = id;
    await insertContactos(conn, 'entidade_contactos_secundarios', 'entidade_id', id, entidadeContactos(ent, ent._index));
    await insertCondicoes(
      conn,
      'entidade_condicoes_testes',
      'entidade_id',
      id,
      entidadeCondicoes(subTesteIds, ent._index),
      subTesteIds,
    );
  }
  console.log(`  ✓ entidades (${ENTIDADES.length}) + contactos + condições`);
}

async function seedPostos(conn) {
  for (const p of POSTOS) {
    const id = uuidv4();
    const labId = ids.laboratorios[p.lab_key];
    await conn.execute(
      `INSERT INTO postos (id, nome, codigo_posto, laboratorio_id, morada, codigo_postal, cidade, distrito, pais, contacto, email, notas, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        id, p.nome, p.codigo_posto, labId, p.morada, p.codigo_postal, p.cidade, p.distrito,
        'Portugal', p.contacto, p.email, `Posto de colheita — ${p.nome}.`,
      ],
    );
    ids.postos[p.codigo_posto] = id;
    await insertContactos(conn, 'posto_contactos_secundarios', 'posto_id', id, [
      { nome: 'Receção Posto', funcao: 'Receção', email: `posto.${p.codigo_posto.toLowerCase()}@lab.pt`, telefone: p.contacto },
      { nome: 'Coordenação Amostras', funcao: 'Técnico', email: `amostras.${p.codigo_posto.toLowerCase()}@lab.pt`, telefone: p.contacto },
    ]);
    await insertCondicoes(conn, 'posto_condicoes_testes', 'posto_id', id, [
      { sub_codigo: 'MT-001', comissao: 6, prazo_pagamento_dias: 30 },
    ], ids.testes);
  }
  console.log(`  ✓ postos (${POSTOS.length}) + contactos + condições`);
}

async function seedUtilizadoresStaff(conn) {
  const empresaGenoma = ids.empresas.genoma;
  for (const u of UTILIZADORES_STAFF) {
    const id = uuidv4();
    const perfilId = ids.perfis[u.perfil];
    const hash = await bcrypt.hash(u.password, 10);
    await conn.execute(
      `INSERT INTO utilizadores (id, perfil_id, empresa_id, nome, email, telefone, password_hash, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [id, perfilId, empresaGenoma, u.nome, u.email, u.telefone, hash],
    );
    ids.utilizadores[u.key] = id;
  }
  console.log(`  ✓ utilizadores staff (${UTILIZADORES_STAFF.length})`);
}

async function seedMedicos(conn) {
  const perfilMedico = ids.perfis.Medico;
  for (const m of MEDICOS) {
    const utilizadorId = uuidv4();
    const hash = await bcrypt.hash(m.password, 10);
    await conn.execute(
      `INSERT INTO utilizadores (id, perfil_id, empresa_id, nome, email, telefone, password_hash, ativo)
       VALUES (?, ?, NULL, ?, ?, ?, ?, TRUE)`,
      [utilizadorId, perfilMedico, m.nome, m.email, m.telefone_movel, hash],
    );
    await conn.execute(
      `INSERT INTO medicos (utilizador_id, num_ordem, especialidade, titulo, genero, pais, telefone_fixo, criterio_busca_postos, notas, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        utilizadorId, m.num_ordem, m.especialidade, m.titulo, m.genero, m.pais,
        m.telefone_fixo, m.criterio_busca_postos, m.notas,
      ],
    );
    await insertContactos(conn, 'medico_contactos_secundarios', 'medico_id', utilizadorId, m.contactos_secundarios);
    for (const entCodigo of m.entidades) {
      const entidadeId = ids.entidades[entCodigo];
      if (!entidadeId) continue;
      await conn.execute(
        'INSERT INTO medico_locais_trabalho (id, medico_id, entidade_id) VALUES (?, ?, ?)',
        [uuidv4(), utilizadorId, entidadeId],
      );
    }
    await insertCondicoes(conn, 'medico_condicoes_testes', 'medico_id', utilizadorId, m.condicoes_testes, ids.testes);
    ids.utilizadores[m.key] = utilizadorId;
  }
  console.log(`  ✓ medicos (${MEDICOS.length}) + contactos + locais + condições`);
}

async function seedMotivos(conn) {
  for (const m of MOTIVOS_ANULACAO) {
    await conn.execute(
      'INSERT INTO motivos_anulacao (id, nome, ativo, contexto, reabre_contacto) VALUES (?, ?, TRUE, ?, ?)',
      [uuidv4(), m.nome, m.contexto, m.reabre_contacto ? 1 : 0],
    );
  }
  console.log(`  ✓ motivos_anulacao (${MOTIVOS_ANULACAO.length})`);
}

async function seedAdmin() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('\nA semear Administração...\n');
    await seedProcessoStatus(conn);
    await seedPerfis(conn);
    await seedEmpresas(conn);
    await seedTiposKit(conn);
    await seedLaboratorios(conn);
    await seedTestes(conn);
    await seedEntidades(conn);
    await seedPostos(conn);
    await seedUtilizadoresStaff(conn);
    await seedMedicos(conn);
    await seedMotivos(conn);

    await conn.commit();
    console.log('\n✓ Seed de Administração concluído');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    await seedAdmin();
  } catch (error) {
    console.error('Erro no seed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedAdmin };
