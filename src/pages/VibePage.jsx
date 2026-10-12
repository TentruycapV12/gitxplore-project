import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import TopNav from '../Components/TopNav.jsx';
import Footer from '../Components/Footer.jsx';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { VIBE_CATEGORIES, VIBE_ENGINES, VIBE_TEMPLATES } from '../data/vibeTemplatesData';
import { downloadZipBundle } from '../lib/zipExport';
import './VibePage.css';

const SAVED_STORAGE_KEY = 'gx_vibe_saved_templates';
const USER_TEMPLATES_KEY = 'gx_vibe_user_submitted';

const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  bot: 'M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7zM9 14h.01M15 14h.01',
  terminal: 'm4 17 6-6-6-6M12 19h8',
  plug: 'M12 2v6M9 4v4M15 4v4M6 8h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3zM12 16v6',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  'git-branch': 'M6 3v12M18 9a3 3 0 1 0-2.8-2M6 15a3 3 0 1 0 2.8 2M15 7.5A6.5 6.5 0 0 0 6 14',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  copy: 'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 1 2 2v4M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2H8V4z',
  check: 'M20 6 9 17l-5-5',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M18 6 6 18M6 6l12 12',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
};

// Đọc danh sách đã bookmark từ localStorage
const loadSavedIds = () => {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Đọc template do người dùng thêm từ localStorage
const loadUserTemplates = () => {
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function VibePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { openPlayground, openCompare } = useUI();

  // State
  const [category, setCategory] = useState(() => searchParams.get('cat') || 'all');
  const [selectedEngine, setSelectedEngine] = useState(() => searchParams.get('engine') || 'All Engines');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'stars' | 'downloads' | 'newest'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'

  // Saved / Bookmarks
  const [savedIds, setSavedIds] = useState(loadSavedIds);
  const [userTemplates, setUserTemplates] = useState(loadUserTemplates);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Modals
  const [inspectItem, setInspectItem] = useState(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Feedback copy state
  const [copiedId, setCopiedId] = useState(null);
  const searchInputRef = useRef(null);

  // Đồng bộ URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('cat', category);
    if (selectedEngine !== 'All Engines') params.set('engine', selectedEngine);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    setSearchParams(params, { replace: true });
  }, [category, selectedEngine, searchQuery, setSearchParams]);

  // Keyboard shortcut: / hoặc ⌘K để focus ô tìm kiếm
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Tổng hợp tất cả templates (hệ thống + người dùng gửi)
  const allTemplates = useMemo(() => {
    return [...userTemplates, ...VIBE_TEMPLATES];
  }, [userTemplates]);

  // Mẫu nổi bật (Featured picks)
  const featuredTemplates = useMemo(() => {
    return allTemplates.filter((t) => t.badge === 'Featured' || t.badge === 'Hot' || t.badge === 'Popular').slice(0, 3);
  }, [allTemplates]);

  // Bộ lọc tag phổ biến
  const allTags = useMemo(() => {
    const map = new Map();
    allTemplates.forEach((item) => {
      item.tags?.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [allTemplates]);

  // Lọc và sắp xếp
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((item) => {
      if (showSavedOnly && !savedIds.includes(item.id)) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (selectedEngine !== 'All Engines' && !item.compatibility.includes(selectedEngine)) return false;
      if (selectedTag && !item.tags.includes(selectedTag)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = item.name.toLowerCase().includes(q);
        const inDesc = item.shortDesc.toLowerCase().includes(q) || item.fullDesc.toLowerCase().includes(q);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const inAuthor = item.author.toLowerCase().includes(q);
        const inInstall = item.installCommand.toLowerCase().includes(q);
        if (!inName && !inDesc && !inTags && !inAuthor && !inInstall) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'stars') {
        const sA = parseFloat(a.stars) * (a.stars.includes('k') ? 1000 : 1);
        const sB = parseFloat(b.stars) * (b.stars.includes('k') ? 1000 : 1);
        return sB - sA;
      }
      if (sortBy === 'downloads') {
        const dA = parseFloat(a.downloads) * (a.downloads.includes('k') ? 1000 : 1);
        const dB = parseFloat(b.downloads) * (b.downloads.includes('k') ? 1000 : 1);
        return dB - dA;
      }
      if (sortBy === 'newest') {
        return (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0);
      }
      // default: popular
      const pA = parseFloat(a.downloads) + parseFloat(a.stars) * 2;
      const pB = parseFloat(b.downloads) + parseFloat(b.stars) * 2;
      return pB - pA;
    });
  }, [allTemplates, showSavedOnly, savedIds, category, selectedEngine, selectedTag, searchQuery, sortBy]);

  // Xử lý bookmark
  const toggleBookmark = (id, e) => {
    e?.stopPropagation();
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Copy text kèm phản hồi UI
  const handleCopy = (text, id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tải file prompt về máy
  const handleDownload = (item) => {
    const element = document.createElement('a');
    const file = new Blob([item.systemPrompt || item.installCommand], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = item.fileName || `${item.id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Tải trọn gói bộ cấu hình dạng .zip
  const handleDownloadZip = (item, e) => {
    e?.stopPropagation();
    const promptText = item.systemPrompt || item.installCommand || '';
    const mcpConfig = JSON.stringify(
      {
        mcpServers: {
          [item.id]: {
            command: 'npx',
            args: ['-y', `@modelcontextprotocol/server-${item.id}`],
            env: {},
          },
        },
      },
      null,
      2
    );

    const files = [
      { name: '.cursorrules', content: promptText },
      { name: 'CLAUDE.md', content: `# Claude Code Instructions\n\n${promptText}` },
      { name: '.windsurfrules', content: `# Windsurf / Cascade Config\n\n${promptText}` },
      { name: 'mcp.json', content: mcpConfig },
      {
        name: 'README.md',
        content: `# ${item.name} - Vibe Coding Bundle\n\n${item.shortDesc}\n\n## Category: ${item.categoryName}\n## Engine Compatibility: ${item.compatibility?.join(', ')}\n\n### How to use:\n1. Place .cursorrules in your project root for Cursor IDE.\n2. Or use CLAUDE.md for Claude Code CLI.\n3. Add mcp.json to your local MCP settings.\n\nGenerated by GitXplore Vibe Coding Hub.`,
      },
    ];

    downloadZipBundle(files, `${item.id}-vibe-bundle.zip`);
  };

  return (
    <div className="vb">
      <TopNav />

      {/* ===== HERO SECTION ===== */}
      <section className="vb-hero">
        <div className="vb-hero-glow" />
        <div className="vb-hero-badge">
          <Ico d={ICONS.sparkles} size={15} />
          <span>{t('vb_hero_badge')}</span>
          <span className="vb-badge-pill">aitmpl.com Inspired</span>
        </div>

        <h1 className="vb-hero-title">
          VIBE <span>CODING</span> HUB
        </h1>

        <p className="vb-hero-subtitle">
          {t('vb_hero_sub')}
        </p>

        {/* Live Counters */}
        <div className="vb-stats">
          <div className="vb-stat-item">
            <strong>1.38M+</strong>
            <span>{t('vb_stat_cli')}</span>
          </div>
          <div className="vb-stat-divider" />
          <div className="vb-stat-item">
            <strong>32+</strong>
            <span>{t('vb_stat_templates')}</span>
          </div>
          <div className="vb-stat-divider" />
          <div className="vb-stat-item">
            <strong>100%</strong>
            <span>{t('vb_stat_mcp')}</span>
          </div>
          <div className="vb-stat-divider" />
          <div className="vb-stat-item">
            <strong>{lang === 'vi' ? 'Miễn phí' : 'Free'}</strong>
            <span>{t('vb_stat_foss')}</span>
          </div>
        </div>

        {/* Terminal Search Trigger */}
        <div className="vb-search-container">
          <div className="vb-search-box">
            <span className="vb-prompt-arrow">&gt;</span>
            <input
              ref={searchInputRef}
              type="text"
              className="vb-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('vb_search_ph')}
              aria-label="Vibe Search"
            />
            {searchQuery && (
              <button
                type="button"
                className="vb-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <Ico d={ICONS.close} size={16} />
              </button>
            )}
            <kbd className="vb-kbd">⌘K / /</kbd>
          </div>
        </div>

        {/* Hero Action Shortcuts */}
        <div className="vb-hero-actions">
          <button
            type="button"
            className="vb-btn vb-btn-primary"
            onClick={() => openPlayground()}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              color: '#0a0a0c',
              fontWeight: 800,
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              border: 'none',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span>{lang === 'vi' ? 'Thử Vibe Sandbox Trực Tiếp' : 'Try Live Sandbox'}</span>
          </button>
          <button
            type="button"
            className="vb-btn vb-btn-secondary"
            onClick={() => openCompare()}
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            <span style={{ fontSize: '15px' }}>⚖️</span>
            <span>{lang === 'vi' ? 'So sánh Repo' : 'Repo Battle'}</span>
          </button>
          <button
            type="button"
            className="vb-btn vb-btn-secondary"
            onClick={() => setShowGeneratorModal(true)}
          >
            <Ico d={ICONS.sparkles} size={16} />
            <span>{t('vb_btn_custom')}</span>
          </button>
          <button
            type="button"
            className="vb-btn vb-btn-secondary"
            onClick={() => setShowSubmitModal(true)}
          >
            <Ico d={ICONS.plus} size={16} />
            <span>{t('vb_btn_submit')}</span>
          </button>
          <a
            href="https://aitmpl.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="vb-btn vb-btn-ghost"
          >
            <span>{t('vb_btn_original')}</span>
            <Ico d={ICONS.external} size={14} />
          </a>
        </div>

        {/* Guide Toggle Button */}
        <div style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="vb-guide-toggle-btn"
            onClick={() => setShowGuide((prev) => !prev)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fef08a',
              padding: '8px 18px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span>💡</span>
            <span>{showGuide ? (lang === 'vi' ? 'Thu gọn hướng dẫn 3 bước' : 'Hide 3-Step Guide') : (lang === 'vi' ? 'Xem hướng dẫn Vibe Coding 3 bước cho người mới' : 'Quick 3-step beginner guide')}</span>
            <span>{showGuide ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* FAST 3-STEP BEGINNER GUIDE FOR VIBE CODING */}
        {showGuide && (
          <div style={{
            maxWidth: '920px',
            margin: '20px auto 0',
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.9), rgba(12, 16, 28, 0.95))',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '18px',
            padding: '22px 24px',
            backdropFilter: 'blur(16px)',
            textAlign: 'left',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fef08a', fontWeight: 800, fontSize: '14px' }}>
                <span>💡</span>
                <span>{lang === 'vi' ? 'Quy trình sử dụng Vibe Coding (3 bước chuẩn Cursor / Claude Code):' : '3-Step Vibe Coding Workflow:'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
              >
                ✕ {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '12px', marginBottom: '4px' }}>
                  {lang === 'vi' ? 'BƯỚC 1: CÀI ĐẶT TRÌNH SOẠN THẢO' : 'STEP 1: INSTALL EDITOR'}
                </div>
                <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {lang === 'vi' ? 'Tải Cursor IDE, Windsurf hoặc VS Code (có Claude Code / GitHub Copilot).' : 'Download Cursor IDE, Windsurf or VS Code with Claude Code.'}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.25)' }}>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '12px', marginBottom: '4px' }}>
                  {lang === 'vi' ? 'BƯỚC 2: SAO CHÉP QUY TẮC (.cursorrules)' : 'STEP 2: COPY RULE (.cursorrules)'}
                </div>
                <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {lang === 'vi' ? 'Chọn 1 thẻ mẫu chuyên ngành bên dưới và bấm nút ⚡ Sao chép Rule.' : 'Pick a verified template below and click ⚡ Copy Rule.'}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)' }}>
                <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '12px', marginBottom: '4px' }}>
                  {lang === 'vi' ? 'BƯỚC 3: DÁN VÀO DỰ ÁN & RA LỆNH' : 'STEP 3: PASTE & PROMPT'}
                </div>
                <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {lang === 'vi' ? 'Tạo file .cursorrules ở gốc dự án và prompt AI tự nhiên để code tự sinh!' : 'Create .cursorrules at project root and chat naturally with AI!'}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== MAIN CONTENT WORKSPACE ===== */}
      <div className="vb-shell">
        {/* SIDEBAR NAVIGATION (như aitmpl.com) */}
        <aside className="vb-sidebar">
          {/* Section: Workplace */}
          <div className="vb-side-group">
            <span className="vb-side-title">{t('vb_workplace')}</span>
            <button
              type="button"
              className={`vb-side-link ${!showSavedOnly && category === 'all' ? 'is-active' : ''}`}
              onClick={() => { setShowSavedOnly(false); setCategory('all'); }}
            >
              <Ico d={ICONS.grid} size={16} />
              <span>{t('vb_all_components')}</span>
              <span className="vb-side-count">{allTemplates.length}</span>
            </button>
            <button
              type="button"
              className={`vb-side-link ${showSavedOnly ? 'is-active' : ''}`}
              onClick={() => setShowSavedOnly(true)}
            >
              <Ico d={ICONS.bookmark} size={16} />
              <span>{t('vb_saved_items')}</span>
              <span className="vb-side-count">{savedIds.length}</span>
            </button>
            <button
              type="button"
              className="vb-side-link"
              onClick={() => setShowGeneratorModal(true)}
            >
              <Ico d={ICONS.sparkles} size={16} />
              <span>{t('vb_prompt_generator')}</span>
              <span className="vb-side-badge">AI</span>
            </button>
          </div>

          {/* Section: Categories */}
          <div className="vb-side-group">
            <span className="vb-side-title">{t('vb_categories_title')}</span>
            {VIBE_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const count = allTemplates.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`vb-side-link ${!showSavedOnly && category === cat.id ? 'is-active' : ''}`}
                  onClick={() => { setShowSavedOnly(false); setCategory(cat.id); }}
                >
                  <Ico d={ICONS[cat.icon] || ICONS.zap} size={16} />
                  <span>{lang === 'vi' ? cat.labelVi : cat.label}</span>
                  <span className="vb-side-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Section: Engine Compatibility */}
          <div className="vb-side-group">
            <span className="vb-side-title">{t('vb_engines_title')}</span>
            {VIBE_ENGINES.map((engine) => (
              <button
                key={engine}
                type="button"
                className={`vb-side-link ${selectedEngine === engine ? 'is-active' : ''}`}
                onClick={() => setSelectedEngine(engine)}
              >
                <span className="vb-dot" />
                <span>{engine}</span>
              </button>
            ))}
          </div>

          {/* Section: Quick Links */}
          <div className="vb-side-group">
            <span className="vb-side-title">{t('vb_resources_title')}</span>
            <a
              href="https://github.com/davila7/claude-code-templates"
              target="_blank"
              rel="noopener noreferrer"
              className="vb-side-link"
            >
              <Ico d={ICONS.external} size={15} />
              <span>Claude Code Templates</span>
            </a>
            <a
              href="https://modelcontextprotocol.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="vb-side-link"
            >
              <Ico d={ICONS.external} size={15} />
              <span>MCP Protocol Docs</span>
            </a>
          </div>
        </aside>

        {/* MAIN CATALOG VIEW */}
        <main className="vb-main">
          {/* FEATURED SPOTLIGHT SECTION */}
          {category === 'all' && !searchQuery && !showSavedOnly && !selectedTag && featuredTemplates.length > 0 && (
            <section className="vb-spotlight-section">
              <div className="vb-spotlight-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🔥</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {lang === 'vi' ? 'Mẫu Vibe Đề Xuất Hàng Đầu (Staff Picks)' : 'Featured Staff Picks'}
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {lang === 'vi' ? 'Đã kiểm định tối ưu 100% cho Claude Code & Cursor IDE' : 'Production verified for Cursor & Claude Code'}
                </span>
              </div>

              <div className="vb-spotlight-grid">
                {featuredTemplates.map((item) => {
                  const isSaved = savedIds.includes(item.id);
                  const catObj = VIBE_CATEGORIES.find((c) => c.id === item.category) || {};

                  return (
                    <article
                      key={`spotlight-${item.id}`}
                      className="vb-spotlight-card"
                      onClick={() => setInspectItem(item)}
                    >
                      <div className="vb-spotlight-top">
                        <span className="vb-cat-badge" style={{ '--cat-color': catObj.color || '#f59e0b' }}>
                          <Ico d={ICONS[catObj.icon] || ICONS.zap} size={12} />
                          {item.categoryName}
                        </span>
                        <span className="vb-status-badge is-featured">★ STAFF PICK</span>
                        <button
                          type="button"
                          className={`vb-bookmark-btn ${isSaved ? 'is-active' : ''}`}
                          onClick={(e) => toggleBookmark(item.id, e)}
                          title={isSaved ? 'Bỏ lưu' : 'Lưu mẫu này'}
                        >
                          <Ico d={ICONS.bookmark} size={15} />
                        </button>
                      </div>

                      <h4 className="vb-spotlight-title">{item.name}</h4>
                      <p className="vb-spotlight-desc">{item.shortDesc}</p>

                      <div className="vb-compat-row" style={{ margin: '12px 0 6px' }}>
                        {item.compatibility.map((eng) => (
                          <span key={eng} className="vb-compat-pill">{eng}</span>
                        ))}
                      </div>

                      <div className="vb-spotlight-foot">
                        <span style={{ fontSize: '12px', color: '#fef08a', fontWeight: 700 }}>
                          ⭐ {item.stars} • ⬇️ {item.downloads}
                        </span>
                        <button
                          type="button"
                          className="vb-act-btn vb-act-prompt"
                          onClick={(e) => handleCopy(item.systemPrompt || item.installCommand, `${item.id}-spotlight`, e)}
                        >
                          {copiedId === `${item.id}-spotlight` ? (lang === 'vi' ? '✓ Đã sao chép' : '✓ Copied') : (lang === 'vi' ? '⚡ Sao chép Rule' : '⚡ Copy Rule')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Subheader Filters & Controls */}
          <div className="vb-toolbar">
            <div className="vb-tags-wrap">
              <button
                type="button"
                className={`vb-tag-chip ${!selectedTag ? 'is-active' : ''}`}
                onClick={() => setSelectedTag('')}
              >
                {t('vb_all_topics')}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`vb-tag-chip ${selectedTag === tag ? 'is-active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>

            <div className="vb-toolbar-right">
              <div className="vb-sort-wrap">
                <label htmlFor="vbSortSelect">{t('vb_sort_lbl')}</label>
                <select
                  id="vbSortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="vb-sort-select"
                >
                  <option value="popular">{t('vb_sort_popular')}</option>
                  <option value="stars">{t('vb_sort_stars')}</option>
                  <option value="downloads">{t('vb_sort_downloads')}</option>
                  <option value="newest">{t('vb_sort_newest')}</option>
                </select>
              </div>

              <div className="vb-view-toggle">
                <button
                  type="button"
                  className={`vb-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <Ico d={ICONS.grid} size={16} />
                </button>
                <button
                  type="button"
                  className={`vb-view-btn ${viewMode === 'compact' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('compact')}
                  title="List view"
                >
                  <Ico d={ICONS.terminal} size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(category !== 'all' || selectedEngine !== 'All Engines' || selectedTag || searchQuery || showSavedOnly) && (
            <div className="vb-active-filters">
              <span className="vb-filter-label">{t('vb_active_filters')}</span>
              {showSavedOnly && (
                <span className="vb-filter-pill">
                  {t('vb_saved_items')} <button type="button" onClick={() => setShowSavedOnly(false)}>×</button>
                </span>
              )}
              {category !== 'all' && (
                <span className="vb-filter-pill">
                  {category} <button type="button" onClick={() => setCategory('all')}>×</button>
                </span>
              )}
              {selectedEngine !== 'All Engines' && (
                <span className="vb-filter-pill">
                  {selectedEngine} <button type="button" onClick={() => setSelectedEngine('All Engines')}>×</button>
                </span>
              )}
              {selectedTag && (
                <span className="vb-filter-pill">
                  #{selectedTag} <button type="button" onClick={() => setSelectedTag('')}>×</button>
                </span>
              )}
              {searchQuery && (
                <span className="vb-filter-pill">
                  “{searchQuery}” <button type="button" onClick={() => setSearchQuery('')}>×</button>
                </span>
              )}
              <button
                type="button"
                className="vb-clear-all"
                onClick={() => {
                  setCategory('all');
                  setSelectedEngine('All Engines');
                  setSelectedTag('');
                  setSearchQuery('');
                  setShowSavedOnly(false);
                }}
              >
                {t('vb_clear_all')}
              </button>
              <span className="vb-results-count">({t('vb_results_count', { n: filteredTemplates.length })})</span>
            </div>
          )}

          {/* EMPTY STATE */}
          {filteredTemplates.length === 0 && (
            <div className="vb-empty">
              <div className="vb-empty-icon">
                <Ico d={ICONS.search} size={36} />
              </div>
              <h3>{t('vb_empty_title')}</h3>
              <p>{t('vb_empty_sub')}</p>
              <button
                type="button"
                className="vb-btn vb-btn-secondary"
                onClick={() => {
                  setCategory('all');
                  setSelectedEngine('All Engines');
                  setSelectedTag('');
                  setSearchQuery('');
                  setShowSavedOnly(false);
                }}
              >
                {t('vb_empty_btn')}
              </button>
            </div>
          )}

          {/* CARDS GRID */}
          <div className={viewMode === 'grid' ? 'vb-grid' : 'vb-list'}>
            {filteredTemplates.map((item) => {
              const isSaved = savedIds.includes(item.id);
              const isCopied = copiedId === item.id;
              const catObj = VIBE_CATEGORIES.find((c) => c.id === item.category) || {};

              return (
                <article
                  key={item.id}
                  className={`vb-card ${isSaved ? 'is-bookmarked' : ''}`}
                  onClick={() => setInspectItem(item)}
                >
                  <div className="vb-card-top">
                    <div className="vb-card-badges">
                      <span
                        className="vb-cat-badge"
                        style={{ '--cat-color': catObj.color || '#f59e0b' }}
                      >
                        <Ico d={ICONS[catObj.icon] || ICONS.zap} size={12} />
                        {item.categoryName}
                      </span>
                      {item.badge && (
                        <span className={`vb-status-badge is-${item.badge.toLowerCase()}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`vb-bookmark-btn ${isSaved ? 'is-active' : ''}`}
                      onClick={(e) => toggleBookmark(item.id, e)}
                      title={isSaved ? 'Bỏ lưu' : 'Lưu mẫu này'}
                      aria-label="Lưu mẫu"
                    >
                      <Ico d={ICONS.bookmark} size={16} />
                    </button>
                  </div>

                  <div className="vb-card-header">
                    <div className="vb-author-line">
                      <span className="vb-author-avatar">{item.avatarChar}</span>
                      <span className="vb-author-name">{item.author}</span>
                      <span className="vb-version-tag">{item.version}</span>
                    </div>

                    <h3 className="vb-card-title">{item.name}</h3>
                    <p className="vb-card-desc">{item.shortDesc}</p>
                  </div>

                  {/* Compatibility & Tags */}
                  <div className="vb-card-meta">
                    <div className="vb-compat-row">
                      {item.compatibility.map((eng) => (
                        <span key={eng} className="vb-compat-pill">
                          {eng}
                        </span>
                      ))}
                    </div>

                    <div className="vb-tags-row">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="vb-mini-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CLI Snippet Box */}
                  <div className="vb-cli-box" onClick={(e) => e.stopPropagation()}>
                    <code>{item.installCommand}</code>
                    <button
                      type="button"
                      className={`vb-cli-copy ${isCopied ? 'is-copied' : ''}`}
                      onClick={(e) => handleCopy(item.installCommand, item.id, e)}
                      title="Copy lệnh cài đặt"
                    >
                      <Ico d={isCopied ? ICONS.check : ICONS.copy} size={14} />
                      <span>{isCopied ? t('pm_copied') : t('pm_copy')}</span>
                    </button>
                  </div>

                  {/* Card Footer: Metrics & Details */}
                  <div className="vb-card-footer">
                    <div className="vb-metrics">
                      <span className="vb-metric" title="Stars">
                        <Ico d={ICONS.star} size={13} />
                        {item.stars}
                      </span>
                      <span className="vb-metric" title="Downloads">
                        <Ico d={ICONS.download} size={13} />
                        {item.downloads}
                      </span>
                    </div>

                    <div className="vb-actions">
                      <button
                        type="button"
                        className="vb-act-btn vb-act-inspect"
                        onClick={(e) => { e.stopPropagation(); setInspectItem(item); }}
                      >
                        {t('vb_inspect_btn')}
                      </button>
                      <button
                        type="button"
                        className="vb-act-btn vb-act-prompt"
                        onClick={(e) => handleCopy(item.systemPrompt || item.installCommand, `${item.id}-prompt`, e)}
                        title="Copy Prompt"
                      >
                        {copiedId === `${item.id}-prompt` ? t('vb_copied_prompt_btn') : t('vb_copy_prompt_btn')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </div>

      {/* ===== MODAL CHI TIẾT TEMPLATE ===== */}
      {inspectItem && (
        <TemplateDetailModal
          item={inspectItem}
          isSaved={savedIds.includes(inspectItem.id)}
          onToggleBookmark={(e) => toggleBookmark(inspectItem.id, e)}
          onClose={() => setInspectItem(null)}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDownloadZip={handleDownloadZip}
          copiedId={copiedId}
          onTryPlayground={(templateId) => {
            setInspectItem(null);
            openPlayground(templateId);
          }}
        />
      )}

      {/* ===== MODAL TẠO PROMPT TÙY BIẾN ===== */}
      {showGeneratorModal && (
        <PromptGeneratorModal
          onClose={() => setShowGeneratorModal(false)}
          onApplyGenerated={(newTemplate) => {
            setUserTemplates((prev) => {
              const updated = [newTemplate, ...prev];
              localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(updated));
              return updated;
            });
            setShowGeneratorModal(false);
            setInspectItem(newTemplate);
          }}
        />
      )}

      {/* ===== MODAL ĐÓNG GÓP MẪU MỚI ===== */}
      {showSubmitModal && (
        <SubmitTemplateModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={(template) => {
            setUserTemplates((prev) => {
              const updated = [template, ...prev];
              localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(updated));
              return updated;
            });
            setShowSubmitModal(false);
            setInspectItem(template);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

// ==================== COMPONENT: MODAL CHI TIẾT TEMPLATE ====================
function TemplateDetailModal({ item, isSaved, onToggleBookmark, onClose, onCopy, onDownload, onDownloadZip, copiedId, onTryPlayground }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'install' | 'example'
  const catObj = VIBE_CATEGORIES.find((c) => c.id === item.category) || {};

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="vb-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vb-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="vb-modal-head">
          <div className="vb-head-left">
            <span
              className="vb-cat-badge"
              style={{ '--cat-color': catObj.color || '#f59e0b' }}
            >
              <Ico d={ICONS[catObj.icon] || ICONS.zap} size={14} />
              {item.categoryName}
            </span>
            <h2 className="vb-modal-title">{item.name}</h2>
            <div className="vb-modal-sub">
              <span>Tác giả: <strong>{item.author}</strong></span>
              <span>• Phiên bản: <strong>{item.version}</strong></span>
              <span>• Đánh giá: <strong>★ {item.rating || '4.9'}</strong> ({item.stars} sao)</span>
            </div>
          </div>

          <div className="vb-head-right">
            <button
              type="button"
              className={`vb-btn-icon ${isSaved ? 'is-active' : ''}`}
              onClick={onToggleBookmark}
              title={isSaved ? 'Bỏ lưu' : 'Lưu mẫu này'}
            >
              <Ico d={ICONS.bookmark} size={18} />
            </button>
            <button type="button" className="vb-btn-icon" onClick={onClose} title="Đóng">
              <Ico d={ICONS.close} size={18} />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="vb-modal-tabs">
          <button
            type="button"
            className={`vb-modal-tab ${activeTab === 'prompt' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            {t('vb_modal_tab_prompt')}
          </button>
          <button
            type="button"
            className={`vb-modal-tab ${activeTab === 'install' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('install')}
          >
            {t('vb_modal_tab_install')}
          </button>
          <button
            type="button"
            className={`vb-modal-tab ${activeTab === 'example' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('example')}
          >
            {t('vb_modal_tab_example')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="vb-modal-body">
          {activeTab === 'prompt' && (
            <div className="vb-prompt-section">
              <div className="vb-section-desc">
                <p>{item.fullDesc}</p>
              </div>

              <div className="vb-code-container">
                <div className="vb-code-bar">
                  <span className="vb-file-name">{item.fileName || 'system-prompt.md'}</span>
                  <button
                    type="button"
                    className="vb-code-copy"
                    onClick={(e) => onCopy(item.systemPrompt, 'modal-prompt', e)}
                  >
                    <Ico d={copiedId === 'modal-prompt' ? ICONS.check : ICONS.copy} size={14} />
                    <span>{copiedId === 'modal-prompt' ? 'Đã copy!' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <pre className="vb-pre">
                  <code>{item.systemPrompt}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="vb-install-section">
              <p className="vb-guide-note">
                Sử dụng lệnh bên dưới trong terminal để đưa mẫu này vào dự án của bạn (hỗ trợ Claude Code CLI, Cursor IDE và Antigravity):
              </p>

              <div className="vb-install-block">
                <h4>1. Claude Code CLI</h4>
                <div className="vb-cli-row">
                  <code>{item.engineCommands?.claudeCode || item.installCommand}</code>
                  <button
                    type="button"
                    onClick={(e) => onCopy(item.engineCommands?.claudeCode || item.installCommand, 'cmd-claude', e)}
                  >
                    {copiedId === 'cmd-claude' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="vb-install-block">
                <h4>2. Cursor IDE (.cursorrules)</h4>
                <div className="vb-cli-row">
                  <code>{item.engineCommands?.cursor || `cursor rules add ${item.id}`}</code>
                  <button
                    type="button"
                    onClick={(e) => onCopy(item.engineCommands?.cursor || `cursor rules add ${item.id}`, 'cmd-cursor', e)}
                  >
                    {copiedId === 'cmd-cursor' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="vb-install-block">
                <h4>3. Google Antigravity (AGY CLI)</h4>
                <div className="vb-cli-row">
                  <code>{item.engineCommands?.antigravity || `agy skill install ${item.id}`}</code>
                  <button
                    type="button"
                    onClick={(e) => onCopy(item.engineCommands?.antigravity || `agy skill install ${item.id}`, 'cmd-agy', e)}
                  >
                    {copiedId === 'cmd-agy' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'example' && (
            <div className="vb-example-section">
              <p className="vb-guide-note">Ví dụ minh họa cấu trúc hoặc kết quả mà mẫu này sinh ra khi AI hoạt động:</p>
              <div className="vb-code-container">
                <div className="vb-code-bar">
                  <span className="vb-file-name">example-output.tsx</span>
                  <button
                    type="button"
                    className="vb-code-copy"
                    onClick={(e) => onCopy(item.exampleOutput, 'modal-ex', e)}
                  >
                    <Ico d={copiedId === 'modal-ex' ? ICONS.check : ICONS.copy} size={14} />
                    <span>{copiedId === 'modal-ex' ? 'Đã copy!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="vb-pre">
                  <code>{item.exampleOutput || '// Chưa có ví dụ mã mẫu'}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="vb-modal-foot">
          <div className="vb-foot-left">
            <span className="vb-tags-title">Tags:</span>
            {item.tags.map((t) => (
              <span key={t} className="vb-mini-tag">#{t}</span>
            ))}
          </div>

          <div className="vb-foot-right">
            <button
              type="button"
              className="vb-btn vb-btn-primary"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                color: '#0a0a0c',
                fontWeight: 700,
                border: 'none',
              }}
              onClick={() => onTryPlayground && onTryPlayground(item.id)}
              title="Mở ngay trình giả lập Sandbox để thử nghiệm trực tiếp"
            >
              <span>⚡</span>
              <span>Thử trong Sandbox</span>
            </button>
            <button
              type="button"
              className="vb-btn vb-btn-secondary"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                fontWeight: 700,
              }}
              onClick={(e) => onDownloadZip && onDownloadZip(item, e)}
              title="Tải toàn bộ file .cursorrules, CLAUDE.md, .windsurfrules & mcp.json đóng gói ZIP"
            >
              <span>📦</span>
              <span>Tải trọn gói ZIP (Bundle)</span>
            </button>
            <button
              type="button"
              className="vb-btn vb-btn-secondary"
              onClick={() => onDownload(item)}
            >
              <Ico d={ICONS.download} size={15} />
              <span>Tải file ({item.fileName || 'template.md'})</span>
            </button>
            <button
              type="button"
              className="vb-btn vb-btn-primary"
              onClick={(e) => onCopy(item.systemPrompt, 'modal-foot-copy', e)}
            >
              <Ico d={copiedId === 'modal-foot-copy' ? ICONS.check : ICONS.copy} size={15} />
              <span>{copiedId === 'modal-foot-copy' ? 'Đã copy thành công!' : 'Copy Toàn Bộ Prompt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== COMPONENT: MODAL TẠO PROMPT TÙY BIẾN ====================
function PromptGeneratorModal({ onClose, onApplyGenerated }) {
  const [role, setRole] = useState('Frontend UI Specialist');
  const [stack, setStack] = useState('React 19 + Tailwind CSS + GSAP');
  const [focus, setFocus] = useState('Clean Architecture & Micro-interactions');
  const [targetEngine, setTargetEngine] = useState('Claude Code');
  const [customGoal, setCustomGoal] = useState('');

  const generatedPrompt = useMemo(() => {
    return `# Custom Vibe Coding Prompt: ${role}
Target Engine: ${targetEngine}
Tech Stack: ${stack}
Primary Focus: ${focus}
${customGoal ? `Specific Goal: ${customGoal}\n` : ''}
## Core Instructions:
1. Act as a high-velocity Senior ${role}. Always write clean, production-grade code.
2. Architecture: Separate UI components from side-effects and network calls using custom hooks.
3. Design System: Ensure high-contrast dark theme (#090505) with glowing amber accents and subtle glassmorphism.
4. Error Handling: Never leave unhandled promise rejections. Provide graceful fallbacks and loading skeletons.
5. Testing: Validate edge cases, accessibility tags, and verify runtime builds before concluding.`;
  }, [role, stack, focus, targetEngine, customGoal]);

  const handleSaveAsTemplate = () => {
    const newTemplate = {
      id: `custom-prompt-${Date.now()}`,
      name: `${role} (${stack.split(' ')[0]})`,
      category: 'skills',
      categoryName: 'Skill',
      badge: 'Custom',
      author: '@me',
      authorName: 'My Workspace',
      avatarChar: 'M',
      version: 'v1.0.0',
      stars: '1',
      downloads: '1',
      rating: 5.0,
      compatibility: [targetEngine, 'Cursor'],
      tags: stack.split('+').map((s) => s.trim().split(' ')[0]),
      shortDesc: `Custom Prompt tùy biến cho ${role} tập trung vào ${focus}.`,
      fullDesc: `Mẫu prompt sinh tự động cho dự án ${stack}.`,
      fileName: `vibe-${role.toLowerCase().replace(/\s+/g, '-')}.md`,
      installCommand: `claude-code template add custom-${role.toLowerCase().replace(/\s+/g, '-')}`,
      systemPrompt: generatedPrompt,
      exampleOutput: `// Code generated with ${role} directives\nexport default function VibeWidget() {\n  return <div>Ready!</div>;\n}`,
    };
    onApplyGenerated(newTemplate);
  };

  return (
    <div className="vb-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vb-modal-content vb-generator-content" onClick={(e) => e.stopPropagation()}>
        <div className="vb-modal-head">
          <div>
            <h2 className="vb-modal-title">✦ Bộ Tạo Vibe Coding Prompt Tự Động</h2>
            <p className="vb-modal-sub">Tự cấu hình phong cách lập trình AI theo ý muốn trong 4 bước đơn giản</p>
          </div>
          <button type="button" className="vb-btn-icon" onClick={onClose}>
            <Ico d={ICONS.close} size={18} />
          </button>
        </div>

        <div className="vb-generator-grid">
          <div className="vb-gen-controls">
            <div className="vb-field">
              <label>1. Vai trò chuyên gia (Role):</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Frontend UI Specialist">Frontend UI Specialist (Giao diện chuẩn Vibe)</option>
                <option value="Fullstack Senior Architect">Fullstack Senior Architect (Kiến trúc toàn diện)</option>
                <option value="Database & Supabase Lead">Database & Supabase Lead (Cơ sở dữ liệu & RLS)</option>
                <option value="Application Security Auditor">Application Security Auditor (Bảo mật & OWASP)</option>
                <option value="QA Test Automation Lead">QA Test Automation Lead (Kiểm thử TDD)</option>
              </select>
            </div>

            <div className="vb-field">
              <label>2. Tech Stack của bạn:</label>
              <select value={stack} onChange={(e) => setStack(e.target.value)}>
                <option value="React 19 + Tailwind CSS + GSAP">React 19 + Tailwind CSS + GSAP</option>
                <option value="Next.js 15 App Router + TypeScript">Next.js 15 App Router + TypeScript</option>
                <option value="Vite + React + Supabase JS">Vite + React + Supabase JS</option>
                <option value="Node.js + Express + PostgreSQL">Node.js + Express + PostgreSQL</option>
                <option value="Python + FastAPI + Pydantic">Python + FastAPI + Pydantic</option>
              </select>
            </div>

            <div className="vb-field">
              <label>3. Trọng tâm ưu tiên (Focus):</label>
              <select value={focus} onChange={(e) => setFocus(e.target.value)}>
                <option value="Clean Architecture & Micro-interactions">Clean Architecture & Micro-interactions</option>
                <option value="Sub-second Performance & Core Web Vitals">Tối ưu hiệu năng 100 điểm Lighthouse</option>
                <option value="Strict Zero-Any Type Safety">Tuyệt đối không dùng `any`, ép type nghiêm ngặt</option>
                <option value="Rapid Prototyping & MVP Speed">Xây dựng tính năng thần tốc (Rapid MVP)</option>
              </select>
            </div>

            <div className="vb-field">
              <label>4. Công cụ AI đích:</label>
              <select value={targetEngine} onChange={(e) => setTargetEngine(e.target.value)}>
                <option value="Claude Code">Claude Code CLI</option>
                <option value="Cursor">Cursor IDE (.cursorrules)</option>
                <option value="Antigravity">Google Antigravity (RULE.md)</option>
                <option value="Windsurf">Windsurf Cascade</option>
              </select>
            </div>

            <div className="vb-field">
              <label>Yêu cầu hoặc ghi chú thêm (Tùy chọn):</label>
              <input
                type="text"
                placeholder="VD: Không dùng thư viện ngoài nếu CSS làm được..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
              />
            </div>
          </div>

          <div className="vb-gen-preview">
            <span className="vb-preview-title">Xem trước Prompt sẽ tạo:</span>
            <pre className="vb-pre">
              <code>{generatedPrompt}</code>
            </pre>
          </div>
        </div>

        <div className="vb-modal-foot">
          <button type="button" className="vb-btn vb-btn-ghost" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="vb-btn vb-btn-secondary"
            onClick={() => {
              navigator.clipboard.writeText(generatedPrompt);
              alert('Đã copy Prompt tùy biến vào clipboard!');
            }}
          >
            <Ico d={ICONS.copy} size={15} />
            Copy Prompt
          </button>
          <button
            type="button"
            className="vb-btn vb-btn-primary"
            onClick={handleSaveAsTemplate}
          >
            <Ico d={ICONS.plus} size={15} />
            Lưu Vào Danh Sách Của Tôi
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== COMPONENT: MODAL ĐÓNG GÓP MẪU MỚI ====================
function SubmitTemplateModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('skills');
  const [shortDesc, setShortDesc] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tags, setTags] = useState('React, Tailwind, AI');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    const newTemplate = {
      id: `user-template-${Date.now()}`,
      name: name.trim(),
      category,
      categoryName: VIBE_CATEGORIES.find((c) => c.id === category)?.labelVi || 'Skill',
      badge: 'Community',
      author: '@community',
      authorName: 'Community Contributor',
      avatarChar: 'C',
      version: 'v1.0.0',
      stars: '1',
      downloads: '1',
      rating: 5.0,
      compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      shortDesc: shortDesc.trim() || 'Mẫu Vibe do cộng đồng đóng góp.',
      fullDesc: shortDesc.trim() || 'Mẫu Vibe do cộng đồng đóng góp.',
      fileName: `${name.toLowerCase().replace(/\s+/g, '-')}.md`,
      installCommand: `npx aitmpl add ${category} ${name.toLowerCase().replace(/\s+/g, '-')}`,
      systemPrompt: systemPrompt.trim(),
      exampleOutput: '// Community template example output',
    };

    onSubmit(newTemplate);
  };

  return (
    <div className="vb-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vb-modal-content vb-submit-content" onClick={(e) => e.stopPropagation()}>
        <div className="vb-modal-head">
          <div>
            <h2 className="vb-modal-title">+ Đóng Góp Mẫu Vibe Mới</h2>
            <p className="vb-modal-sub">Chia sẻ kỹ năng, Agent hoặc lệnh Slash của bạn với cộng đồng</p>
          </div>
          <button type="button" className="vb-btn-icon" onClick={onClose}>
            <Ico d={ICONS.close} size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vb-submit-form">
          <div className="vb-field">
            <label>Tên Mẫu / Component *</label>
            <input
              type="text"
              required
              placeholder="VD: Next.js 15 Server Actions Specialist"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="vb-field-row">
            <div className="vb-field">
              <label>Danh mục</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="skills">Skills (Kỹ năng)</option>
                <option value="agents">Agents (Đặc vụ)</option>
                <option value="commands">Commands (Lệnh Slash)</option>
                <option value="mcps">MCPs (Giao thức MCP)</option>
                <option value="rules">Rules & Settings (.cursorrules)</option>
                <option value="hooks">Hooks & CI/CD</option>
              </select>
            </div>
            <div className="vb-field">
              <label>Tags (cách nhau bằng dấu phẩy)</label>
              <input
                type="text"
                placeholder="React, Nextjs, TypeScript"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="vb-field">
            <label>Mô tả ngắn gọn</label>
            <input
              type="text"
              placeholder="Tóm tắt công dụng của mẫu này trong 1 câu..."
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
            />
          </div>

          <div className="vb-field">
            <label>Nội dung System Prompt / Quy tắc Markdown *</label>
            <textarea
              required
              rows={8}
              placeholder="Nhập hướng dẫn, system prompt hoặc nội dung .cursorrules..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          <div className="vb-modal-foot">
            <button type="button" className="vb-btn vb-btn-ghost" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="vb-btn vb-btn-primary">
              <Ico d={ICONS.plus} size={15} />
              Đăng Mẫu Này
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
