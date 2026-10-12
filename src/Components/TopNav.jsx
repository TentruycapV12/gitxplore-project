import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationDropdown from './NotificationDropdown.jsx';
import WelcomeOnboardingModal from './WelcomeOnboardingModal.jsx';
import { useNotifications } from '../hooks/useNotifications';
import './TopNav.css';

const Svg = ({ children }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  home: <Svg><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Svg>,
  vibe: <Svg><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" /><path d="M5 3v4M3 5h4M19 17v4M17 19h4" /></Svg>,
  news: <Svg><rect x="3" y="4" width="14" height="16" rx="2" /><path d="M17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2M7 8h6M7 12h6M7 16h4" /></Svg>,
  community: <Svg><circle cx="9" cy="8" r="3.2" /><path d="M2.8 20c.4-3.4 3-5.5 6.2-5.5s5.8 2.1 6.2 5.5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.6c2.6.1 4.4 1.8 4.7 4.4" /></Svg>,
  forum: <Svg><path d="M4 5h16v11H9l-5 4z" /></Svg>,
  support: <Svg><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" /></Svg>,
  search: <Svg><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.8-3.8" /></Svg>,
  market: <Svg><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></Svg>,
  grid: <Svg><circle cx="6" cy="6" r="1.4" /><circle cx="12" cy="6" r="1.4" /><circle cx="18" cy="6" r="1.4" /><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /><circle cx="6" cy="18" r="1.4" /><circle cx="12" cy="18" r="1.4" /><circle cx="18" cy="18" r="1.4" /></Svg>,
  bell: <Svg><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4" /></Svg>,
  bookmark: <Svg><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></Svg>,
};

// Các tab giữa. `to` = chuyển trang, `modal` = mở popup.
const TABS = [
  { id: 'home', label: 'Trang chủ', to: '/' },
  { id: 'market', label: 'Chợ Công Nghệ', to: '/market' },
  { id: 'vibe', label: 'Vibe', to: '/vibe' },
  { id: 'news', label: 'Tin tức', to: '/news' },
  { id: 'community', label: 'Cộng đồng', to: '/community' },
  { id: 'forum', label: 'Diễn đàn', to: '/forum' },
  { id: 'support', label: 'Hỗ trợ', modal: 'support' },
];

const FORUM_LABEL = {
  vi: 'Diễn đàn', en: 'Forum', ja: 'フォーラム', zh: '论坛', ko: '포럼',
  fr: 'Forum', de: 'Forum', es: 'Foro', ru: 'Форум', pt: 'Fórum',
};

const MARKET_LABEL = {
  vi: 'Chợ Công Nghệ', en: 'Tech Market', ja: 'テック市場', zh: '科技集市', ko: '테크 마켓',
  fr: 'Marché Tech', de: 'Tech-Markt', es: 'Mercado Tech', ru: 'Тех-Рынок', pt: 'Mercado Tech',
};

export default function TopNav() {
  const { user, logout } = useAuth();
  const { openModal, openPlayground, openCompare } = useUI();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  // Trên trang /search thì ô tìm kiếm hiện đúng từ khóa đang tìm.
  const [query, setQuery] = useState(() => (pathname === '/search' ? new URLSearchParams(search).get('q') || '' : ''));
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'apps' | 'user' | 'notif' | null
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { unreadCount } = useNotifications();
  const rootRef = useRef(null);

  // Tự động hiển thị hướng dẫn lần đầu đăng nhập
  useEffect(() => {
    if (user?.identifier && !localStorage.getItem(`gx_onboard_done_${user.identifier}`)) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    if (pathname === '/search') setQuery(new URLSearchParams(search).get('q') || '');
  }, [pathname, search]);

  // Đóng dropdown khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setMenu(null); };
    const onKey = (e) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const activeId =
    pathname.startsWith('/market') ? 'market' :
    pathname.startsWith('/vibe') ? 'vibe' :
    pathname.startsWith('/news') ? 'news' :
    pathname.startsWith('/forum') ? 'forum' :
    pathname.startsWith('/community') ? 'community' :
    pathname === '/' ? 'home' : null;

  const tabLabel = {
    home: t('ui_home'), market: MARKET_LABEL[lang] || MARKET_LABEL.en, vibe: t('vibe_nav') || 'Vibe Coding', news: t('news'), community: t('community'),
    forum: FORUM_LABEL[lang] || FORUM_LABEL.en, support: t('support'),
  };

  const onTab = (tab) => {
    setMenu(null);
    if (tab.to) navigate(tab.to);
    else if (tab.modal) openModal(tab.modal);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const go = (path) => { setMenu(null); navigate(path); };

  return (
    <header className="tn" ref={rootRef}>
      {/* ===== TRÁI: logo + tìm kiếm ===== */}
      <div className="tn-left">
        <button type="button" className="tn-logo" onClick={() => go('/')} aria-label={`GitXplore - ${t('ui_home')}`}>
          <span className="tn-logo-mark">⚡</span>
          <span className="tn-logo-text">GitXplore</span>
          <span className="tn-logo-pill">VIBE</span>
        </button>

        <form className={`tn-search ${searchOpen ? 'is-open' : ''}`} onSubmit={onSearch} role="search">
          <button
            type="button"
            className="tn-search-icon"
            aria-label={t('search_placeholder')}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {ICONS.search}
          </button>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            aria-label={t('search_placeholder')}
          />
        </form>
      </div>

      {/* ===== GIỮA: tab icon ===== */}
      <nav className="tn-tabs" aria-label={t('ui_main_nav')}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tn-tab ${activeId === tab.id ? 'is-active' : ''}`}
            onClick={() => onTab(tab)}
            aria-label={tabLabel[tab.id]}
            aria-current={activeId === tab.id ? 'page' : undefined}
          >
            {ICONS[tab.id]}
            <span className="tn-tip">{tabLabel[tab.id]}</span>
          </button>
        ))}
      </nav>

      {/* ===== PHẢI: nút tròn + avatar ===== */}
      <div className="tn-right">
        {/* Universal ⌘K Search Pill */}
        <button
          type="button"
          className="tn-search-pill"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          title="Tìm kiếm nhanh toàn cầu (Ctrl+K)"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '999px',
            padding: '6px 14px',
            color: '#d1d5db',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <span>🔍</span>
          <span style={{ opacity: 0.85 }}>Tìm kiếm...</span>
          <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#fef08a' }}>⌘K</kbd>
        </button>

        {/* Quick Vibe Sandbox Pill */}
        <button
          type="button"
          onClick={() => openPlayground()}
          title="Vibe Coding Playground - Thử code 1-chạm"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '999px',
            padding: '6px 12px',
            color: '#fef08a',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>⚡</span>
          <span>Sandbox</span>
        </button>

        <div className="tn-wrap">
          <button
            type="button"
            className={`tn-circle ${menu === 'apps' ? 'is-on' : ''}`}
            onClick={() => setMenu(menu === 'apps' ? null : 'apps')}
            aria-label={t('ui_shortcuts')}
            aria-expanded={menu === 'apps'}
          >
            {ICONS.grid}
          </button>

          {menu === 'apps' && (
            <div className="tn-pop tn-apps" role="menu">
              <p className="tn-pop-title">{t('ui_shortcuts')}</p>
              <div className="tn-apps-grid">
                <button type="button" onClick={() => { setMenu(null); openPlayground(); }}>
                  <span style={{ fontSize: '18px' }}>⚡</span><span>Vibe Sandbox</span>
                </button>
                <button type="button" onClick={() => { setMenu(null); openCompare(); }}>
                  <span style={{ fontSize: '18px' }}>⚖️</span><span>So sánh Repo</span>
                </button>
                <button type="button" onClick={() => go('/market')}>
                  <span style={{ fontSize: '18px' }}>🛒</span><span>{MARKET_LABEL[lang] || MARKET_LABEL.en}</span>
                </button>
                <button type="button" onClick={() => go('/vibe')}>{ICONS.vibe}<span>{t('vibe_nav') || 'Vibe Coding'}</span></button>
                <button type="button" onClick={() => go('/news')}>{ICONS.news}<span>{t('news')}</span></button>
                <button type="button" onClick={() => go('/community')}>{ICONS.community}<span>{t('community')}</span></button>
                <button type="button" onClick={() => go('/accountscenter/saved')}>{ICONS.bookmark}<span>{t('saved_repos')}</span></button>
                <button type="button" onClick={() => { setMenu(null); openModal('support'); }}>{ICONS.support}<span>{t('support')}</span></button>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="tn-wrap">
            <button
              type="button"
              className={`tn-circle tn-bell ${menu === 'notif' ? 'is-on' : ''}`}
              onClick={() => setMenu(menu === 'notif' ? null : 'notif')}
              aria-label={t('ui_notifications')}
              aria-expanded={menu === 'notif'}
              title="Thông báo"
            >
              {ICONS.bell}
              {unreadCount > 0 && (
                <span className="tn-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {menu === 'notif' && (
              <NotificationDropdown onClose={() => setMenu(null)} />
            )}
          </div>
        )}

        {!user ? (
          <>
            <button type="button" className="tn-btn tn-btn--ghost" onClick={() => openModal('signin')}>{t('signin')}</button>
            <button type="button" className="tn-btn tn-btn--solid" onClick={() => openModal('register')}>{t('register')}</button>
          </>
        ) : (
          <div className="tn-wrap">
            <button
              type="button"
              className="tn-avatar"
              onClick={() => setMenu(menu === 'user' ? null : 'user')}
              aria-label={t('ui_account')}
              aria-expanded={menu === 'user'}
            >
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" />
                : <span>{user.avatarChar}</span>}
              <i className="tn-caret" aria-hidden="true">
                <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </i>
            </button>

            {menu === 'user' && (
              <div className="tn-pop tn-user" role="menu">
                <button type="button" className="tn-user-card" onClick={() => go('/accountscenter/profiles')}>
                  <span className="tn-user-av">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.avatarChar}
                  </span>
                  <span className="tn-user-info">
                    <strong>{user.name}{user.publicId && <span className="tn-uid">#{user.publicId}</span>}</strong>
                    <small>{user.identifier}</small>
                  </span>
                </button>
                <hr />
                <button type="button" className="tn-item" onClick={() => { setMenu(null); setShowOnboarding(true); }}>💡 {t('ui_onboarding_guide')}</button>
                <button type="button" className="tn-item" onClick={() => go('/accountscenter/profiles')}>{t('profile_details')}</button>
                <button type="button" className="tn-item" onClick={() => go('/accountscenter/saved')}>{t('saved_repos')}</button>
                <button type="button" className="tn-item" onClick={() => go('/accountscenter/history')}>{t('history')}</button>
                <button type="button" className="tn-item" onClick={() => go('/accountscenter/language')}>{t('language')}</button>
                <hr />
                <button type="button" className="tn-item tn-item--danger" onClick={() => { setMenu(null); logout(); }}>{t('signout')}</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showOnboarding && <WelcomeOnboardingModal onClose={() => setShowOnboarding(false)} />}
    </header>
  );
}
