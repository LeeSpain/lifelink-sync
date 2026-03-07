import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 60000; // 1 minute

export function useCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  cacheTime = CACHE_DURATION
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cached = cache.get(key);
      const now = Date.now();
      
      if (cached && now < cached.timestamp + cached.expiry) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await queryFn();
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: now,
        expiry: cacheTime
      });
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, cacheTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const invalidateCache = useCallback(() => {
    cache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refetch: fetchData, invalidate: invalidateCache };
}

export function useOptimizedSupabaseQuery<T = any>(
  table: string,
  select = '*',
  options: {
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    cacheTime?: number;
  } = {}
) {
  const { filter = {}, order, limit, cacheTime = CACHE_DURATION } = options;
  
  const queryFn = useCallback(async (): Promise<T[]> => {
    let query = (supabase as any).from(table).select(select);
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });
    
    // Apply ordering
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? false });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as T[];
  }, [table, select, JSON.stringify(filter), JSON.stringify(order), limit]);

  const cacheKey = useMemo(() => 
    `${table}_${select}_${JSON.stringify(filter)}_${JSON.stringify(order)}_${limit}`,
    [table, select, filter, order, limit]
  );

  return useCachedQuery(cacheKey, queryFn, [table, select, filter, order, limit], cacheTime);
}

// Batch query hook for related data
export function useBatchQueries(queries: Array<{ key: string; fn: () => Promise<any> }>) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      queries.map(async ({ key, fn }) => {
        try {
          const result = await fn();
          return { key, data: result };
        } catch (error) {
          return { key, error };
        }
      })
    );

    const newData: Record<string, any> = {};
    const newErrors: Record<string, Error> = {};

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, data: resultData, error } = result.value;
        if (error) {
          newErrors[key] = error;
        } else {
          newData[key] = resultData;
        }
      }
    });

    setData(newData);
    setErrors(newErrors);
    setLoading(false);
  }, [queries]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, errors, refetch: fetchAll };
}

// Clear cache utility
export function clearCache(pattern?: string) {
  if (pattern) {
    const keys = Array.from(cache.keys()).filter(key => key.includes(pattern));
    keys.forEach(key => cache.delete(key));
  } else {
    cache.clear();
  }
}