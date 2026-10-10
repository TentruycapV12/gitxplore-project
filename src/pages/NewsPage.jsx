import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewsFeed } from '../hooks/useNewsFeed';
import { useProjectSearch } from '../hooks/useProjectSearch';
import { KINDS, SEARCH_SOURCES, SOURCES } from '../lib/newsSources';
import './NewsPage.css';

const PAGE = 24; // chỉ vẽ 24 thẻ mỗi lượt -> không lag, bấm "Show more" mới vẽ thêm

const INTERVALS = [
  { ms: 60_000, label: '1 min' },
  { ms: 300_000, label: '5 min' },
  { ms: 900_000, label: '15 min' },
  { ms: 0, label: 'Off' },
];

const relTime = (ts, now) => {
  if (!ts) return '';
  const m = Math.max(0, Math.floor((now - ts) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const KIND_LABEL = {
  repo: 'Repo',
  package: 'Package',
  article: 'Article',
  discussion: 'Discussion',
  social: 'Social',
};

const readInterval = () => {
  const raw = localStorage.getItem('gxp_news_interval');
  const v = Number(raw);
  return raw !== null && INTERVALS.some((i) => i.ms === v) ? v : 300_000;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tô sáng từ khoá trong tiêu đề. */
function Hl({ text, q }) {
  const terms = q.split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map(escapeRe).join('|')})`, 'ig');
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="nw-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function NewsPage() {
  const navigate = useNavigate();
  const [intervalMs, setIntervalMs] = useState(readInterval);
  const [kind, setKind] = useState('all');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('best');
  const [limit, setLimit] = useState({ key: '', n: PAGE });
  const [now, setNow] = useState(() => Date.now());

  const search = useProjectSearch(query);
  // Đang tìm kiếm thì tạm dừng tự cập nhật bảng tin để đỡ tốn data.
  const feed = useNewsFeed(search.active ? 0 : intervalMs);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const changeInterval = (ms) => {
    setIntervalMs(ms);
    localStorage.setItem('gxp_news_interval', String(ms));
  };

  const mode = search.active ? 'search' : 'feed';
  const highlight = search.active ? search.query : '';

  const list = useMemo(() => {
    const base = mode === 'search' ? search.items : feed.items;
    const q = query.trim().toLowerCase();
    let out = base.filter(
      (it) =>
        (kind === 'all' || it.kind === kind) &&
        (source === 'all' || it.source === source) &&
        (mode === 'search' || !q || `${it.title} ${it.summary} ${it.author}`.toLowerCase().includes(q))
    );
    if (mode === 'search' && sort === 'new') out = [...out].sort((a, b) => b.date - a.date);
    return out;
  }, [mode, search.items, feed.items, kind, source, query, sort]);

  const limitKey = `${mode}|${search.query}|${kind}|${source}|${sort}`;
  const n = limit.key === limitKey ? limit.n : PAGE;
  const shown = list.slice(0, n);
  const canShowLocal = n < list.length;
  const canFetchMore = mode === 'search' && search.hasMore && !canShowLocal;

  const onShowMore = () => {
    if (canShowLocal) setLimit({ key: limitKey, n: n + PAGE });
    else if (canFetchMore) {
      setLimit({ key: limitKey, n: n + PAGE });
      search.loadMore();
    }
  };

  const errorsMap = mode === 'search' ? search.errors : feed.errors;
  const labelPool = mode === 'search' ? SEARCH_SOURCES : SOURCES;
  const failed = Object.keys(errorsMap);
  const sourceOptions = labelPool.filter((s) => kind === 'all' || s.kind === kind);

  const waiting = mode === 'search' ? search.searching : feed.items.length === 0 && feed.loading;

  return (
    <div className="nw">
      <header className="nw-top">
        <button type="button" className="nw-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <span className="nw-brand">
          GIT<span>XPLORE</span> News
        </span>
        <div className="nw-live" title={feed.lastUpdated ? new Date(feed.lastUpdated).toLocaleString() : ''}>
          {mode === 'search' ? (
            <>
              <i className={`nw-dot ${search.searching ? 'is-loading' : 'is-live'}`} />
              {search.searching ? 'Searching…' : `${list.length} results`}
            </>
          ) : (
            <>
              <i className={`nw-dot ${feed.loading ? 'is-loading' : intervalMs ? 'is-live' : ''}`} />
              {feed.loading
                ? 'Updating…'
                : feed.lastUpdated
                  ? `Updated ${relTime(feed.lastUpdated, now)}`
                  : 'Waiting…'}
            </>
          )}
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
        <button type="button" className="nw-btn" onClick={feed.refresh} disabled={feed.loading || mode === 'search'}>
          ↻ Refresh
        </button>
      </header>

      <main className="nw-main">
        <div className="nw-head">
          <h1>{mode === 'search' ? `Results for “${search.query}”` : 'Open-source News'}</h1>
          <p>
            {mode === 'search'
              ? 'Searching GitHub, GitLab, npm, crates.io, Hugging Face, Hacker News and Stack Overflow.'
              : 'Latest repositories, articles, discussions and posts. Type a keyword to search any project.'}
          </p>
        </div>

        <div className="nw-filters">
          <input
            className="nw-input nw-search nw-search--main"
            type="search"
            placeholder="Search any project, package or topic… (e.g. react, ollama, redis)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search projects"
          />
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
          {mode === 'search' && (
            <select className="nw-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="best">Best match</option>
              <option value="new">Newest activity</option>
            </select>
          )}
        </div>

        {mode === 'feed' && feed.newCount > 0 && (
          <button type="button" className="nw-new" onClick={feed.applyPending}>
            ↑ Show {feed.newCount} new {feed.newCount === 1 ? 'item' : 'items'}
          </button>
        )}

        {failed.length > 0 && (
          <p className="nw-warn">
            Couldn’t load: {failed.map((id) => labelPool.find((s) => s.id === id)?.label || id).join(', ')}
            {mode === 'feed' ? ' (will retry on next refresh).' : '.'}
          </p>
        )}

        {waiting ? (
          <div className="nw-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="nw-card nw-skel" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="nw-empty">
            {mode === 'search' ? `No results for “${search.query}”. Try another keyword.` : 'No news matches your filters.'}
          </p>
        ) : (
          <div className="nw-grid">
            {shown.map((it) => (
              <a key={it.id} className="nw-card" href={it.url} target="_blank" rel="noreferrer noopener">
                {it.image && it.kind !== 'repo' && it.kind !== 'package' && (
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
                    <span>
                      <Hl text={it.title} q={highlight} />
                    </span>
                  </h3>
                  {it.summary && (
                    <p>
                      <Hl text={it.summary} q={highlight} />
                    </p>
                  )}
                  <div className="nw-foot">
                    <span>{it.author}</span>
                    <span>{it.meta}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {!waiting && (canShowLocal || canFetchMore) && (
          <button type="button" className="nw-more" onClick={onShowMore} disabled={search.loadingMore}>
            {search.loadingMore ? 'Loading…' : canShowLocal ? `Show more (${list.length - n} left)` : 'Load more results'}
          </button>
        )}
      </main>
    </div>
  );
}
