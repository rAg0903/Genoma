type StatusBadgeProps = {
  status: string;
  map: Record<string, string>;
  fallbackClassName?: string;
  className?: string;
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');

export function StatusBadge({ status, map, fallbackClassName, className }: StatusBadgeProps) {
  const safeFallback = fallbackClassName || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  const styles = map[normalize(status)] || safeFallback;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles} ${className || ''}`.trim()}>
      {status}
    </span>
  );
}
