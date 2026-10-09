import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook (bài 5-6): chỉ lo bookmark. Phần đăng nhập đã nằm ở AuthContext
 * nên không còn lặp lại logic getSession/onAuthStateChange như useAuthUser cũ.
 */
export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      return;
    }
    let ignore = false; // tránh setState khi component đã unmount / user đã đổi

    supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!ignore && !error && data) setBookmarks(data);
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  const toggleBookmark = useCallback(
    async (repo) => {
      if (!userId) return false;

      const exists = bookmarks.some((b) => b.repo_id === repo.id);
      if (exists) {
        await supabase.from('bookmarks').delete().eq('user_id', userId).eq('repo_id', repo.id);
        setBookmarks((prev) => prev.filter((b) => b.repo_id !== repo.id));
      } else {
        const { data } = await supabase
          .from('bookmarks')
          .insert([{ user_id: userId, repo_id: repo.id, repo_name: repo.name, repo_desc: repo.desc || '' }])
          .select();
        if (data) setBookmarks((prev) => [...prev, data[0]]);
      }
      return true;
    },
    [userId, bookmarks]
  );

  return { bookmarks, toggleBookmark };
}
