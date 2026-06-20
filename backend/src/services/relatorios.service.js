const relatoriosRepository = require('../repositories/relatorios.repository');
const resultadosGeneticosRepository = require('../repositories/resultados_geneticos.repository');
const processosRepository = require('../repositories/processos.repository');
const logService = require('./log.service');
const { emit, EVENTS } = require('../events');

const RELATORIO_DESTINOS_VALIDOS = ['Nenhum', 'Medico', 'Utente', 'Ambos'];
const ESTADOS_ENVIO = ['Pendente', 'Enviado', 'Falha'];

const escapeHtml = (value) =>
  String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-PT');
};

const ensureProcesso = async (processoId, user) => {
  const processo = await processosRepository.findById(processoId);
  if (!processo) throw new Error('Processo nao encontrado');
  if (user && user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para aceder a este processo');
  }
  return processo;
};

/**
 * Constroi o relatorio em HTML com a identidade Genoma (PT). O HTML e pensado
 * para ser aberto no navegador e impresso/convertido em PDF (Ctrl+P / "Guardar
 * como PDF"), replicando o fluxo do CRM antigo sem dependencias pesadas.
 */
const buildRelatorioHtml = (processo, anomalias) => {
  const tudoOk = !!processo.resultado_tudo_ok;

  const linhasAnomalias = (anomalias || [])
    .map(
      (a) => `
        <tr>
          <td>${escapeHtml(a.tipo_resultado || 'Cromossoma')}</td>
          <td>${escapeHtml(a.cromossoma)}</td>
          <td>${escapeHtml(a.resultado_valor)}</td>
          <td>${escapeHtml(a.probabilidade || '—')}</td>
        </tr>`
    )
    .join('');

  const blocoResultado = tudoOk
    ? `<div class="resultado-ok">
         <strong>Resultado: sem anomalias detetadas</strong>
         <p>Nao foram detetadas alteracoes nos parametros analisados.</p>
       </div>`
    : `<div class="resultado-anomalia">
         <strong>Resultado: anomalias detetadas</strong>
         <table class="tabela">
           <thead>
             <tr><th>Tipo</th><th>Cromossoma</th><th>Resultado</th><th>Probabilidade</th></tr>
           </thead>
           <tbody>${linhasAnomalias}</tbody>
         </table>
       </div>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatorio Genoma - ${escapeHtml(processo.numero_processo || processo.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; }
    .cabecalho { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 16px; }
    .marca { font-size: 28px; font-weight: 700; color: #0d9488; letter-spacing: 1px; }
    .subtitulo { color: #6b7280; font-size: 13px; }
    h1 { font-size: 20px; margin: 28px 0 8px; }
    .grelha { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; }
    .campo { font-size: 14px; }
    .campo span { color: #6b7280; display: block; font-size: 12px; }
    .tabela { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .tabela th, .tabela td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    .tabela th { background: #f0fdfa; }
    .resultado-ok { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-top: 12px; }
    .resultado-anomalia { background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin-top: 12px; }
    .rodape { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="cabecalho">
    <div>
      <div class="marca">GENOMA</div>
      <div class="subtitulo">Testes Geneticos &middot; Relatorio Clinico</div>
    </div>
    <div class="campo" style="text-align:right">
      <span>Processo</span>
      <strong>${escapeHtml(processo.numero_processo || processo.id)}</strong>
    </div>
  </div>

  <h1>Identificacao</h1>
  <div class="grelha">
    <div class="campo"><span>Utente</span>${escapeHtml(processo.paciente_nome)}</div>
    <div class="campo"><span>Medico</span>${escapeHtml(processo.medico_nome)}</div>
    <div class="campo"><span>Teste</span>${escapeHtml(processo.teste_nome)}</div>
    <div class="campo"><span>Kit</span>${escapeHtml(processo.kit_codigo || '—')}</div>
    <div class="campo"><span>Posto</span>${escapeHtml(processo.posto || '—')}</div>
    <div class="campo"><span>Data da colheita</span>${formatDate(processo.data_colheita)}</div>
    <div class="campo"><span>Data do resultado</span>${formatDate(processo.data_resultado)}</div>
    <div class="campo"><span>Data de validacao</span>${formatDate(processo.data_validacao)}</div>
  </div>

  <h1>Resultado</h1>
  ${blocoResultado}

  <div class="rodape">
    Documento gerado automaticamente pela plataforma Genoma em ${formatDate(new Date())}.
    Este relatorio deve ser interpretado por um profissional de saude.
  </div>
</body>
</html>`;
};

exports.getRelatorioHtml = async (processoId, user) => {
  const processo = await ensureProcesso(processoId, user);
  const anomalias = await resultadosGeneticosRepository.findByProcesso(processoId);
  return buildRelatorioHtml(processo, anomalias);
};

exports.listRelatorios = async (processoId, user) => {
  await ensureProcesso(processoId, user);
  return relatoriosRepository.findByProcesso(processoId);
};

exports.gerarRelatorio = async (processoId, data, user) => {
  const processo = await ensureProcesso(processoId, user);

  if (!processo.data_resultado && processo.status_id !== 'Resultado Disponivel' && processo.status_id !== 'Validado') {
    throw new Error('So e possivel gerar relatorio apos o resultado estar disponivel.');
  }

  const pdfUrl = `/api/processos/${processoId}/relatorio/html`;
  const relatorio = await relatoriosRepository.create({
    processoId,
    template: data.template || 'genoma-default',
    pdfUrl,
    observacoes: data.observacoes || null,
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Gerou relatorio',
      tabela: 'processo_relatorios',
    });
  }

  const html = buildRelatorioHtml(
    processo,
    await resultadosGeneticosRepository.findByProcesso(processoId)
  );

  return { ...relatorio, html };
};

/**
 * Regista o envio do relatorio (medico/utente/ambos) e o estado do envio.
 */
exports.registarEnvio = async (processoId, data, user) => {
  const processo = await ensureProcesso(processoId, user);

  const destino = data.destino || 'Medico';
  if (!RELATORIO_DESTINOS_VALIDOS.includes(destino)) {
    throw new Error(`Destino invalido. Valores validos: ${RELATORIO_DESTINOS_VALIDOS.join(', ')}`);
  }

  const estado = data.estado_envio && ESTADOS_ENVIO.includes(data.estado_envio)
    ? data.estado_envio
    : 'Enviado';

  const relatorios = await relatoriosRepository.findByProcesso(processoId);
  const relatorioId = data.relatorio_id || (relatorios[0] && relatorios[0].id);
  if (!relatorioId) {
    throw new Error('Nao existe relatorio gerado para este processo.');
  }

  await relatoriosRepository.updateEstadoEnvio(relatorioId, estado, data.observacoes);

  await processosRepository.update(processoId, {
    relatorio_enviado_para: destino,
    data_envio_relatorio: new Date().toISOString().split('T')[0],
  });

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: `Enviou relatorio (${destino})`,
      tabela: 'processo_relatorios',
    });
  }

  emit(EVENTS.RELATORIO_ENVIADO, {
    processo_id: processo.id,
    numero_processo: processo.numero_processo,
    destino,
    medico_email: processo.medico_email || null,
    utente_email: processo.paciente_email || null,
  });

  return { processo_id: processo.id, relatorio_id: relatorioId, destino, estado_envio: estado };
};
