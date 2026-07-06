import { LucideIcon } from 'lucide-react';
import { ReactNode, useCallback, useLayoutEffect, useRef, useState, WheelEvent } from 'react';
import { TAB } from '../../../lib/design-tokens';

export type SlidingTabItem<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
  /** Tooltip para tabs só com ícone */
  title?: string;
};

type SlidingTabsProps<T extends string> = {
  items: SlidingTabItem<T>[];
  active: T | '';
  onChange: (id: T) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
  /** Tabs compactas só com ícone (ex.: pipeline / tabela) */
  iconOnly?: boolean;
};

type Indicator = { left: number; width: number };
type ScrollEdges = { left: boolean; right: boolean };

function useSlidingIndicator<T extends string>(active: T | '') {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, width: 0 });
  const [scrollEdges, setScrollEdges] = useState<ScrollEdges>({ left: false, right: false });

  const updateScrollEdges = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const { scrollLeft, scrollWidth, clientWidth } = scroll;
    const hasOverflow = scrollWidth > clientWidth + 1;

    setScrollEdges({
      left: hasOverflow && scrollLeft > 2,
      right: hasOverflow && scrollLeft < scrollWidth - clientWidth - 2,
    });
  }, []);

  const updateIndicator = useCallback(() => {
    const scroll = scrollRef.current;
    const btn = active ? tabRefs.current.get(active as T) : undefined;

    if (!btn) {
      setIndicator({ left: 0, width: 0 });
      updateScrollEdges();
      return;
    }

    setIndicator({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
    });

    updateScrollEdges();
  }, [active, updateScrollEdges]);

  useLayoutEffect(() => {
    updateIndicator();

    const scroll = scrollRef.current;
    const track = trackRef.current;
    if (!scroll || !track) return;

    const ro = new ResizeObserver(updateIndicator);
    ro.observe(scroll);
    ro.observe(track);
    scroll.addEventListener('scroll', updateIndicator, { passive: true });
    window.addEventListener('resize', updateIndicator);

    return () => {
      ro.disconnect();
      scroll.removeEventListener('scroll', updateIndicator);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  useLayoutEffect(() => {
    if (!active) {
      updateIndicator();
      return;
    }
    const btn = tabRefs.current.get(active as T);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    requestAnimationFrame(updateIndicator);
  }, [active, updateIndicator]);

  const setTabRef = useCallback((id: T, el: HTMLButtonElement | null) => {
    if (el) tabRefs.current.set(id, el);
    else tabRefs.current.delete(id);
  }, []);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const scroll = scrollRef.current;
    if (!scroll || scroll.scrollWidth <= scroll.clientWidth + 1) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    event.preventDefault();
    scroll.scrollBy({ left: delta, behavior: 'auto' });
  }, []);

  return { scrollRef, trackRef, indicator, scrollEdges, setTabRef, handleWheel };
}

export function SlidingTabs<T extends string>({
  items,
  active,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
  iconOnly = false,
}: SlidingTabsProps<T>) {
  const { scrollRef, trackRef, indicator, scrollEdges, setTabRef, handleWheel } =
    useSlidingIndicator(active);

  const btnPad = iconOnly
    ? 'p-2'
    : size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : 'px-3.5 md:px-4 py-2 text-[13px]';

  return (
    <nav aria-label={ariaLabel} className={`relative max-w-full ${className}`}>
      {scrollEdges.left && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-slate-100 via-slate-100/80 to-transparent dark:from-[#0a1018] dark:via-[#0a1018]/85 dark:to-transparent"
        />
      )}
      {scrollEdges.right && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-slate-100 via-slate-100/80 to-transparent dark:from-[#0a1018] dark:via-[#0a1018]/85 dark:to-transparent"
        />
      )}

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="max-w-full overflow-x-auto overflow-y-hidden scrollbar-none"
      >
        <div ref={trackRef} className={TAB.track}>
          <span
            aria-hidden
            className={`${TAB.indicator} ${indicator.width === 0 ? 'opacity-0' : 'opacity-100'}`}
            style={{ left: indicator.left, width: indicator.width }}
          />

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;

            return (
              <button
                key={item.id}
                ref={(el) => setTabRef(item.id, el)}
                type="button"
                title={item.title ?? item.label}
                onClick={() => onChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={iconOnly ? item.label : undefined}
                className={[
                  'relative z-10 inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-lg transition-colors duration-200',
                  btnPad,
                  isActive ? TAB.active : TAB.inactive,
                ].join(' ')}
              >
                {Icon && (
                  <Icon
                    className={[
                      'shrink-0 transition-colors duration-200',
                      iconOnly ? 'h-4 w-4' : 'h-4 w-4',
                      isActive ? TAB.activeIcon : TAB.inactiveIcon,
                    ].join(' ')}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                )}
                {!iconOnly && <span>{item.label}</span>}
                {!iconOnly && typeof item.count === 'number' && (
                  <span
                    className={[
                      'px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums',
                      isActive
                        ? TAB.activeCount
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                    ].join(' ')}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/** Atalho para alternar entre duas vistas (pipeline / tabela). */
export function ViewModeToggle<T extends string>({
  items,
  value,
  onChange,
}: {
  items: SlidingTabItem<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <SlidingTabs
      items={items}
      active={value}
      onChange={onChange}
      iconOnly
      size="sm"
      ariaLabel="Modo de visualização"
    />
  );
}

export function SlidingTabsSlot({ children }: { children: ReactNode }) {
  return <div className="mt-4 max-w-full">{children}</div>;
}
