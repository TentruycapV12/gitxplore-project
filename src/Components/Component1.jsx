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

export default function Component1() {
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
          gap: '14px',
          margin: '0 0 24px',
          padding: '14px 20px',
          background: audienceMode === 'beginner'
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.2) 100%)'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(120, 53, 15, 0.2) 100%)',
          border: audienceMode === 'beginner'
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '18px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{audienceMode === 'beginner' ? '🌱' : '⚡'}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: audienceMode === 'beginner' ? '#6ee7b7' : '#fef08a' }}>
              {audienceMode === 'beginner'
                ? (lang === 'vi' ? 'Chế độ Người Mới Bắt Đầu (Beginner Mode)' : 'Beginner-Friendly View')
                : (lang === 'vi' ? 'Chế độ Lập Trình Viên (Developer Mode)' : 'Full Developer View')}
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', opacity: 0.9 }}>
              {audienceMode === 'beginner'
                ? (lang === 'vi' ? 'Các ứng dụng được tinh chọn dễ dùng, có thể bấm "Live Demo" trải nghiệm ngay không cần biết code.' : 'Curated apps with instant live web demos, simplified without technical jargon.')
                : (lang === 'vi' ? 'Hiển thị đầy đủ mọi kho mã nguồn, lệnh terminal git clone và các thông số chuyên sâu.' : 'Full repositories, terminal clone commands, and specialized frameworks.')}
            </div>
          </div>
        </div>

        {/* 2-Way Pill Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.55)',
            padding: '4px',
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
            🌱 {lang === 'vi' ? 'Người Mới' : 'Beginner'}
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
            💻 {lang === 'vi' ? 'Developer' : 'Developer'}
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
            placeholder={t('search_placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}