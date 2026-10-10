import { memo, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Ảnh nền công nghệ dự phòng khi link gốc bị lỗi
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

function Component2({ project, onSelect }) {
  const { t } = useLanguage();
  const catLabel = t(`cat_${project.category}`) === `cat_${project.category}` ? project.categoryName : t(`cat_${project.category}`);
  const cardRef = useRef(null);
  const handleSelect = useCallback(() => onSelect(project), [onSelect, project]);

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
      <div className="media-container" onClick={handleSelect} style={{ cursor: 'pointer' }}>
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
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        )}
        <span className="media-badge">{project.language}</span>
      </div>

      <div className="project-info">
        <div className="info-top">
          <span className="category-text">{catLabel}</span>
          <div className="stats-group">
            <span>★ {project.stars}</span>
            <span>⑂ {project.forks}</span>
          </div>
        </div>

        <h3 className="project-name" onClick={handleSelect} style={{ cursor: 'pointer' }}>
          {project.name}
        </h3>
        <p className="project-description">{project.description}</p>

        <div className="actions-row">
          <button
            onClick={handleSelect}
            className="link-btn btn-secondary"
            style={{ cursor: 'pointer' }}
          >
            {t('quick_view')}
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

// memo: card chỉ render lại khi `project` hoặc `onSelect` đổi (không render lại khi gõ ô tìm kiếm...).
export default memo(Component2);