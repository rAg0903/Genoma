import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { AUTH_CHANGED_EVENT, getAuthToken } from '../../../lib/auth-session';
import type { DashboardScope } from './DashboardToolbar';

export function useDashboardData<T>(scope: DashboardScope, loadErrorLabel: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ data: T }>(`/dashboards/${scope}`, { token: getAuthToken() });
      setData(res.data);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : loadErrorLabel);
    } finally {
      setLoading(false);
    }
  }, [scope, loadErrorLabel]);

  useEffect(() => { void refetch(); }, [refetch]);

  useEffect(() => {
    const onAuthChanged = () => { void refetch(); };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refetch]);

  return { data, loading, error, updatedAt, refetch };
}
