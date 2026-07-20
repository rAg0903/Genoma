/**
 * Serviço de geração de PDFs.
 *
 *  - Fatura de processo: pdfkit (layout tabular)
 *  - Relatório clínico NIPT: HTML do template → PDF via Puppeteer (igual à pré-visualização)
 */
'use strict';

const fs = require('fs');
const PDFDocument = require('pdfkit');
const { buildRelatorioClinicoMaternityProposta1Html, RELATORIO_PROPOSTA1_A4_WIDTH_PX, RELATORIO_PROPOSTA1_A4_HEIGHT_PX } = require('../templates/relatorio-clinico-maternity-proposta1');

const TEAL = '#0d9488';
const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_200 = '#e2e8f0';
const WHITE = '#ffffff';

const fmtDate = (v) => {
  if (!v) return '—';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).substring(0, 10).split('-').reverse().join('/');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const fmtEur = (n) => {
  const num = Number(n || 0);
  return `${num.toFixed(2)} EUR`;
};

/**
 * Gera um PDF de fatura em buffer.
 * @param {object} opts
 * @param {object} opts.processo  — dados do processo (numero, paciente_nome, teste, …)
 * @param {object} opts.faturacao — dados de faturação (valor_base, desconto_percentual, valor_final, …)
 * @param {object} opts.empresa   — dados da empresa emitente (nome, nif, morada, …)
 * @returns {Promise<Buffer>}
 */
exports.gerarFaturaPdf = (opts) =>
  new Promise((resolve, reject) => {
    const { processo, faturacao, empresa = {} } = opts;
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 96; // largura útil (margin * 2)
    const L = 48; // margem esquerda

    // ── Cabeçalho ──────────────────────────────────────────────────────────────
    doc.rect(L, 48, W, 60).fill(TEAL);
    doc.fillColor(WHITE).fontSize(18).font('Helvetica-Bold')
       .text('FATURA', L + 16, 62, { width: W / 2 });
    doc.fontSize(10).font('Helvetica')
       .text(empresa.nome || 'Genoma Laboratório Genómico', L + 16, 84);

    // Número e data no canto direito
    doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
       .text(`Nº: ${processo.numero || '—'}`, L + W / 2, 62, { width: W / 2, align: 'right' });
    doc.font('Helvetica')
       .text(`Data: ${fmtDate(faturacao?.data_emissao || new Date())}`, L + W / 2, 78, { width: W / 2, align: 'right' });

    doc.y = 128;

    // ── Dados emitente / receptor ───────────────────────────────────────────────
    const boxTop = doc.y;
    doc.rect(L, boxTop, W / 2 - 8, 80).strokeColor(SLATE_200).stroke();
    doc.rect(L + W / 2 + 8, boxTop, W / 2 - 8, 80).strokeColor(SLATE_200).stroke();

    doc.fillColor(SLATE_600).fontSize(8).font('Helvetica-Bold')
       .text('EMITENTE', L + 8, boxTop + 8);
    doc.fillColor(SLATE_900).fontSize(9).font('Helvetica')
       .text(empresa.nome || 'Genoma', L + 8, boxTop + 22)
       .text(`NIF: ${empresa.nif || '—'}`, L + 8, boxTop + 35)
       .text(empresa.morada || '', L + 8, boxTop + 48, { width: W / 2 - 24 });

    doc.fillColor(SLATE_600).fontSize(8).font('Helvetica-Bold')
       .text('CLIENTE', L + W / 2 + 16, boxTop + 8);
    doc.fillColor(SLATE_900).fontSize(9).font('Helvetica')
       .text(processo.paciente_nome || '—', L + W / 2 + 16, boxTop + 22)
       .text(`Processo: ${processo.numero || '—'}`, L + W / 2 + 16, boxTop + 35)
       .text(`Teste: ${processo.teste || processo.teste_nome || '—'}`, L + W / 2 + 16, boxTop + 48, { width: W / 2 - 24 });

    doc.y = boxTop + 96;

    // ── Tabela de linhas ────────────────────────────────────────────────────────
    const tHeaderY = doc.y;
    doc.rect(L, tHeaderY, W, 24).fill(SLATE_900);
    doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
       .text('Descrição', L + 8, tHeaderY + 7, { width: W * 0.55 })
       .text('Qtd', L + W * 0.55, tHeaderY + 7, { width: W * 0.1, align: 'center' })
       .text('Preço unit.', L + W * 0.65, tHeaderY + 7, { width: W * 0.15, align: 'right' })
       .text('Total', L + W * 0.8, tHeaderY + 7, { width: W * 0.18, align: 'right' });

    doc.y = tHeaderY + 24;

    const valorBase = Number(faturacao?.valor_base || 0);
    const desconto = Number(faturacao?.desconto_percentual || 0);
    const valorFinal = Number(faturacao?.valor_final || valorBase * (1 - desconto / 100));

    const linha = (desc, qty, unit, total, bg) => {
      const rowY = doc.y;
      if (bg) doc.rect(L, rowY, W, 22).fill(bg);
      doc.fillColor(SLATE_900).fontSize(9).font('Helvetica')
         .text(desc, L + 8, rowY + 5, { width: W * 0.55 })
         .text(String(qty), L + W * 0.55, rowY + 5, { width: W * 0.1, align: 'center' })
         .text(fmtEur(unit), L + W * 0.65, rowY + 5, { width: W * 0.15, align: 'right' })
         .text(fmtEur(total), L + W * 0.8, rowY + 5, { width: W * 0.18, align: 'right' });
      doc.y = rowY + 22;
    };

    linha(processo.teste || processo.teste_nome || 'Análise genómica', 1, valorBase, valorBase, '#f8fafc');
    if (desconto > 0) {
      linha(`Desconto (${desconto}%)`, 1, -valorBase * desconto / 100, -valorBase * desconto / 100);
    }

    // Linha total
    doc.rect(L, doc.y, W, 28).fill(TEAL);
    doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold')
       .text('TOTAL', L + 8, doc.y + 7, { width: W * 0.75 })
       .text(fmtEur(valorFinal), L + W * 0.75, doc.y + 7, { width: W * 0.23, align: 'right' });
    doc.y += 28;

    // ── Referências / condições ────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.fillColor(SLATE_600).fontSize(8).font('Helvetica')
       .text('Condições de pagamento: 30 dias após emissão', L, doc.y)
       .text('Método de pagamento: Transferência bancária / MBWay', L, doc.y + 12);

    if (faturacao?.observacoes) {
      doc.moveDown(0.8)
         .fillColor(SLATE_900).fontSize(8)
         .text(`Observações: ${faturacao.observacoes}`, L, doc.y);
    }

    // ── Rodapé ─────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.rect(L, footerY, W, 1).fill(SLATE_200);
    doc.fillColor(SLATE_600).fontSize(7).font('Helvetica')
       .text(
         `Documento gerado automaticamente pelo sistema Genoma em ${fmtDate(new Date())}`,
         L, footerY + 8,
         { width: W, align: 'center' },
       );

    doc.end();
  });

let browserPromise = null;

const resolveChromePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === 'darwin') {
    const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(macChrome)) return macChrome;
  }
  if (process.platform === 'linux') {
    for (const candidate of ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  if (process.platform === 'win32') {
    const winCandidates = [
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ].filter(Boolean);
    for (const candidate of winCandidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return undefined;
};

const getBrowser = async () => {
  if (!browserPromise) {
    const puppeteer = require('puppeteer');
    const executablePath = resolveChromePath();
    browserPromise = puppeteer.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });
  }
  return browserPromise;
};

const PDF_EXPORT_CSS = `
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  overflow: visible !important;
}
body.pdf-export { display: block !important; }
.page {
  width: ${RELATORIO_PROPOSTA1_A4_WIDTH_PX}px !important;
  max-width: ${RELATORIO_PROPOSTA1_A4_WIDTH_PX}px !important;
  min-width: ${RELATORIO_PROPOSTA1_A4_WIDTH_PX}px !important;
  min-height: ${RELATORIO_PROPOSTA1_A4_HEIGHT_PX}px !important;
  margin: 0 auto !important;
  box-shadow: none !important;
  overflow: visible !important;
}
`;

const prepareRelatorioHtmlForPdf = (html) => {
  let doc = String(html || '');
  if (!/class=["'][^"']*pdf-export/i.test(doc)) {
    doc = doc.replace(/<body(\s[^>]*)?>/i, (match) => {
      if (/class=/i.test(match)) {
        return match.replace(/class=(["'])([^"']*)\1/i, 'class=$1$2 pdf-export$1');
      }
      return '<body class="pdf-export">';
    });
  }
  if (doc.includes('</head>')) {
    return doc.replace('</head>', `<style id="pdf-export-fix">${PDF_EXPORT_CSS}</style></head>`);
  }
  return `<style id="pdf-export-fix">${PDF_EXPORT_CSS}</style>${doc}`;
};

const htmlToPdfBuffer = async (html) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const exportHtml = prepareRelatorioHtmlForPdf(html);
    await page.setViewport({
      width: RELATORIO_PROPOSTA1_A4_WIDTH_PX,
      height: RELATORIO_PROPOSTA1_A4_HEIGHT_PX,
      deviceScaleFactor: 1,
    });
    await page.setContent(exportHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.emulateMediaType('screen');
    await page.evaluate(() => document.fonts?.ready);

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await page.close();
  }
};

/**
 * PDF do relatório — Puppeteer (igual à pré-visualização HTML).
 */
exports.gerarRelatorioNiptPdf = async ({ processo, anomalias = [] }) => {
  const html = buildRelatorioClinicoMaternityProposta1Html(processo, anomalias);
  return htmlToPdfBuffer(html);
};

exports.closePdfBrowser = async () => {
  if (!browserPromise) return;
  const browser = await browserPromise;
  browserPromise = null;
  await browser.close();
};
