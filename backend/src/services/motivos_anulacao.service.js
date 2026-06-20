const motivosAnulacaoRepository = require('../repositories/motivos_anulacao.repository');
const logService = require('./log.service');

exports.listAll = async () => motivosAnulacaoRepository.findAll();

exports.getById = async (id) => motivosAnulacaoRepository.findById(id);

exports.create = async (data, user) => {
  const nome = String(data.nome || '').trim();
  if (!nome) throw new Error('Nome do motivo de anulação é obrigatório');

  const existente = await motivosAnulacaoRepository.findByNome(nome);
  if (existente) throw new Error('Já existe um motivo de anulação com este nome');

  const created = await motivosAnulacaoRepository.create({ nome, ativo: data.ativo });

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

  await motivosAnulacaoRepository.update(id, {
    ...(data.nome !== undefined ? { nome: String(data.nome).trim() } : {}),
    ...(data.ativo !== undefined ? { ativo: !!data.ativo } : {}),
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
