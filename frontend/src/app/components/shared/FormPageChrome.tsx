import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { PAGE } from '../../../lib/design-tokens';
import { SlidingTabItem, SlidingTabs, SlidingTabsSlot } from './SlidingTabs';

type FormPageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Contentor de páginas de formulário / detalhe (alinhado com o Painel). */
export function FormPageShell({ children, className = '' }: FormPageShellProps) {
  return (
    <div className={`${PAGE.shell} ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  );
}

export function FormPageBody({ children, className = '' }: FormPageShellProps) {
  return <div className={`${PAGE.body} ${className}`}>{children}</div>;
}

type FormPageHeaderProps<T extends string> = {
  onBack: () => void;
  title: string;
  titleExtra?: ReactNode;
  subtitle?: string;
  avatar?: ReactNode;
  actions?: ReactNode;
  tabs?: SlidingTabItem<T>[];
  activeTab?: T;
  onTabChange?: (id: T) => void;
  tabsAriaLabel?: string;
};

/** Cabeçalho de formulário: voltar, avatar, título, acções e tabs deslizantes. */
export function FormPageHeader<T extends string>({
  onBack,
  title,
  titleExtra,
  subtitle,
  avatar,
  actions,
  tabs,
  activeTab,
  onTabChange,
  tabsAriaLabel = 'Secções do formulário',
}: FormPageHeaderProps<T>) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {avatar ? <div className="flex-shrink-0">{avatar}</div> : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 className={`${PAGE.title} truncate`}>{title}</h1>
            {titleExtra}
          </div>
          {subtitle ? <p className={`${PAGE.subtitle} truncate`}>{subtitle}</p> : null}
        </div>

        {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
      </div>

      {tabs && tabs.length > 0 && activeTab && onTabChange ? (
        <SlidingTabsSlot>
          <SlidingTabs
            items={tabs}
            active={activeTab}
            onChange={onTabChange}
            ariaLabel={tabsAriaLabel}
          />
        </SlidingTabsSlot>
      ) : null}
    </header>
  );
}

type FormPrimaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  form?: string;
  className?: string;
};

/** Botão Guardar / Criar — outline teal (igual a «+ Novo …» nas listagens). */
export function FormPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  form,
  className = '',
}: FormPrimaryButtonProps) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={`${ADD_ACTION_BUTTON_CLASS} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/** Avatar circular com iniciais (formulários). */
export function FormAvatarInitials({ initials, tone = 'brand' }: { initials: string; tone?: 'brand' | 'info' }) {
  const tones = {
    brand: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400',
    info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  };

  return (
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${tones[tone]}`}>
      <span className="text-[15px] font-bold">{initials}</span>
    </div>
  );
}
