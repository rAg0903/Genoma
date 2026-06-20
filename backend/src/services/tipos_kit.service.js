const tiposKitRepository = require('../repositories/tipos_kit.repository');
const logService = require('./log.service');

exports.listAll = async () => tiposKitRepository.findAll();

exports.getById = async (id) => tiposKitRepository.findById(id);

exports.create = async (data, user) => {
  const nome = String(data.nome || '').trim();
  if (!nome) throw new Error('Nome do tipo de kit é obrigatório');

  const existente = await tiposKitRepository.findByNome(nome);
  if (existente) throw new Error('Já existe um tipo de kit com este nome');

  const created = await tiposKitRepository.create({ nome, ativo: data.ativo });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Criou tipo de kit',
      tabela: 'tipos_kit',
      registro_id: created.id,
    });
  }

  return created;
};

exports.update = async (id, data, user) => {
  const item = await tiposKitRepository.findById(id);
  if (!item) throw new Error('Tipo de kit não encontrado');

  if (data.nome !== undefined) {
    const nome = String(data.nome).trim();
    if (!nome) throw new Error('Nome do tipo de kit não pode estar vazio');
    if (nome !== item.nome) {
      const existente = await tiposKitRepository.findByNome(nome);
      if (existente) throw new Error('Já existe outro tipo de kit com este nome');
    }
  }

  await tiposKitRepository.update(id, {
    ...(data.nome !== undefined ? { nome: String(data.nome).trim() } : {}),
    ...(data.ativo !== undefined ? { ativo: !!data.ativo } : {}),
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Atualizou tipo de kit',
      tabela: 'tipos_kit',
      registro_id: id,
    });
  }

  return tiposKitRepository.findById(id);
};

exports.delete = async (id, user) => {
  const item = await tiposKitRepository.findById(id);
  if (!item) throw new Error('Tipo de kit não encontrado');

  const refs = await tiposKitRepository.countReferencias(id);
  if (refs > 0) {
    throw new Error(`Não é possível eliminar: existem ${refs} lote(s)/kit(s) associados`);
  }

  await tiposKitRepository.delete(id);

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Eliminou tipo de kit',
      tabela: 'tipos_kit',
      registro_id: id,
    });
  }

  return true;
};
