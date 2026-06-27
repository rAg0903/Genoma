const bcrypt = require('bcrypt');
const utilizadoresRepository = require('../repositories/utilizadores.repository');
const perfisRepository = require('../repositories/perfis.repository');
const empresasRepository = require('../repositories/empresas.repository');
const logService = require('./log.service');

const normalizePerfilNome = (nome) =>
    (nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const isAdminPerfil = (nome) => normalizePerfilNome(nome) === 'administrador';

const MAX_AVATAR_LENGTH = 400000;
const AVATAR_DATA_URL_REGEX = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i;

const normalizeAvatarUrl = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (typeof value !== 'string') {
        throw new Error('Foto de perfil inválida');
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (!AVATAR_DATA_URL_REGEX.test(trimmed)) {
        throw new Error('Formato de imagem não suportado. Use JPEG, PNG, WebP ou GIF.');
    }

    if (trimmed.length > MAX_AVATAR_LENGTH) {
        throw new Error('A imagem é demasiado grande. Escolha uma foto mais pequena.');
    }

    return trimmed;
};

const resolvePerfilId = async (data) => {
    if (data.perfil_id) {
        return data.perfil_id;
    }

    const perfilNome = data.perfil_nome || data.perfil;
    if (!perfilNome) {
        return null;
    }

    const perfil = await perfisRepository.findByNome(String(perfilNome).trim());
    return perfil ? perfil.id : null;
};

const assertSingleAdministrator = async (perfilId, excludeUserId = null) => {
    if (!perfilId) return;

    const perfil = await perfisRepository.findById(perfilId);
    if (!perfil || !isAdminPerfil(perfil.nome)) return;

    const count = await utilizadoresRepository.countByPerfilId(perfilId, excludeUserId);
    if (count > 0) {
        throw new Error('Já existe um utilizador Administrador. Só pode existir um.');
    }
};

exports.listAll = async (user) => {
    const perfil = user?.perfil_id ? await perfisRepository.findById(user.perfil_id) : null;
    if (isAdminPerfil(perfil?.nome)) {
        return utilizadoresRepository.findAll();
    }
    if (user.empresa_id) {
        return utilizadoresRepository.findByEmpresaIncludingMedicos(user.empresa_id);
    }
    return utilizadoresRepository.findAll();
};

exports.getById = async (id, user) => {
    const utilizador = await utilizadoresRepository.findById(id);

    if (user.empresa_id && utilizador.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para aceder a este utilizador');
    }

    return utilizador;
};

exports.create = async (data, user) => {
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do utilizador é obrigatório');
    }

    if (!data.email || data.email.trim() === '') {
        throw new Error('Email é obrigatório');
    }

    const email = data.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Email inválido');
    }

    const existeEmail = await utilizadoresRepository.existeEmail(email);
    if (existeEmail) {
        throw new Error('Já existe um utilizador com este email');
    }

    const perfilId = await resolvePerfilId(data);
    if (!perfilId) {
        throw new Error('Perfil é obrigatório');
    }

    const perfil = await perfisRepository.findById(perfilId);
    if (!perfil) {
        throw new Error('Perfil não encontrado');
    }

    await assertSingleAdministrator(perfilId);

    if (data.empresa_id) {
        const empresa = await empresasRepository.findById(data.empresa_id);
        if (!empresa) {
            throw new Error('Empresa não encontrada');
        }
    }

    if (data.telefone && data.telefone.trim() === '') {
        data.telefone = null;
    }

    let passwordHash = null;
    if (data.password && data.password.trim() !== '') {
        passwordHash = await bcrypt.hash(data.password, 10);
    }

    const utilizador = await utilizadoresRepository.create({
        nome: data.nome.trim(),
        email,
        telefone: data.telefone ? data.telefone.trim() : null,
        perfil_id: perfilId,
        empresa_id: data.empresa_id || null,
        password_hash: passwordHash,
        ativo: data.ativo !== undefined ? data.ativo : true
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: 'Criou utilizador',
            tabela: 'utilizadores',
            registro_id: utilizador.id
        });
    }

    const created = await utilizadoresRepository.findById(utilizador.id);
    const { password_hash, reset_token_hash, reset_token_expires_at, ...utilizadorSemPassword } = created;
    void password_hash;
    void reset_token_hash;
    void reset_token_expires_at;
    return utilizadorSemPassword;
};

exports.update = async (id, data, user) => {
    const utilizador = await utilizadoresRepository.findById(id);
    if (!utilizador) {
        throw new Error('Utilizador não encontrado');
    }

    if (user.empresa_id && utilizador.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para atualizar este utilizador');
    }

    if (isAdminPerfil(utilizador.perfil_nome) && data.perfil_id !== undefined) {
        const nextPerfilId = data.perfil_id;
        const currentPerfil = await perfisRepository.findById(utilizador.perfil_id);
        if (!currentPerfil || nextPerfilId !== currentPerfil.id) {
            throw new Error('O perfil do utilizador Administrador não pode ser alterado');
        }
    }

    if (data.nome !== undefined) {
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('Nome do utilizador não pode estar vazio');
        }
    }

    if (data.email !== undefined) {
        if (!data.email || data.email.trim() === '') {
            throw new Error('Email não pode estar vazio');
        }

        const email = data.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Email inválido');
        }

        if (utilizador.email !== email) {
            const existeEmail = await utilizadoresRepository.existeEmail(email, id);
            if (existeEmail) {
                throw new Error('Já existe outro utilizador com este email');
            }
        }
        data.email = email;
    }

    let nextPerfilId = undefined;
    if (data.perfil_id !== undefined || data.perfil_nome !== undefined || data.perfil !== undefined) {
        nextPerfilId = await resolvePerfilId(data);
        if (!nextPerfilId) {
            throw new Error('Perfil não encontrado');
        }

        const perfil = await perfisRepository.findById(nextPerfilId);
        if (!perfil) {
            throw new Error('Perfil não encontrado');
        }

        await assertSingleAdministrator(nextPerfilId, id);
    }

    if (data.empresa_id !== undefined && data.empresa_id !== null) {
        const empresa = await empresasRepository.findById(data.empresa_id);
        if (!empresa) {
            throw new Error('Empresa não encontrada');
        }
    }

    const updateData = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telefone !== undefined) updateData.telefone = data.telefone ? data.telefone.trim() : null;
    if (nextPerfilId !== undefined) updateData.perfil_id = nextPerfilId;
    if (data.empresa_id !== undefined) updateData.empresa_id = data.empresa_id;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.avatar_url !== undefined) updateData.avatar_url = normalizeAvatarUrl(data.avatar_url);

    if (data.password) {
        updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    await utilizadoresRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: 'Atualizou utilizador',
            tabela: 'utilizadores',
            registro_id: id
        });
    }

    const updated = await utilizadoresRepository.findById(id);
    const { password_hash, reset_token_hash, reset_token_expires_at, ...utilizadorSemPassword } = updated;
    void password_hash;
    void reset_token_hash;
    void reset_token_expires_at;
    return utilizadorSemPassword;
};

exports.delete = async (id, user) => {
    const utilizador = await utilizadoresRepository.findById(id);
    if (!utilizador) {
        throw new Error('Utilizador não encontrado');
    }

    if (user.empresa_id && utilizador.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para deletar este utilizador');
    }

    if (user.id === id) {
        throw new Error('Não pode deletar a sua própria conta');
    }

    if (isAdminPerfil(utilizador.perfil_nome)) {
        throw new Error('O utilizador Administrador não pode ser eliminado');
    }

    await utilizadoresRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: 'Deletou utilizador',
            tabela: 'utilizadores',
            registro_id: id
        });
    }

    return true;
};
