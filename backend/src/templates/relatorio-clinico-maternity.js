const fs = require('fs');
const path = require('path');

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
      /* try next path */
    }
  }
  return '';
};

const GENOMA_LOGO_URI = loadImageDataUri('Imagem1G.png');
const LAB_REPORT_HEADER_URI = loadImageDataUri('Lab_Report_Final.png');

const PERFORMANCE_ROWS = [
  { label: 'Trissomia 21', sens: '99.1%', spec: '99.9%', ciSens: '96.3 - 99.8%', ciSpec: '99.6 - 99.9%' },
  { label: 'Trissomia 18', sens: '&gt;99.9%', spec: '99.6%', ciSens: '92.4 - 100%', ciSpec: '99.2 - 99.8%' },
  { label: 'Trissomia 13', sens: '91.7%', spec: '99.7%', ciSens: '59.7 - 99.6%', ciSpec: '99.3 - 99.9%' },
  { label: 'Cromossoma Y', sens: '99.4%', ciSens: '99.0 - 99.6%', single: true },
];

const buildPerformanceTableRows = () =>
  PERFORMANCE_ROWS.map((row) => {
    if (row.single) {
      return `<tr>
        <td class="perf-label">${row.label}</td>
        <td class="perf-metric"><span class="perf-key">Sensibilidade:</span><span class="perf-val">${row.sens}</span></td>
        <td class="perf-ci">${row.ciSens}</td>
      </tr>`;
    }
    return `<tr>
        <td class="perf-label" rowspan="2">${row.label}</td>
        <td class="perf-metric"><span class="perf-key">Sensibilidade:</span><span class="perf-val">${row.sens}</span></td>
        <td class="perf-ci">${row.ciSens}</td>
      </tr>
      <tr>
        <td class="perf-metric"><span class="perf-key">Especificidade:</span><span class="perf-val">${row.spec}</span></td>
        <td class="perf-ci">${row.ciSpec}</td>
      </tr>`;
  }).join('');

const resolveTesteVariant = (processo) => {
  const nome = `${processo.sub_teste_nome || ''} ${processo.teste_nome || ''}`.toLowerCase();
  if (nome.includes('core') || nome.includes('básico') || nome.includes('basico')) return 'Core';
  if (nome.includes('inter')) return 'Intermédio';
  if (nome.includes('complet') || nome.includes('genome') || nome.includes('plus')) return 'Plus';
  return 'Core';
};

const findAnomalia = (anomalias, matcher) =>
  (anomalias || []).find((a) => matcher(String(a.cromossoma || ''), String(a.tipo_resultado || '')));

const buildTrissomiaResult = (processo, anomalias) => {
  const trissomias = (anomalias || []).filter((a) => {
    const c = String(a.cromossoma || '');
    return (a.tipo_resultado || 'Cromossoma') === 'Cromossoma' && ['13', '18', '21'].some((n) => c.includes(n));
  });

  if (processo.resultado_tudo_ok !== false && trissomias.length === 0) {
    return {
      headline: 'NEGATIVO',
      detail: 'Este resultado mostrou uma representação esperada dos cromossomas 21, 18 e 13',
    };
  }

  if (trissomias.length === 0) {
    return {
      headline: escapeHtml(processo.resultado_anomalias || 'Ver detalhe clínico'),
      detail: '',
    };
  }

  const lines = trissomias.map((a) =>
    `${escapeHtml(a.cromossoma)}: ${escapeHtml(a.resultado_valor || 'Detectado')}${a.probabilidade ? ` (${escapeHtml(a.probabilidade)})` : ''}`
  );
  return { headline: 'ANORMAL', detail: lines.join('<br/>') };
};

const buildCromossomaYResult = (anomalias) => {
  const sexual = findAnomalia(anomalias, (c, t) => t === 'Sexual' || c.toUpperCase().includes('Y') || c.toUpperCase().includes('X'));
  if (!sexual) {
    return { headline: '', detail: '' };
  }

  const valor = String(sexual.resultado_valor || sexual.cromossoma || '').toLowerCase();
  if (valor.includes('femin') || valor.includes('xx') || String(sexual.cromossoma).toUpperCase() === 'X') {
    return { headline: 'SEXO FEMININO', detail: 'Não foi encontrado o cromossoma Y' };
  }
  return { headline: 'SEXO MASCULINO', detail: 'Foi encontrado o cromossoma Y' };
};

const buildGenericAnomaliasResult = (anomalias, tipo, excludeY = false) => {
  const rows = (anomalias || []).filter((a) => {
    if ((a.tipo_resultado || '') !== tipo) return false;
    if (excludeY && String(a.cromossoma || '').toUpperCase().includes('Y')) return false;
    return true;
  });
  if (rows.length === 0) return { headline: '', detail: '' };
  return {
    headline: 'ANORMAL',
    detail: rows.map((a) =>
      `${escapeHtml(a.cromossoma)}: ${escapeHtml(a.resultado_valor || 'Detectado')}`
    ).join('<br/>'),
  };
};

const resultCell = (headline, detail) => {
  if (!headline && !detail) return '<td class="resultado-valor resultado-vazio">&nbsp;</td>';
  return `<td class="resultado-valor">${headline ? `<div class="resultado-headline">${headline}</div>` : ''}${detail ? `<div class="resultado-detalhe">${detail}</div>` : ''}</td>`;
};

const identificacao = (processo) =>
  escapeHtml(processo.numero_processo || processo.kit_codigo || processo.id);

exports.buildRelatorioClinicoMaternityHtml = (processo, anomalias) => {
  const variant = resolveTesteVariant(processo);
  const trissomia = buildTrissomiaResult(processo, anomalias);
  const cromossomaY = buildCromossomaYResult(anomalias);
  const sexuais = buildGenericAnomaliasResult(anomalias, 'Sexual', true);
  const micro = buildGenericAnomaliasResult(anomalias, 'Microdelecao');
  const fracaoFetal = processo.fracao_fetal
    ? `${escapeHtml(String(processo.fracao_fetal).replace('%', '').trim())} %`
    : '';

  const dataRelatorio = formatDatePt(processo.data_validacao || processo.data_resultado || new Date());
  const headerHtml = LAB_REPORT_HEADER_URI
    ? `<img src="${LAB_REPORT_HEADER_URI}" alt="MaterniT21 PLUS Lab Report" class="img-lab-header" />`
    : '<div class="img-lab-header-fallback">MaterniT21 PLUS — Lab Report</div>';
  const logoHtml = GENOMA_LOGO_URI
    ? `<img src="${GENOMA_LOGO_URI}" alt="Genoma" class="logo-genoma" />`
    : '<div class="logo-genoma-text">GENOMA</div>';

  const performanceRows = buildPerformanceTableRows();

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Relatório ${escapeHtml(identificacao(processo))}</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      /* Tom alinhado com o teal do logótipo MaterniT21 */
      --maternity-line: #03738b;
    }
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    html {
      background: #d1d5db;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      margin: 0;
      padding: 0;
      font-size: 10px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 11mm 10mm;
      background: #fff;
    }
    .cabecalho {
      margin-bottom: 1.5mm;
    }
    .cabecalho-linha {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      column-gap: 6mm;
    }
    .cabecalho-esq {
      min-width: 0;
    }
    .header-brand {
      min-width: 0;
    }
    .img-lab-header {
      display: block;
      width: 108mm;
      max-width: 100%;
      height: auto;
      object-fit: contain;
      object-position: left top;
    }
    .img-lab-header-fallback {
      font-size: 16px;
      font-weight: 700;
      color: #1e4f91;
    }
    .lab-info {
      text-align: left;
      font-size: 8pt;
      line-height: 1.5;
      color: #111;
      padding-top: 0.5mm;
      font-weight: 400;
      justify-self: end;
      max-width: 56mm;
      margin-left: auto;
    }
    .lab-info strong {
      font-weight: 700;
    }
    .titulo-relatorio {
      font-size: 11pt;
      font-weight: 700;
      margin: 1mm 0 0;
      line-height: 1.2;
    }
    .bloco-linhas {
      border-top: 4px solid var(--maternity-line);
      border-bottom: 4px solid var(--maternity-line);
      padding: 3mm 0 2.5mm;
      margin-bottom: 4mm;
    }
    table.info-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.info-table td {
      padding: 0.6mm 0;
      font-size: 9.5pt;
      line-height: 1.35;
      vertical-align: top;
    }
    table.info-table .info-lbl {
      width: 19%;
      font-weight: 500;
      padding-right: 2mm;
      white-space: nowrap;
    }
    table.info-table .info-val {
      width: 31%;
      padding-right: 4mm;
    }
    .conteudo-principal {
      display: grid;
      grid-template-columns: 46% 54%;
      gap: 2mm;
      align-items: stretch;
    }
    .coluna-resultados {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    table.resultados {
      width: 100%;
      height: 100%;
      flex: 1 1 auto;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5pt;
    }
    table.resultados td {
      border: 1px solid #111;
      vertical-align: middle;
      padding: 1.8mm 2mm;
      text-align: center;
    }
    table.resultados tbody {
      height: 100%;
    }
    table.resultados tr.resultado-row td {
      height: 21%;
    }
    table.resultados tr.resultado-row-final td {
      height: 16%;
      padding: 1mm 2mm;
    }
    .resultado-row-final .resultado-headline {
      font-size: 9pt;
      margin-bottom: 0;
    }
    table.resultados td:first-child {
      width: 44%;
      font-weight: 700;
      line-height: 1.3;
    }
    .resultado-valor {
      width: 56%;
    }
    .resultado-vazio {
      min-height: 0;
    }
    .resultado-headline {
      font-size: 10pt;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 0.8mm;
    }
    .resultado-detalhe {
      font-weight: 400;
      font-size: 8.5pt;
      line-height: 1.25;
    }
    .performance-box {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    .performance-box > h4,
    .secao-texto h4 {
      margin: 0 0 1mm;
      font-size: 10pt;
      font-weight: 700;
      line-height: 1.15;
    }
    .performance-box > p,
    .secao-texto p,
    .secao-texto li {
      margin: 0;
      font-size: 5pt;
      line-height: 1.18;
      text-align: justify;
    }
    .performance-box > p {
      margin-bottom: 1.2mm;
    }
    table.performance {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      line-height: 1.1;
      table-layout: fixed;
    }
    table.performance th,
    table.performance td {
      border: 1px solid #111;
      padding: 0.5mm 1mm;
      vertical-align: middle;
    }
    table.performance th {
      font-weight: 700;
      font-size: 7pt;
      text-align: center;
      padding: 0.7mm 1mm;
      line-height: 1.15;
    }
    .perf-label {
      font-weight: 700;
      white-space: nowrap;
      font-size: 7pt;
      text-align: center;
      width: 26%;
    }
    .perf-metric {
      width: 40%;
      padding: 0.4mm 1.2mm;
      white-space: nowrap;
    }
    .perf-key,
    .perf-val {
      display: inline-block;
      width: 49%;
      vertical-align: middle;
    }
    .perf-key { text-align: left; }
    .perf-val { text-align: right; }
    .perf-ci {
      width: 34%;
      text-align: center;
      font-size: 7pt;
      padding: 0.4mm 0.8mm;
    }
    .performance-box .secao-texto {
      margin-top: 2mm;
      flex: 1 1 auto;
    }
    .secao-texto {
      margin-top: 2mm;
      page-break-inside: avoid;
    }
    .secao-texto ol {
      margin: 0;
      padding-left: 4mm;
      font-size: 5pt;
      line-height: 1.18;
    }
    .bloco-inferior {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
      align-items: stretch;
      margin-top: 3mm;
      page-break-inside: avoid;
    }
    .coluna-inferior {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    .secao-texto-inferior {
      margin-top: 2mm;
      page-break-inside: avoid;
    }
    .secao-texto-inferior:first-child {
      margin-top: 0;
    }
    .logo-rodape {
      margin-top: auto;
      padding-top: 5mm;
    }
    .logo-genoma {
      display: block;
      max-width: 58mm;
      max-height: 16mm;
      object-fit: contain;
      object-position: left bottom;
    }
    .logo-genoma-text {
      font-size: 22px;
      font-weight: 300;
      letter-spacing: 3px;
      color: #1a4c5c;
    }
    .assinatura {
      margin-top: auto;
      padding-top: 5mm;
      text-align: right;
      font-size: 6pt;
      line-height: 1.35;
    }
    @media screen {
      body { padding: 8mm 0; }
      .page {
        box-shadow: 0 2px 14px rgba(0, 0, 0, 0.18);
      }
    }
    @media print {
      html { background: #fff; }
      body { padding: 0; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
  <div class="cabecalho">
    <div class="cabecalho-linha">
      <div class="cabecalho-esq">
        <div class="header-brand">${headerHtml}</div>
        <div class="titulo-relatorio">Relatório FINAL (${escapeHtml(variant)})</div>
      </div>
      <div class="lab-info">
        <strong>Sequenom Laboratories</strong><br/>
        3595 John Hopkins Court<br/>
        San Diego, CA 92121<br/>
        CLIA #: 05D2015356 &nbsp; CAP #: 7527138<br/>
        LAB Director: Philip Cacheris, MD, PhD
      </div>
    </div>
  </div>

  <div class="bloco-linhas">
    <table class="info-table">
      <tr>
        <td class="info-lbl">Médico Prescritor:</td>
        <td class="info-val">${escapeHtml(processo.medico_nome)}</td>
        <td class="info-lbl">Paciente:</td>
        <td class="info-val">${escapeHtml(processo.paciente_nome)}</td>
      </tr>
      <tr>
        <td class="info-lbl">Data do Pedido:</td>
        <td class="info-val">${formatDatePt(processo.data_entrada)}</td>
        <td class="info-lbl">Data Nascimento:</td>
        <td class="info-val">${formatDatePt(processo.paciente_data_nascimento)}</td>
      </tr>
      <tr>
        <td class="info-lbl">Data da Colheita:</td>
        <td class="info-val">${formatDatePt(processo.data_colheita)}</td>
        <td class="info-lbl">ID Paciente:</td>
        <td class="info-val">${identificacao(processo)}</td>
      </tr>
      <tr>
        <td class="info-lbl">Data Recebida:</td>
        <td class="info-val">${formatDatePt(processo.data_chegada_laboratorio)}</td>
        <td class="info-lbl">Amostra:</td>
        <td class="info-val">${identificacao(processo)}</td>
      </tr>
      <tr>
        <td class="info-lbl">Identificação:</td>
        <td class="info-val">${identificacao(processo)}</td>
        <td class="info-lbl">Tel:</td>
        <td class="info-val">${escapeHtml(processo.paciente_telemovel || '')}</td>
      </tr>
      <tr>
        <td class="info-lbl"></td>
        <td class="info-val"></td>
        <td class="info-lbl">Data do Relatório:</td>
        <td class="info-val">${dataRelatorio}</td>
      </tr>
    </table>
  </div>

  <div class="conteudo-principal">
    <div class="coluna-resultados">
      <table class="resultados">
        <tbody>
          <tr class="resultado-row">
            <td>Resultado do Teste para Cromossomas 21, 18 e 13</td>
            ${resultCell(trissomia.headline, trissomia.detail)}
          </tr>
          <tr class="resultado-row">
            <td>Resultado do Teste para o Cromossoma Y</td>
            ${resultCell(cromossomaY.headline, cromossomaY.detail)}
          </tr>
          <tr class="resultado-row">
            <td>Resultado do Teste para Aneuploidias dos Cromossomas Sexuais</td>
            ${resultCell(sexuais.headline, sexuais.detail)}
          </tr>
          <tr class="resultado-row">
            <td>Resultado do Teste para Microdeleções</td>
            ${resultCell(micro.headline, micro.detail)}
          </tr>
          <tr class="resultado-row-final">
            <td>Fracção Fetal</td>
            <td class="resultado-valor${fracaoFetal ? '' : ' resultado-vazio'}">${fracaoFetal ? `<div class="resultado-headline">${fracaoFetal}</div>` : '&nbsp;'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="performance-box">
      <h4>Performance</h4>
      <p>As características de desempenho do teste MaterniT<sup>®</sup> 21 PLUS foram determinadas com um estudo de validação clínica com grávidas com risco aumentado para aneuploidia cromossómica fetal. [1], [2], [3]</p>
      <table class="performance">
        <thead>
          <tr>
            <th></th>
            <th>Performance</th>
            <th>Intervalo de Confiança<br/>(95% CI)</th>
          </tr>
        </thead>
        <tbody>${performanceRows}</tbody>
      </table>
      <div class="secao-texto">
        <h4>Limitações do Teste</h4>
        <p>Embora os resultados destes testes sejam altamente precisos, podem ocorrer resultados discordantes, incluindo previsão imprecisa de sexo fetal, devido a mosaicismo ou neoplasia placentária, materna ou fetal; gémeo desaparecido; transplante prévio de órgãos maternos; ou outras causas. As aneuploidias cromossómicas sexuais não são reportáveis para gestações múltiplas conhecidas. Estes testes são testes de triagem e não de diagnóstico; eles não substituem a precisão do diagnóstico pré-natal com CVS ou amniocentese. Um paciente com um resultado de teste positivo deve ser encaminhado para aconselhamento genético e oferecido diagnóstico pré-natal invasivo para confirmação dos resultados do teste. [4] Um resultado negativo não garante uma gravidez não afetada nem exclui a possibilidade de outras anormalidades cromossómicas ou defeitos congénitos que não façam parte desses testes. Pode ser relatado um resultado não informativo, cujas causas podem incluir, mas não estão limitadas a cobertura de sequênciamento insuficiente, ruído ou artefatos na região, viés de amplificação ou sequenciamento ou fracção fetal insuficiente. Estes testes não se destinam a identificar gravidezes em risco de defeitos do tubo neural ou defeitos da parede ventral. Testes para anormalidades cromossómicas completas (incluindo cromossomas sexuais) e para anormalidades sub-cromossómicas poderiam levar à descoberta potencial de anormalidades genómicas fetais e maternas que poderiam ter significado clínico maior, menor ou nulo. Avaliar o significado de um resultado positivo ou não relatável pode envolver testes invasivos e estudos adicionais sobre a mãe. Tais investigações podem levar a um diagnóstico de anomalias cromossómicas ou sub-cromossómicas maternas, que ocasionalmente podem estar associadas a neoplasias maternas benignas ou malignas. Esses testes podem não identificar com precisão triploidia fetal, rearranjos balanceados ou a localização precisa de duplicações ou deleções sub-cromossómicas; estes podem ser detectados por diagnóstico pré-natal com CVS ou amniocentese. A capacidade de relatar resultados pode ser afetada pelo IMC materno, peso materno, lúpus eritematoso sistêmico materno (LES) e / ou por certos agentes farmacêuticos, como a heparina de baixo peso molecular (por exemplo: Lovenox<sup>®</sup>, Xaparin<sup>®</sup>, Clexane<sup>®</sup> e Fragmin<sup>®</sup>). Os resultados deste teste, incluindo os benefícios e limitações, devem ser discutidos com um profissional de saúde qualificado. As decisões de acompanhamento da gravidez, incluindo o término da gravidez, não se devem basear apenas nos resultados desses testes. O profissional de saúde é responsável pelo uso dessas informações na gestão dos seus pacientes.</p>
      </div>
    </div>
  </div>

  <div class="bloco-inferior">
    <div class="coluna-inferior coluna-inferior-esq">
      <div class="secao-texto secao-texto-inferior">
        <h4>Acerca do Teste</h4>
        <p>O teste desenvolvido em laboratório (LDT) do MaterniT<sup>®</sup> 21 PLUS analisa o ADN livre circulante de células fetais de uma amostra de sangue materno. O teste é indicado para uso em mulheres grávidas com risco aumentado de aneuploidia cromossómica fetal. Os dados de validação das gravidezes gemelares são limitados e a capacidade deste teste para detectar aneuploidia numa gravidez de trio ainda não foi validada.</p>
      </div>
      <div class="secao-texto secao-texto-inferior">
        <h4>Método do Teste</h4>
        <p>O ADN livre de células circulantes foi purificado a partir do componente de plasma do sangue materno. O ADN extraído foi então convertido numa biblioteca de ADN genómico para análise de aneuploidias dos cromossomas 21, 18 e 13 via Next Generation Sequencing (NGS). [1] As descobertas opcionais incluem aneuploidias dos cromossomas sexuais (AFC) e série de sequenciamento aprimorada (ESS), que será relatada apenas como um achado adicional quando uma anormalidade for detectada. O teste SCA inclui informações sobre a representação X e Y, enquanto o teste ESS inclui deleções em regiões selecionadas (22q, 15q, 11q, 8q, 5p, 4p, 1p) e trissomias dos cromossomas 16 e 22.</p>
      </div>
      <div class="logo-rodape">${logoHtml}</div>
    </div>
    <div class="coluna-inferior coluna-inferior-dir">
      <div class="secao-texto secao-texto-inferior">
        <h4>Nota</h4>
        <p>Este teste foi desenvolvido e as suas características de desempenho determinadas pela LabCorp. Não foi autorizado nem aprovado pela Food and Drug Administration. Este teste é usado para fins clínicos. Não deve ser considerado como investigacional ou para pesquisa. Este laboratório está certificado de acordo com as CLIA (Clinical Laboratory Improvement Amendments) como qualificado para realizar testes laboratoriais clínicos de alta complexidade e acreditados pelo College of American Pathologists (CAP).</p>
      </div>
      <div class="secao-texto secao-texto-inferior">
        <h4>Referências</h4>
        <ol>
          <li>Palomaki GE, et al. Genet Med. 2012;14(3):296-305.</li>
          <li>Palomaki GE, et al. Genet Med. 2011;13(11):913-920.</li>
          <li>Mazloom AR, et al. Prenat Diag. 2013;33(6):591-597.</li>
          <li>ACOG/SMFM Joint Committee Opinion No. 545, Dec 2012.</li>
        </ol>
      </div>
      <div class="assinatura">
        Philip Cacheris, MD, PhD<br/>
        Director, Sequenom Laboratories<br/>
        ${dataRelatorio}
      </div>
    </div>
  </div>
  </div>
</body>
</html>`;
};
