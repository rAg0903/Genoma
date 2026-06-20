import { LucideIcon, Settings2 } from 'lucide-react';

type AdminTabItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

type AdminModuleHeaderProps<T extends string> = {
  title: string;
  subtitle?: string;
  tabs: AdminTabItem<T>[];
  activeTab: T;
  onTabChange: (id: T) => void;
};

export function AdminModuleHeader<T extends string>({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
}: AdminModuleHeaderProps<T>) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 md:px-6 pt-5 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/80 dark:from-teal-950/60 dark:to-teal-900/30 border border-teal-200/70 dark:border-teal-800/50 shadow-sm">
            <Settings2 className="h-5 w-5 text-teal-600 dark:text-teal-400" strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[21px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {tabs.length > 0 && (
        <nav
          aria-label="Submodulos de administracao"
          className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40"
        >
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <div className="flex min-w-max px-2 md:px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'group relative flex items-center gap-2 px-3.5 md:px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300',
                      ].join(' ')}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-teal-500 dark:bg-teal-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
