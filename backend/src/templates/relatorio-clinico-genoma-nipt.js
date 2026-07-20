const fs = require('fs');
const path = require('path');
const {
  NUMEROS,
  cromossomasAnalisados,
  parseResultadosJson,
  inicializarNegativo,
  anomaliasParaResultados,
  derivarTudoOk,
  obterValorResultado,
  classeResultado,
  normalizarResultado,
  buildTituloConclusao,
  buildTextoConclusao,
  classeConclusao,
} = require('../utils/cromossoma-opcoes');

const escapeHtml = (value) =>
  String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDatePt = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const text = String(value).trim();
    const m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return text;
  }
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${mo}/${y}`;
};

const loadImageDataUri = (filename) => {
  const candidates = [
    path.join(__dirname, '../assets', filename),
    path.join(__dirname, '../../../frontend/public', filename),
    path.join(__dirname, '../../../frontend/dist', filename),
  ];
  for (const imagePath of candidates) {
    try {
      if (fs.existsSync(imagePath)) {
        const buf = fs.readFileSync(imagePath);
        const ext = path.extname(filename).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    } catch {
      /* try next */
    }
  }
  return '';
};

const GENOMA_LOGO_URI = loadImageDataUri('Imagem1G.png') || loadImageDataUri('genoma-logo.png');

const resolveClinicaFallback = (processo) => ({
  nome: process.env.CLINICA_NOME || processo.empresa_nome || 'GENOMA',
  morada: process.env.CLINICA_MORADA || '',
  codigoPostal: process.env.CLINICA_CODIGO_POSTAL || '',
  telefone: process.env.CLINICA_TELEFONE || '',
  email: process.env.CLINICA_EMAIL || processo.empresa_email || '',
});

const resolveTipoKit = (processo) =>
  processo.sub_teste_nome || processo.teste_nome || processo.teste || '';

const resolveDadosResultado = (processo, anomalias) => {
  const analisados = cromossomasAnalisados(processo);
  let resultados = parseResultadosJson(processo.resultados_cromossomas);
  if (Object.keys(resultados).length === 0 && anomalias?.length) {
    resultados = anomaliasParaResultados(anomalias, analisados);
  }
  if (Object.keys(resultados).length === 0) {
    resultados = inicializarNegativo(analisados);
  }

  const sugerirRepeticao = !!processo.sugerir_repeticao;
  const semAnomalias = sugerirRepeticao
    ? false
    : derivarTudoOk(resultados, analisados, false) && processo.resultado_tudo_ok !== 0;

  return { analisados, resultados, sugerirRepeticao, semAnomalias };
};

const buildCampo = (label, value) => {
  if (!value) return '';
  return `<div class="genoma-resultado-campo">
    <span class="genoma-resultado-label">${escapeHtml(label)}</span>
    <span class="genoma-resultado-valor">${escapeHtml(value)}</span>
  </div>`;
};

const buildChips = (analisados) =>
  NUMEROS.map((n) =>
    `<span class="genoma-resultado-chip${analisados.includes(n) ? ' ativo' : ''}">C${n}</span>`
  ).join('');

const buildColunaTabela = (numeros, analisados, resultados, semAnomalias) => {
  const rows = numeros.map((n) => {
    const analisado = analisados.includes(n);
    const valor = analisado ? obterValorResultado(resultados, n, analisados, semAnomalias) : '';
    const cls = analisado ? classeResultado(valor) : 'nao-analisado';
    return `<tr class="${analisado ? '' : 'linha-nao-analisada'}">
      <td><span class="genoma-resultado-crom-num">C${n}</span></td>
      <td class="${cls}">${analisado ? escapeHtml(valor) : '—'}</td>
    </tr>`;
  }).join('');
  return `<table class="genoma-resultado-lista">
    <thead><tr><th>Cromossoma</th><th>Resultado</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
};

const STYLES = `
* { box-sizing: border-box; }
@page { size: A4 portrait; margin: 12mm; }
html { background: #e2e8f0; }
body {
  margin: 0; padding: 8mm 0;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.page { width: 210mm; margin: 0 auto; background: #fff; box-shadow: 0 2px 14px rgba(0,0,0,.12); }
@media screen {
  html { overflow: hidden; height: auto; }
  body {
    padding: 0;
    margin: 0;
    min-height: 0;
    height: auto;
    overflow: hidden;
    background: #fff;
    display: flex;
    justify-content: center;
  }
  .page {
    width: 210mm;
    max-width: 210mm;
    margin: 0;
    box-shadow: none;
    flex-shrink: 0;
  }
}
@media print {
  html { background: #fff; overflow: visible; }
  body {
    padding: 0;
    margin: 0;
    min-height: 0;
    height: auto;
    overflow: visible;
    background: #fff;
    display: block;
  }
  .page {
    width: 210mm;
    max-width: 210mm;
    margin: 0 auto;
    box-shadow: none;
  }
}
body.pdf-export {
  padding: 0;
  margin: 0;
  background: #fff;
  display: block;
  overflow: visible;
}
body.pdf-export .page {
  width: 210mm;
  max-width: 210mm;
  margin: 0 auto;
  box-shadow: none;
}
.genoma-resultado-folha { background: #fff; color: #0f172a; overflow: hidden; }
.genoma-resultado-topbar {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  padding: 0.5rem 1.25rem; background: #f0f9ff; border-bottom: 1px solid #dbeafe;
  font-size: 0.7rem; color: #64748b; flex-wrap: wrap;
}
.genoma-resultado-clinica, .genoma-resultado-ref { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; }
.genoma-resultado-ref { text-align: right; margin-left: auto; font-weight: 500; color: #475569; }
.genoma-resultado-header {
  display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem;
  padding: 1.25rem 1.25rem 1rem; border-bottom: 2px solid #0d9488; flex-wrap: wrap;
}
.genoma-resultado-brand { display: flex; align-items: center; gap: 0.85rem; }
.genoma-resultado-logo {
  width: 52px; height: 52px; border-radius: 8px;
  background: linear-gradient(135deg, #0d9488, #0891b2);
  display: flex; align-items: center; justify-content: center; padding: 8px; flex-shrink: 0;
}
.genoma-resultado-logo img { width: 100%; height: 100%; object-fit: contain; }
.genoma-resultado-logo-fallback { color: #fff; font-weight: 700; font-size: 0.65rem; letter-spacing: 0.08em; }
.genoma-resultado-brand-name {
  font-size: 1.35rem; font-weight: 700; letter-spacing: 0.06em;
  color: #0f766e; text-transform: uppercase;
}
.genoma-resultado-brand-tag { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
.genoma-resultado-doc-id { text-align: right; }
.genoma-resultado-doc-label {
  font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;
}
.genoma-resultado-doc-num { font-size: 1rem; font-weight: 700; color: #0f172a; }
.genoma-resultado-ficha {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #e2e8f0;
}
.genoma-resultado-bloco { padding: 1.1rem 1.35rem; background: #fff; }
.genoma-resultado-bloco:first-child { border-right: 1px solid #f1f5f9; }
.genoma-resultado-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem 1.25rem; }
.genoma-resultado-campo { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.genoma-resultado-label {
  font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em;
  color: #64748b; font-weight: 600;
}
.genoma-resultado-valor { font-size: 0.95rem; color: #0f172a; font-weight: 600; line-height: 1.3; }
.genoma-resultado-valor-kit { color: #0f766e; }
.genoma-resultado-secao-titulo {
  margin: 0 0 0.75rem; font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em; color: #0d9488;
}
.genoma-resultado-cromossomas-resumo {
  margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed #e2e8f0;
}
.genoma-resultado-contagem {
  display: inline-block; margin-left: 0.5rem; font-size: 0.72rem; font-weight: 600;
  color: #0f766e; background: #ecfdf5; padding: 0.15rem 0.5rem; border-radius: 999px;
}
.genoma-resultado-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.55rem; }
.genoma-resultado-chip {
  display: inline-flex; align-items: center; justify-content: center; min-width: 2rem;
  padding: 0.2rem 0.35rem; font-size: 0.65rem; font-weight: 600; border-radius: 4px;
  border: 1px solid #e2e8f0; background: #f8fafc; color: #cbd5e1;
}
.genoma-resultado-chip.ativo { border-color: #6ee7b7; background: #ecfdf5; color: #047857; }
.genoma-resultado-conclusao {
  display: flex; align-items: flex-start; gap: 0.85rem; margin: 1rem 1.35rem;
  padding: 1rem 1.15rem; border-radius: 8px; border: 1px solid #e2e8f0; border-left-width: 4px;
  background: #f8fafc;
}
.genoma-resultado-conclusao.ok {
  border-left-color: #10b981; border-color: #a7f3d0;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}
.genoma-resultado-conclusao.anomalia {
  border-left-color: #f59e0b; border-color: #fde68a;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}
.genoma-resultado-conclusao.alerta {
  border-left-color: #ef4444; border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}
.genoma-resultado-conclusao-icon {
  width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0; margin-top: 0.1rem; background: #cbd5e1;
}
.genoma-resultado-conclusao.ok .genoma-resultado-conclusao-icon { background: #10b981; }
.genoma-resultado-conclusao.anomalia .genoma-resultado-conclusao-icon { background: #f59e0b; }
.genoma-resultado-conclusao.alerta .genoma-resultado-conclusao-icon { background: #ef4444; }
.genoma-resultado-conclusao-titulo { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
.genoma-resultado-conclusao-texto { font-size: 0.82rem; color: #475569; line-height: 1.5; }
.genoma-resultado-secao-tabela { padding: 1.1rem 1.35rem 1.25rem; background: #fafbfc; }
.genoma-resultado-secao-desc { margin: -0.35rem 0 0.85rem; font-size: 0.78rem; color: #64748b; }
.genoma-resultado-colunas {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 0.75rem;
}
.genoma-resultado-lista {
  width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;
  border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: #fff;
}
.genoma-resultado-lista th {
  background: #0f766e; color: #fff; font-weight: 600; padding: 0.6rem 0.85rem;
  text-align: left; font-size: 0.72rem; text-transform: uppercase;
}
.genoma-resultado-lista td { border-top: 1px solid #f1f5f9; padding: 0.5rem 0.85rem; }
.genoma-resultado-lista tr.linha-nao-analisada td { opacity: 0.55; }
.genoma-resultado-crom-num {
  display: inline-flex; align-items: center; justify-content: center; min-width: 2.1rem;
  padding: 0.15rem 0.4rem; font-size: 0.75rem; font-weight: 700; border-radius: 4px;
  background: #f1f5f9; color: #475569;
}
.genoma-resultado-lista td.nao-analisado { background: #fafbfc; color: #cbd5e1; text-align: center; }
.genoma-resultado-lista td.negativo { color: #166534; font-weight: 600; background: #f0fdf4; }
.genoma-resultado-lista td.positivo { color: #991b1b; font-weight: 700; background: #fef2f2; }
.genoma-resultado-lista td.suspeita { color: #92400e; font-weight: 700; background: #fffbeb; }
.genoma-resultado-legenda {
  display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.72rem; color: #64748b; margin-top: 0.5rem;
}
.genoma-resultado-legenda span { display: inline-flex; align-items: center; gap: 0.35rem; }
.genoma-resultado-legenda i {
  display: inline-block; width: 0.65rem; height: 0.65rem; border-radius: 2px;
}
.leg-negativo { background: #10b981; }
.leg-positivo { background: #ef4444; }
.leg-suspeita { background: #f59e0b; }
.leg-na { background: #cbd5e1; }
.genoma-resultado-secao { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
.genoma-resultado-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem 1.5rem;
}
.genoma-resultado-grid > div { display: grid; gap: 0.1rem; }
.genoma-resultado-grid dt {
  font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: #94a3b8; font-weight: 600;
}
.genoma-resultado-grid dd { margin: 0; font-size: 0.88rem; color: #1e293b; font-weight: 500; }
.genoma-resultado-footer {
  padding: 1rem 1.35rem 1.25rem; font-size: 0.75rem; color: #64748b; line-height: 1.55;
  border-top: 1px solid #e2e8f0; background: #f8fafc;
}
.genoma-resultado-footer-assinatura { margin-top: 0.65rem; font-weight: 600; color: #0f766e; }
`;

/**
 * Relatório clínico NIPT — layout alinhado com ResultadoFolha (MAUI).
 * @param {object} [options]
 * @param {boolean} [options.pdf] — estilos para exportação PDF (igual à pré-visualização).
 */
exports.buildRelatorioClinicoGenomaNiptHtml = (processo, anomalias = [], clinicaOverride = null, options = {}) => {
  const clinica = clinicaOverride || resolveClinicaFallback(processo);
  const numero = processo.numero_processo || processo.numero || processo.id;
  const dataEmissao = formatDatePt(
    processo.data_relatorio_laboratorio || processo.data_validacao || processo.data_resultado || new Date()
  );
  const tipoKit = resolveTipoKit(processo);
  const { analisados, resultados, sugerirRepeticao, semAnomalias } = resolveDadosResultado(processo, anomalias);

  const tituloConclusao = buildTituloConclusao({ sugerirRepeticao, semAnomalias });
  const textoConclusao = buildTextoConclusao({ sugerirRepeticao, semAnomalias, resultados, analisados });
  const conclusaoCls = classeConclusao({ sugerirRepeticao, semAnomalias });

  const metade = Math.ceil(NUMEROS.length / 2);
  const colunaEsquerda = NUMEROS.slice(0, metade);
  const colunaDireita = NUMEROS.slice(metade);

  const clinicaLinhas = [
    clinica.morada,
    clinica.codigoPostal,
    clinica.telefone ? `Tel. ${clinica.telefone}` : '',
    clinica.email,
  ].filter(Boolean).map((l) => `<span>${escapeHtml(l)}</span>`).join('');

  const logoHtml = GENOMA_LOGO_URI
    ? `<img src="${GENOMA_LOGO_URI}" alt="Genoma" />`
    : '<span class="genoma-resultado-logo-fallback">GENOMA</span>';

  const temComplementar = processo.cromossomas_sexuais
    || processo.resultado_cromossomas_sexuais
    || processo.fracao_fetal;

  const complementarHtml = temComplementar ? `
    <section class="genoma-resultado-secao">
      <h2 class="genoma-resultado-secao-titulo">Informação complementar</h2>
      <dl class="genoma-resultado-grid">
        ${processo.cromossomas_sexuais ? `<div><dt>Cromossomas sexuais</dt><dd>${escapeHtml(processo.cromossomas_sexuais)}</dd></div>` : ''}
        ${processo.resultado_cromossomas_sexuais ? `<div><dt>Resultado crom. sexuais</dt><dd>${escapeHtml(normalizarResultado(processo.resultado_cromossomas_sexuais))}</dd></div>` : ''}
        ${processo.fracao_fetal ? `<div><dt>Fração fetal</dt><dd>${escapeHtml(String(processo.fracao_fetal).replace('%', '').trim())} %</dd></div>` : ''}
      </dl>
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatório NIPT ${escapeHtml(numero)}</title>
  <style>${STYLES}</style>
</head>
<body class="${options.pdf ? 'pdf-export' : ''}">
  <div class="page">
    <div class="genoma-resultado-folha">
      <div class="genoma-resultado-topbar">
        <div class="genoma-resultado-clinica">${clinicaLinhas}</div>
        <div class="genoma-resultado-ref">
          <span>Ref. ${escapeHtml(numero)}</span>
          <span>Emissão ${dataEmissao}</span>
        </div>
      </div>

      <header class="genoma-resultado-header">
        <div class="genoma-resultado-brand">
          <div class="genoma-resultado-logo">${logoHtml}</div>
          <div>
            <div class="genoma-resultado-brand-name">${escapeHtml(clinica.nome)}</div>
            <div class="genoma-resultado-brand-tag">Relatório de Resultados — Teste Pré-Natal Não Invasivo</div>
          </div>
        </div>
        <div class="genoma-resultado-doc-id">
          <div class="genoma-resultado-doc-label">Documento</div>
          <div class="genoma-resultado-doc-num">RR/${escapeHtml(numero)}</div>
        </div>
      </header>

      <div class="genoma-resultado-corpo">
        <div class="genoma-resultado-ficha">
          <section class="genoma-resultado-bloco">
            <h2 class="genoma-resultado-secao-titulo">Identificação</h2>
            <div class="genoma-resultado-campos">
              ${buildCampo('Paciente', processo.paciente_nome)}
              ${buildCampo('N.º Processo', numero)}
              ${buildCampo('Médico assistente', processo.medico_nome)}
              ${buildCampo('ID Amostra', processo.id_amostra)}
            </div>
          </section>

          <section class="genoma-resultado-bloco">
            <h2 class="genoma-resultado-secao-titulo">Dados do teste</h2>
            <div class="genoma-resultado-campos">
              ${buildCampo('Teste', processo.teste_nome || processo.teste)}
              ${tipoKit ? `<div class="genoma-resultado-campo"><span class="genoma-resultado-label">Kit</span><span class="genoma-resultado-valor genoma-resultado-valor-kit">${escapeHtml(tipoKit)}</span></div>` : ''}
              ${buildCampo('Envio laboratório', formatDatePt(processo.data_envio_laboratorio))}
              ${buildCampo('Recepção laboratório', formatDatePt(processo.data_chegada_laboratorio))}
              ${buildCampo('Relatório laboratório', formatDatePt(processo.data_relatorio_laboratorio))}
            </div>
            <div class="genoma-resultado-cromossomas-resumo">
              <span class="genoma-resultado-label">Cromossomas analisados</span>
              <span class="genoma-resultado-contagem">${analisados.length} de 23</span>
              <div class="genoma-resultado-chips">${buildChips(analisados)}</div>
            </div>
          </section>
        </div>

        <div class="genoma-resultado-conclusao ${conclusaoCls}">
          <div class="genoma-resultado-conclusao-icon" aria-hidden="true"></div>
          <div>
            <div class="genoma-resultado-conclusao-titulo">${escapeHtml(tituloConclusao)}</div>
            <div class="genoma-resultado-conclusao-texto">${escapeHtml(textoConclusao)}</div>
          </div>
        </div>

        <section class="genoma-resultado-secao genoma-resultado-secao-tabela">
          <h2 class="genoma-resultado-secao-titulo">Resultados cromossómicos</h2>
          <p class="genoma-resultado-secao-desc">Cromossomas não incluídos no kit aparecem com resultado em branco.</p>
          <div class="genoma-resultado-colunas">
            <div>${buildColunaTabela(colunaEsquerda, analisados, resultados, semAnomalias)}</div>
            <div>${buildColunaTabela(colunaDireita, analisados, resultados, semAnomalias)}</div>
          </div>
          <div class="genoma-resultado-legenda">
            <span><i class="leg-negativo"></i> Negativo</span>
            <span><i class="leg-positivo"></i> Positivo</span>
            <span><i class="leg-suspeita"></i> Suspeita</span>
            <span><i class="leg-na"></i> Não analisado</span>
          </div>
        </section>
      </div>

      ${complementarHtml}

      <footer class="genoma-resultado-footer">
        <p>
          Este relatório reflecte a análise genética efectuada sobre a amostra identificada.
          Os resultados devem ser interpretados no contexto clínico global da gravidez e confirmados
          por métodos diagnósticos quando indicado.
        </p>
        <p class="genoma-resultado-footer-assinatura">
          ${escapeHtml(clinica.nome)}${clinica.email ? ` · ${escapeHtml(clinica.email)}` : ''}
        </p>
      </footer>
    </div>
  </div>
</body>
</html>`;
};
