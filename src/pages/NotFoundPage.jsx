import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: '#0a0606',
        color: '#fef3c7',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '64px', margin: 0 }}>404</h1>
      <p style={{ opacity: 0.8 }}>{t('nf_text')}</p>
      <Link to="/" className="link-btn btn-primary">
        {t('nf_home')}
      </Link>
    </div>
  );
}