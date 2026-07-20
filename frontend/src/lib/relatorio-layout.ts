/** Largura A4 em px (~210mm @ 96dpi) — alinhada com o template backend. */
export const RELATORIO_A4_WIDTH_PX = 794;
export const RELATORIO_A4_HEIGHT_PX = 1123;

const PDF_EXPORT_STYLE = `
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
  overflow: visible !important;
}
body.relatorio-preview,
body.pdf-export {
  display: block !important;
}
.page {
  width: ${RELATORIO_A4_WIDTH_PX}px !important;
  max-width: ${RELATORIO_A4_WIDTH_PX}px !important;
  min-width: ${RELATORIO_A4_WIDTH_PX}px !important;
  min-height: ${RELATORIO_A4_HEIGHT_PX}px !important;
  margin: 0 auto !important;
  box-shadow: none !important;
  overflow: visible !important;
}
`;

/** HTML idêntico entre pré-visualização e exportação PDF. */
export function prepareRelatorioHtml(html: string): string {
  let doc = html;
  if (!/class=["'][^"']*(relatorio-preview|pdf-export)/i.test(doc)) {
    doc = doc.replace(/<body(\s[^>]*)?>/i, (match) => {
      if (/class=/i.test(match)) {
        return match.replace(/class=(["'])([^"']*)\1/i, 'class=$1$2 relatorio-preview$1');
      }
      return '<body class="relatorio-preview">';
    });
  }
  if (doc.includes('</head>')) {
    return doc.replace('</head>', `<style id="relatorio-export-fix">${PDF_EXPORT_STYLE}</style></head>`);
  }
  return `<style id="relatorio-export-fix">${PDF_EXPORT_STYLE}</style>${doc}`;
}

/** Versão para exportação PDF (mesmo layout, classe pdf-export). */
export function prepareRelatorioHtmlForPdf(html: string): string {
  return prepareRelatorioHtml(html).replace(/\brelatorio-preview\b/g, 'pdf-export');
}
