import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
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
    label: 'Lối tắt',
    icon: <Icon><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Icon>,
  },
  {
    id: 'saved',
    label: 'Repo đã lưu',
    icon: <Icon><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" /></Icon>,
  },
  {
    id: 'notes',
    label: 'Ghi chú nhanh',
    icon: <Icon><path d="M4 4h16v12l-4 4H4V4z" /><path d="M16 20v-4h4M8 9h8M8 13h5" /></Icon>,
  },
];

function LinksPane({ go, openSupport }) {
  const { user } = useAuth();
  const items = [
    { label: 'Tin tức', desc: 'Tin mới về mã nguồn mở', onClick: () => go('/news') },
    { label: 'Cộng đồng', desc: 'Thảo luận, hỏi đáp, chia sẻ', onClick: () => go('/community') },
    {
      label: 'Trung tâm tài khoản',
      desc: user ? 'Repo đã lưu, hồ sơ, lịch sử' : 'Đăng nhập để sử dụng',
      onClick: () => go('/accountscenter/saved'),
    },
    { label: 'Hỗ trợ', desc: 'Câu hỏi thường gặp, gửi yêu cầu', onClick: openSupport },
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
  const { selectProject } = useUI();
  const { bookmarks } = useBookmarks();

  if (!user) {
    return <p className="qd-empty">Đăng nhập để xem các repo bạn đã lưu.</p>;
  }
  if (!bookmarks.length) {
    return <p className="qd-empty">Bạn chưa lưu repo nào. Mở một dự án và bấm “Lưu Repo”.</p>;
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
        placeholder="Ghi lại ý tưởng, tên repo muốn xem sau…"
        aria-label="Ghi chú nhanh"
      />
      <p className="qd-hint">Tự động lưu trên trình duyệt này.</p>
    </div>
  );
}

export default function QuickDock() {
  const navigate = useNavigate();
  const { openModal, modalType, selectedProject } = useUI();
  const [active, setActive] = useState(null); // null = đóng
  const panelRef = useRef(null);

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
      if (!e.target.closest?.('.qd-root')) setActive(null);
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

  return (
    <div className="qd-root">
      {current && (
        <aside className="qd-panel" ref={panelRef} role="dialog" aria-label={current.label}>
          <header className="qd-head">
            <h2 className="qd-title">{current.label}</h2>
            <button type="button" className="qd-close" onClick={() => setActive(null)} aria-label="Đóng">
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

      <nav className="qd-rail" aria-label="Thanh tiện ích">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="qd-tab"
            aria-pressed={active === t.id}
            aria-label={t.label}
            title={t.label}
            onClick={() => setActive((a) => (a === t.id ? null : t.id))}
          >
            {t.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}