import { LucideIcon } from 'lucide-react';

type TabItem<T extends string> = {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
};

type TabsBarProps<T extends string> = {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
};

export function TabsBar<T extends string>({ items, active, onChange }: TabsBarProps<T>) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md transition-all whitespace-nowrap ${
              isActive
                ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            style={{ fontSize: '13px', fontWeight: isActive ? 500 : 400, lineHeight: 1 }}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="whitespace-nowrap">{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
                style={{ fontSize: '11px', fontWeight: 600 }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
