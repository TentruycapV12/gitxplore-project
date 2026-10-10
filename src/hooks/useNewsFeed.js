import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAllNews } from '../lib/newsSources';

const CACHE_KEY = 'gxp_news_cache_v1';

const loadCache = () => {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (c?.items?.length) return c;
  } catch {
    /* cache hỏng -> bỏ qua */
  }
  return null;
};

/**
 * Tự động cập nhật theo chu kỳ (intervalMs).
 * - Hiện cache ngay (stale-while-revalidate) rồi tải mới.
 * - Tab ẩn thì tạm dừng; quay lại tab thì cập nhật nếu đã quá hạn.
 * - Có bài mới -> không làm nhảy danh sách, mà hiện nút "N bài mới".
 */
export function useNewsFeed(intervalMs) {
  const [cache] = useState(loadCache);
  const [items, setItems] = useState(cache?.items || []);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(cache?.ts || null);
  const [pending, setPending] = useState(null);

  const itemsRef = useRef(items);
  const lastRef = useRef(cache?.ts || 0);
  const abortRef = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refresh = useCallback(async (manual = false) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const { items: next, errors: errs } = await fetchAllNews(ctrl.signal);
    if (ctrl.signal.aborted) return;

    setErrors(errs);
    setLoading(false);
    if (!next.length) return;

    const now = Date.now();
    lastRef.current = now;
    setLastUpdated(now);

    const known = new Set(itemsRef.current.map((i) => i.id));
    const fresh = next.filter((i) => !known.has(i.id)).length;

    if (manual || itemsRef.current.length === 0 || fresh === 0) {
      setItems(next);
      setPending(null);
    } else {
      setPending({ items: next, count: fresh });
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, items: next.slice(0, 150) }));
    } catch {
      /* hết dung lượng -> bỏ qua */
    }
  }, []);

  const applyPending = useCallback(() => {
    setPending((p) => {
      if (p) setItems(p.items);
      return null;
    });
  }, []);

  useEffect(() => {
    refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  useEffect(() => {
    if (!intervalMs) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, intervalMs);
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastRef.current > intervalMs) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, refresh]);

  return {
    items,
    errors,
    loading,
    lastUpdated,
    newCount: pending?.count || 0,
    applyPending,
    refresh: () => refresh(true),
  };
}
