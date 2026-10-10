import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import { useCommunity } from '../hooks/useCommunity';
import { useProjectSearch } from '../hooks/useProjectSearch';
import { openSourceProjects } from '../data/projectsData';
import { fold, norm, scoreText } from '../lib/searchUtils';
import TopNav from '../Components/TopNav.jsx';
import './SearchPage.css';

/**
 * Trang kết quả tìm kiếm chung: /search?q=...&type=all|people|groups|projects
 *  - Mọi người : bảng profiles (bạn bè / thành viên cộng đồng), cần đăng nhập
 *  - Nhóm      : chủ đề diễn đàn (bảng topics)
 *  - Dự án     : danh sách dự án trong web + (khi cần) GitHub, npm... qua useProjectSearch
 * Khối nào khớp nhất với từ khóa sẽ được xếp lên đầu (giống Facebook).
 */

const TYPES = ['all', 'people', 'groups', 'projects'];
const PREVIEW = 5;
const PAGE = 20;

const TEXT = {
  vi: {
    title: 'Kết quả tìm kiếm', filters: 'Bộ lọc',
    all: 'Tất cả', people: 'Mọi người', groups: 'Nhóm cộng đồng', projects: 'Dự án',
    see_all: 'Xem tất cả', show_more: 'Xem thêm', loading: 'Đang tìm…',
    no_query: 'Nhập từ khóa vào ô tìm kiếm để bắt đầu.',
    no_results: 'Không tìm thấy kết quả cho “{q}”.',
    no_results_tip: 'Hãy thử từ khóa ngắn hơn hoặc kiểm tra lại chính tả.',
    login_people: 'Đăng nhập để tìm bạn bè và thành viên cộng đồng.',
    signin: 'Đăng nhập',
    add: 'Thêm bạn bè', confirm: 'Xác nhận', delete: 'Xóa', cancel_req: 'Hủy lời mời', is_friend: 'Bạn bè',
    mutual: '{n} bạn chung',
    view_topic: 'Xem chủ đề', replies: 'phản hồi', views: 'lượt xem',
    quick_view: 'Xem nhanh', web_title: 'Trên GitHub, npm và các nguồn khác', searching_web: 'Đang tìm trên web…',
    topics_failed: 'Không tải được diễn đàn.', people_failed: 'Không tải được danh sách thành viên.',
    people_missing: 'Tính năng bạn bè chưa được cài đặt.',
    n_sent: 'Đã gửi lời mời kết bạn', n_accepted: 'Đã chấp nhận lời mời', n_removed: 'Đã xóa lời mời',
  },
  en: {
    title: 'Search results', filters: 'Filters',
    all: 'All', people: 'People', groups: 'Community groups', projects: 'Projects',
    see_all: 'See all', show_more: 'Show more', loading: 'Searching…',
    no_query: 'Type something in the search box to get started.',
    no_results: 'No results found for “{q}”.',
    no_results_tip: 'Try a shorter keyword or check the spelling.',
    login_people: 'Sign in to search friends and community members.',
    signin: 'Sign in',
    add: 'Add friend', confirm: 'Confirm', delete: 'Delete', cancel_req: 'Cancel request', is_friend: 'Friends',
    mutual: '{n} mutual friends',
    view_topic: 'View topic', replies: 'replies', views: 'views',
    quick_view: 'Quick view', web_title: 'On GitHub, npm and other sources', searching_web: 'Searching the web…',
    topics_failed: 'Could not load the forum.', people_failed: 'Could not load members.',
    people_missing: 'Friends feature is not set up yet.',
    n_sent: 'Friend request sent', n_accepted: 'Request accepted', n_removed: 'Request removed',
  },
};

const hueOf = (s = '') => [...s].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');
const gradient = (key) => {
  const h = hueOf(key);
  return { background: `linear-gradient(135deg, hsl(${h} 55% 28%), hsl(${(h + 45) % 360} 70% 42%))` };
};
const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const isUrl = (s) => /^https?:\/\//i.test((s || '').trim());
const clip = (s, n = 150) => (s && s.length > n ? `${s.slice(0, n).trim()}…` : s || '');

/** Tô sáng từ khóa trong chuỗi, không phân biệt hoa-thường và dấu tiếng Việt. */
function Hl({ text, tokens }) {
  const s = String(text ?? '').normalize('NFC');
  if (!s || !tokens.length) return s;
  const f = fold(s);
  const on = new Array(s.length).fill(false);
  tokens.forEach((tok) => {
    if (!tok) return;
    let i = f.indexOf(tok);
    while (i !== -1) {
      for (let k = i; k < i + tok.length; k += 1) on[k] = true;
      i = f.indexOf(tok, i + tok.length);
    }
  });
  const out = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && on[j] === on[i]) j += 1;
    const part = s.slice(i, j);
    out.push(on[i] ? <mark key={i}>{part}</mark> : part);
    i = j;
  }
  return out;
}

function Avatar({ p }) {
  return p.avatar_url
    ? <img className="sr-av" src={p.avatar_url} alt="" referrerPolicy="no-referrer" />
    : <span className="sr-av" style={gradient(p.email || p.name)}>{initial(p.name)}</span>;
}

function Card({ title, children, footer }) {
  return (
    <section className="sr-card">
      {title && <h2 className="sr-card-title">{title}</h2>}
      {children}
      {footer}
    </section>
  );
}

const SeeAll = ({ onClick, children }) => (
  <button type="button" className="sr-seeall" onClick={onClick}>{children}</button>
);

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { lang } = useLanguage();
  const { openModal, selectProject } = useUI();
  const L = TEXT[lang] || TEXT.en;
  const c = useCommunity();

  const q = (params.get('q') || '').trim();
  const typeParam = params.get('type');
  const type = TYPES.includes(typeParam) ? typeParam : 'all';
  const qn = useMemo(() => norm(q), [q]);
  const tokens = useMemo(() => (qn ? qn.split(' ') : []), [qn]);
  const ready = qn.length >= 2;

  const [topics, setTopics] = useState([]);
  const [topicsState, setTopicsState] = useState('loading'); // loading | ok | failed
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => { setLimit(PAGE); }, [q, type]);

  // Tải chủ đề diễn đàn một lần, lọc trên máy (đủ nhanh với vài trăm bài).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*, topic_messages(count)')
          .order('last_reply_time', { ascending: false })
          .limit(500);
        if (error) throw error;
        if (alive) { setTopics(data || []); setTopicsState('ok'); }
      } catch (err) {
        console.error(err);
        if (alive) setTopicsState('failed');
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ---------- Mọi người ---------- */
  const profiles = useMemo(() => [...c.byEmail.values()], [c.byEmail]);
  const mutualMap = useMemo(() => {
    const m = new Map();
    [...c.suggestions, ...c.incoming, ...c.outgoing].forEach((p) => m.set(p.email, p.mutual));
    return m;
  }, [c.suggestions, c.incoming, c.outgoing]);

  const peopleRes = useMemo(() => {
    if (!ready || !c.me) return [];
    return profiles
      .filter((p) => p.email !== c.me)
      .map((p) => {
        const raw = Math.max(scoreText(qn, p.name), Math.round(scoreText(qn, p.bio, { fuzzy: false }) * 0.4));
        const friendBonus = raw > 0 && c.rel.get(p.email)?.state === 'friend' ? 8 : 0;
        return { item: p, score: raw + friendBonus };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (a.item.name || '').localeCompare(b.item.name || ''));
  }, [ready, qn, c.me, c.rel, profiles]);

  /* ---------- Nhóm (chủ đề diễn đàn) ---------- */
  const groupRes = useMemo(() => {
    if (!ready) return [];
    return topics
      .map((t) => {
        const desc = isUrl(t.description) ? '' : t.description;
        const score = Math.max(
          scoreText(qn, t.title),
          Math.round(scoreText(qn, t.author_name, { fuzzy: false }) * 0.6),
          Math.round(scoreText(qn, t.prefix, { fuzzy: false }) * 0.3),
          Math.round(scoreText(qn, desc, { fuzzy: false }) * 0.4)
        );
        return { item: t, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score); // cùng điểm giữ thứ tự mới nhất
  }, [ready, qn, topics]);

  /* ---------- Dự án ---------- */
  const projectRes = useMemo(() => {
    if (!ready) return [];
    return openSourceProjects
      .map((p) => ({
        item: p,
        score: Math.max(
          scoreText(qn, p.name),
          Math.round(scoreText(qn, p.description, { fuzzy: false }) * 0.5),
          Math.round(scoreText(qn, p.categoryName) * 0.6),
          Math.round(scoreText(qn, p.language, { fuzzy: false }) * 0.8)
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [ready, qn]);

  // Chỉ gọi GitHub/npm... khi từ khóa thật sự giống tên dự án, hoặc khi chẳng có gì khác khớp,
  // hoặc người dùng chủ động mở tab Dự án. Tránh kéo repo ngẫu nhiên khi đang tìm một người.
  const localDone = topicsState !== 'loading' && !c.loading;
  const needWeb = ready && (type === 'projects' || (localDone && (projectRes.length > 0 || (peopleRes.length === 0 && groupRes.length === 0))));
  const web = useProjectSearch(needWeb ? q : '');
  const webItems = useMemo(() => web.items.filter((i) => i.kind !== 'discussion'), [web.items]);

  /* ---------- Thứ tự các khối: khối nào khớp nhất lên đầu ---------- */
  const sections = useMemo(() => {
    const list = [
      { id: 'people', top: peopleRes[0]?.score || 0, n: peopleRes.length },
      { id: 'groups', top: groupRes[0]?.score || 0, n: groupRes.length },
      {
        id: 'projects',
        top: projectRes[0]?.score || (webItems.length || web.searching ? 10 : 0),
        n: projectRes.length + webItems.length,
        pending: web.searching,
      },
    ];
    return list.filter((s) => s.n > 0 || s.pending).sort((a, b) => b.top - a.top);
  }, [peopleRes, groupRes, projectRes, webItems.length, web.searching]);

  const counts = {
    all: null,
    people: c.me ? peopleRes.length : null,
    groups: groupRes.length,
    projects: projectRes.length + webItems.length,
  };

  const setType = (next) => {
    const nextParams = { q };
    if (next !== 'all') nextParams.type = next;
    setParams(nextParams);
  };

  /* ---------- Hành động kết bạn ---------- */
  const relationButtons = (p) => {
    const r = c.rel.get(p.email);
    if (r?.state === 'friend') return <span className="sr-pill">{L.is_friend}</span>;
    if (r?.state === 'incoming') {
      return (
        <>
          <button type="button" className="sr-btn sr-btn--primary" disabled={c.busy} onClick={() => c.accept(r.id)}>{L.confirm}</button>
          <button type="button" className="sr-btn" disabled={c.busy} onClick={() => c.removeRequest(r.id)}>{L.delete}</button>
        </>
      );
    }
    if (r?.state === 'outgoing') {
      return <button type="button" className="sr-btn" disabled={c.busy} onClick={() => c.removeRequest(r.id)}>{L.cancel_req}</button>;
    }
    return <button type="button" className="sr-btn sr-btn--primary" disabled={c.busy} onClick={() => c.sendRequest(p.email)}>{L.add}</button>;
  };

  /* ---------- Các khối hiển thị ---------- */
  const renderPeople = (focused) => {
    const rows = focused ? peopleRes.slice(0, limit) : peopleRes.slice(0, PREVIEW);
    return (
      <Card
        title={L.people}
        footer={
          focused
            ? (peopleRes.length > limit && <SeeAll onClick={() => setLimit((n) => n + PAGE)}>{L.show_more}</SeeAll>)
            : (peopleRes.length > PREVIEW && <SeeAll onClick={() => setType('people')}>{L.see_all}</SeeAll>)
        }
      >
        <ul className="sr-list">
          {rows.map(({ item: p }) => {
            const m = mutualMap.get(p.email);
            const isFriend = c.rel.get(p.email)?.state === 'friend';
            const sub = !isFriend && m > 0 ? fmt(L.mutual, { n: m }) : clip(p.bio, 90);
            return (
              <li key={p.email} className="sr-row">
                <Avatar p={p} />
                <div className="sr-row-main">
                  <div className="sr-name"><Hl text={p.name} tokens={tokens} /></div>
                  {sub && <div className="sr-meta">{sub}</div>}
                </div>
                <div className="sr-actions">{relationButtons(p)}</div>
              </li>
            );
          })}
        </ul>
      </Card>
    );
  };

  const renderGroups = (focused) => {
    const rows = focused ? groupRes.slice(0, limit) : groupRes.slice(0, PREVIEW);
    return (
      <Card
        title={L.groups}
        footer={
          focused
            ? (groupRes.length > limit && <SeeAll onClick={() => setLimit((n) => n + PAGE)}>{L.show_more}</SeeAll>)
            : (groupRes.length > PREVIEW && <SeeAll onClick={() => setType('groups')}>{L.see_all}</SeeAll>)
        }
      >
        <ul className="sr-list">
          {rows.map(({ item: t }) => {
            const replies = t.topic_messages?.[0]?.count || 0;
            const when = t.last_reply_time || t.created_at;
            const desc = isUrl(t.description) ? '' : clip(t.description);
            return (
              <li key={t.id} className="sr-row sr-row--top">
                <span className="sr-av sr-av--square" style={gradient(t.author_name || t.title)}>{initial(t.title)}</span>
                <div className="sr-row-main">
                  <div className="sr-name">
                    <Hl text={t.title} tokens={tokens} />
                    {t.prefix && <span className="sr-chip">{t.prefix}</span>}
                  </div>
                  <div className="sr-meta">
                    {t.author_name || '—'} · {replies} {L.replies}
                    {t.views_count != null && <> · {t.views_count} {L.views}</>}
                    {when && <> · {new Date(when).toLocaleDateString(lang === 'vi' ? 'vi-VN' : undefined)}</>}
                  </div>
                  {desc && <p className="sr-desc"><Hl text={desc} tokens={tokens} /></p>}
                </div>
                <div className="sr-actions">
                  <Link className="sr-btn sr-btn--primary" to={`/forum?thread=${t.id}`}>{L.view_topic}</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    );
  };

  const renderProjects = (focused) => {
    const local = focused ? projectRes : projectRes.slice(0, 4);
    const web_ = focused ? webItems.slice(0, limit) : webItems.slice(0, 3);
    const hasMore = focused
      ? webItems.length > limit
      : projectRes.length > 4 || webItems.length > 3;
    return (
      <Card
        title={L.projects}
        footer={
          focused
            ? (hasMore && <SeeAll onClick={() => setLimit((n) => n + PAGE)}>{L.show_more}</SeeAll>)
            : (hasMore && <SeeAll onClick={() => setType('projects')}>{L.see_all}</SeeAll>)
        }
      >
        <ul className="sr-list">
          {local.map(({ item: p }) => (
            <li key={`p${p.id}`} className="sr-row sr-row--top">
              {p.mediaType === 'image'
                ? <img className="sr-thumb" src={p.mediaUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                : <span className="sr-thumb" style={gradient(p.name)}>{initial(p.name)}</span>}
              <div className="sr-row-main">
                <div className="sr-name"><Hl text={p.name} tokens={tokens} /></div>
                <div className="sr-meta">{p.categoryName} · {p.language} · ★ {p.stars}</div>
                <p className="sr-desc"><Hl text={p.description} tokens={tokens} /></p>
              </div>
              <div className="sr-actions">
                <button type="button" className="sr-btn sr-btn--primary" onClick={() => selectProject(p)}>{L.quick_view}</button>
                <a className="sr-btn" href={p.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
              </div>
            </li>
          ))}
        </ul>

        {(web_.length > 0 || web.searching) && (
          <>
            <h3 className="sr-sub">{L.web_title}</h3>
            {web.searching && web_.length === 0 && <p className="sr-note">{L.searching_web}</p>}
            <ul className="sr-list">
              {web_.map((it) => (
                <li key={it.id} className="sr-row sr-row--top">
                  <span className="sr-thumb" style={gradient(it.sourceLabel || it.title)}>{initial(it.sourceLabel)}</span>
                  <div className="sr-row-main">
                    <div className="sr-name"><Hl text={it.title} tokens={tokens} /></div>
                    <div className="sr-meta">{it.sourceLabel}{it.author ? ` · ${it.author}` : ''}{it.meta ? ` · ${it.meta}` : ''}</div>
                    {it.summary && <p className="sr-desc">{clip(it.summary)}</p>}
                  </div>
                  <div className="sr-actions">
                    <a className="sr-btn" href={it.url} target="_blank" rel="noreferrer">↗</a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    );
  };

  const renderBlock = { people: renderPeople, groups: renderGroups, projects: renderProjects };

  const loginNote = (
    <Card title={L.people}>
      <p className="sr-note">{L.login_people}</p>
      <button type="button" className="sr-btn sr-btn--primary sr-btn--auto" onClick={() => openModal('signin')}>{L.signin}</button>
    </Card>
  );

  /* ---------- Nội dung chính ---------- */
  let body;
  const stillLoading = topicsState === 'loading' || (c.me && c.loading);
  if (!ready) {
    body = <p className="sr-empty">{L.no_query}</p>;
  } else if (type === 'all') {
    body = (
      <>
        {sections.map((s) => <div key={s.id}>{renderBlock[s.id](false)}</div>)}
        {!c.me && loginNote}
        {sections.length === 0 && stillLoading && <p className="sr-empty">{L.loading}</p>}
        {sections.length === 0 && !stillLoading && !web.searching && (
          <div className="sr-empty">
            <p>{fmt(L.no_results, { q })}</p>
            <p className="sr-note">{L.no_results_tip}</p>
          </div>
        )}
      </>
    );
  } else if (type === 'people' && !c.me) {
    body = loginNote;
  } else {
    const n = counts[type] || 0;
    body = n > 0 || (type === 'projects' && web.searching)
      ? renderBlock[type](true)
      : (
        <div className="sr-empty">
          <p>{stillLoading ? L.loading : fmt(L.no_results, { q })}</p>
          {!stillLoading && <p className="sr-note">{L.no_results_tip}</p>}
        </div>
      );
  }

  const toast = c.notice && (
    <div className={`sr-toast ${c.notice.type === 'err' ? 'is-err' : ''}`} role="status">
      {c.notice.type === 'err' ? c.notice.text : L[c.notice.key] || ''}
    </div>
  );

  return (
    <div className="sr">
      <TopNav />
      <div className="sr-shell">
        <aside className="sr-side">
          <h1 className="sr-title">{L.title}</h1>
          {q && <p className="sr-query">“{q}”</p>}
          <div className="sr-filter-h">{L.filters}</div>
          <nav className="sr-filters" aria-label={L.filters}>
            {TYPES.map((id) => (
              <button
                key={id}
                type="button"
                className={`sr-filter ${type === id ? 'is-on' : ''}`}
                aria-current={type === id ? 'true' : undefined}
                onClick={() => setType(id)}
              >
                <span>{L[id]}</span>
                {ready && counts[id] > 0 && <b>{counts[id]}</b>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="sr-main">
          {topicsState === 'failed' && ready && <p className="sr-note sr-note--warn">{L.topics_failed}</p>}
          {c.me && c.error === 'failed' && ready && <p className="sr-note sr-note--warn">{L.people_failed}</p>}
          {c.me && c.error === 'missing' && ready && <p className="sr-note sr-note--warn">{L.people_missing}</p>}
          {body}
        </main>
      </div>
      {toast}
    </div>
  );
}
