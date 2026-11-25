import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLenis } from '../hooks/useLenis';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { useUI } from '../context/UIContext';
import HeroSection from '../Components/HeroSection.jsx';
import BeginnerQuickStart from '../Components/BeginnerQuickStart.jsx';
import HomeHubSpotlight from '../Components/HomeHubSpotlight.jsx';
import ProjectFilterBar from '../Components/ProjectFilterBar.jsx';
import ProjectCard from '../Components/ProjectCard.jsx';
import About from '../Components/About.jsx';
import Footer from '../Components/Footer.jsx';

export default function HomePage() {
  useLenis();

  const { projects } = useProjectFilters();
  const { selectProject, openModal } = useUI();
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
      <HeroSection />
      <BeginnerQuickStart />

      <main className="lusion-container" id="explore">
        <HomeHubSpotlight />
        <ProjectFilterBar />

        <section className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onSelect={selectProject} />
          ))}
        </section>
      </main>

      <About />
      <Footer />
    </>
  );
}
