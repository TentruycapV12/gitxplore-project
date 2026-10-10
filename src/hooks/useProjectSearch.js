import { useCallback, useEffect, useRef, useState } from 'react';
import { searchProjects } from '../lib/newsSources';

const TTL = 10 * 60 * 1000; // nhớ kết quả 10 phút -> gõ lại cùng từ khoá không tốn data
const CACHE = new Map();

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/**
 * Tìm theo từ khoá trên nhiều nguồn.
 * - Debounce 500ms: gõ xong mới gọi, không gọi mỗi phím.
 * - Huỷ request cũ khi từ khoá đổi.
 * - Chỉ tải trang đầu; "Show more" mới tải trang kế tiếp.
 */
export function useProjectSearch(rawQuery) {
  const query = useDebounced(rawQuery.trim(), 500);
  const active = query.length >= 2;

  const [state, setState] = useState({ query: '', items: [], errors: {}, page: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const moreAbort = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const ctrl = new AbortController();

    const run = async () => {
      const cached = CACHE.get(query);
      if (cached && Date.now() - cached.ts < TTL) {
        setState(cached.data);
        return;
      }
      const { items, errors } = await searchProjects(query, { signal: ctrl.signal, page: 1 });
      if (ctrl.signal.aborted) return;
      const data = { query, items, errors, page: 1 };
      CACHE.set(query, { ts: Date.now(), data });
      setState(data);
    };
    run();

    return () => ctrl.abort();
  }, [query, active]);

  const ready = active && state.query === query;

  const loadMore = useCallback(async () => {
    if (!ready || loadingMore) return;
    moreAbort.current?.abort();
    const ctrl = new AbortController();
    moreAbort.current = ctrl;
    setLoadingMore(true);

    const nextPage = state.page + 1;
    const { items, errors } = await searchProjects(query, { signal: ctrl.signal, page: nextPage });
    if (ctrl.signal.aborted) return;

    setState((prev) => {
      if (prev.query !== query) return prev;
      const known = new Set(prev.items.map((i) => i.id));
      const merged = [...prev.items, ...items.filter((i) => !known.has(i.id))];
      const data = { ...prev, items: merged, page: nextPage, errors: { ...prev.errors, ...errors } };
      CACHE.set(query, { ts: Date.now(), data });
      return data;
    });
    setLoadingMore(false);
  }, [ready, loadingMore, state.page, query]);

  return {
    active,
    query,
    searching: active && !ready,
    items: ready ? state.items : [],
    errors: ready ? state.errors : {},
    loadingMore,
    hasMore: ready && state.items.length > 0,
    loadMore,
  };
}
