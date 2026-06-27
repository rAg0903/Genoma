const dashboardsRepository = require('../repositories/dashboards.repository');

const num = (value) => Number(value || 0);

exports.getOperacional = async (medicoUtilizadorId = null) => {
  const [contadores, porEstado, parados, requisicoes, atraso, faturas, contactos] = await Promise.all([
    dashboardsRepository.contadoresOperacionais(medicoUtilizadorId),
    dashboardsRepository.processosPorEstado(medicoUtilizadorId),
    dashboardsRepository.processosParados(7, medicoUtilizadorId),
    dashboardsRepository.requisicoesPendentes(),
    dashboardsRepository.resultadosEmAtraso(15, medicoUtilizadorId),
    dashboardsRepository.faturasEmFalta(medicoUtilizadorId),
    dashboardsRepository.totalContactos(medicoUtilizadorId),
  ]);

  const alertas = [];
  if (num(atraso.total) > 0) {
    alertas.push({
      nivel: 'critico',
      mensagem: `${num(atraso.total)} resultado(s) em atraso (prazo de resposta ultrapassado).`,
    });
  }
  if (num(parados.total) > 0) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `${num(parados.total)} processo(s) parado(s) ha mais de 7 dias.`,
    });
  }
  if (num(faturas.nao_emitidas) > 0) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `${num(faturas.nao_emitidas)} processo(s) validado(s) sem fatura emitida.`,
    });
  }
  if (num(faturas.nao_pagas) > 0) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `${num(faturas.nao_pagas)} fatura(s) emitida(s) por pagar.`,
    });
  }
  if (num(contadores.kits_disponiveis) <= 5) {
    alertas.push({
      nivel: 'critico',
      mensagem: `Stock de kits baixo (${num(contadores.kits_disponiveis)} disponiveis).`,
    });
  }
  if (num(requisicoes.total) > 0) {
    alertas.push({
      nivel: 'info',
      mensagem: `${num(requisicoes.total)} requisicao(oes) de kits pendentes.`,
    });
  }

  return {
    kpis: {
      total_contactos: num(contactos.total),
      processos_ativos: num(contadores.processos_ativos),
      colheitas_hoje: num(contadores.colheitas_hoje),
      colheitas_semana: num(contadores.colheitas_semana),
      resultados_pendentes: num(contadores.resultados_pendentes),
      resultados_em_atraso: num(atraso.total),
      kits_disponiveis: num(contadores.kits_disponiveis),
      lotes_ativos: num(contadores.lotes_ativos),
      faturacao_mes: num(contadores.faturacao_mes),
      faturas_nao_emitidas: num(faturas.nao_emitidas),
      faturas_nao_pagas: num(faturas.nao_pagas),
      por_validar: num(contadores.por_validar),
      alertas_criticos: alertas.filter((a) => a.nivel === 'critico').length,
    },
    graficos: {
      processos_por_estado: porEstado.map((r) => ({ estado: r.estado, total: num(r.total) })),
    },
    alertas,
  };
};

exports.getFinanceiro = async (medicoUtilizadorId = null) => {
  const [contadores, receitaMes, topMedicos] = await Promise.all([
    dashboardsRepository.contadoresFinanceiros(medicoUtilizadorId),
    dashboardsRepository.receitaPorMes(6, medicoUtilizadorId),
    dashboardsRepository.receitaPorMedico(5, medicoUtilizadorId),
  ]);

  const alertas = [];
  if (num(contadores.faturas_por_pagar) > 0) {
    alertas.push({
      nivel: 'aviso',
      mensagem: `${num(contadores.faturas_por_pagar)} fatura(s) por pagar (${num(contadores.pendente_recebimento).toFixed(2)} EUR).`,
    });
  }

  return {
    kpis: {
      faturacao_mes: num(contadores.faturacao_mes),
      pendente_recebimento: num(contadores.pendente_recebimento),
      recebido_total: num(contadores.recebido_total),
      ticket_medio: num(contadores.ticket_medio),
    },
    graficos: {
      receita_por_mes: receitaMes.map((r) => ({ mes: r.mes, total: num(r.total) })),
      top_medicos: topMedicos.map((r) => ({ medico: r.medico, total: num(r.total), processos: num(r.processos) })),
    },
    alertas,
  };
};

exports.getLaboratorial = async (medicoUtilizadorId = null) => {
  const [contadores, expiracao, anomalias] = await Promise.all([
    dashboardsRepository.contadoresLaboratoriais(medicoUtilizadorId),
    dashboardsRepository.kitsAExpirar(30),
    dashboardsRepository.anomaliasPorCromossoma(medicoUtilizadorId),
  ]);

  const totalComResultado = num(contadores.total_com_resultado);
  const percAnomalias = totalComResultado > 0
    ? Math.round((num(contadores.com_anomalias) / totalComResultado) * 1000) / 10
    : 0;

  const alertas = [];
  if (num(expiracao.expirados) > 0) {
    alertas.push({ nivel: 'critico', mensagem: `${num(expiracao.expirados)} kit(s) expirado(s) em stock.` });
  }
  if (num(expiracao.a_expirar) > 0) {
    alertas.push({ nivel: 'aviso', mensagem: `${num(expiracao.a_expirar)} kit(s) a expirar nos proximos 30 dias.` });
  }
  if (num(contadores.resultados_por_validar) > 0) {
    alertas.push({ nivel: 'info', mensagem: `${num(contadores.resultados_por_validar)} resultado(s) a aguardar validacao.` });
  }

  return {
    kpis: {
      em_laboratorio: num(contadores.em_laboratorio),
      resultados_por_validar: num(contadores.resultados_por_validar),
      tat_medio_dias: num(contadores.tat_medio_dias),
      percentagem_anomalias: percAnomalias,
    },
    graficos: {
      anomalias_por_cromossoma: anomalias.map((r) => ({ cromossoma: r.cromossoma, total: num(r.total) })),
    },
    alertas,
  };
};

exports.getExecutivo = async (medicoUtilizadorId = null) => {
  const [contadores, mix, porMes] = await Promise.all([
    dashboardsRepository.contadoresExecutivos(medicoUtilizadorId),
    dashboardsRepository.mixDeServicos(medicoUtilizadorId),
    dashboardsRepository.processosPorMes(12, medicoUtilizadorId),
  ]);

  return {
    kpis: {
      total_processos: num(contadores.total_processos),
      processos_mes: num(contadores.processos_mes),
      medicos_ativos: num(contadores.medicos_ativos),
      receita_total: num(contadores.receita_total),
    },
    graficos: {
      mix_servicos: mix.map((r) => ({ teste: r.teste, total: num(r.total) })),
      processos_por_mes: porMes.map((r) => ({ mes: r.mes, total: num(r.total) })),
    },
    alertas: [],
  };
};
