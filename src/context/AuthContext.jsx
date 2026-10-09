import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { supabase } from '../supabaseClient';

/**
 * AuthContext = Context API + useReducer (bài 7).
 * Là NƠI DUY NHẤT giữ thông tin người dùng + đồng bộ với Supabase,
 * thay cho việc App.jsx và useAuthUser.js cùng lặp một đoạn logic.
 */

const STORAGE_KEY = 'hka_user';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function mapSupabaseUser(u) {
  return {
    id: u.id,
    name: u.user_metadata?.full_name || u.user_metadata?.user_name || u.email?.split('@')[0],
    identifier: u.email,
    avatarChar: (u.email || 'U').charAt(0).toUpperCase(),
    avatarUrl: u.user_metadata?.avatar_url || null,
    provider: u.app_metadata?.provider || 'OAuth',
  };
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { user: action.payload };
    case 'UPDATE_USER':
      return state.user ? { user: { ...state.user, ...action.payload } } : state;
    case 'CLEAR_USER':
      return { user: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, undefined, () => ({
    user: readStoredUser(),
  }));

  // Lưu localStorage ở đúng một chỗ: mỗi khi user đổi.
  useEffect(() => {
    try {
      if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage có thể bị chặn (private mode) */
    }
  }, [state.user]);

  // Lắng nghe Supabase auth, có cleanup khi unmount (bài 5-6, useEffect + cleanup).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: mapSupabaseUser(session.user) });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'CLEAR_USER' });
      }
      // INITIAL_SESSION không có session: giữ nguyên user "Local" đã lưu.
    });

    return () => subscription?.unsubscribe();
  }, []);

  const setUser = useCallback((user) => dispatch({ type: 'SET_USER', payload: user }), []);
  const updateUser = useCallback((patch) => dispatch({ type: 'UPDATE_USER', payload: patch }), []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  // useMemo: chỉ tạo object mới khi user đổi → consumer không re-render thừa.
  const value = useMemo(
    () => ({ user: state.user, setUser, updateUser, logout }),
    [state.user, setUser, updateUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
