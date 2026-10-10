import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNewsFeed } from '../hooks/useNewsFeed';
import { useProjectSearch } from '../hooks/useProjectSearch';
import { KINDS, SEARCH_SOURCES, SOURCES } from '../lib/newsSources';
import './NewsPage.css';

const PAGE = 24; // chỉ vẽ 24 thẻ mỗi lượt -> không lag, bấm "Show more" mới vẽ thêm

const INTERVALS = [{ ms: 60_000 }, { ms: 300_000 }, { ms: 900_000 }, { ms: 0 }];

// Thời gian tương đối theo ngôn ngữ đang chọn.
const relTime = (ts, now, t, locale) => {
  if (!ts) return '';
  const m = Math.max(0, Math.floor((now - ts) / 60000));
  if (m < 1) return t('nw_now');
  if (m < 60) return t('nw_ago_m', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('nw_ago_h', { n: h });
  const d = Math.floor(h / 24);
  if (d < 30) return t('nw_ago_d', { n: d });
  return new Date(ts).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
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
  const { t, locale } = useLanguage();
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
          {t('nw_back')}
        </button>
        <span className="nw-brand">
          GIT<span>XPLORE</span> {t('news')}
        </span>
        <div className="nw-live" title={feed.lastUpdated ? new Date(feed.lastUpdated).toLocaleString(locale) : ''}>
          {mode === 'search' ? (
            <>
              <i className={`nw-dot ${search.searching ? 'is-loading' : 'is-live'}`} />
              {search.searching ? t('nw_searching') : t('nw_results', { n: list.length })}
            </>
          ) : (
            <>
              <i className={`nw-dot ${feed.loading ? 'is-loading' : intervalMs ? 'is-live' : ''}`} />
              {feed.loading
                ? t('nw_updating')
                : feed.lastUpdated
                  ? t('nw_updated', { t: relTime(feed.lastUpdated, now, t, locale) })
                  : t('nw_waiting')}
            </>
          )}
        </div>
        <label className="nw-select">
          {t('nw_auto')}
          <select value={intervalMs} onChange={(e) => changeInterval(Number(e.target.value))}>
            {INTERVALS.map((i) => (
              <option key={i.ms} value={i.ms}>
                {i.ms ? t('nw_min', { n: i.ms / 60000 }) : t('nw_off')}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="nw-btn" onClick={feed.refresh} disabled={feed.loading || mode === 'search'}>
          {t('nw_refresh')}
        </button>
      </header>

      <main className="nw-main">
        <div className="nw-head">
          <h1>{mode === 'search' ? t('nw_results_for', { q: search.query }) : t('nw_title')}</h1>
          <p>
            {mode === 'search'
              ? t('nw_head_search')
              : t('nw_head_feed')}
          </p>
        </div>

        <div className="nw-filters">
          <input
            className="nw-input nw-search nw-search--main"
            type="search"
            placeholder={t('nw_search_ph')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('nw_search_aria')}
          />
          <div className="nw-chips" role="group" aria-label={t('nw_type')}>
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
                {t(`nw_k_${k.id}`)}
              </button>
            ))}
          </div>
          <select className="nw-input" value={source} onChange={(e) => setSource(e.target.value)} aria-label={t('nw_source')}>
            <option value="all">{t('nw_all_sources')}</option>
            {sourceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {mode === 'search' && (
            <select className="nw-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('nw_sort')}>
              <option value="best">{t('nw_best')}</option>
              <option value="new">{t('nw_newest')}</option>
            </select>
          )}
        </div>

        {mode === 'feed' && feed.newCount > 0 && (
          <button type="button" className="nw-new" onClick={feed.applyPending}>
            {t('nw_show_new', { n: feed.newCount })}
          </button>
        )}

        {failed.length > 0 && (
          <p className="nw-warn">
            {t('nw_load_fail', { list: failed.map((id) => labelPool.find((s) => s.id === id)?.label || id).join(', ') })}
            {mode === 'feed' ? t('nw_retry') : '.'}
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
            {mode === 'search' ? t('nw_no_results', { q: search.query }) : t('nw_no_match')}
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
                    <span className={`nw-tag nw-tag--${it.kind}`}>{t(`nw_t_${it.kind}`)}</span>
                    <span>{it.sourceLabel}</span>
                    <span className="nw-time">{relTime(it.date, now, t, locale)}</span>
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
            {search.loadingMore ? t('nw_loading') : canShowLocal ? t('nw_show_more', { n: list.length - n }) : t('nw_load_more')}
          </button>
        )}
      </main>
    </div>
  );
}