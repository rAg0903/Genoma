import { ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  empty?: ReactNode;
};

export function DataTable<T>({ columns, data, empty }: DataTableProps<T>) {
  if (data.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {column.header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-[13px] ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
