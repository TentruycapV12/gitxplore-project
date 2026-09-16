import React, { useRef } from 'react';

function Component2({ context }) {
  const { project, setSelectedProject } = context;
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  return (
    <article
      className="project-card"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="media-container" onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer' }}>
        {project.mediaType === 'video' ? (
          <video
            src={project.mediaUrl}
            className="media-asset"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={project.mediaUrl}
            alt={project.name}
            className="media-asset"
            loading="lazy"
          />
        )}
        <span className="media-badge">{project.language}</span>
      </div>

      <div className="project-info">
        <div className="info-top">
          <span className="category-text">{project.categoryName}</span>
          <div className="stats-group">
            <span>★ {project.stars}</span>
            <span>⑂ {project.forks}</span>
          </div>
        </div>

        <h3 className="project-name" onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer' }}>
          {project.name}
        </h3>
        <p className="project-description">{project.description}</p>

        <div className="actions-row">
          <button
            onClick={() => setSelectedProject(project)}
            className="link-btn btn-secondary"
            style={{ cursor: 'pointer' }}
          >
            Quick View 👁
          </button>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="link-btn btn-primary"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </article>
  );
}

export default Component2;