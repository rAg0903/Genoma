import { processosApi } from './api-processos';
import { exportRelatorioHtmlToPdfBase64 } from './relatorio-pdf-client';

/** Gera o PDF no browser (html2pdf) e grava no servidor via API. */
export async function gerarRelatorioComPdfCliente(processoId: string) {
  const html = await processosApi.fetchRelatorioHtml(processoId);
  const pdf_base64 = await exportRelatorioHtmlToPdfBase64(html);
  return processosApi.gerarRelatorio(processoId, { pdf_base64 });
}
