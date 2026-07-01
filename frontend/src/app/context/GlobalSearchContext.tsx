import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { GlobalSearchPalette } from '../components/listagens/GlobalSearchPalette';
import { navigateToSearchTarget } from '../../lib/global-search-navigation';
import type { SearchResultItem } from '../../lib/api-listagens';

interface GlobalSearchContextValue {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  const toggleSearch = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onNavigate = useCallback(
    (target: SearchResultItem['target']) => {
      setOpen(false);
      navigateToSearchTarget(navigate, target);
    },
    [navigate],
  );

  const value = useMemo(
    () => ({ open, openSearch, closeSearch, toggleSearch }),
    [open, openSearch, closeSearch, toggleSearch],
  );

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearchPalette open={open} onClose={closeSearch} onNavigate={onNavigate} />
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return ctx;
}
