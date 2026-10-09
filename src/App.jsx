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

/** Dọn sạch GSAP ScrollTrigger, pin-spacer và khôi phục thanh cuộn khi đổi trang */
function ScrollCleanup() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Dọn dẹp triệt để pin-spacer và trigger của GSAP
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true));
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('height');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

/** Protected route: chưa đăng nhập thì đẩy về trang chủ và mở modal đăng nhập */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace state={{ requireLogin: true }} />;
  return children;
}

export default function App() {
  return (
    <>
      <ScrollCleanup />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/community" element={<CommunityForum />} />

        {/* /accountscenter/:section */}
        <Route
          path="/accountscenter/:section?"
          element={
            <RequireAuth>
              <SavedDashboard />
            </RequireAuth>
          }
        />

        {/* Các route cũ chuyển hướng sang Accounts Center */}
        <Route path="/profiles" element={<Navigate to="/accountscenter/profiles" replace />} />
        <Route path="/saved" element={<Navigate to="/accountscenter/saved" replace />} />
        <Route path="/history" element={<Navigate to="/accountscenter/history" replace />} />

        {/* Trang 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}