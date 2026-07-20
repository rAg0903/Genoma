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
  normalizarResultado,
  temPositivoOuSuspeita,
} = require('../utils/cromossoma-opcoes');

/** Largura A4 em px (~210mm @ 96dpi). */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const TEAL = '#03738b';
const GRID_BORDER = '#c5c5c5';

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
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    } catch {
      /* try next */
    }
  }
  return '';
};

const HEADER_LOGO_URI = loadImageDataUri('maternity-proposta-header.png');
const FOOTER_LOGO_URI = loadImageDataUri('maternity-proposta-footer.png');

const identificacaoPaciente = (processo) =>
  escapeHtml(processo.numero_processo || processo.kit_codigo || processo.id || '');

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

const resolveResultadoTeste = ({ sugerirRepeticao, semAnomalias, resultados, analisados }) => {
  if (sugerirRepeticao) return 'REPETIR COLHEITA';
  if (semAnomalias) return 'NEGATIVO';
  const positivos = analisados.filter((n) => normalizarResultado(resultados[n]) === 'Positivo');
  const suspeitos = analisados.filter((n) => normalizarResultado(resultados[n]) === 'Suspeita');
  if (positivos.length > 0 || suspeitos.length > 0) return 'POSITIVO';
  return 'ANORMAL';
};

const resolveSexoFetal = (processo, anomalias) => {
  const raw = String(processo.cromossomas_sexuais || '').trim();
  if (raw) {
    const upper = raw.toUpperCase();
    if (upper.includes('MASC') || upper === 'XY' || upper.includes('Y')) return 'MASCULINO';
    if (upper.includes('FEM') || upper === 'XX') return 'FEMININO';
    return upper;
  }

  const sexual = (anomalias || []).find((a) => (a.tipo_resultado || '') === 'Sexual');
  if (sexual) {
    const valor = String(sexual.resultado_valor || sexual.cromossoma || '').toUpperCase();
    if (valor.includes('MASC') || valor.includes('Y')) return 'MASCULINO';
    if (valor.includes('FEM') || valor.includes('XX') || valor === 'X') return 'FEMININO';
    return valor;
  }

  return '';
};

const formatFracaoFetal = (processo) => {
  if (processo.fracao_fetal === null || processo.fracao_fetal === undefined || processo.fracao_fetal === '') {
    return '';
  }
  const text = String(processo.fracao_fetal).replace('%', '').trim();
  if (!text) return '';
  return `${escapeHtml(text)}%`;
};

const valorCromossoma = (numero, analisados, resultados, semAnomalias) => {
  if (!analisados.includes(numero)) return '';
  let valor = obterValorResultado(resultados, numero, analisados, semAnomalias);
  if (temPositivoOuSuspeita(valor)) {
    valor = normalizarResultado(valor);
  }
  return valor;
};

const buildLinhasCromossomas = (analisados, resultados, semAnomalias) => {
  const rows = [];
  for (let i = 0; i < 12; i += 1) {
    const leftNum = i + 1;
    const rightNum = i + 13;
    const leftVal = valorCromossoma(leftNum, analisados, resultados, semAnomalias);
    const rightVal = rightNum <= 23 ? valorCromossoma(rightNum, analisados, resultados, semAnomalias) : '';

    rows.push(`<tr>
      <td class="crom-name">Cromossoma ${leftNum}</td>
      <td class="crom-val">${leftVal ? escapeHtml(leftVal) : '&nbsp;'}</td>
      <td class="crom-name">${rightNum <= 23 ? `Cromossoma ${rightNum}` : '&nbsp;'}</td>
      <td class="crom-val">${rightVal ? escapeHtml(rightVal) : '&nbsp;'}</td>
    </tr>`);
  }
  return rows.join('');
};

const STYLES = `
* { box-sizing: border-box; }
@page { size: A4 portrait; margin: 0; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  font-family: Arial, Helvetica, sans-serif;
  color: #111;
  font-size: 10pt;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page {
  width: ${A4_WIDTH_PX}px;
  min-height: ${A4_HEIGHT_PX}px;
  margin: 0 auto;
  padding: 36px 44px 32px;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.cabecalho-marca {
  margin-bottom: 10px;
}
.img-header {
  display: block;
  height: 52px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;
}
.titulo-doc {
  margin: 0 0 14px;
  text-align: center;
  font-size: 13pt;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.linha-teal {
  border: 0;
  border-top: 3px solid ${TEAL};
  margin: 0 0 14px;
}
.bloco-info p {
  margin: 0 0 4px;
  font-size: 10pt;
}
.info-split {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}
.info-split span {
  white-space: nowrap;
}
.conteudo {
  flex: 1 1 auto;
}
table.resumo {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 28px;
  border-top: 3px solid ${TEAL};
  border-bottom: 3px solid ${TEAL};
  font-size: 10pt;
}
table.resumo td {
  padding: 7px 4px;
  border-bottom: 1px solid #d9d9d9;
  vertical-align: middle;
}
table.resumo tr:last-child td {
  border-bottom: none;
}
table.resumo td:first-child {
  text-align: left;
  width: 55%;
}
table.resumo td:last-child {
  text-align: right;
  font-weight: 400;
}
table.resumo .destaque {
  font-weight: 700;
}
.titulo-tabela {
  margin: 0 0 10px;
  text-align: center;
  font-size: 10pt;
  font-weight: 700;
}
table.crom-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 9.5pt;
}
table.crom-grid td {
  border: 1px solid ${GRID_BORDER};
  padding: 5px 8px;
  vertical-align: middle;
}
table.crom-grid .crom-name {
  width: 24%;
}
table.crom-grid .crom-val {
  width: 26%;
  text-align: center;
}
.rodape {
  margin-top: auto;
  padding-top: 36px;
}
.img-footer {
  display: block;
  height: 28px;
  width: auto;
  object-fit: contain;
  object-position: left center;
}
.linha-rodape {
  border: 0;
  border-top: 2px solid #9fd3e5;
  margin: 18px 0 0;
}
`;

exports.RELATORIO_PROPOSTA1_A4_WIDTH_PX = A4_WIDTH_PX;
exports.RELATORIO_PROPOSTA1_A4_HEIGHT_PX = A4_HEIGHT_PX;

/**
 * Relatório Maternity Proposta 1 — fiel ao PDF de referência do cliente.
 */
exports.buildRelatorioClinicoMaternityProposta1Html = (processo, anomalias = [], _clinica = null, options = {}) => {
  const { analisados, resultados, sugerirRepeticao, semAnomalias } = resolveDadosResultado(processo, anomalias);

  const dataRelatorio = formatDatePt(
    processo.data_relatorio_laboratorio || processo.data_validacao || processo.data_resultado || new Date(),
  );
  const resultadoTeste = resolveResultadoTeste({ sugerirRepeticao, semAnomalias, resultados, analisados });
  const sexoFetal = resolveSexoFetal(processo, anomalias);
  const fracaoFetal = formatFracaoFetal(processo);

  const headerLogo = HEADER_LOGO_URI
    ? `<img src="${HEADER_LOGO_URI}" alt="Maternity by Genoma" class="img-header" />`
    : '<div class="img-header">MATERNITY by GENOMA</div>';
  const footerLogo = FOOTER_LOGO_URI
    ? `<img src="${FOOTER_LOGO_URI}" alt="Genoma" class="img-footer" />`
    : '<div class="img-footer">GENOMA</div>';

  const bodyClass = options.pdf ? 'pdf-export' : 'relatorio-preview';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatório ${identificacaoPaciente(processo)}</title>
  <style>${STYLES}</style>
</head>
<body class="${bodyClass}">
  <div class="page">
    <div class="cabecalho-marca">${headerLogo}</div>
    <h1 class="titulo-doc">Relatório FINAL</h1>
    <hr class="linha-teal" />

    <div class="bloco-info">
      <p><strong>Médico Prescritor:</strong> ${escapeHtml(processo.medico_nome)}</p>
      <p><strong>Paciente:</strong> ${escapeHtml(processo.paciente_nome)}</p>
      <p><strong>Data Nascimento:</strong> ${formatDatePt(processo.paciente_data_nascimento)}</p>
      <p><strong>ID Paciente:</strong> ${identificacaoPaciente(processo)}</p>
      <div class="info-split">
        <span><strong>Tel:</strong> ${escapeHtml(processo.paciente_telemovel || processo.paciente_telefone || '')}</span>
        <span><strong>Data do Relatório:</strong> ${dataRelatorio}</span>
      </div>
    </div>

    <hr class="linha-teal" />

    <div class="conteudo">
      <table class="resumo">
        <tr>
          <td>Resultado do Teste</td>
          <td class="destaque">${escapeHtml(resultadoTeste)}</td>
        </tr>
        <tr>
          <td>Sexo Fetal</td>
          <td>${sexoFetal ? escapeHtml(sexoFetal) : '&nbsp;'}</td>
        </tr>
        <tr>
          <td>Fracção Fetal</td>
          <td>${fracaoFetal || '&nbsp;'}</td>
        </tr>
      </table>

      <h2 class="titulo-tabela">Tabela de Resultados</h2>
      <table class="crom-grid">
        <tbody>${buildLinhasCromossomas(analisados, resultados, semAnomalias)}</tbody>
      </table>
    </div>

    <footer class="rodape">
      ${footerLogo}
      <hr class="linha-rodape" />
    </footer>
  </div>
</body>
</html>`;
};
