import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  // Lắng nghe thay đổi Auth và đồng bộ LocalStorage
  useEffect(() => {
    const processSession = (session) => {
      if (session?.user) {
        const u = session.user;
        setUser(u);
        
        // Tạo object user lưu vào localStorage nếu cần hiển thị nhanh avatar/tên
        const userData = {
          name: u.user_metadata?.full_name || u.user_metadata?.user_name || u.email?.split('@')[0],
          identifier: u.email,
          avatarChar: (u.email || 'U').charAt(0).toUpperCase(),
          avatarUrl: u.user_metadata?.avatar_url || null,
          provider: u.app_metadata?.provider || 'OAuth',
        };
        localStorage.setItem('hka_user', JSON.stringify(userData));

        // Lấy danh sách bookmark của user này
        fetchBookmarks(u.id);
      } else {
        setUser(null);
        setBookmarks([]);
        localStorage.removeItem('hka_user');
      }
    };

    // 1. Kiểm tra session hiện tại khi vừa load trang
    supabase.auth.getSession().then(({ data: { session } }) => {
      processSession(session);
    });

    // 2. Lắng nghe sự kiện đăng nhập / đăng xuất thời gian thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      processSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Lấy bookmark từ Supabase Database
  const fetchBookmarks = async (userId) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId);
    if (!error && data) setBookmarks(data);
  };

  // Toggle Bookmark
  const toggleBookmark = async (repo) => {
    if (!user) return alert('Vui lòng đăng nhập để lưu repository!');

    const isBookmarked = bookmarks.some((b) => b.repo_id === repo.id);
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('repo_id', repo.id);
      setBookmarks((prev) => prev.filter((b) => b.repo_id !== repo.id));
    } else {
      const { data } = await supabase.from('bookmarks').insert([{
        user_id: user.id,
        repo_id: repo.id,
        repo_name: repo.name,
        repo_desc: repo.desc || '',
      }]).select();
      if (data) setBookmarks((prev) => [...prev, data[0]]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hka_user');
    setUser(null);
    setBookmarks([]);
  };

  return { user, bookmarks, toggleBookmark, handleLogout };
}