const empresasRepository = require('../repositories/empresas.repository');
const logService = require('./log.service');

exports.listAll = async (user) => {
    return await empresasRepository.findAll();
};

exports.getById = async (id, user) => {
    return await empresasRepository.findById(id);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome da empresa é obrigatório');
    }

    // Validar email se fornecido
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Email inválido');
        }

        // Verificar se já existe empresa com esse email
        const existente = await empresasRepository.findByEmail(data.email);
        if (existente) {
            throw new Error('Já existe uma empresa com este email');
        }
    }

    // Verificar se já existe empresa com o mesmo nome
    const existenteNome = await empresasRepository.findByNome(data.nome);
    if (existenteNome) {
        throw new Error('Já existe uma empresa com este nome');
    }

    // Validar código postal se fornecido
    if (data.codigo_postal && data.codigo_postal.trim() === '') {
        data.codigo_postal = null;
    }

    // Validar telefone se fornecido
    if (data.telefone && data.telefone.trim() === '') {
        data.telefone = null;
    }

    const tiposPermitidos = ['CLINICA', 'POSTO', 'LABORATORIO', 'PARCEIRO'];
    let tipoEmpresa = data.tipo_empresa ? data.tipo_empresa.trim().toUpperCase() : null;
    if (tipoEmpresa && !tiposPermitidos.includes(tipoEmpresa)) {
        throw new Error(`Tipo de entidade inválido. Valores válidos: ${tiposPermitidos.join(', ')}`);
    }

    const empresa = await empresasRepository.create({
        nome: data.nome.trim(),
        morada: data.morada ? data.morada.trim() : null,
        codigo_postal: data.codigo_postal ? data.codigo_postal.trim() : null,
        telefone: data.telefone ? data.telefone.trim() : null,
        email: data.email ? data.email.trim() : null,
        tipo_empresa: tipoEmpresa,
        nif: data.nif ? data.nif.trim() : null,
        pais: data.pais ? data.pais.trim() : null,
        contacto: data.contacto ? data.contacto.trim() : null,
        ativo: data.ativo === undefined ? true : !!data.ativo
    });

    // Log da ação
    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Criou empresa",
            tabela: "empresas",
            registro_id: empresa.id
        });
    }

    return empresa;
};

exports.update = async (id, data, user) => {
    // Verificar se existe
    const empresa = await empresasRepository.findById(id);
    if (!empresa) {
        throw new Error('Empresa não encontrada');
    }

    // Validações
    if (data.nome !== undefined) {
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('Nome da empresa não pode estar vazio');
        }
        
        if (empresa.nome !== data.nome) {
            const existente = await empresasRepository.findByNome(data.nome);
            if (existente) {
                throw new Error('Já existe outra empresa com este nome');
            }
        }
    }

    if (data.email !== undefined) {
        if (data.email && data.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw new Error('Email inválido');
            }

            if (empresa.email !== data.email) {
                const existente = await empresasRepository.findByEmail(data.email);
                if (existente) {
                    throw new Error('Já existe outra empresa com este email');
                }
            }
        }
    }

    // Preparar dados para atualizar
    const updateData = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.morada !== undefined) updateData.morada = data.morada ? data.morada.trim() : null;
    if (data.codigo_postal !== undefined) updateData.codigo_postal = data.codigo_postal ? data.codigo_postal.trim() : null;
    if (data.telefone !== undefined) updateData.telefone = data.telefone ? data.telefone.trim() : null;
    if (data.email !== undefined) updateData.email = data.email ? data.email.trim() : null;
    if (data.tipo_empresa !== undefined) {
        const tipoEmpresa = data.tipo_empresa ? data.tipo_empresa.trim().toUpperCase() : null;
        const tiposPermitidos = ['CLINICA', 'POSTO', 'LABORATORIO', 'PARCEIRO'];
        if (tipoEmpresa && !tiposPermitidos.includes(tipoEmpresa)) {
            throw new Error(`Tipo de entidade inválido. Valores válidos: ${tiposPermitidos.join(', ')}`);
        }
        updateData.tipo_empresa = tipoEmpresa;
    }
    if (data.nif !== undefined) updateData.nif = data.nif ? data.nif.trim() : null;
    if (data.pais !== undefined) updateData.pais = data.pais ? data.pais.trim() : null;
    if (data.contacto !== undefined) updateData.contacto = data.contacto ? data.contacto.trim() : null;
    if (data.ativo !== undefined) updateData.ativo = !!data.ativo;

    await empresasRepository.update(id, updateData);

    // Log da ação
    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou empresa",
            tabela: "empresas",
            registro_id: id
        });
    }

    return { id, ...updateData };
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const empresa = await empresasRepository.findById(id);
    if (!empresa) {
        throw new Error('Empresa não encontrada');
    }

    // Verificar se há utilizadores associados
    const countUtilizadores = await empresasRepository.countUtilizadores(id);
    if (countUtilizadores > 0) {
        throw new Error(`Não é possível deletar uma empresa que tem ${countUtilizadores} utilizador(es) associado(s)`);
    }

    await empresasRepository.delete(id);

    // Log da ação
    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou empresa",
            tabela: "empresas",
            registro_id: id
        });
    }

    return true;
};
