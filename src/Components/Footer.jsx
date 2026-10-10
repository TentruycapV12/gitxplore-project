import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  // Giữ chữ HKA in đậm trong câu giới thiệu, bất kể ngôn ngữ nào.
  const brandParts = t('ft_brand').split('HKA');
  return (
    <footer className="custom-footer">
      <div className="footer-inner">
        {/* Cột trái: Logo & Giới thiệu */}
        <div className="footer-left">
          <div className="footer-logo">
            <span className="logo-main">HKA</span>
            <span className="logo-sub">.vn</span>
          </div>
          
          <p className="footer-text">
            {brandParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <strong>HKA</strong>}
                {part}
              </span>
            ))}
          </p>
          
          <p className="footer-text">
            {t('ft_desc')}
          </p>
        </div>

        {/* Cột phải: Bản quyền */}
        <div className="footer-right">
          <p className="footer-copyright">
            {t('ft_rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}