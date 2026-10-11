import { useState, useEffect, useMemo } from 'react';
import { openSourceProjects } from '../data/projectsData';
import { POPULAR_PAIRS, generateComparison } from '../data/repoCompareData';
import './RepoCompareModal.css';

export default function RepoCompareModal({ initialPair, onClose }) {
  // Tìm dự án A và B ban đầu
  const defaultA = initialPair?.[0] || openSourceProjects.find((p) => p.name.includes('React')) || openSourceProjects[0];
  const defaultB = initialPair?.[1] || openSourceProjects.find((p) => p.name.includes('Vue')) || openSourceProjects[1];

  const [selectedIdA, setSelectedIdA] = useState(defaultA?.id || 1);
  const [selectedIdB, setSelectedIdB] = useState(defaultB?.id || 2);
  const [activePreset, setActivePreset] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const projA = useMemo(() => openSourceProjects.find((p) => p.id === selectedIdA) || openSourceProjects[0], [selectedIdA]);
  const projB = useMemo(() => openSourceProjects.find((p) => p.id === selectedIdB) || openSourceProjects[1], [selectedIdB]);

  const comparison = useMemo(() => {
    return generateComparison(projA, projB);
  }, [projA, projB]);

  const selectPreset = (pair) => {
    setActivePreset(pair.id);
    const pA = openSourceProjects.find((p) => p.name.toLowerCase().includes(pair.nameA.toLowerCase())) || projA;
    const pB = openSourceProjects.find((p) => p.name.toLowerCase().includes(pair.nameB.toLowerCase())) || projB;
    if (pA) setSelectedIdA(pA.id);
    if (pB) setSelectedIdB(pB.id);
  };

  if (!comparison) return null;

  return (
    <div className="rc-overlay" onClick={onClose}>
      <div className="rc-box" onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className="rc-header">
          <div className="rc-header-title">
            <div className="rc-icon">⚖️</div>
            <div>
              <h2 className="rc-title">REPO BATTLE: ĐẤU TRƯỜNG SO SÁNH DỰ ÁN</h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Phân tích đa chiều số sao, độ dễ học và khả năng Vibe Coding</span>
            </div>
          </div>
          <button type="button" className="rc-close-btn" onClick={onClose} title="Đóng so sánh">
            ✕
          </button>
        </div>

        {/* ===== QUICK PAIRS BAR ===== */}
        <div className="rc-quick-bar">
          <span className="rc-quick-label">CẶP SO SÁNH HOT:</span>
          {POPULAR_PAIRS.map((pair) => (
            <button
              key={pair.id}
              type="button"
              className={`rc-pair-chip ${activePreset === pair.id ? 'is-active' : ''}`}
              onClick={() => selectPreset(pair)}
            >
              ⚔️ {pair.nameA} vs {pair.nameB}
            </button>
          ))}
        </div>

        {/* ===== SCROLLABLE ARENA BODY ===== */}
        <div className="rc-arena-body">
          {/* THE VERSUS ARENA HEADER */}
          <div className="rc-arena-grid">
            {/* Fighter A */}
            <div className="rc-fighter-card rc-fighter-card--a">
              <label style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800 }}>DỰ ÁN A</label>
              <select
                className="rc-select"
                value={selectedIdA}
                onChange={(e) => {
                  setSelectedIdA(Number(e.target.value));
                  setActivePreset(null);
                }}
              >
                {openSourceProjects.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#120909' }}>
                    {p.name} ({p.stars} stars)
                  </option>
                ))}
              </select>
              <h3 className="rc-fighter-name">{projA.name}</h3>
              <p className="rc-fighter-tag">{projA.categoryName} • Ngôn ngữ: {projA.language || 'Đa nền tảng'}</p>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                <a href={projA.githubUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12.5px', color: '#f59e0b', textDecoration: 'none', fontWeight: 700 }}>
                  GitHub ↗
                </a>
                {projA.demoUrl && (
                  <a href={projA.demoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12.5px', color: '#cbd5e1', textDecoration: 'none' }}>
                    • Trang chủ ↗
                  </a>
                )}
              </div>
            </div>

            {/* Center VS Energy */}
            <div className="rc-vs-badge">
              <div className="rc-vs-circle">VS</div>
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800 }}>ARENA</span>
            </div>

            {/* Fighter B */}
            <div className="rc-fighter-card rc-fighter-card--b">
              <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>DỰ ÁN B</label>
              <select
                className="rc-select"
                value={selectedIdB}
                onChange={(e) => {
                  setSelectedIdB(Number(e.target.value));
                  setActivePreset(null);
                }}
              >
                {openSourceProjects.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#0e1726' }}>
                    {p.name} ({p.stars} stars)
                  </option>
                ))}
              </select>
              <h3 className="rc-fighter-name">{projB.name}</h3>
              <p className="rc-fighter-tag">{projB.categoryName} • Ngôn ngữ: {projB.language || 'Đa nền tảng'}</p>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                <a href={projB.githubUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12.5px', color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}>
                  GitHub ↗
                </a>
                {projB.demoUrl && (
                  <a href={projB.demoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12.5px', color: '#cbd5e1', textDecoration: 'none' }}>
                    • Trang chủ ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* METRICS COMPARISON TABLE */}
          <div className="rc-metrics-box">
            {/* Stars */}
            <div className="rc-metric-row">
              <span className="rc-val rc-val--a">{comparison.scoreA.stars}</span>
              <div className="rc-bar-track rc-bar-track--a">
                <div className="rc-bar-fill rc-bar-fill--a" style={{ width: '85%' }} />
              </div>
              <span className="rc-metric-label">⭐ GitHub Stars</span>
              <div className="rc-bar-track">
                <div className="rc-bar-fill rc-bar-fill--b" style={{ width: '75%' }} />
              </div>
              <span className="rc-val rc-val--b">{comparison.scoreB.stars}</span>
            </div>

            {/* Forks */}
            <div className="rc-metric-row">
              <span className="rc-val rc-val--a">{comparison.scoreA.forks}</span>
              <div className="rc-bar-track rc-bar-track--a">
                <div className="rc-bar-fill rc-bar-fill--a" style={{ width: '80%' }} />
              </div>
              <span className="rc-metric-label">🍴 Cộng Đồng Forks</span>
              <div className="rc-bar-track">
                <div className="rc-bar-fill rc-bar-fill--b" style={{ width: '70%' }} />
              </div>
              <span className="rc-val rc-val--b">{comparison.scoreB.forks}</span>
            </div>

            {/* Beginner Friendly */}
            <div className="rc-metric-row">
              <span className="rc-val rc-val--a">{comparison.scoreA.beginnerScore}/10</span>
              <div className="rc-bar-track rc-bar-track--a">
                <div className="rc-bar-fill rc-bar-fill--a" style={{ width: `${comparison.scoreA.beginnerScore * 10}%` }} />
              </div>
              <span className="rc-metric-label">🌱 Dễ Học Cho Newbie</span>
              <div className="rc-bar-track">
                <div className="rc-bar-fill rc-bar-fill--b" style={{ width: `${comparison.scoreB.beginnerScore * 10}%` }} />
              </div>
              <span className="rc-val rc-val--b">{comparison.scoreB.beginnerScore}/10</span>
            </div>

            {/* Vibe Coding & AI Support */}
            <div className="rc-metric-row">
              <span className="rc-val rc-val--a">{comparison.scoreA.vibeScore}/10</span>
              <div className="rc-bar-track rc-bar-track--a">
                <div className="rc-bar-fill rc-bar-fill--a" style={{ width: `${comparison.scoreA.vibeScore * 10}%` }} />
              </div>
              <span className="rc-metric-label">🤖 Hỗ Trợ Vibe Coding</span>
              <div className="rc-bar-track">
                <div className="rc-bar-fill rc-bar-fill--b" style={{ width: `${comparison.scoreB.vibeScore * 10}%` }} />
              </div>
              <span className="rc-val rc-val--b">{comparison.scoreB.vibeScore}/10</span>
            </div>

            {/* Performance */}
            <div className="rc-metric-row">
              <span className="rc-val rc-val--a">{comparison.scoreA.perfScore}/10</span>
              <div className="rc-bar-track rc-bar-track--a">
                <div className="rc-bar-fill rc-bar-fill--a" style={{ width: `${comparison.scoreA.perfScore * 10}%` }} />
              </div>
              <span className="rc-metric-label">⚡ Hiệu Năng & Tốc Độ</span>
              <div className="rc-bar-track">
                <div className="rc-bar-fill rc-bar-fill--b" style={{ width: `${comparison.scoreB.perfScore * 10}%` }} />
              </div>
              <span className="rc-val rc-val--b">{comparison.scoreB.perfScore}/10</span>
            </div>
          </div>

          {/* STRENGTHS COLUMNS */}
          <div className="rc-strengths-grid">
            <div className="rc-strength-col">
              <h4 className="rc-strength-title" style={{ color: '#f59e0b' }}>✨ ĐIỂM MẠNH NỔI BẬT CỦA {projA.name.toUpperCase()}</h4>
              <ul className="rc-strength-list">
                {comparison.strengthsA.map((s, idx) => (
                  <li key={idx} className="rc-strength-item">
                    <span style={{ color: '#f59e0b' }}>✔</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rc-strength-col">
              <h4 className="rc-strength-title" style={{ color: '#38bdf8' }}>✨ ĐIỂM MẠNH NỔI BẬT CỦA {projB.name.toUpperCase()}</h4>
              <ul className="rc-strength-list">
                {comparison.strengthsB.map((s, idx) => (
                  <li key={idx} className="rc-strength-item">
                    <span style={{ color: '#38bdf8' }}>✔</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ARISU AI VERDICT */}
          <div className="rc-verdict-box">
            <div className="rc-verdict-icon">🤖</div>
            <div className="rc-verdict-main">
              <h4>PHÁN QUYẾT TỪ TRỢ LÝ AI ARISU</h4>
              <p>{comparison.verdict}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
