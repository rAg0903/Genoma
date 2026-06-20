const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const medicosRepository = require('../repositories/medicos.repository');
const utilizadoresRepository = require('../repositories/utilizadores.repository');
const logService = require('./log.service');
const pool = require('../config/database');

const CRITERIOS_POSTOS = ['nome', 'cidade', 'distrito', 'codigo'];

const normalizeCondicoesTestes = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((r) => r && r.teste_id)
    .map((r) => ({
      teste_id: r.teste_id,
      comissao: r.comissao,
      prazo_pagamento_dias: r.prazo_pagamento_dias,
    }));
};

const normalizeContactos = (items) => {
  const base = [{ nome: '', funcao: '', email: '', telefone: '' }];
  const list = Array.isArray(items) ? items : [];
  while (list.length < 3) list.push({ nome: '', funcao: '', email: '', telefone: '' });
  return list.slice(0, 3).map((c, i) => ({
    nome: String(c?.nome || base[i]?.nome || '').trim(),
    funcao: String(c?.funcao || '').trim(),
    email: String(c?.email || '').trim(),
    telefone: String(c?.telefone || '').trim(),
  }));
};

const getPerfilMedicoId = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute("SELECT id FROM perfis WHERE nome = 'Medico' LIMIT 1");
    if (!rows[0]) throw new Error('Perfil Medico nao encontrado nas definicoes');
    return rows[0].id;
  } finally {
    connection.release();
  }
};

const validatePayload = async (data, utilizadorId = null) => {
  const nome = String(data.nome || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  if (!nome) throw new Error('Nome e obrigatorio');
  if (!email) throw new Error('Email e obrigatorio');

  const existenteEmail = await utilizadoresRepository.findByEmail(email);
  if (existenteEmail && existenteEmail.id !== utilizadorId) {
    throw new Error('Ja existe um utilizador com este email');
  }

  const numOrdem = data.num_ordem ? String(data.num_ordem).trim() : null;
  if (numOrdem && await medicosRepository.existeNumOrdem(numOrdem, utilizadorId)) {
    throw new Error('Ja existe um medico com este numero de cedula');
  }

  const criterio = data.criterio_busca_postos || 'nome';
  if (!CRITERIOS_POSTOS.includes(criterio)) {
    throw new Error('Criterio de busca de postos invalido');
  }

  return { nome, email, numOrdem, criterio };
};

exports.listAll = async () => medicosRepository.findAll();

exports.getById = async (utilizadorId) => medicosRepository.findById(utilizadorId);

exports.create = async (data, user) => {
  const { nome, email, numOrdem, criterio } = await validatePayload(data);
  const perfilId = await getPerfilMedicoId();
  const utilizadorId = uuidv4();
  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

  await utilizadoresRepository.create({
    id: utilizadorId,
    perfil_id: perfilId,
    empresa_id: null,
    nome,
    email,
    telefone: data.telefone_movel ? String(data.telefone_movel).trim() : null,
    password_hash: passwordHash,
    ativo: data.ativo !== false,
  });

  await medicosRepository.create({
    utilizador_id: utilizadorId,
    num_ordem: numOrdem,
    especialidade: data.especialidade ? String(data.especialidade).trim() : null,
    titulo: data.titulo ? String(data.titulo).trim() : null,
    genero: data.genero || null,
    pais: data.pais || 'Portugal',
    telefone_fixo: data.telefone_fixo ? String(data.telefone_fixo).trim() : null,
    criterio_busca_postos: criterio,
    notas: data.notas ? String(data.notas).trim() : null,
    ativo: data.ativo !== false,
  });

  await medicosRepository.replaceContactos(utilizadorId, normalizeContactos(data.contactos_secundarios));
  await medicosRepository.replaceLocaisTrabalho(utilizadorId, data.locais_trabalho || []);
  await medicosRepository.replaceCondicoesTestes(utilizadorId, normalizeCondicoesTestes(data.condicoes_testes));

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id,
      utilizador_id: user.id,
      acao: 'Criou medico',
      tabela: 'medicos',
      registro_id: utilizadorId,
    });
  }

  return medicosRepository.findById(utilizadorId);
};

exports.update = async (utilizadorId, data, user) => {
  const medico = await medicosRepository.findById(utilizadorId);
  if (!medico) throw new Error('Medico nao encontrado');

  const { nome, email, numOrdem, criterio } = await validatePayload({ ...medico, ...data }, utilizadorId);

  await utilizadoresRepository.update(utilizadorId, {
    nome,
    email,
    telefone: data.telefone_movel !== undefined
      ? (data.telefone_movel ? String(data.telefone_movel).trim() : null)
      : medico.telefone_movel,
    ativo: data.ativo !== undefined ? data.ativo !== false : medico.ativo,
  });

  await medicosRepository.update(utilizadorId, {
    num_ordem: numOrdem,
    especialidade: data.especialidade !== undefined
      ? (data.especialidade ? String(data.especialidade).trim() : null)
      : medico.especialidade,
    titulo: data.titulo !== undefined ? (data.titulo ? String(data.titulo).trim() : null) : medico.titulo,
    genero: data.genero !== undefined ? data.genero : medico.genero,
    pais: data.pais !== undefined ? data.pais : medico.pais,
    telefone_fixo: data.telefone_fixo !== undefined
      ? (data.telefone_fixo ? String(data.telefone_fixo).trim() : null)
      : medico.telefone_fixo,
    criterio_busca_postos: criterio,
    notas: data.notas !== undefined ? (data.notas ? String(data.notas).trim() : null) : medico.notas,
    ativo: data.ativo !== undefined ? data.ativo !== false : medico.ativo,
  });

  if (data.contactos_secundarios !== undefined) {
    await medicosRepository.replaceContactos(utilizadorId, normalizeContactos(data.contactos_secundarios));
  }
  if (data.locais_trabalho !== undefined) {
    await medicosRepository.replaceLocaisTrabalho(utilizadorId, data.locais_trabalho);
  }
  if (data.condicoes_testes !== undefined) {
    await medicosRepository.replaceCondicoesTestes(utilizadorId, normalizeCondicoesTestes(data.condicoes_testes));
  }

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id,
      utilizador_id: user.id,
      acao: 'Atualizou medico',
      tabela: 'medicos',
      registro_id: utilizadorId,
    });
  }

  return medicosRepository.findById(utilizadorId);
};

exports.delete = async (utilizadorId, user) => {
  const medico = await medicosRepository.findById(utilizadorId);
  if (!medico) throw new Error('Medico nao encontrado');

  const countProcessos = await medicosRepository.countProcessosAssociados(utilizadorId);
  if (countProcessos > 0) {
    throw new Error(`Nao e possivel remover este medico com ${countProcessos} processo(s) associado(s)`);
  }

  const countPedidos = await medicosRepository.countPedidosAssociados(utilizadorId);
  if (countPedidos > 0) {
    throw new Error(`Nao e possivel remover este medico com ${countPedidos} pedido(s) associado(s)`);
  }

  await medicosRepository.delete(utilizadorId);
  await utilizadoresRepository.delete(utilizadorId);

  if (user) {
    await logService.log({
      empresa_id: user.empresa_id,
      utilizador_id: user.id,
      acao: 'Removeu medico',
      tabela: 'medicos',
      registro_id: utilizadorId,
    });
  }

  return true;
};
