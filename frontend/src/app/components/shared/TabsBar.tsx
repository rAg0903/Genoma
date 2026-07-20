import { SlidingTabItem, SlidingTabs } from './SlidingTabs';

export type TabItem<T extends string = string> = SlidingTabItem<T>;

type TabsBarProps<T extends string> = {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  instant?: boolean;
};

export function TabsBar<T extends string>({ items, active, onChange, instant }: TabsBarProps<T>) {
  return (
    <SlidingTabs
      items={items}
      active={active}
      onChange={onChange}
      ariaLabel="Secções"
      instant={instant}
    />
  );
}
