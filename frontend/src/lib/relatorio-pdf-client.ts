import { prepareRelatorioHtmlForPdf, RELATORIO_A4_WIDTH_PX } from './relatorio-layout';

const A4_WIDTH_PX = RELATORIO_A4_WIDTH_PX;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
        reject(new Error('Falha ao ler o PDF gerado.'));
        return;
      }
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Falha ao ler o PDF gerado.'));
    reader.readAsDataURL(blob);
  });

const loadScript = (doc: Document, src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar biblioteca PDF.'));
    doc.head.appendChild(script);
  });

type Html2PdfApi = () => {
  set: (opt: object) => {
    from: (el: HTMLElement) => {
      outputPdf: (type: 'blob') => Promise<Blob>;
    };
  };
};

const asError = (e: unknown): Error => {
  if (e instanceof Error) return e;
  if (typeof e === 'string' && e.trim()) return new Error(e);
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return new Error((e as { message: string }).message);
  }
  return new Error('Falha ao gerar o PDF do relatório.');
};

const waitForImages = (doc: Document): Promise<void> =>
  Promise.all(
    Array.from(doc.images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);

const waitForLayout = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/**
 * Gera PDF a partir do HTML da pré-visualização, isolado num iframe invisível.
 * Não altera CSS da app — evita flash da sidebar durante a exportação.
 */
export async function exportRelatorioHtmlToPdfBase64(html: string): Promise<string> {
  const prepared = prepareRelatorioHtmlForPdf(html);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('data-pdf-export-root', '');
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${A4_WIDTH_PX}px`,
    'height:1200px',
    'border:0',
    'opacity:0',
    'visibility:hidden',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('Falha ao renderizar o relatório.'));
      iframe.srcdoc = prepared;
    });

    const iframeWin = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!iframeWin || !doc) throw new Error('Falha ao preparar o relatório.');

    await loadScript(doc, '/js/html2pdf.bundle.min.js');
    const html2pdf = (iframeWin as Window & { html2pdf?: Html2PdfApi }).html2pdf;
    if (!html2pdf) throw new Error('Biblioteca PDF indisponível.');

    await waitForImages(doc);
    await waitForLayout();

    const page = doc.querySelector('.page') as HTMLElement | null;
    if (!page) throw new Error('Conteúdo do relatório não encontrado.');

    // margin como número (não array): arrays criados no documento pai falham
    // a validação do html2pdf dentro do iframe (realms diferentes).
    const blob = await html2pdf()
      .set({
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          window: iframeWin,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css legacy' },
      })
      .from(page)
      .outputPdf('blob');

    return await blobToBase64(blob);
  } catch (e) {
    throw asError(e);
  } finally {
    iframe.remove();
  }
}
