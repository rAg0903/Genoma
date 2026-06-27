import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../../i18n/LanguageContext';
import { AccountSettingsModal } from './AccountSettingsModal';
import { EditProfileModal } from './EditProfileModal';
import { UserAvatar } from './UserAvatar';
import { formatUtilizadorNome } from '../../../lib/utilizadores';

type MenuPlacement = 'bottom-end' | 'top-start';

interface UserAccountMenuProps {
  placement?: MenuPlacement;
  onMenuAction?: () => void;
  trigger: (props: { open: boolean; onClick: () => void }) => ReactNode;
}

export function UserAccountMenu({ placement = 'bottom-end', onMenuAction, trigger }: UserAccountMenuProps) {
  const { role, currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const displayName = currentUser
    ? formatUtilizadorNome({ nome: currentUser.nome, medico_titulo: currentUser.medico_titulo })
    : t('common.currentUser');
  const displayRole = currentUser?.perfil_nome || t(`roles.${role}`);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    closeMenu();
    onMenuAction?.();
    logout();
    navigate('/login', { replace: true });
  };

  const openProfile = () => {
    closeMenu();
    onMenuAction?.();
    setProfileModalOpen(true);
  };

  const openSettings = () => {
    closeMenu();
    onMenuAction?.();
    setAccountModalOpen(true);
  };

  const menuPositionClass =
    placement === 'top-start'
      ? 'left-0 bottom-full mb-2'
      : 'right-0 top-full mt-2';

  return (
    <div ref={containerRef} className="relative">
      {trigger({ open, onClick: () => setOpen((prev) => !prev) })}

      {open && (
        <div
          className={`absolute ${menuPositionClass} w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700 z-[120] overflow-hidden`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 dark:border-slate-800">
            <UserAvatar
              name={displayName}
              avatarUrl={currentUser?.avatar_url}
              fallback={role.slice(0, 2).toUpperCase()}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900 dark:text-slate-100" style={{ fontSize: '13px' }}>{displayName}</p>
              <p className="truncate text-slate-500 dark:text-slate-400" style={{ fontSize: '12px' }}>{displayRole}</p>
            </div>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              onClick={openProfile}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <UserCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px' }}>{t('account.profile')}</span>
            </button>
            <button
              type="button"
              onClick={openSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300" style={{ fontSize: '13px' }}>{t('account.settings')}</span>
            </button>

            <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

            <button
              type="button"
              onClick={handleLogout}
              className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-slate-900 dark:text-slate-100 group-hover:text-white dark:group-hover:text-slate-900 transition-colors" />
              <span style={{ fontSize: '13px' }}>{t('account.logout')}</span>
            </button>
          </div>
        </div>
      )}

      <EditProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <AccountSettingsModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
    </div>
  );
}
