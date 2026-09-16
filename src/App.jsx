import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { supabase } from './supabaseClient';
import { openSourceProjects } from './data/projectsData';
import HeroParallax from './Components/HeroParallax.jsx';
import Component1 from './Components/Component1.jsx';
import Component2 from './Components/Component2.jsx';
import SubNavBar from './Components/SubNavBar.jsx';
import Footer from './Components/Footer.jsx';
import ProjectModal from './Components/ProjectModal.jsx';
import NavModals from './Components/NavModals.jsx';
import CommunityForum from './Components/CommunityForum.jsx';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' hoặc 'community'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [navModal, setNavModal] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hka_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const userData = {
          name: u.user_metadata?.full_name || u.user_metadata?.user_name || u.email?.split('@')[0],
          identifier: u.email,
          avatarChar: (u.email || 'U').charAt(0).toUpperCase(),
          avatarUrl: u.user_metadata?.avatar_url || null,
          provider: u.app_metadata?.provider || 'OAuth',
        };
        localStorage.setItem('hka_user', JSON.stringify(userData));
        setCurrentUser(userData);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const userData = {
          name: u.user_metadata?.full_name || u.user_metadata?.user_name || u.email?.split('@')[0],
          identifier: u.email,
          avatarChar: (u.email || 'U').charAt(0).toUpperCase(),
          avatarUrl: u.user_metadata?.avatar_url || null,
          provider: u.app_metadata?.provider || 'OAuth',
        };
        localStorage.setItem('hka_user', JSON.stringify(userData));
        setCurrentUser(userData);
      } else {
        localStorage.removeItem('hka_user');
        setCurrentUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hka_user');
    setCurrentUser(null);
  };

  useEffect(() => {
    if (currentPage !== 'home') return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, [currentPage]);

  const filteredProjects = (() => {
    if (searchTerm.trim() !== '') {
      return openSourceProjects.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.language.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeCategory === 'all') {
      return openSourceProjects.slice(0, 4);
    }

    return openSourceProjects.filter((item) => item.category === activeCategory);
  })();

  const appContext = {
    user: currentUser,
    setUser: setCurrentUser,
    logout: handleLogout,
    modalType: navModal,
    setModal: setNavModal,
    closeModal: () => setNavModal(null),
    activeCategory,
    setCategory: setActiveCategory,
    searchTerm,
    setSearchTerm,
    selectedProject,
    setSelectedProject,
    closeProjectModal: () => setSelectedProject(null),
    navigate: setCurrentPage,
  };

  // NẾU ĐANG Ở TRANG COMMUNITY: HIỂN THỊ NGUYÊN TRANG RIÊNG BIỆT
  if (currentPage === 'community') {
    return (
      <CommunityForum
        context={appContext}
        onBack={() => setCurrentPage('home')}
      />
    );
  }

  // TRANG CHỦ CHÍNH
  return (
    <>
      <HeroParallax context={appContext} />

      <main className="lusion-container" id="explore">
        <Component1 context={appContext} />

        <section className="projects-grid">
          {filteredProjects.map((project) => (
            <Component2
              key={project.id}
              context={{ ...appContext, project }}
            />
          ))}
        </section>
      </main>

      <SubNavBar context={appContext} />

      <Footer />

      {appContext.selectedProject && <ProjectModal context={appContext} />}
      {appContext.modalType && <NavModals context={appContext} />}
    </>
  );
}

export default App;