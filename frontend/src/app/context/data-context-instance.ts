import { createContext } from 'react';
import type { DataContextType } from './DataContext';

/** Stable context instance — keep in a small module so HMR on DataProvider does not recreate context. */
export const DataContext = createContext<DataContextType | null>(null);
