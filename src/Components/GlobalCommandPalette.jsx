import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { openSourceProjects } from '../data/projectsData';
import { VIBE_TEMPLATES } from '../data/vibeTemplatesData';
import './GlobalCommandPalette.css';

export default function GlobalCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { selectProject, openPlayground, openCompare } = useUI();

  // Lắng nghe tổ hợp phím Ctrl+K / Cmd+K / Slash (/) và Custom Event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus ô tìm kiếm khi mở
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Danh sách mục điều hướng mặc định
  const navItems = useMemo(() => [
    { id: 'nav-playground', type: 'action-playground', title: '⚡ Vibe Coding Playground (Thử Code Trực Tiếp)', sub: 'Code Sandbox 1-chạm: Chạy Cafe web, Game Snake, Pomodoro ngay', icon: '⚡' },
    { id: 'nav-compare', type: 'action-compare', title: '⚖️ So sánh Dự án (Repo Battle Arena)', sub: 'Đối đầu trực diện 2 repo: React vs Vue, Supabase vs Firebase...', icon: '⚖️' },
    { id: 'nav-market', type: 'nav', title: '🛒 Chợ Công Nghệ & Sàn Trung Gian (Marketplace)', sub: 'Mua bán thiết bị điện tử, vi mạch, piano, AI tools an toàn qua Escrow', icon: '🛒', path: '/market' },
    { id: 'nav-home', type: 'nav', title: 'Trang chủ (Home)', sub: 'Kho mã nguồn, Live Demo & Vibe Coding', icon: '🏠', path: '/' },
    { id: 'nav-guide', type: 'guide', title: 'Nhập môn trong 3 phút (Beginner Guide)', sub: 'Hiểu ngay mã nguồn mở & Vibe Coding cho người mới', icon: '🌱', path: '/#beginner-guide' },
    { id: 'nav-vibe', type: 'nav', title: 'Vibe Coding Hub', sub: 'Mẫu .cursorrules, MCP Servers & AI Prompts', icon: '⚡', path: '/vibe' },
    { id: 'nav-forum', type: 'nav', title: 'Diễn đàn Cộng đồng (Forum)', sub: 'Thảo luận realtime & phòng trà tân thủ', icon: '💬', path: '/forum' },
    { id: 'nav-news', type: 'nav', title: 'Tin tức Công nghệ (News 24/7)', sub: 'Cập nhật xu hướng GitHub & thế giới mã nguồn mở', icon: '📰', path: '/news' },
    { id: 'nav-account', type: 'nav', title: 'Trung tâm Tài khoản (Accounts Center)', sub: 'Cài đặt hồ sơ, bảo mật & kho lưu trữ cá nhân', icon: '🛡️', path: '/accountscenter' },
  ], []);

  // Tổng hợp kết quả tìm kiếm tức thì
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return navItems;
    }

    const matchedNav = navItems.filter(
      (n) => n.title.toLowerCase().includes(q) || n.sub.toLowerCase().includes(q)
    );

    const matchedRepos = openSourceProjects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.language.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({
        id: `repo-${p.id}`,
        type: 'repo',
        title: p.name,
        sub: `⭐ ${p.stars} • ${p.language} — ${p.description.substring(0, 75)}...`,
        icon: '📁',
        raw: p,
      }));

    const matchedVibe = VIBE_TEMPLATES
      .filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((v) => ({
        id: `vibe-${v.id}`,
        type: 'vibe',
        title: v.title,
        sub: `${v.category.toUpperCase()} • ${v.description.substring(0, 70)}...`,
        icon: '⚡',
        path: `/vibe?cat=${v.category}`,
      }));

    const aiAction = {
      id: 'ai-ask',
      type: 'ai',
      title: `Hỏi Trợ Lý Arisu: "${query}"`,
      sub: 'Nhận câu trả lời và code hướng dẫn tức thì',
      icon: '🤖',
      query: query,
    };

    return [...matchedNav, ...matchedRepos, ...matchedVibe, aiAction];
  }, [query, navItems]);

  // Xử lý chọn mục
  const handleSelect = (item) => {
    setIsOpen(false);
    if (!item) return;

    if (item.type === 'action-playground') {
      if (openPlayground) openPlayground();
    } else if (item.type === 'action-compare') {
      if (openCompare) openCompare();
    } else if (item.type === 'nav') {
      navigate(item.path);
    } else if (item.type === 'guide') {
      if (window.location.pathname === '/') {
        const el = document.getElementById('beginner-guide');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById('beginner-guide');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } else if (item.type === 'repo') {
      selectProject(item.raw);
    } else if (item.type === 'vibe') {
      navigate(item.path);
    } else if (item.type === 'ai') {
      window.dispatchEvent(
        new CustomEvent('open-arisu-ai', {
          detail: { query: item.query }
        })
      );
    }
  };

  // Điều hướng bằng phím mũi tên
  const handleKeyDownList = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="gcp-overlay"
      role="dialog"
      aria-modal="true"
      onClick={() => setIsOpen(false)}
      data-lenis-prevent="true"
    >
      <div
        className="gcp-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        {/* Search Input Bar */}
        <div className="gcp-input-wrap">
          <span className="gcp-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="gcp-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={lang === 'vi' ? 'Tìm kho repo, Vibe templates, diễn đàn... (Esc để đóng)' : 'Search repos, Vibe rules, forum... (Esc to close)'}
            aria-label="Universal Search"
          />
          <kbd className="gcp-esc-pill" onClick={() => setIsOpen(false)}>ESC</kbd>
        </div>

        {/* Results Flow */}
        <div className="gcp-list" ref={listRef}>
          {filteredResults.length === 0 ? (
            <div className="gcp-empty">
              <span>🛸</span>
              <p>{lang === 'vi' ? 'Không tìm thấy kết quả phù hợp.' : 'No matching results found.'}</p>
            </div>
          ) : (
            filteredResults.map((item, idx) => (
              <div
                key={item.id}
                className={`gcp-item ${selectedIndex === idx ? 'is-active' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="gcp-item-icon">{item.icon}</div>
                <div className="gcp-item-info">
                  <div className="gcp-item-title">{item.title}</div>
                  <div className="gcp-item-sub">{item.sub}</div>
                </div>
                <span className="gcp-item-enter">↵</span>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="gcp-footer">
          <div className="gcp-shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Di chuyển</span>
            <span><kbd>↵</kbd> Chọn</span>
            <span><kbd>ESC</kbd> Đóng</span>
          </div>
          <div className="gcp-brand-tag">⚡ GitXplore Universal ⌘K</div>
        </div>
      </div>
    </div>
  );
}
