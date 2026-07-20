import { useCallback, useEffect, useRef, useState } from 'react';
import { prepareRelatorioHtml, RELATORIO_A4_WIDTH_PX, RELATORIO_A4_HEIGHT_PX } from '../../../lib/relatorio-layout';

export function RelatorioPreviewFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pageHeight, setPageHeight] = useState(RELATORIO_A4_HEIGHT_PX);

  const preparedHtml = prepareRelatorioHtml(html);

  const syncHeight = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const page = doc?.querySelector('.page') as HTMLElement | null;
    if (page) {
      setPageHeight(Math.max(page.scrollHeight, page.offsetHeight, 900));
    }
  }, []);

  useEffect(() => {
    syncHeight();
  }, [preparedHtml, syncHeight]);

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-slate-200 px-3 py-4 dark:bg-slate-950">
      <iframe
        ref={iframeRef}
        title="Pré-visualização do relatório"
        srcDoc={preparedHtml}
        sandbox="allow-same-origin"
        onLoad={syncHeight}
        scrolling="no"
        className="mx-auto block border-0 bg-white shadow-md"
        style={{
          width: RELATORIO_A4_WIDTH_PX,
          height: pageHeight,
        }}
      />
    </div>
  );
}
