import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';
import { PAGE } from '../../../lib/design-tokens';

type HeaderAction = {
  label: string;
  mobileLabel?: string;
  onClick: () => void;
  icon?: LucideIcon;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: HeaderAction;
  children?: ReactNode;
};

export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
  const Icon = action?.icon;

  return (
    <header>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className={PAGE.title}>{title}</h1>
          {subtitle && <p className={PAGE.subtitle}>{subtitle}</p>}
        </div>
        {action && (
          <button type="button" onClick={action.onClick} className={ADD_ACTION_BUTTON_CLASS}>
            {Icon && <Icon className="w-4 h-4" />}
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.mobileLabel || action.label}</span>
          </button>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
