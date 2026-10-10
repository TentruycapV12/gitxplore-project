import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewsFeed } from '../hooks/useNewsFeed';
import { KINDS, SOURCES } from '../lib/newsSources';
import './NewsPage.css';

const INTERVALS = [
  { ms: 60_000, label: '1 min' },
  { ms: 300_000, label: '5 min' },
  { ms: 900_000, label: '15 min' },
  { ms: 0, label: 'Off' },
];

const relTime = (ts, now) => {
  const m = Math.max(0, Math.floor((now - ts) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const KIND_LABEL = { repo: 'Repo', article: 'Article', discussion: 'Discussion', social: 'Social' };

const readInterval = () => {
  const raw = localStorage.getItem('gxp_news_interval');
  const v = Number(raw);
  return raw !== null && INTERVALS.some((i) => i.ms === v) ? v : 300_000;
};

export default function NewsPage() {
  const navigate = useNavigate();
  const [intervalMs, setIntervalMs] = useState(readInterval);
  const { items, errors, loading, lastUpdated, newCount, applyPending, refresh } = useNewsFeed(intervalMs);

  const [kind, setKind] = useState('all');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const changeInterval = (ms) => {
    setIntervalMs(ms);
    localStorage.setItem('gxp_news_interval', String(ms));
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (kind === 'all' || it.kind === kind) &&
        (source === 'all' || it.source === source) &&
        (!q || `${it.title} ${it.summary} ${it.author}`.toLowerCase().includes(q))
    );
  }, [items, kind, source, query]);

  const failed = Object.keys(errors);
  const sourceOptions = SOURCES.filter((s) => kind === 'all' || s.kind === kind);

  return (
    <div className="nw">
      <header className="nw-top">
        <button type="button" className="nw-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <span className="nw-brand">
          GIT<span>XPLORE</span> News
        </span>
        <div className="nw-live" title={lastUpdated ? new Date(lastUpdated).toLocaleString() : ''}>
          <i className={`nw-dot ${loading ? 'is-loading' : intervalMs ? 'is-live' : ''}`} />
          {loading ? 'Updating…' : lastUpdated ? `Updated ${relTime(lastUpdated, now)}` : 'Waiting…'}
        </div>
        <label className="nw-select">
          Auto-refresh
          <select value={intervalMs} onChange={(e) => changeInterval(Number(e.target.value))}>
            {INTERVALS.map((i) => (
              <option key={i.ms} value={i.ms}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="nw-btn" onClick={refresh} disabled={loading}>
          ↻ Refresh
        </button>
      </header>

      <main className="nw-main">
        <div className="nw-head">
          <h1>Open-source News</h1>
          <p>Repositories, articles, discussions and posts from across the web, refreshed automatically.</p>
        </div>

        <div className="nw-filters">
          <div className="nw-chips" role="group" aria-label="Type">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={kind === k.id}
                onClick={() => {
                  setKind(k.id);
                  setSource('all');
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
          <select className="nw-input" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
            <option value="all">All sources</option>
            {sourceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            className="nw-input nw-search"
            type="search"
            placeholder="Search news…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {newCount > 0 && (
          <button type="button" className="nw-new" onClick={applyPending}>
            ↑ Show {newCount} new {newCount === 1 ? 'item' : 'items'}
          </button>
        )}

        {failed.length > 0 && (
          <p className="nw-warn">
            Couldn’t load: {failed.map((id) => SOURCES.find((s) => s.id === id)?.label || id).join(', ')} (will retry on
            next refresh).
          </p>
        )}

        {items.length === 0 && loading ? (
          <div className="nw-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="nw-card nw-skel" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="nw-empty">No news matches your filters.</p>
        ) : (
          <div className="nw-grid">
            {visible.map((it) => (
              <a key={it.id} className="nw-card" href={it.url} target="_blank" rel="noreferrer noopener">
                {it.image && it.kind !== 'repo' && (
                  <img
                    className="nw-img"
                    src={it.image}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div className="nw-body">
                  <div className="nw-meta">
                    <span className={`nw-tag nw-tag--${it.kind}`}>{KIND_LABEL[it.kind]}</span>
                    <span>{it.sourceLabel}</span>
                    <span className="nw-time">{relTime(it.date, now)}</span>
                  </div>
                  <h3>
                    {it.kind === 'repo' && it.image && (
                      <img className="nw-avatar" src={it.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    )}
                    {it.title}
                  </h3>
                  {it.summary && <p>{it.summary}</p>}
                  <div className="nw-foot">
                    <span>{it.author}</span>
                    <span>{it.meta}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
