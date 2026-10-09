import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { openSourceProjects } from '../data/projectsData';

/**
 * Đồng bộ bộ lọc với URL bằng useSearchParams (bài 8-9, slide 22-23):
 *   /?category=ai&q=react
 * → reload, chia sẻ link hay bấm Back đều giữ nguyên bộ lọc.
 */
export function useProjectFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('q') || '';

  const setParam = useCallback(
    (key, value, emptyValue = '') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === emptyValue) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true } // không làm đầy lịch sử trình duyệt mỗi lần lọc
      );
    },
    [setSearchParams]
  );

  const setCategory = useCallback((value) => setParam('category', value, 'all'), [setParam]);
  const setSearch = useCallback((value) => setParam('q', value.trim()), [setParam]);

  // useMemo: chỉ lọc lại khi category/search đổi, không lọc lại mỗi lần render.
  const projects = useMemo(() => {
    const term = search.toLowerCase();
    if (term) {
      return openSourceProjects.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          item.language.toLowerCase().includes(term)
      );
    }
    if (category === 'all') return openSourceProjects.slice(0, 4);
    return openSourceProjects.filter((item) => item.category === category);
  }, [category, search]);

  return { category, search, setCategory, setSearch, projects };
}
