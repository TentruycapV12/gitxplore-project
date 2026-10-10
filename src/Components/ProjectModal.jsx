import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProjectModal() {
  const { selectedProject: project, closeProject: closeProjectModal } = useUI();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  // Huỷ timer nếu modal đóng trước khi hết 2s (tránh setState sau khi unmount).
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Đóng modal bằng phím Esc; cleanup gỡ listener khi modal đóng.
  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && closeProjectModal();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeProjectModal]);

  if (!project) return null;

  const cloneCommand = `git clone ${project.githubUrl}.git`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
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
              <span className="modal-category">{t(`cat_${project.category}`) === `cat_${project.category}` ? project.categoryName : t(`cat_${project.category}`)}</span>
              <h2 className="modal-title">{project.name}</h2>
            </div>
            <div className="modal-stats">
              <span>⭐ {project.stars} {t('pm_stars')}</span>
              <span>🍴 {project.forks} {t('pm_forks')}</span>
            </div>
          </div>

          <p className="modal-desc">{project.description}</p>

          <div className="clone-box">
            <code>{cloneCommand}</code>
            <button onClick={handleCopy} className="btn-copy">
              {copied ? t('pm_copied') : t('pm_copy')}
            </button>
          </div>

          <div className="modal-footer-btns">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="link-btn btn-secondary">
                {t('pm_demo')}
              </a>
            )}
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="link-btn btn-primary">
              {t('pm_open')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}