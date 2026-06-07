import { useCallback, useEffect, useState } from 'react';
import { errMessage } from '@/api/client';

/**
 * Generic list loader for Ops screens. Pass a STABLE fetch function (a
 * module-level api function), or memoise it, to avoid refetch loops.
 */
export function useOpsList<T>(fetchFn: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchFn());
    } catch (e) {
      setError(errMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload, setItems };
}
