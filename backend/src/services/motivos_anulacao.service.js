const motivosAnulacaoRepository = require('../repositories/motivos_anulacao.repository');
const logService = require('./log.service');

const CONTEXTOS = new Set(['contacto', 'processo']);

const normalizeContexto = (value) => (value === 'processo' ? 'processo' : 'contacto');

exports.assertMotivoParaContexto = async (motivoId, contexto) => {
  if (!motivoId) {
    throw new Error('Motivo de anulação é obrigatório');
  }
  const motivo = await motivosAnulacaoRepository.findById(motivoId);
  if (!motivo || motivo.ativo === false || motivo.ativo === 0) {
    throw new Error('Motivo de anulação inválido');
  }
  if (motivo.contexto !== contexto) {
    throw new Error('Motivo de anulação não aplicável neste contexto');
  }
  return motivo;
};

exports.listAll = async () => motivosAnulacaoRepository.findAll();

exports.getById = async (id) => motivosAnulacaoRepository.findById(id);

exports.create = async (data, user) => {
  const nome = String(data.nome || '').trim();
  if (!nome) throw new Error('Nome do motivo de anulação é obrigatório');

  const contexto = normalizeContexto(data.contexto);
  if (data.contexto && !CONTEXTOS.has(data.contexto)) {
    throw new Error('Contexto inválido. Use contacto ou processo.');
  }

  const existente = await motivosAnulacaoRepository.findByNome(nome);
  if (existente) throw new Error('Já existe um motivo de anulação com este nome');

  const created = await motivosAnulacaoRepository.create({
    nome,
    ativo: data.ativo,
    contexto,
    reabre_contacto: contexto === 'processo' ? !!data.reabre_contacto : false,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Criou motivo de anulação',
      tabela: 'motivos_anulacao',
      registro_id: created.id,
    });
  }

  return created;
};

exports.update = async (id, data, user) => {
  const item = await motivosAnulacaoRepository.findById(id);
  if (!item) throw new Error('Motivo de anulação não encontrado');

  if (data.nome !== undefined) {
    const nome = String(data.nome).trim();
    if (!nome) throw new Error('Nome do motivo de anulação não pode estar vazio');
    if (nome !== item.nome) {
      const existente = await motivosAnulacaoRepository.findByNome(nome);
      if (existente) throw new Error('Já existe outro motivo de anulação com este nome');
    }
  }

  if (data.contexto !== undefined && !CONTEXTOS.has(data.contexto)) {
    throw new Error('Contexto inválido. Use contacto ou processo.');
  }

  const contextoResultante = data.contexto !== undefined ? normalizeContexto(data.contexto) : item.contexto;

  await motivosAnulacaoRepository.update(id, {
    ...(data.nome !== undefined ? { nome: String(data.nome).trim() } : {}),
    ...(data.ativo !== undefined ? { ativo: !!data.ativo } : {}),
    ...(data.contexto !== undefined ? { contexto: contextoResultante } : {}),
    ...(data.reabre_contacto !== undefined
      ? { reabre_contacto: contextoResultante === 'processo' ? !!data.reabre_contacto : false }
      : (data.contexto === 'contacto' ? { reabre_contacto: false } : {})),
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Atualizou motivo de anulação',
      tabela: 'motivos_anulacao',
      registro_id: id,
    });
  }

  return motivosAnulacaoRepository.findById(id);
};

exports.delete = async (id, user) => {
  const item = await motivosAnulacaoRepository.findById(id);
  if (!item) throw new Error('Motivo de anulação não encontrado');

  await motivosAnulacaoRepository.delete(id);

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Eliminou motivo de anulação',
      tabela: 'motivos_anulacao',
      registro_id: id,
    });
  }

  return true;
};
