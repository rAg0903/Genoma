import { Link, useLocation, useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/LanguageContext';

function NotFoundInner() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
      <p
        aria-hidden
        className="select-none text-[clamp(7rem,22vw,12rem)] font-bold leading-none tracking-tighter text-slate-200 dark:text-slate-800/90"
      >
        404
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
        {t('errors.notFound.title')}
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">
        {t('errors.notFound.description')}
      </p>

      <div className="mt-7 h-0.5 w-10 rounded-full bg-teal-500 dark:bg-teal-400" />

      <div className="mt-9 flex flex-col items-center gap-4">
        <Link
          to="/"
          className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {t('errors.notFound.dashboard')}
        </Link>

        {canGoBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
          >
            {t('errors.notFound.back')}
          </button>
        )}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const location = useLocation();
  const isStandalone = location.pathname === '/preview-404';

  if (isStandalone) {
    return (
      <div
        className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-teal-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/40" />
        <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-900/15" />
        <div className="absolute -left-16 top-16 h-52 w-52 rounded-full bg-white/70 blur-3xl dark:bg-slate-800/40" />
        <div className="relative flex min-h-screen items-center justify-center">
          <NotFoundInner />
        </div>
      </div>
    );
  }

  return <NotFoundInner />;
}
