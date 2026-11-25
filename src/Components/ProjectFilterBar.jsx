import { useEffect, useRef, useState } from 'react';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { useLanguage } from '../context/LanguageContext';

const ALL_CATEGORIES = [
  { id: 'all', key: 'all_repos' },
  { id: 'beginner', key: 'cat_beginner' },
  { id: 'apps', key: 'cat_apps' },
  { id: 'ai', key: 'cat_ai' },
  { id: 'gamedev', key: 'cat_gamedev' },
  { id: 'agents', key: 'cat_agents' },
  { id: 'web', key: 'cat_web' },
  { id: 'devtools', key: 'cat_devtools' },
  { id: 'cloud', key: 'cat_cloud' },
  { id: 'security', key: 'cat_security' },
  { id: 'databases', key: 'cat_databases' },
];

const BEGINNER_CATEGORIES = [
  { id: 'all', key: 'all_repos' },
  { id: 'beginner', key: 'cat_beginner' },
  { id: 'apps', key: 'cat_apps' },
  { id: 'ai', key: 'cat_ai' },
  { id: 'gamedev', key: 'cat_gamedev' },
  { id: 'web', key: 'cat_web' },
];

export default function ProjectFilterBar() {
  const { category, search, setCategory, setSearch } = useProjectFilters();
  const { t, lang } = useLanguage();

  const [audienceMode, setAudienceMode] = useState(() => {
    return localStorage.getItem('gx_audience_mode') || 'beginner';
  });

  const handleSwitchMode = (mode) => {
    setAudienceMode(mode);
    localStorage.setItem('gx_audience_mode', mode);
    if (mode === 'beginner' && !['all', 'beginner', 'apps', 'ai', 'gamedev', 'web'].includes(category)) {
      setCategory('beginner');
    }
  };

  // Ô nhập giữ state cục bộ để gõ mượt; URL chỉ cập nhật sau khi ngừng gõ 250ms.
  const [input, setInput] = useState(search);
  const lastWritten = useRef(search);

  useEffect(() => {
    if (input.trim() === lastWritten.current) return; // không có gì mới để ghi lên URL
    const timer = setTimeout(() => {
      lastWritten.current = input.trim();
      setSearch(input);
    }, 250);
    return () => clearTimeout(timer); // cleanup: huỷ timer cũ mỗi lần gõ thêm
  }, [input, setSearch]);

  // Bấm Back/Forward làm URL đổi → cập nhật lại ô nhập.
  useEffect(() => {
    if (search !== lastWritten.current) {
      lastWritten.current = search;
      setInput(search);
    }
  }, [search]);

  const activeCategories = audienceMode === 'beginner' ? BEGINNER_CATEGORIES : ALL_CATEGORIES;

  return (
    <section className="hero-section">
      {/* THANH CHUYỂN ĐỔI CHẾ ĐỘ: NGƯỜI MỚI VS DEVELOPER */}
      <div
        className="audience-mode-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          margin: '0 0 20px',
          padding: '10px 18px',
          background: 'rgba(18, 12, 12, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: audienceMode === 'beginner' ? '#6ee7b7' : '#fef08a' }}>
            {audienceMode === 'beginner'
              ? (lang === 'vi' ? 'Chế độ Người Mới (Tinh Chọn Live Demo)' : 'Beginner View (Curated Live Demos)')
              : (lang === 'vi' ? 'Chế độ Lập Trình Viên (Đầy Đủ Repo & Git Clone)' : 'Developer View (Full Repos & Git Clone)')}
          </span>
        </div>

        {/* 2-Way Pill Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '3px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <button
            type="button"
            onClick={() => handleSwitchMode('beginner')}
            style={{
              padding: '7px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: audienceMode === 'beginner' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: audienceMode === 'beginner' ? '#ffffff' : '#94a3b8',
              boxShadow: audienceMode === 'beginner' ? '0 2px 12px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            {lang === 'vi' ? 'Người Mới' : 'Beginner'}
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('dev')}
            style={{
              padding: '7px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: audienceMode === 'dev' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: audienceMode === 'dev' ? '#000000' : '#94a3b8',
              boxShadow: audienceMode === 'dev' ? '0 2px 12px rgba(245, 158, 11, 0.5)' : 'none',
            }}
          >
            {lang === 'vi' ? 'Lập Trình Viên' : 'Developer'}
          </button>
        </div>
      </div>

      <div className="controls-bar">
        <div className="category-tags">
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              className={`tag-btn ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {t(cat.key)}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            className="lusion-search"
            placeholder={lang === 'vi' ? 'Lọc nhanh dự án theo tên hoặc công nghệ...' : 'Filter projects by name or stack...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}