import { useEffect, useRef, useState } from 'react';
import { useProjectFilters } from '../hooks/useProjectFilters';

const categories = [
  { id: 'all', label: 'All Repositories' },
  { id: 'ai', label: 'AI & Machine Learning' },
  { id: 'gamedev', label: 'Game Dev' },
  { id: 'agents', label: 'Virtual Avatars & Agents' },
  { id: 'web', label: 'Web Development' },
  { id: 'devtools', label: 'DevTools & Runtimes' },
  { id: 'cloud', label: 'Cloud & DevOps' },
  { id: 'security', label: 'Security & Network' },
  { id: 'databases', label: 'Databases & Big Data' },
];

export default function Component1() {
  const { category, search, setCategory, setSearch } = useProjectFilters();

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
              {cat.label}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            className="lusion-search"
            placeholder="Search repositories, frameworks..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
