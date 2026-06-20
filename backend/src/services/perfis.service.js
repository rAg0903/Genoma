const perfisRepository = require('../repositories/perfis.repository');
const logService = require('./log.service');
const perfilStockSubmodulosService = require('./perfil_stock_submodulos.service');

const normalizePerfilNome = (nome) =>
    (nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const isAdminPerfil = (nome) => normalizePerfilNome(nome) === 'administrador';

exports.listAll = async (user) => {
    return await perfisRepository.findAll();
};

exports.getById = async (id, user) => {
    return await perfisRepository.findById(id);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do perfil é obrigatório');
    }

    // Verificar se já existe um perfil com o mesmo nome
    const existente = await perfisRepository.findByNome(data.nome);
    if (existente) {
        throw new Error('Já existe um perfil com este nome');
    }

    const perfil = await perfisRepository.create({
        nome: data.nome.trim()
    });

    await perfilStockSubmodulosService.getByPerfilId(perfil.id);

    // Log da ação
    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Criou perfil",
            tabela: "perfis",
            registro_id: perfil.id
        });
    }

    return perfil;
};

exports.getStockSubmodulos = async (perfilId) => {
    return perfilStockSubmodulosService.getByPerfilId(perfilId);
};

exports.updateStockSubmodulos = async (perfilId, permissoes, user) => {
    const result = await perfilStockSubmodulosService.updateByPerfilId(perfilId, permissoes);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: 'Atualizou permissões de Stocks por submódulo',
            tabela: 'perfil_stock_submodulos',
            registro_id: perfilId
        });
    }

    return result;
};

exports.update = async (id, data, user) => {
    // Validações
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do perfil é obrigatório');
    }

    // Verificar se existe
    const perfil = await perfisRepository.findById(id);
    if (!perfil) {
        throw new Error('Perfil não encontrado');
    }

    if (isAdminPerfil(perfil.nome)) {
        throw new Error('O perfil Administrador não pode ser alterado');
    }

    // Verificar se outro perfil tem o mesmo nome
    if (perfil.nome !== data.nome) {
        const existente = await perfisRepository.findByNome(data.nome);
        if (existente) {
            throw new Error('Já existe outro perfil com este nome');
        }
    }

    await perfisRepository.update(id, {
        nome: data.nome.trim()
    });

    // Log da ação
    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou perfil",
            tabela: "perfis",
            registro_id: id
        });
    }

    return { id, nome: data.nome };
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const perfil = await perfisRepository.findById(id);
    if (!perfil) {
        throw new Error('Perfil não encontrado');
    }

    if (isAdminPerfil(perfil.nome)) {
        throw new Error('O perfil Administrador não pode ser eliminado');
    }

    // Verificar se há utilizadores com este perfil
    const pool = require('../config/database');
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM utilizadores WHERE perfil_id = ?', [id]);
        if (rows[0].count > 0) {
            throw new Error('Não é possível deletar um perfil que tem utilizadores associados');
        }
    } finally {
        connection.release();
    }

    await perfisRepository.delete(id);

    // Log da ação
    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou perfil",
            tabela: "perfis",
            registro_id: id
        });
    }

    return true;
};
