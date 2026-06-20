import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { ADD_ACTION_BUTTON_CLASS } from '../../../lib/design-system';

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
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '20px', fontWeight: 600 }}>{title}</h1>
          {subtitle && (
            <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={ADD_ACTION_BUTTON_CLASS}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.mobileLabel || action.label}</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
