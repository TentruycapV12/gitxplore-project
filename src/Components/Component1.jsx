import { useEffect, useRef, useState } from 'react';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { useLanguage } from '../context/LanguageContext';

const categories = [
  { id: 'all', key: 'all_repos' },
  { id: 'ai', key: 'cat_ai' },
  { id: 'gamedev', key: 'cat_gamedev' },
  { id: 'agents', key: 'cat_agents' },
  { id: 'web', key: 'cat_web' },
  { id: 'devtools', key: 'cat_devtools' },
  { id: 'cloud', key: 'cat_cloud' },
  { id: 'security', key: 'cat_security' },
  { id: 'databases', key: 'cat_databases' },
];

export default function Component1() {
  const { category, search, setCategory, setSearch } = useProjectFilters();
  const { t } = useLanguage();

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

  return (
    <section className="hero-section">
      <div className="controls-bar">
        <div className="category-tags">
          {categories.map((cat) => (
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