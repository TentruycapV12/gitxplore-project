import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from './context/AuthContext';
import { useUI } from './context/UIContext';
import HomePage from './pages/HomePage.jsx';
import CommunityForum from './Components/CommunityForum.jsx';
import CommunityHub from './Components/CommunityHub.jsx';
import SavedDashboard from './Components/SavedDashboard.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ProjectModal from './Components/ProjectModal.jsx';
import NavModals from './Components/NavModals.jsx';
import SupportModal from './Components/SupportModal.jsx';
import QuickDock from './Components/QuickDock.jsx';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

/** Mỗi lần đổi trang (pathname) thì cuộn về đầu. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}

/** Link cũ /community/forum?thread=... chuyển sang /forum, giữ nguyên phần ?thread=. */
function ForumRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/forum${search}`} replace />;
}

/** Protected route: chưa đăng nhập thì đẩy về trang chủ và mở form đăng nhập. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace state={{ requireLogin: true }} />;
  return children;
}

export default function App() {
  const { modalType, closeModal, selectedProject } = useUI();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Trang Cộng đồng mới (sidebar + ngôn ngữ) */}
        <Route path="/community" element={<CommunityHub />} />
        {/* Diễn đàn nằm ở /forum. Link cũ /community/forum chuyển sang đây (đặt TRƯỚC :section để không bị nuốt) */}
        <Route path="/forum" element={<CommunityForum />} />
        <Route path="/community/forum" element={<ForumRedirect />} />
        <Route path="/community/:section" element={<CommunityHub />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* /accountscenter/:section */}
        <Route
          path="/accountscenter/:section?"
          element={
            <RequireAuth>
              <SavedDashboard />
            </RequireAuth>
          }
        />

        <Route path="/profiles" element={<Navigate to="/accountscenter/profiles" replace />} />
        <Route path="/saved" element={<Navigate to="/accountscenter/saved" replace />} />
        <Route path="/history" element={<Navigate to="/accountscenter/history" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* TẤT CẢ CÁC MODAL ĐƯỢC QUẢN LÝ Ở ĐÂY */}
      {selectedProject && <ProjectModal />}
      {modalType === 'support' && <SupportModal onClose={closeModal} />}
      {modalType && modalType !== 'support' && <NavModals />}

      {/* Thanh tiện ích bên phải (cửa sổ lối tắt) */}
      <QuickDock />
    </>
  );
}
