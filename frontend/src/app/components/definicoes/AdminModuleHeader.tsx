import { PAGE } from '../../../lib/design-tokens';
import { SlidingTabItem, SlidingTabs, SlidingTabsSlot } from '../shared/SlidingTabs';

type AdminModuleHeaderProps<T extends string> = {
  title: string;
  subtitle?: string;
  tabs: SlidingTabItem<T>[];
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
    <header>
      <div>
        <h1 className={PAGE.title}>{title}</h1>
        {subtitle && <p className={PAGE.subtitle}>{subtitle}</p>}
      </div>

      {tabs.length > 0 && (
        <SlidingTabsSlot>
          <SlidingTabs
            items={tabs}
            active={activeTab}
            onChange={onTabChange}
            ariaLabel="Submodulos de administracao"
          />
        </SlidingTabsSlot>
      )}
    </header>
  );
}
