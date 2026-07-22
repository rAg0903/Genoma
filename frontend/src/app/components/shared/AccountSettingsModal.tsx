import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  KeyRound,
  Loader2,
  Settings,
  Shield,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Theme, useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../../lib/permissions';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { LanguagePreference, useLanguage } from '../../../i18n/LanguageContext';
import {
  NOTIF_PREF_UI,
  NotifPrefs,
  defaultNotifPrefs,
  readNotifPrefs,
  writeNotifPrefs,
} from '../../../lib/notificacoes';

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type SettingsSection = 'geral' | 'notificacoes' | 'seguranca' | 'conta';

const navItemDefs: { id: SettingsSection; icon: typeof Settings }[] = [
  { id: 'geral', icon: Settings },
  { id: 'notificacoes', icon: Bell },
  { id: 'seguranca', icon: KeyRound },
  { id: 'conta', icon: User },
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-slate-200/80 dark:border-slate-700/80 last:border-b-0">
      <div className="min-w-0">
        <p className="text-slate-900 dark:text-slate-100" style={{ fontSize: '14px' }}>{label}</p>
        {description && (
          <p className="text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontSize: '12px', lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 outline-none focus:ring-2 focus:ring-slate-400/30 min-w-[9rem]"
      style={{ fontSize: '13px' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function SettingToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
          checked ? 'translate-x-6 bg-white dark:bg-slate-900' : 'translate-x-1 bg-white'
        }`}
      />
    </button>
  );
}

export function AccountSettingsModal({ open, onClose }: AccountSettingsModalProps) {
  const { role, currentUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSection>('geral');
  const [showMfaBanner, setShowMfaBanner] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(defaultNotifPrefs);

  const navItems = useMemo(
    () => navItemDefs.map((item) => ({
      ...item,
      label: t(`settings.sections.${item.id}`),
    })),
    [t],
  );

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguagePreference);
    toast.success(t('settings.languageChanged'));
  };

  useEffect(() => {
    if (!open) return;
    setNome(currentUser?.nome || '');
    setEmail(currentUser?.email || '');
    setNotifPrefs(readNotifPrefs());
    setActiveSection('geral');
  }, [open, currentUser?.nome, currentUser?.email]);

  const persistNotifPrefs = (next: NotifPrefs) => {
    setNotifPrefs(next);
    writeNotifPrefs(next);
  };

  const handleSaveAccount = async () => {
    const trimmedNome = nome.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNome) {
      toast.error(t('settings.nameRequired'));
      return;
    }
    if (!trimmedEmail) {
      toast.error(t('settings.emailRequired'));
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ nome: trimmedNome, email: trimmedEmail });
      toast.success(t('settings.accountUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.accountSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const displayRole = currentUser?.perfil_nome || t(`roles.${role as UserRole}`);
  const isActive = currentUser?.ativo !== false;

  const renderContent = () => {
    switch (activeSection) {
      case 'geral':
        return (
          <div>
            {showMfaBanner && (
              <div className="mb-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5 relative">
                <button
                  type="button"
                  onClick={() => setShowMfaBanner(false)}
                  className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                  aria-label={t('settings.closeNotice')}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
                <div className="flex items-start gap-4 pr-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100" style={{ fontSize: '15px' }}>{t('settings.mfaBannerTitle')}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                      {t('settings.mfaBannerDescription')}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setActiveSection('seguranca'); }}
                      className="mt-3 px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-sm transition-colors"
                      style={{ fontSize: '13px', fontWeight: 600 }}
                    >
                      {t('settings.configureMfa')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <SettingRow label={t('settings.theme')}>
              <SettingSelect
                value={theme}
                onChange={(v) => setTheme(v as Theme)}
                options={[
                  { value: 'light', label: t('settings.themeLight') },
                  { value: 'dark', label: t('settings.themeDark') },
                  { value: 'system', label: t('settings.themeSystem') },
                ]}
              />
            </SettingRow>
            <SettingRow label={t('settings.language')}>
              <SettingSelect
                value={language}
                onChange={handleLanguageChange}
                options={[
                  { value: 'auto', label: t('settings.languageAuto') },
                  { value: 'pt', label: t('settings.languagePt') },
                  { value: 'en', label: t('settings.languageEn') },
                ]}
              />
            </SettingRow>
          </div>
        );

      case 'notificacoes':
        return (
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-4" style={{ fontSize: '13px', lineHeight: 1.5 }}>
              {t('settings.notifications.intro')}
            </p>
            {NOTIF_PREF_UI.map(({ key, labelKey, descKey }) => (
              <SettingRow
                key={key}
                label={t(labelKey)}
                description={t(descKey)}
              >
                <SettingToggle
                  checked={notifPrefs[key]}
                  onChange={(v) => persistNotifPrefs({ ...notifPrefs, [key]: v })}
                />
              </SettingRow>
            ))}
          </div>
        );

      case 'seguranca':
        return (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-slate-100 font-medium" style={{ fontSize: '14px' }}>
                    {t('settings.password')}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                    {t('settings.passwordDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.message(t('settings.changePasswordSoon'))}
                    className="mt-3 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    {t('settings.changePassword')}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-slate-100 font-medium" style={{ fontSize: '14px' }}>
                    {t('settings.mfaTitle')}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                    {t('settings.mfaDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.message(t('settings.mfaSoon'))}
                    className="mt-3 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-sm transition-colors"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  >
                    {t('settings.configureMfa')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'conta':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="account-name" className="block text-slate-500 dark:text-slate-400 mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>
                  {t('settings.accountName')}
                </label>
                <input
                  id="account-name"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-500"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label htmlFor="account-email" className="block text-slate-500 dark:text-slate-400 mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>
                  {t('settings.accountEmail')}
                </label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-500"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-slate-200/80 dark:border-slate-700/80">
              <SettingRow label={t('settings.accountRole')}>
                <span className="text-slate-600 dark:text-slate-300" style={{ fontSize: '13px' }}>{displayRole}</span>
              </SettingRow>
              <SettingRow label={t('settings.accountStatus')}>
                <span className={`${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`} style={{ fontSize: '13px', fontWeight: 500 }}>
                  {isActive ? t('settings.accountActive') : t('settings.accountInactive')}
                </span>
              </SettingRow>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => void handleSaveAccount()}
                disabled={saving}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                style={{ fontSize: '14px', fontWeight: 500 }}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.saveChanges')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-[calc(100%-1.5rem)] p-0 gap-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 [&>button]:hidden">
        <DialogTitle className="sr-only">{t('settings.title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('settings.description')}
        </DialogDescription>

        <div className="flex flex-col sm:flex-row h-[min(640px,88vh)]">
          {/* Sidebar */}
          <aside className="sm:w-56 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
            <div className="flex items-center px-3 pt-3 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                aria-label={t('settings.closeSettings')}
              >
                <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <nav className="flex sm:flex-col gap-0.5 px-2 pb-3 sm:py-2 overflow-x-auto sm:overflow-x-visible">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
            <div className="px-6 pt-5 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex-shrink-0">
              <h2 className="text-slate-900 dark:text-slate-100" style={{ fontSize: '18px', fontWeight: 600 }}>
                {t(`settings.sections.${activeSection}`)}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
