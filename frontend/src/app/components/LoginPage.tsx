import { Eye, EyeOff, LoaderCircle, Lock, Mail, Moon, ShieldCheck, Sun } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { apiRequest } from '../../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import genomaSymbol from '../../assets/genoma-logo_high_quality.png';
import genomaSymbolDark from '../../assets/genoma-logo_high_quality2.png';

type LoginResponse = {
  token: string;
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-500/20';

const brandSurfaceClass =
  'border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70';

export function LoginPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage(t('login.fillFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: {
          email: email.trim(),
          password,
        },
      });

      const storage = rememberSession ? window.localStorage : window.sessionStorage;
      storage.setItem('token', response.token);
      window.dispatchEvent(new Event('genoma:auth-changed'));
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message || t('login.error') : t('login.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-slate-50 px-4 pt-8 pb-8 dark:bg-slate-950"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-20 rounded-xl border border-slate-200/70 bg-white/80 p-2.5 text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 md:right-8 md:top-8"
        aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
        title={isDark ? t('theme.lightMode') : t('theme.darkMode')}
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(14,64,98,0.14)] dark:border-slate-800 dark:bg-slate-900 md:min-h-[640px] md:grid-cols-[1.08fr_0.92fr]">
        {/* Left — form */}
        <section className="relative flex flex-col justify-center px-6 py-10 md:px-10 md:py-14">
          <div className="mb-8 max-w-md">
            <span className="mb-4 inline-flex items-center rounded-full border border-teal-200/70 bg-gradient-to-r from-teal-50 to-teal-100/80 px-3 py-1 text-teal-800 dark:border-teal-800/50 dark:from-teal-950/60 dark:to-teal-900/30 dark:text-teal-300" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }}>
              {t('login.badge')}
            </span>
            <h1 className="text-slate-900 dark:text-slate-50" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1 }}>
              {t('login.title')}
            </h1>
            <p className="mt-2 max-w-sm text-slate-500 dark:text-slate-400" style={{ fontSize: '14px', lineHeight: 1.5 }}>
              {t('login.subtitle')}
            </p>
          </div>

          <form className="max-w-md space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', fontWeight: 600 }}>
                {t('common.email')}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="utilizador@genoma.local"
                  className={inputClass}
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', fontWeight: 600 }}>
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className={`${inputClass} pr-11`}
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-slate-600 dark:text-slate-400" style={{ fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-500 dark:border-slate-600"
                />
                {t('login.rememberMe')}
              </label>
              <Link
                to="/forgot-password"
                className="text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200" style={{ fontSize: '13px' }}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <p className="mt-8 flex max-w-md items-center gap-2 text-slate-400 dark:text-slate-500" style={{ fontSize: '12px' }}>
            <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            {t('login.secureAccess')}
          </p>
        </section>

        {/* Right — branding */}
        <section className="relative hidden overflow-hidden md:flex md:items-center md:justify-center md:px-10 md:py-14">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-teal-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/40" />
          <div
            className="absolute inset-0 opacity-[0.25] dark:opacity-[0.1]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.1) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -left-16 top-16 h-52 w-52 rounded-full bg-white/70 blur-3xl dark:bg-slate-800/40" />
          <div className="absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-900/15" />
          <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-slate-200/40 blur-2xl dark:bg-slate-700/20" />

          <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
            <div className="relative mb-10">
              <div className="absolute inset-0 scale-110 rounded-[2rem] bg-white/50 blur-2xl dark:hidden" />
              <div
                className={`relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-[2rem] p-6 ${brandSurfaceClass}`}
              >
                <img
                  src={genomaSymbol}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-contain dark:hidden"
                />
                <img
                  src={genomaSymbolDark}
                  alt=""
                  aria-hidden
                  className="hidden h-full w-full object-contain dark:block"
                />
              </div>
            </div>

            <div className={`w-full rounded-2xl px-8 py-7 ${brandSurfaceClass}`}>
              <p className="font-genoma-wordmark text-slate-900 dark:text-slate-50" style={{ fontSize: '32px', lineHeight: 1 }}>
                Genoma
              </p>
              <p className="mx-auto mt-3 max-w-[240px] text-slate-500 dark:text-slate-400" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                {t('login.tagline')}
              </p>

              <div className="mx-auto mt-4 h-0.5 w-10 rounded-full bg-teal-500 dark:bg-teal-400" />

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {(['patients', 'processes', 'results'] as const).map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                  >
                    {t(`login.highlights.${key}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
