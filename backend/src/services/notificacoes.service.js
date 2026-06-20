const notificacoesRepository = require('../repositories/notificacoes.repository');

const NIVEL_WEIGHT = { critico: 0, aviso: 1, info: 2 };

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const buildLembreteNotifications = (rows) => {
  const hoje = todayIso();
  return rows.map((row) => {
    const atrasado = row.data_limite && row.data_limite < hoje;
    const nivel = row.prioridade === 'Alta' || atrasado ? 'critico' : row.prioridade === 'Normal' ? 'aviso' : 'info';
    const partes = [row.titulo];
    if (row.processo_numero) partes.push(`(${row.processo_numero})`);
    if (atrasado) partes.push('— em atraso');

    return {
      id: `lembrete:${row.id}`,
      tipo: 'lembrete',
      titulo: atrasado ? 'Lembrete em atraso' : 'Lembrete pendente',
      mensagem: partes.join(' '),
      nivel,
      link: '/notificacoes',
      created_at: toIso(row.data_limite || row.created_at),
    };
  });
};

const buildProcessoNotifications = (rows) =>
  rows.map((row) => {
    const resultado = row.status === 'Resultado Disponivel';
    return {
      id: `processo:${row.id}:${resultado ? 'resultado' : 'validado'}`,
      tipo: 'processo',
      titulo: resultado ? 'Resultado disponível' : 'Processo validado',
      mensagem: resultado
        ? `${row.numero_processo} — ${row.paciente_nome} aguarda validação`
        : `${row.numero_processo} — ${row.paciente_nome} pronto para faturação`,
      nivel: resultado ? 'aviso' : 'info',
      link: `/processos/${row.id}/editar`,
      created_at: toIso(row.data_entrada),
    };
  });

const buildKitNotifications = (rows) =>
  rows.map((row) => ({
    id: `kit:${row.id}`,
    tipo: 'stock',
    titulo: 'Kit expirado',
    mensagem: `${row.codigo_barras} (${row.localizacao || 'sem localização'})`,
    nivel: 'critico',
    link: '/stocks?tab=kits',
    created_at: toIso(row.data_validade),
  }));

const formatLocationEndpoint = (tipo, nome) => {
  if (nome) {
    const prefix = tipo === 'Escritorio' ? 'Empresa' : tipo === 'Posto' ? 'Posto' : 'Laboratório';
    return `${prefix}: ${nome}`;
  }
  if (tipo === 'Escritorio') return 'Empresa';
  if (tipo === 'Posto') return 'Posto';
  if (tipo === 'Laboratorio') return 'Laboratório';
  return tipo || '—';
};

const formatRequisicaoQuantidade = (quantidade) => {
  const qtd = Number(quantidade);
  if (!qtd || Number.isNaN(qtd)) return '';
  return ` (${qtd} kit${qtd === 1 ? '' : 's'})`;
};

const buildStockNotifications = (baixo, lotes, requisicoes) => {
  const items = [];

  baixo.forEach((row) => {
    items.push({
      id: `stock:baixo:${row.localizacao}`,
      tipo: 'stock',
      titulo: 'Stock baixo',
      mensagem: `${row.localizacao}: ${row.total} kit(s) disponível(is)`,
      nivel: row.total === 0 ? 'critico' : 'aviso',
      link: '/stocks?tab=kits',
      created_at: new Date().toISOString(),
    });
  });

  if (lotes.length) {
    items.push({
      id: 'stock:lotes-a-expirar',
      tipo: 'stock',
      titulo: 'Lotes a expirar',
      mensagem: `${lotes.length} lote(s) expiram nos próximos 45 dias`,
      nivel: 'aviso',
      link: '/stocks?tab=lotes',
      created_at: toIso(lotes[0]?.data_validade),
    });
  }

  requisicoes.forEach((row) => {
    const parada = row.data && new Date(row.data).getTime() < Date.now() - 3 * 86400000;
    const origem = formatLocationEndpoint(row.origem, row.origem_nome);
    const destino = formatLocationEndpoint(row.destino, row.destino_nome);
    items.push({
      id: `stock:requisicao:${row.id}`,
      tipo: 'stock',
      titulo: row.status === 'Em transito' ? 'Envio em trânsito' : 'Envio pendente',
      mensagem: `${origem} → ${destino}${parada ? ' (parado >3d)' : ''}`,
      nivel: parada ? 'aviso' : 'info',
      link: '/stocks?tab=requisicoes',
      created_at: toIso(row.data),
    });
  });

  return items;
};

const lowerFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
};

const buildAtividadeTitulo = (row) => {
  const acao = (row.acao || '').toLowerCase();
  if (acao.includes('criou processo')) return 'Processo criado';
  if (acao.includes('atualizou processo')) return 'Processo atualizado';
  if (acao.includes('deletou processo')) return 'Processo eliminado';
  if (acao.includes('criou paciente')) return 'Contacto criado';
  if (acao.includes('atualizou paciente')) return 'Contacto atualizado';
  if (acao.includes('deletou paciente')) return 'Contacto eliminado';
  if (acao.includes('kit utilizado')) return 'Kit utilizado';
  if (acao.includes('colheita')) return 'Colheita';
  if (acao.includes('criou kit')) return 'Kit criado';
  if (acao.includes('criou lote')) return 'Lote criado';
  if (acao.includes('requisicao') || acao.includes('envio')) return 'Envio de kits';
  return 'Atividade no sistema';
};

const buildAtividadeMensagem = (row) => {
  const user = row.utilizador_nome || 'Utilizador';
  const acao = (row.acao || '').trim();
  const acaoLower = acao.toLowerCase();

  if (row.tabela_afetada === 'processos' && row.numero_processo) {
    const paciente = row.paciente_nome ? ` do paciente ${row.paciente_nome}` : '';
    if (acaoLower.includes('criou')) return `${user} criou o processo ${row.numero_processo}${paciente}`;
    if (acaoLower.includes('atualizou')) return `${user} atualizou o processo ${row.numero_processo}${paciente}`;
    if (acaoLower.includes('deletou')) return `${user} eliminou o processo ${row.numero_processo}${paciente}`;
    return `${user} ${lowerFirst(acao)} — ${row.numero_processo}${paciente}`;
  }

  if (row.tabela_afetada === 'pacientes' && row.paciente_nome) {
    if (acaoLower.includes('criou')) return `${user} criou o contacto ${row.paciente_nome}`;
    if (acaoLower.includes('atualizou')) return `${user} atualizou o contacto ${row.paciente_nome}`;
    if (acaoLower.includes('deletou')) return `${user} eliminou o contacto ${row.paciente_nome}`;
    return `${user} ${lowerFirst(acao)} — ${row.paciente_nome}`;
  }

  if (row.tabela_afetada === 'colheitas' && row.numero_processo) {
    const paciente = row.paciente_nome ? ` do paciente ${row.paciente_nome}` : '';
    return `${user} ${lowerFirst(acao)} — processo ${row.numero_processo}${paciente}`;
  }

  if (acaoLower.includes('kit utilizado') && row.kit_codigo) {
    return `${user} marcou o kit ${row.kit_codigo} como utilizado na colheita`;
  }

  if (row.tabela_afetada === 'lotes' && row.lote_codigo && !acaoLower.includes(row.lote_codigo.toLowerCase())) {
    return `${user} ${lowerFirst(acao)} — lote ${row.lote_codigo}`;
  }

  if (row.tabela_afetada === 'kits' && row.kit_codigo && !acaoLower.includes(row.kit_codigo.toLowerCase())) {
    return `${user} ${lowerFirst(acao)} — kit ${row.kit_codigo}`;
  }

  if (row.tabela_afetada === 'requisicoes_kits') {
    const origem = formatLocationEndpoint(row.requisicao_origem, row.requisicao_origem_nome);
    const destino = formatLocationEndpoint(row.requisicao_destino, row.requisicao_destino_nome);
    const route = `${origem} → ${destino}`;
    const qtd = formatRequisicaoQuantidade(row.requisicao_quantidade);

    if (acaoLower.includes('criou')) return `${user} criou envio ${route}${qtd}`;
    if (acaoLower.includes('atualizou')) return `${user} atualizou envio ${route}${qtd}`;
    if (acaoLower.includes('eliminou')) return `${user} eliminou envio ${route}${qtd}`;
    return `${user} ${lowerFirst(acao)} — ${route}${qtd}`;
  }

  if (acao) return `${user} ${lowerFirst(acao)}`;
  return `${user} registou uma alteração no sistema`;
};

const resolveAtividadeLink = (row) => {
  const tabela = row.tabela_afetada;
  const id = row.registro_id;

  if (tabela === 'processos' && id) return `/processos/${id}/editar`;
  if (tabela === 'pacientes' && id) return `/contactos/${id}/editar`;
  if (tabela === 'colheitas' && row.processo_id) return `/processos/${row.processo_id}/editar`;
  if (tabela === 'postos' && row.kit_codigo) return '/stocks?tab=kits';
  if (tabela === 'kits' || tabela === 'movimentos_kits') return '/stocks?tab=kits';
  if (tabela === 'lotes') return '/stocks?tab=lotes';
  if (tabela === 'requisicoes_kits') return '/stocks?tab=requisicoes';
  if (tabela === 'postos' && id) return '/definicoes?tab=laboratorios';
  if (tabela === 'lembretes') return '/notificacoes';
  return null;
};

const buildAtividadeNotifications = (rows) =>
  rows.map((row) => ({
    id: `atividade:${row.id}`,
    tipo: 'atividade',
    titulo: buildAtividadeTitulo(row),
    mensagem: buildAtividadeMensagem(row),
    nivel: 'info',
    link: resolveAtividadeLink(row),
    created_at: toIso(row.data),
  }));

const sortNotifications = (items) =>
  [...items].sort((a, b) => {
    const nivelDiff = (NIVEL_WEIGHT[a.nivel] ?? 2) - (NIVEL_WEIGHT[b.nivel] ?? 2);
    if (nivelDiff !== 0) return nivelDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

const attachReadState = (items, lidas) =>
  items.map((item) => ({ ...item, lida: lidas.has(item.id) }));

exports.listForUser = async (utilizadorId, { limit = 50, apenasNaoLidas = false } = {}) => {
  const [
    lidas,
    lembretes,
    processos,
    kits,
    stockBaixo,
    lotesAExpirar,
    requisicoes,
    atividade,
  ] = await Promise.all([
    notificacoesRepository.findLidasByUtilizador(utilizadorId),
    notificacoesRepository.findLembretesPendentes(),
    notificacoesRepository.findProcessosComResultado(),
    notificacoesRepository.findKitsExpirados(),
    notificacoesRepository.findStockBaixo(),
    notificacoesRepository.findLotesAExpirar(),
    notificacoesRepository.findRequisicoesPendentes(),
    notificacoesRepository.findAtividadeRecente(),
  ]);

  const raw = sortNotifications([
    ...buildLembreteNotifications(lembretes),
    ...buildProcessoNotifications(processos),
    ...buildKitNotifications(kits),
    ...buildStockNotifications(stockBaixo, lotesAExpirar, requisicoes),
    ...buildAtividadeNotifications(atividade),
  ]);

  let data = attachReadState(raw, lidas);
  if (apenasNaoLidas) data = data.filter((n) => !n.lida);

  const unreadCount = data.filter((n) => !n.lida).length;
  const totalUnread = attachReadState(raw, lidas).filter((n) => !n.lida).length;

  return {
    data: data.slice(0, limit),
    count: data.length,
    unreadCount: totalUnread,
  };
};

exports.markRead = async (utilizadorId, notificacaoId) => {
  await notificacoesRepository.markRead(utilizadorId, notificacaoId);
  return { ok: true };
};

exports.markAllRead = async (utilizadorId) => {
  const { data } = await exports.listForUser(utilizadorId, { limit: 500 });
  const ids = data.filter((n) => !n.lida).map((n) => n.id);
  const marked = await notificacoesRepository.markAllRead(utilizadorId, ids);
  return { marked };
};
