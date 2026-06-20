import { KeyRound, LoaderCircle, Lock, Mail, Moon, Sun } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../../lib/api';
import { useTheme } from '../context/ThemeContext';

type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
  expiresInMinutes?: number;
};

type ResetPasswordResponse = {
  message: string;
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-500/20';

const inputWithIconClass = `${inputClass} pl-11`;

const formPanelClass =
  'space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30';

export function ForgotPasswordPage() {
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setRequestMessage(null);
    setGeneratedToken(null);

    try {
      setIsSending(true);
      const response = await apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });

      setRequestMessage(response.message || 'Pedido enviado com sucesso.');
      if (response.resetToken) {
        setGeneratedToken(response.resetToken);
        setToken(response.resetToken);
      }
    } catch (error) {
      const fallback = 'Nao foi possivel processar o pedido agora.';
      setRequestError(error instanceof Error ? error.message || fallback : fallback);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError(null);
    setResetMessage(null);

    if (!token.trim()) {
      setResetError('Introduza o token de recuperacao.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError('A nova password deve ter no minimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('A confirmacao da password nao coincide.');
      return;
    }

    try {
      setIsResetting(true);
      const response = await apiRequest<ResetPasswordResponse>('/auth/reset-password', {
        method: 'POST',
        body: {
          token: token.trim(),
          newPassword,
        },
      });

      setResetMessage(response.message || 'Password atualizada com sucesso.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const fallback = 'Nao foi possivel redefinir a password.';
      setResetError(error instanceof Error ? error.message || fallback : fallback);
    } finally {
      setIsResetting(false);
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
        aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        title={isDark ? 'Modo claro' : 'Modo escuro'}
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(14,64,98,0.14)] dark:border-slate-800 dark:bg-slate-900 md:p-10">
        <div className="mb-8">
          <span
            className="mb-4 inline-flex items-center rounded-full border border-teal-200/70 bg-gradient-to-r from-teal-50 to-teal-100/80 px-3 py-1 text-teal-800 dark:border-teal-800/50 dark:from-teal-950/60 dark:to-teal-900/30 dark:text-teal-300"
            style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            RECUPERACAO DE ACESSO
          </span>
          <h1 className="text-slate-900 dark:text-slate-50" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1 }}>
            Recuperar Password
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            Peça um token de recuperação e defina a password. Utilize também este fluxo no primeiro acesso, após a conta ser criada em Administração.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={handleRequestReset} className={formPanelClass}>
            <h2 className="text-slate-900 dark:text-slate-50" style={{ fontSize: '16px', fontWeight: 700 }}>
              1. Pedir token
            </h2>
            <div className="space-y-2">
              <label htmlFor="recover-email" className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', fontWeight: 600 }}>
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="recover-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="utilizador@genoma.local"
                  className={inputWithIconClass}
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            {requestMessage && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                style={{ fontSize: '13px' }}
              >
                {requestMessage}
              </div>
            )}
            {requestError && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
                style={{ fontSize: '13px' }}
              >
                {requestError}
              </div>
            )}

            {generatedToken && (
              <div
                className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-teal-800 dark:border-teal-800/50 dark:bg-teal-950/40 dark:text-teal-300"
                style={{ fontSize: '12px' }}
              >
                Token de teste (ambiente nao-producao): {generatedToken}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isSending ? 'A enviar...' : 'Enviar token'}
            </button>
          </form>

          <form onSubmit={handleResetPassword} className={formPanelClass}>
            <h2 className="text-slate-900 dark:text-slate-50" style={{ fontSize: '16px', fontWeight: 700 }}>
              2. Redefinir password
            </h2>

            <div className="space-y-2">
              <label htmlFor="token" className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', fontWeight: 600 }}>
                Token
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Cole o token recebido"
                  className={inputWithIconClass}
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', fontWeight: 600 }}>
                Nova password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputWithIconClass}
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px', fontWeight: 600 }}>
                Confirmar password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputWithIconClass}
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            {resetMessage && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                style={{ fontSize: '13px' }}
              >
                {resetMessage}
              </div>
            )}
            {resetError && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
                style={{ fontSize: '13px' }}
              >
                {resetError}
              </div>
            )}

            <button
              type="submit"
              disabled={isResetting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {isResetting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isResetting ? 'A atualizar...' : 'Atualizar password'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
