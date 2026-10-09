import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLenis } from '../hooks/useLenis';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { useUI } from '../context/UIContext';
import HeroParallax from '../Components/HeroParallax.jsx';
import Component1 from '../Components/Component1.jsx';
import Component2 from '../Components/Component2.jsx';
import SubNavBar from '../Components/SubNavBar.jsx';
import About from '../Components/About.jsx';
import Footer from '../Components/Footer.jsx';
import ProjectModal from '../Components/ProjectModal.jsx';
import NavModals from '../Components/NavModals.jsx';

export default function HomePage() {
  useLenis();

  const { projects } = useProjectFilters();
  const { selectedProject, modalType, selectProject, openModal } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.requireLogin) {
      openModal('signin');
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location, navigate, openModal]);

  return (
    <>
      <HeroParallax />

      <main className="lusion-container" id="explore">
        <Component1 />

        <section className="projects-grid">
          {projects.map((project) => (
            <Component2 key={project.id} project={project} onSelect={selectProject} />
          ))}
        </section>
      </main>

      <About />
      <SubNavBar />
      <Footer />

      {selectedProject && <ProjectModal />}
      {modalType && <NavModals />}
    </>
  );
}