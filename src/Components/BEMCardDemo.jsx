import React from 'react';
import './BEMCardDemo.scss';

/**
 * Slide 10: Styling with SCSS & BEM Methodology
 * Block: bem-card
 * Elements: bem-card__header, bem-card__title, bem-card__badge, bem-card__body, bem-card__footer, bem-card__btn
 * Modifiers: bem-card--featured, bem-card__btn--primary, bem-card__btn--secondary
 */
export default function BEMCardDemo({ title = "Dự Án Demo BEM", desc = "Mô tả card tuân thủ chặt chẽ quy tắc Block-Element-Modifier", isFeatured = true }) {
  return (
    <article className={`bem-card ${isFeatured ? 'bem-card--featured' : ''}`}>
      <header className="bem-card__header">
        <h3 className="bem-card__title">{title}</h3>
        {isFeatured && <span className="bem-card__badge">BEM MODIFIER</span>}
      </header>

      <div className="bem-card__body">
        <p className="bem-card__desc">{desc}</p>
      </div>

      <footer className="bem-card__footer">
        <button type="button" className="bem-card__btn bem-card__btn--primary">
          Chi tiết
        </button>
        <button type="button" className="bem-card__btn bem-card__btn--secondary">
          Lưu lại
        </button>
      </footer>
    </article>
  );
}
