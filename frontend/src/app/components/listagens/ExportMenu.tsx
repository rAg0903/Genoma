import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listagensApi, ListingKey, ListingQuery } from '../../../lib/api-listagens';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { useLanguage } from '../../../i18n/LanguageContext';

interface ExportMenuProps {
  listing: ListingKey;
  query: ListingQuery;
  count: number;
}

/**
 * Menu de exportacao da listagem activa. Exporta sempre o conjunto filtrado
 * (sem paginacao) — CSV, Excel (.xlsx) ou PDF (HTML pronto a imprimir).
 */
export function ExportMenu({ listing, query, count }: ExportMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);

  const run = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setBusy(format);
    try {
      // Exporta com filtros activos mas sem paginacao.
      const { page, limit, ...rest } = query;
      void page; void limit;
      await listagensApi.export(listing, format, rest);
      toast.success(`Exportação ${format.toUpperCase()} concluída`, { description: `${count} registos.` });
      setOpen(false);
    } catch (e) {
      toast.error('Falha na exportação', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  const items: { id: 'csv' | 'xlsx' | 'pdf'; label: string; icon: typeof FileText }[] = [
    { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { id: 'csv', label: 'CSV', icon: FileDown },
    { id: 'pdf', label: 'PDF (imprimir)', icon: FileText },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={ADD_ACTION_BUTTON_CLASS}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">{t('common.export')}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 z-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1.5">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {t('common.exportRecords', { count })}
            </p>
            {items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                disabled={busy !== null}
                onClick={() => run(id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                {busy === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4 text-slate-400" />}
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
