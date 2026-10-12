import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VibeFeaturedBanner from './VibeFeaturedBanner.jsx';
import MarketplaceFeaturedBanner from './MarketplaceFeaturedBanner.jsx';

export default function HomeHubSpotlight() {
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'vibe'
  const { lang } = useLanguage();
  const isVi = lang === 'vi';

  return (
    <div className="home-spotlight-wrapper" style={{ marginBottom: '28px' }}>
      {/* Switcher Tab Dock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: '0 auto 16px',
          padding: '6px',
          background: 'rgba(14, 19, 31, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '999px',
          maxWidth: '440px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('market')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: activeTab === 'market' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
            background: activeTab === 'market' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.2))' : 'transparent',
            color: activeTab === 'market' ? '#fef08a' : '#94a3b8',
          }}
        >
          <span>🛒</span>
          <span>{isVi ? 'Sàn Chợ Công Nghệ' : 'Tech Marketplace'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vibe')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: activeTab === 'vibe' ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent',
            background: activeTab === 'vibe' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.2))' : 'transparent',
            color: activeTab === 'vibe' ? '#38bdf8' : '#94a3b8',
          }}
        >
          <span>⚡</span>
          <span>Vibe Coding Hub</span>
        </button>
      </div>

      {/* Render Active Banner */}
      {activeTab === 'market' ? <MarketplaceFeaturedBanner /> : <VibeFeaturedBanner />}
    </div>
  );
}
