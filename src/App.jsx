import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage.jsx';
import CommunityForum from './Components/CommunityForum.jsx';
import SavedDashboard from './Components/SavedDashboard.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

/** Mỗi lần đổi trang (pathname) thì cuộn về đầu. Đổi query (?q=...) thì không. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

/** Protected route (slide 14): chưa đăng nhập thì <Navigate> về trang chủ và mở form đăng nhập. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace state={{ requireLogin: true }} />;
  return children;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/community" element={<CommunityForum />} />

        {/* /accountscenter/:section — mục menu nằm trên URL, không cần tự pushState */}
        <Route
          path="/accountscenter/:section?"
          element={
            <RequireAuth>
              <SavedDashboard />
            </RequireAuth>
          }
        />

        {/* Các URL cũ vẫn dùng được nhờ <Navigate> */}
        <Route path="/profiles" element={<Navigate to="/accountscenter/profiles" replace />} />
        <Route path="/saved" element={<Navigate to="/accountscenter/saved" replace />} />
        <Route path="/history" element={<Navigate to="/accountscenter/history" replace />} />

        {/* Catch-all (slide 10-11) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
