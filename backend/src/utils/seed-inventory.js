require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { MOTIVOS_MOVIMENTO, faseForShipmentDestination } = require('../config/kit-lifecycle');
const { LOTE, KITS_ESCRITORIO, KITS_POR_POSTO, formatKitNumero } = require('../seeds/seed-inventory-data');

const SEED_MARKER = 'LOTE-MAT-';

async function fetchOne(conn, sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows[0] || null;
}

async function fetchAll(conn, sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function loadRefs(conn) {
  const empresaGenoma = await fetchOne(conn, "SELECT id, nome FROM empresas WHERE nome = 'Genoma' LIMIT 1");
  const tipoKit = await fetchOne(conn, "SELECT id, nome FROM tipos_kit WHERE nome = 'Maternity' LIMIT 1");
  const adminUser = await fetchOne(
    conn,
    "SELECT id FROM utilizadores WHERE email = 'admin.teste@genoma.local' LIMIT 1",
  );
  const testeBas = await fetchOne(
    conn,
    "SELECT id FROM testes WHERE codigo = 'MT-001' AND teste_pai_id IS NOT NULL LIMIT 1",
  );
  const postos = await fetchAll(
    conn,
    'SELECT id, nome, codigo_posto FROM postos WHERE ativo = 1 ORDER BY codigo_posto ASC',
  );

  if (!empresaGenoma) throw new Error('Empresa Genoma não encontrada. Execute npm run seed:admin primeiro.');
  if (!tipoKit) throw new Error('Tipo de kit Maternity não encontrado. Execute npm run seed:admin primeiro.');
  if (!adminUser) throw new Error('Utilizador admin não encontrado. Execute npm run seed:admin primeiro.');
  if (!postos.length) throw new Error('Nenhum posto encontrado. Execute npm run seed:admin primeiro.');

  return { empresaGenoma, tipoKit, adminUser, testeBasId: testeBas?.id || null, postos };
}

async function assertNotSeeded(conn) {
  const existing = await fetchOne(
    conn,
    'SELECT codigo_lote FROM lotes WHERE codigo_lote LIKE ? LIMIT 1',
    [`${SEED_MARKER}%`],
  );
  if (existing) {
    throw new Error(
      `Inventário seed já aplicado (${existing.codigo_lote}). Apague lotes/kits ou execute npm run reset:crm.`,
    );
  }
}

async function insertKitAtEscritorio(conn, refs, loteId, numero) {
  const kitId = uuidv4();
  await conn.execute(
    `INSERT INTO kits
      (id, numero_kit, tracking, codigo_barras, tipo_kit_id, lote_id, empresa_id, posto_id,
       status, localizacao, data_validade, fase_ciclo)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Disponivel', 'Escritorio', ?, 'em_empresa')`,
    [
      kitId,
      numero,
      numero,
      numero,
      refs.tipoKit.id,
      loteId,
      refs.empresaGenoma.id,
      LOTE.kit_validade,
    ],
  );
  return { id: kitId, numero, tracking: numero };
}

function nextNumeroEnvio(seq) {
  const year = new Date().getFullYear();
  return `ENV-${year}-${String(seq).padStart(5, '0')}`;
}

function trackingFromKits(kits) {
  const values = [...new Set(kits.map((k) => k.tracking).filter(Boolean))];
  return values.length ? values.join(', ') : null;
}

async function createEnvioParaPosto(conn, refs, loteId, posto, kits, envioSeq, dataEnvio) {
  const requisicaoId = uuidv4();
  const requisicao = {
    numero_envio: nextNumeroEnvio(envioSeq),
    utilizador_id: refs.adminUser.id,
    data: dataEnvio,
    origem: 'Escritorio',
    destino: 'Posto',
    origem_empresa_id: refs.empresaGenoma.id,
    destino_posto_id: posto.id,
    origem_nome: refs.empresaGenoma.nome,
    destino_nome: posto.nome,
    quantidade: kits.length,
    status: 'Entregue',
    tracking_number: trackingFromKits(kits),
    lote_id: loteId,
    observacoes: 'Seed — envio escritório → posto',
    kit_status: 'Disponivel',
  };

  await conn.execute(
    `INSERT INTO requisicoes_kits
      (id, numero_envio, utilizador_id, data, origem, destino, quantidade, status, tracking_number, transportadora, lote_id, observacoes,
       origem_empresa_id, origem_posto_id, origem_laboratorio_id,
       destino_empresa_id, destino_posto_id, destino_laboratorio_id,
       origem_nome, destino_nome)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, NULL, ?, NULL, ?, ?)`,
    [
      requisicaoId,
      requisicao.numero_envio,
      requisicao.utilizador_id,
      requisicao.data,
      requisicao.origem,
      requisicao.destino,
      requisicao.quantidade,
      requisicao.status,
      requisicao.tracking_number,
      requisicao.lote_id,
      requisicao.observacoes,
      requisicao.origem_empresa_id,
      requisicao.destino_posto_id,
      requisicao.origem_nome,
      requisicao.destino_nome,
    ],
  );

  const itemValues = kits.map((kit) => [uuidv4(), requisicaoId, kit.id]);
  await conn.query(
    'INSERT INTO requisicao_kits_itens (id, requisicao_id, kit_id) VALUES ?',
    [itemValues],
  );

  const faseCiclo = faseForShipmentDestination(requisicao.destino, requisicao.kit_status);
  const kitIds = kits.map((k) => k.id);
  const placeholders = kitIds.map(() => '?').join(',');
  await conn.execute(
    `UPDATE kits
      SET status = ?, localizacao = ?, empresa_id = NULL, posto_id = ?, laboratorio_id = NULL, fase_ciclo = ?
      WHERE id IN (${placeholders})`,
    [requisicao.kit_status, requisicao.destino, requisicao.destino_posto_id, faseCiclo, ...kitIds],
  );

  const movValues = kits.map((kit) => [
    uuidv4(),
    requisicao.data,
    kit.id,
    requisicao.origem,
    requisicao.destino,
    MOTIVOS_MOVIMENTO.ENVIO,
    requisicao.observacoes,
    requisicaoId,
    null,
    requisicao.origem_empresa_id,
    null,
    null,
    null,
    requisicao.destino_posto_id,
    null,
  ]);
  await conn.query(
    `INSERT INTO movimentos_kits
      (id, data, kit_id, origem, destino, motivo, observacoes, requisicao_id, processo_id,
       origem_empresa_id, origem_posto_id, origem_laboratorio_id,
       destino_empresa_id, destino_posto_id, destino_laboratorio_id)
     VALUES ?`,
    [movValues],
  );

  return requisicao.numero_envio;
}

async function seedInventory() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('\nA semear Inventário...\n');
    await assertNotSeeded(conn);
    const refs = await loadRefs(conn);

    let testeId = refs.testeBasId;
    if (!testeId && LOTE.teste_codigo) {
      const t = await fetchOne(
        conn,
        'SELECT id FROM testes WHERE codigo = ? AND teste_pai_id IS NOT NULL LIMIT 1',
        [LOTE.teste_codigo],
      );
      testeId = t?.id || null;
    }

    const totalKits = KITS_ESCRITORIO + refs.postos.length * KITS_POR_POSTO;
    const loteId = uuidv4();

    await conn.execute(
      `INSERT INTO lotes
        (id, codigo_lote, tipo_kit_id, tipo_teste, teste_id, data_rececao, quantidade, validade, fornecedor_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loteId,
        LOTE.codigo_lote,
        refs.tipoKit.id,
        'Maternity',
        testeId,
        LOTE.data_rececao,
        totalKits,
        LOTE.validade,
        refs.empresaGenoma.id,
        LOTE.estado,
      ],
    );

    const allKits = [];
    for (let seq = 0; seq < totalKits; seq += 1) {
      const numero = formatKitNumero(seq);
      const kit = await insertKitAtEscritorio(conn, refs, loteId, numero);
      allKits.push(kit);
    }
    console.log(`  ✓ Lote recebido: ${totalKits} kits no escritório (${formatKitNumero(0)} … ${formatKitNumero(totalKits - 1)})`);

    let kitIndex = KITS_ESCRITORIO;
    let envioSeq = 1;
    const dataEnvio = LOTE.data_rececao;

    for (const posto of refs.postos) {
      const kits = allKits.slice(kitIndex, kitIndex + KITS_POR_POSTO);
      kitIndex += KITS_POR_POSTO;
      const numeroEnvio = await createEnvioParaPosto(conn, refs, loteId, posto, kits, envioSeq, dataEnvio);
      envioSeq += 1;
      console.log(
        `  ✓ ${posto.codigo_posto}: envio ${numeroEnvio} (${KITS_POR_POSTO} kits: ${kits[0].numero} … ${kits[kits.length - 1].numero})`,
      );
    }

    await conn.commit();

    console.log('\n✓ Seed de Inventário concluído');
    console.log(`  1 lote (${LOTE.codigo_lote}), ${totalKits} kits disponíveis`);
    console.log(`  Nº kit = tracking = codigo_barras (formato ${formatKitNumero(0)})`);
    console.log(`  ${KITS_ESCRITORIO} no escritório + ${KITS_POR_POSTO} por posto via ${refs.postos.length} envios`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    await seedInventory();
  } catch (error) {
    console.error('Erro no seed de inventário:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedInventory };
