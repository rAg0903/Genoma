/**
 * Servico de exportacao de listagens: CSV (nativo), Excel (.xlsx via exceljs)
 * e PDF (HTML server-rendered para impressao do browser, no padrao dos
 * relatorios). Recebe sempre { columns, rows, label } ja filtrados.
 */

const fs = require('fs');
const path = require('path');

const DARK_HEADER = 'FF1A1A1A';

let logoDataUri = '';
try {
  const logoPath = path.join(__dirname, '../assets/genoma-logo.png');
  const logoBuf = fs.readFileSync(logoPath);
  logoDataUri = `data:image/png;base64,${logoBuf.toString('base64')}`;
} catch {
  logoDataUri = '';
}

const cell = (row, key) => {
  const v = row[key];
  if (v === null || v === undefined) return '';
  return String(v);
};

exports.toCSV = ({ columns, rows }) => {
  const escape = (s) => {
    const str = String(s ?? '');
    if (/[";\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const header = columns.map((c) => escape(c.header)).join(';');
  const lines = rows.map((r) => columns.map((c) => escape(cell(r, c.key))).join(';'));
  // BOM para Excel reconhecer UTF-8 (acentos PT).
  return '\uFEFF' + [header, ...lines].join('\r\n');
};

exports.toXLSX = async ({ columns, rows, label }) => {
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Genoma CRM';
  wb.created = new Date();
  const ws = wb.addWorksheet((label || 'Listagem').slice(0, 31));

  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: Math.max(14, c.header.length + 4) }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_HEADER } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  rows.forEach((r) => {
    const obj = {};
    columns.forEach((c) => { obj[c.key] = r[c.key] ?? ''; });
    ws.addRow(obj);
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  return wb.xlsx.writeBuffer();
};

exports.toHTML = ({ columns, rows, label }) => {
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = new Date().toLocaleString('pt-PT');
  const thead = columns.map((c) => `<th>${esc(c.header)}</th>`).join('');
  const tbody = rows.map((r) =>
    `<tr>${columns.map((c) => `<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('');
  const logoImg = logoDataUri
    ? `<img src="${logoDataUri}" alt="Genoma" class="logo" />`
    : '<span class="logo-fallback">GENOMA</span>';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<title>Genoma — ${esc(label)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: #111827;
    margin: 28px 32px;
    background: #fff;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 22px;
    padding-bottom: 14px;
    border-bottom: 1px solid #d1d5db;
  }
  .head-left h1 {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 6px;
    color: #111827;
    letter-spacing: -0.02em;
  }
  .head-left .subtitle {
    font-size: 13px;
    color: #4b5563;
    margin: 0 0 8px;
  }
  .head-left .meta {
    font-size: 11px;
    color: #6b7280;
  }
  .head-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 140px;
  }
  .logo {
    height: 34px;
    width: auto;
    display: block;
    opacity: 0.92;
  }
  .logo-fallback {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #1f2937;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    border: 1px solid #1a1a1a;
  }
  th {
    background: #1a1a1a;
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: 9px 11px;
    border: 1px solid #1a1a1a;
    white-space: nowrap;
  }
  td {
    padding: 8px 11px;
    border: 1px solid #d1d5db;
    color: #111827;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f9fafb; }
  .foot {
    margin-top: 18px;
    font-size: 10px;
    color: #9ca3af;
  }
  @media print {
    body { margin: 10mm 12mm; }
    th {
      background: #1a1a1a !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr:nth-child(even) td { background: #f9fafb !important; }
  }
</style>
</head>
<body>
  <div class="head">
    <div class="head-left">
      <h1>${esc(label)}</h1>
      <p class="subtitle">Listagem · Genoma CRM</p>
      <div class="meta">${esc(rows.length)} registos · ${esc(now)}</div>
    </div>
    <div class="head-right">
      ${logoImg}
    </div>
  </div>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  <div class="foot">Documento gerado pelo CRM Genoma. Para PDF: imprimir (Ctrl/Cmd+P) e guardar como PDF.</div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ try { window.print(); } catch(e){} }, 300); });</script>
</body>
</html>`;
};
