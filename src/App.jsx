import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from './context/AuthContext';
import { useUI } from './context/UIContext';
import HomePage from './pages/HomePage.jsx';
import CommunityForum from './Components/CommunityForum.jsx';
import SavedDashboard from './Components/SavedDashboard.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProjectModal from './Components/ProjectModal.jsx';
import NavModals from './Components/NavModals.jsx';
import SupportModal from './Components/SupportModal.jsx';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

/** Khôi phục thanh cuộn, về đầu trang và refresh ScrollTrigger khi đổi trang */
function ScrollCleanup() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Không kill ScrollTrigger ở đây: HeroParallax tự dọn bằng ctx.revert() khi unmount.
    // (kill-all ở đây chạy sau useLayoutEffect của HeroParallax nên phá luôn hiệu ứng frame)
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('height');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    ScrollTrigger.refresh();
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
  const { modalType, closeModal, selectedProject } = useUI();

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

      {/* QUẢN LÝ TẤT CẢ MODAL TẠI TẦNG CAO NHẤT (APP ROOT) */}
      {selectedProject && <ProjectModal />}
      {modalType === 'support' && <SupportModal onClose={closeModal} />}
      {modalType && modalType !== 'support' && <NavModals />}
    </>
  );
}