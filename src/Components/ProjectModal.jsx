import React, { useState } from 'react';

export default function ProjectModal({ context }) {
  const { selectedProject: project, closeProjectModal } = context;
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const cloneCommand = `git clone ${project.githubUrl}.git`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={closeProjectModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeProjectModal}>✕</button>

        <div className="modal-media-wrap">
          {project.mediaType === 'video' ? (
            <video src={project.mediaUrl} autoPlay loop muted playsInline className="modal-media" />
          ) : (
            <img src={project.mediaUrl} alt={project.name} className="modal-media" />
          )}
        </div>

        <div className="modal-body">
          <div className="modal-header">
            <div>
              <span className="modal-category">{project.categoryName}</span>
              <h2 className="modal-title">{project.name}</h2>
            </div>
            <div className="modal-stats">
              <span>⭐ {project.stars} Stars</span>
              <span>🍴 {project.forks} Forks</span>
            </div>
          </div>

          <p className="modal-desc">{project.description}</p>

          <div className="clone-box">
            <code>{cloneCommand}</code>
            <button onClick={handleCopy} className="btn-copy">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          <div className="modal-footer-btns">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="link-btn btn-secondary">
                Live Demonstration ↗
              </a>
            )}
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="link-btn btn-primary">
              Open on GitHub ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}