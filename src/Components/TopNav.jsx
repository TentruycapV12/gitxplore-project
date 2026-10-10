import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import { scrollToId } from '../lib/scroll';
import './TopNav.css';

const Svg = ({ children }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  home: <Svg><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Svg>,
  news: <Svg><rect x="3" y="4" width="14" height="16" rx="2" /><path d="M17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2M7 8h6M7 12h6M7 16h4" /></Svg>,
  community: <Svg><circle cx="9" cy="8" r="3.2" /><path d="M2.8 20c.4-3.4 3-5.5 6.2-5.5s5.8 2.1 6.2 5.5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.6c2.6.1 4.4 1.8 4.7 4.4" /></Svg>,
  about: <Svg><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.8v.1" /></Svg>,
  support: <Svg><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" /></Svg>,
  search: <Svg><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.8-3.8" /></Svg>,
  grid: <Svg><circle cx="6" cy="6" r="1.4" /><circle cx="12" cy="6" r="1.4" /><circle cx="18" cy="6" r="1.4" /><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /><circle cx="6" cy="18" r="1.4" /><circle cx="12" cy="18" r="1.4" /><circle cx="18" cy="18" r="1.4" /></Svg>,
  bell: <Svg><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4" /></Svg>,
  bookmark: <Svg><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></Svg>,
};

// Các tab giữa. `to` = chuyển trang, `scroll` = cuộn tới mục, `modal` = mở popup.
const TABS = [
  { id: 'home', label: 'Trang chủ', to: '/' },
  { id: 'news', label: 'Tin tức', to: '/news' },
  { id: 'community', label: 'Cộng đồng', to: '/community' },
  { id: 'about', label: 'Giới thiệu', scroll: 'about' },
  { id: 'support', label: 'Hỗ trợ', modal: 'support' },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const { openModal } = useUI();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'apps' | 'user' | null
  const rootRef = useRef(null);

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
    pathname.startsWith('/news') ? 'news' :
    pathname.startsWith('/community') ? 'community' :
    pathname === '/' ? 'home' : null;

  const tabLabel = {
    home: t('ui_home'), news: t('news'), community: t('community'), about: t('about'), support: t('support'),
  };

  const onTab = (tab) => {
    setMenu(null);
    if (tab.to) navigate(tab.to);
    else if (tab.scroll) scrollToId(tab.scroll);
    else if (tab.modal) openModal(tab.modal);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/?q=${encodeURIComponent(q)}`);
    setTimeout(() => scrollToId('explore'), 80);
  };

  const go = (path) => { setMenu(null); navigate(path); };

  return (
    <header className="tn" ref={rootRef}>
      {/* ===== TRÁI: logo + tìm kiếm ===== */}
      <div className="tn-left">
        <button type="button" className="tn-logo" onClick={() => go('/')} aria-label={`NOTOSAN - ${t('ui_home')}`}>
          <span className="tn-logo-mark">N</span>
          <span className="tn-logo-text">NOTOSAN</span>
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
                <button type="button" onClick={() => go('/news')}>{ICONS.news}<span>{t('news')}</span></button>
                <button type="button" onClick={() => go('/community')}>{ICONS.community}<span>{t('community')}</span></button>
                <button type="button" onClick={() => go('/accountscenter/saved')}>{ICONS.bookmark}<span>{t('saved_repos')}</span></button>
                <button type="button" onClick={() => { setMenu(null); openModal('support'); }}>{ICONS.support}<span>{t('support')}</span></button>
              </div>
            </div>
          )}
        </div>

        {user && (
          <button type="button" className="tn-circle tn-bell" onClick={() => go('/community')} aria-label={t('ui_notifications')}>
            {ICONS.bell}
            <i className="tn-badge" />
          </button>
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
                    <strong>{user.name}</strong>
                    <small>{user.identifier}</small>
                  </span>
                </button>
                <hr />
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
    </header>
  );
}