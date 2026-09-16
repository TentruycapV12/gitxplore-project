import React from 'react';

const categories = [
  { id: 'all', label: 'All Repositories' },
  { id: 'ai', label: 'AI & Machine Learning' },
  { id: 'gamedev', label: 'Game Dev' },
  { id: 'agents', label: 'Virtual Avatars & Agents' },
  { id: 'web', label: 'Web Development' },
  { id: 'devtools', label: 'DevTools & Runtimes' },
  { id: 'cloud', label: 'Cloud & DevOps' },
  { id: 'security', label: 'Security & Network' },
  { id: 'databases', label: 'Databases & Big Data' }
];

export default function Component1({ context }) {
  const { activeCategory, setCategory, searchTerm, setSearchTerm } = context;

  return (
    <section className="hero-section">
      <div className="controls-bar">
        <div className="category-tags">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`tag-btn ${activeCategory === cat.id ? 'active' : ''}`}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}