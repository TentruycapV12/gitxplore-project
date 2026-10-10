import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { openSourceProjects } from '../data/projectsData';
import './QuickDock.css';

const NOTES_KEY = 'gx_quick_notes';

const Icon = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TABS = [
  {
    id: 'links',
    labelKey: 'ui_shortcuts',
    icon: <Icon><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Icon>,
  },
  {
    id: 'saved',
    labelKey: 'saved_repos',
    icon: <Icon><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" /></Icon>,
  },
  {
    id: 'notes',
    labelKey: 'ui_dock_notes',
    icon: <Icon><path d="M4 4h16v12l-4 4H4V4z" /><path d="M16 20v-4h4M8 9h8M8 13h5" /></Icon>,
  },
];

function LinksPane({ go, openSupport }) {
  const { user } = useAuth();
  const { t: tr } = useLanguage();
  const items = [
    { label: tr('news'), desc: tr('ui_dock_news_desc'), onClick: () => go('/news') },
    { label: tr('community'), desc: tr('ui_dock_comm_desc'), onClick: () => go('/community') },
    {
      label: tr('acc_title'),
      desc: user ? tr('ui_dock_acc_in') : tr('ui_dock_acc_out'),
      onClick: () => go('/accountscenter/saved'),
    },
    { label: tr('support'), desc: tr('ui_dock_support_desc'), onClick: openSupport },
  ];
  return (
    <ul className="qd-list">
      {items.map((it) => (
        <li key={it.label}>
          <button type="button" className="qd-row" onClick={it.onClick}>
            <span className="qd-row-title">{it.label}</span>
            <span className="qd-row-desc">{it.desc}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SavedPane({ go }) {
  const { user } = useAuth();
  const { t: tr } = useLanguage();
  const { selectProject } = useUI();
  const { bookmarks } = useBookmarks();

  if (!user) {
    return <p className="qd-empty">{tr('ui_dock_saved_login')}</p>;
  }
  if (!bookmarks.length) {
    return <p className="qd-empty">{tr('ui_dock_saved_empty')}</p>;
  }

  const open = (b) => {
    const project = openSourceProjects.find((p) => p.id === b.repo_id);
    if (project) selectProject(project);
    else go('/accountscenter/saved');
  };

  return (
    <ul className="qd-list">
      {bookmarks.map((b) => (
        <li key={b.repo_id}>
          <button type="button" className="qd-row" onClick={() => open(b)}>
            <span className="qd-row-title">{b.repo_name}</span>
            {b.repo_desc && <span className="qd-row-desc qd-clamp">{b.repo_desc}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function NotesPane() {
  const { t: tr } = useLanguage();
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(NOTES_KEY) || ''; } catch { return ''; }
  });

  const onChange = (e) => {
    const v = e.target.value;
    setText(v);
    try { localStorage.setItem(NOTES_KEY, v); } catch { /* bị chặn (private mode) */ }
  };

  return (
    <div className="qd-notes">
      <textarea
        className="qd-textarea"
        value={text}
        onChange={onChange}
        maxLength={5000}
        placeholder={tr('ui_dock_notes_ph')}
        aria-label={tr('ui_dock_notes')}
      />
      <p className="qd-hint">{tr('ui_dock_notes_hint')}</p>
    </div>
  );
}

export default function QuickDock() {
  const navigate = useNavigate();
  useLocation(); // đổi trang thì tìm lại chỗ gắn thanh tiện ích
  const { t: tr } = useLanguage();
  const { openModal, modalType, selectedProject } = useUI();
  const [active, setActive] = useState(null); // null = đóng
  const [slot, setSlot] = useState(null); // ô #qd-slot trong thanh trên cùng (nếu trang có)
  const panelRef = useRef(null);

  // Trang có TopNav thì đưa thanh tiện ích lên cùng hàng với thanh đó; trang khác giữ thanh nổi bên phải.
  useLayoutEffect(() => {
    setSlot(document.getElementById('qd-slot'));
  });

  const current = TABS.find((t) => t.id === active);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onDown = (e) => {
      if (!e.target.closest?.('.qd-root, .qd-rail')) setActive(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [active]);

  if (modalType || selectedProject) return null;

  const go = (path) => {
    setActive(null);
    navigate(path);
  };
  const openSupport = () => {
    setActive(null);
    openModal('support');
  };

  const rail = (
    <nav className={`qd-rail ${slot ? 'qd-rail--inline' : ''}`} aria-label={tr('ui_dock_rail')}>
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="qd-tab"
          aria-pressed={active === t.id}
          aria-label={tr(t.labelKey)}
          title={tr(t.labelKey)}
          onClick={() => setActive((a) => (a === t.id ? null : t.id))}
        >
          {t.icon}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <div className="qd-root">
        {current && (
          <aside className={`qd-panel ${slot ? 'qd-panel--top' : ''}`} ref={panelRef} role="dialog" aria-label={tr(current.labelKey)}>
            <header className="qd-head">
              <h2 className="qd-title">{tr(current.labelKey)}</h2>
              <button type="button" className="qd-close" onClick={() => setActive(null)} aria-label={tr('ui_close')}>
                <Icon><path d="M6 6l12 12M18 6L6 18" /></Icon>
              </button>
            </header>
            <div className="qd-body">
              {active === 'links' && <LinksPane go={go} openSupport={openSupport} />}
              {active === 'saved' && <SavedPane go={go} />}
              {active === 'notes' && <NotesPane />}
            </div>
          </aside>
        )}
        {!slot && rail}
      </div>
      {slot && createPortal(rail, slot)}
    </>
  );
}
