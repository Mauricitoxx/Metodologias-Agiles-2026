import { useEffect, useState } from 'react';
import { loadCatalogSources } from '../utils/catalog';

export function useCatalogEntries(modules) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadCatalogSources(modules).then((data) => {
      if (!cancelled) setResult({ modules, attempt, ...data });
    });
    return () => { cancelled = true; };
  }, [modules, attempt]);
  const current = result?.modules === modules && result?.attempt === attempt ? result : null;
  return {
    loading: !current, entries: current?.entries || [], failures: current?.failures || [],
    retry: () => setAttempt((value) => value + 1),
  };
}
