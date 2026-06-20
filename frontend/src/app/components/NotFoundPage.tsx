import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffffff_0%,_#f0f6ff_48%,_#eaf2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_#0b1220_0%,_#0f172a_48%,_#111827_100%)] px-6 py-16"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

      <section className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <div className="mt-2 flex items-center justify-center gap-4 sm:gap-12">
          <span className="text-[98px] sm:text-[160px] font-semibold text-slate-300/90 dark:text-slate-500/70">4</span>
          <div className="flex flex-col items-center">
            <div className="relative h-26 w-26 sm:h-36 sm:w-36 rounded-full bg-[radial-gradient(circle_at_30%_25%,_#e0f2fe_0%,_#bae6fd_45%,_#7dd3fc_75%,_#38bdf8_100%)] shadow-[0_16px_36px_rgba(56,189,248,0.32)]">
              <div className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-white/70 blur-sm" />
              <div className="absolute left-6 bottom-6 h-8 w-8 rounded-full bg-white/50 blur-sm" />
            </div>
            <div className="mt-3 h-3.5 w-12 rounded-full bg-slate-900/85 dark:bg-slate-100/90" />
            <div className="mt-1.5 h-1.5 w-9 rounded-full bg-slate-700/70 dark:bg-slate-300/70" />
          </div>
          <span className="text-[98px] sm:text-[160px] font-semibold text-slate-300/90 dark:text-slate-500/70">4</span>
        </div>

        <div className="mt-6 max-w-lg px-2 sm:px-0">
          <p className="text-slate-900 dark:text-slate-100" style={{ fontSize: '20px', fontWeight: 700 }}>Pagina nao encontrada</p>
          <p className="mt-2 text-slate-600/90 dark:text-slate-300/90" style={{ fontSize: '14px', lineHeight: 1.6 }}>
            Esta pagina nao existe ou foi movida. Verifique o endereco ou volte para a pagina inicial.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 transition-all hover:bg-slate-800 dark:hover:bg-slate-200"
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            Voltar ao inicio
          </Link>
        </div>
      </section>
    </div>
  );
}
