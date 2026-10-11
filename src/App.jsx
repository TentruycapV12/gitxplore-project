import { useEffect, lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from './context/AuthContext';
import { useUI } from './context/UIContext';
import HomePage from './pages/HomePage.jsx';
import ProjectModal from './Components/ProjectModal.jsx';
import NavModals from './Components/NavModals.jsx';
import SupportModal from './Components/SupportModal.jsx';
import ArisuAIAssistant from './Components/ArisuAIAssistant.jsx';
import GlobalCommandPalette from './Components/GlobalCommandPalette.jsx';
import './App.css';

// TỐI ƯU HÓA TẢI TRANG ĐẦU (CODE SPLITTING): Lazy-load toàn bộ các trang phụ
const CommunityForum = lazy(() => import('./Components/CommunityForum.jsx'));
const CommunityHub = lazy(() => import('./Components/CommunityHub.jsx'));
const SavedDashboard = lazy(() => import('./Components/SavedDashboard.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const VibePage = lazy(() => import('./pages/VibePage.jsx'));

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

/** Hiệu ứng tải trang mượt mà phong cách Glassmorphism */
function RouteLoadingFallback() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080505',
      color: '#fef08a',
      gap: '16px'
    }}>
      <div style={{
        width: '42px',
        height: '42px',
        border: '3px solid rgba(245, 158, 11, 0.2)',
        borderTopColor: '#f59e0b',
        borderRadius: '50%',
        animation: 'gxSpin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', color: '#fef08a' }}>
        ⚡ GITXPLORE • ĐANG NẠP DỮ LIỆU...
      </span>
      <style>{`@keyframes gxSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const { modalType, closeModal, selectedProject } = useUI();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Trang Cộng đồng mới (sidebar + ngôn ngữ) */}
          <Route path="/community" element={<CommunityHub />} />
          {/* Diễn đàn nằm ở /forum */}
          <Route path="/forum" element={<CommunityForum />} />
          <Route path="/community/forum" element={<ForumRedirect />} />
          <Route path="/community/:section" element={<CommunityHub />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/vibe" element={<VibePage />} />
          <Route path="/vibe/:category" element={<VibePage />} />

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
      </Suspense>

      {/* TẤT CẢ CÁC MODAL ĐƯỢC QUẢN LÝ Ở ĐÂY */}
      {selectedProject && <ProjectModal />}
      {modalType === 'support' && <SupportModal onClose={closeModal} />}
      {modalType && modalType !== 'support' && <NavModals />}

      {/* Hộp lệnh tìm kiếm toàn năng ⌘K / Ctrl+K */}
      <GlobalCommandPalette />

      {/* Trợ lý AI Arisu (Blue Archive & Dev Expert) */}
      <ArisuAIAssistant />
    </>
  );
}
