import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { useCommunity } from '../hooks/useCommunity';
import TopNav from './TopNav.jsx';
import { COMMUNITY_TEXT as TEXT } from './communityText';
import './CommunityHub.css';

/* Chữ của trang này nằm ở communityText.js (đủ 10 ngôn ngữ). */
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const SECTIONS = ['home', 'requests', 'suggestions', 'friends', 'birthdays', 'lists', 'topics', 'settings', 'search'];
const NEEDS_LOGIN = ['requests', 'suggestions', 'friends', 'birthdays', 'lists', 'search'];

const Ico = ({ children }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const ICON = {
  home: <Ico><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Ico>,
  requests: <Ico><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.4-3.4 2.7-5.5 6-5.5 1.2 0 2.3.3 3.2.8M17 14v6m0 0-2.5-2.5M17 20l2.5-2.5" /></Ico>,
  suggestions: <Ico><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.4-3.4 2.7-5.5 6-5.5M18 13v6M15 16h6" /></Ico>,
  friends: <Ico><circle cx="9" cy="8" r="3.2" /><path d="M2.8 20c.4-3.4 3-5.5 6.2-5.5s5.8 2.1 6.2 5.5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.6c2.6.1 4.4 1.8 4.7 4.4" /></Ico>,
  birthdays: <Ico><rect x="3" y="9" width="18" height="12" rx="1.5" /><path d="M3 13h18M12 9v12M12 9c-1.5-4-5-4-5-1.5C7 9 9 9 12 9zm0 0c1.5-4 5-4 5-1.5C17 9 15 9 12 9z" /></Ico>,
  lists: <Ico><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></Ico>,
  forum: <Ico><path d="M4 5h16v11H9l-5 4z" /></Ico>,
  topics: <Ico><path d="M4 4h16v12l-4 4H4zM16 20v-4h4M8 9h8M8 13h5" /></Ico>,
  settings: <Ico><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Ico>,
  search: <Ico><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.8-3.8" /></Ico>,
};

const NAV = [
  { id: 'home', key: 'nav_home' },
  { id: 'suggestions', key: 'nav_suggestions', chev: true },
  { id: 'friends', key: 'nav_friends', chev: true },
  { id: 'requests', key: 'nav_requests', chev: true },
  { id: 'lists', key: 'nav_lists', chev: true },
  { id: 'birthdays', key: 'nav_birthdays' },
];

const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');
const hueOf = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

const ROLES = [
  '⚡ Vibe Coder',
  '🚀 Fullstack Builder',
  '🤖 AI Engineer',
  '🎨 UI/UX Artisan',
  '🦀 Systems Dev',
  '🌱 Open Source Explorer',
];

const STACKS = [
  ['React 19', 'Tailwind', 'Cursor AI'],
  ['Next.js', 'TypeScript', 'Supabase'],
  ['Python', 'FastAPI', 'LLM Agent'],
  ['Node.js', 'PostgreSQL', 'Docker'],
  ['Vue 3', 'Vite', 'GraphQL'],
  ['Rust', 'WebAssembly', 'Tauri'],
];

function getDevProfile(p) {
  const hash = Math.abs([...(p.email || p.name || 'dev')].reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const role = ROLES[hash % ROLES.length];
  const stack = STACKS[hash % STACKS.length];
  const rawHandle = p.public_id ? `uid_${p.public_id.slice(-4)}` : (p.email ? p.email.split('@')[0] : 'builder');
  const handle = rawHandle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
  return { role, stack, handle };
}

/** Số ngày tới sinh nhật kế tiếp + tuổi sẽ tròn. */
function nextBirthday(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return { days: Math.round((next - today) / 86400000), age: next.getFullYear() - y, month: m, day: d };
}

/* ---------------- Thành phần nhỏ ---------------- */

function Avatar({ p, size = 'md' }) {
  const h = hueOf(p.email || p.name);
  const bg = `linear-gradient(135deg, hsl(${h} 65% 25%), hsl(${(h + 45) % 360} 70% 40%))`;
  return p.avatar_url ? (
    <img className={`ch-av ch-av--${size}`} src={p.avatar_url} alt={p.name || ''} referrerPolicy="no-referrer" />
  ) : (
    <span className={`ch-av ch-av--${size}`} style={{ background: bg }}>
      {initial(p.name)}
    </span>
  );
}

function PersonCard({ p, sub, children }) {
  const { role, stack, handle } = getDevProfile(p);
  const h = hueOf(p.email || p.name);
  const bannerBg = `linear-gradient(135deg, hsl(${h} 60% 16%), hsl(${(h + 45) % 360} 75% 26%))`;

  return (
    <article className="ch-dev-card">
      <div className="ch-dev-banner" style={{ background: bannerBg }}>
        <span className="ch-dev-role-badge">{role}</span>
      </div>
      <div className="ch-dev-body">
        <div className="ch-dev-avatar-wrap">
          <Avatar p={p} size="lg" />
          <span className="ch-dev-beacon" title="Active on GitXplore Network" />
        </div>
        <div className="ch-dev-header">
          <h3 className="ch-dev-name" title={p.name}>{p.name}</h3>
          <span className="ch-dev-handle">@{handle}</span>
        </div>

        <p className="ch-dev-bio" title={p.bio || sub}>
          {p.bio ? p.bio : (sub || 'Building open source projects & AI apps.')}
        </p>

        <div className="ch-dev-tags">
          {stack.map((t) => (
            <span key={t} className="ch-dev-tag">{t}</span>
          ))}
        </div>

        <div className="ch-dev-actions">
          {children}
        </div>
      </div>
    </article>
  );
}

function TopicCard({ topic, label, onOpen, onHide }) {
  const replies = topic.topic_messages?.[0]?.count || 0;
  const hash = Math.abs(hueOf(topic.title || ''));
  const cats = ['💡 Thảo luận', '🚀 Show Repo', '🤖 AI Vibe Coding', '📚 Hướng dẫn Dev'];
  const cat = cats[hash % cats.length];

  return (
    <article className="ch-topic-card">
      <div className="ch-topic-top">
        <span className="ch-topic-pill">{cat}</span>
        <span className="ch-topic-replies">💬 {replies} {label.replies}</span>
      </div>
      <h3 className="ch-topic-title" onClick={() => onOpen(topic)}>{topic.title}</h3>
      <div className="ch-topic-foot">
        <div className="ch-topic-author">
          <Avatar p={{ name: topic.author_name }} size="sm" />
          <span className="ch-topic-author-name">{topic.author_name || 'GitXplore Builder'}</span>
        </div>
        <div className="ch-topic-btns">
          <button type="button" className="ch-btn ch-btn--primary ch-btn--sm" onClick={() => onOpen(topic)}>
            {label.view_topic} →
          </button>
          <button type="button" className="ch-btn ch-btn--ghost ch-btn--sm" onClick={() => onHide(topic.id)} title={label.hide_topic}>
            ✕
          </button>
        </div>
      </div>
    </article>
  );
}

function ListMenu({ email, lists, label, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ch-pop-wrap">
      <button type="button" className="ch-btn ch-btn--secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label.in_list} ▾
      </button>
      {open && (
        <>
          <div className="ch-pop-back" onClick={() => setOpen(false)} />
          <div className="ch-pop" role="menu">
            {lists.length === 0 && <p className="ch-pop-empty">{label.list_none}</p>}
            {lists.map((l) => {
              const on = l.emails.includes(email);
              return (
                <button key={l.id} type="button" role="menuitemcheckbox" aria-checked={on}
                  className={`ch-pop-item ${on ? 'is-on' : ''}`} onClick={() => onToggle(l, email, on)}>
                  <span className="ch-pop-check">{on ? '✓' : ''}</span>{l.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Nút hành động theo quan hệ (dùng ở Gợi ý và Tìm kiếm). */
function RelationActions({ p, c, label, onHide }) {
  const r = c.rel.get(p.email);
  if (r?.state === 'friend') {
    return <span className="ch-pill-connected">{label.is_friend}</span>;
  }
  if (r?.state === 'incoming') {
    return (
      <div className="ch-action-duo">
        <button type="button" className="ch-btn ch-btn--primary" disabled={c.busy} onClick={() => c.accept(r.id)}>
          {label.confirm}
        </button>
        <button type="button" className="ch-btn ch-btn--secondary" disabled={c.busy} onClick={() => c.removeRequest(r.id)}>
          {label.delete}
        </button>
      </div>
    );
  }
  if (r?.state === 'outgoing') {
    return (
      <button type="button" className="ch-btn ch-btn--secondary" disabled={c.busy} onClick={() => c.removeRequest(r.id)}>
        {label.cancel_req}
      </button>
    );
  }
  return (
    <div className="ch-action-duo">
      <button type="button" className="ch-btn ch-btn--primary" disabled={c.busy} onClick={() => c.sendRequest(p.email)}>
        {label.add}
      </button>
      {onHide && (
        <button type="button" className="ch-btn ch-btn--ghost" onClick={() => onHide(p.email)} title={label.hide}>
          {label.hide}
        </button>
      )}
    </div>
  );
}

const mutualText = (p, label) => (p.mutual > 0 ? fmt(label.mutual, { n: p.mutual }) : label.no_mutual);

function Empty({ children }) {
  return (
    <div className="ch-empty-card">
      <span className="ch-empty-icon">⚡</span>
      <p className="ch-empty-text">{children}</p>
    </div>
  );
}

function SectionHead({ title, action, onAction, count, children }) {
  return (
    <div className="ch-section-head">
      <div className="ch-section-title-wrap">
        <h2 className="ch-h2">{title}</h2>
        {count !== undefined && <span className="ch-count-badge">{count}</span>}
      </div>
      {action && <button type="button" className="ch-link" onClick={onAction}>{action} →</button>}
      {children}
    </div>
  );
}

/* ---------------- Các mục chi tiết ---------------- */

function RequestsSection({ c, label, limit, go }) {
  const [tab, setTab] = useState('received');
  const received = tab === 'received';
  const list = received ? c.incoming : c.outgoing;
  const shown = limit ? list.slice(0, limit) : list;

  return (
    <section className="ch-section">
      <SectionHead
        title={label.req_title}
        action={limit ? label.see_all : null}
        onAction={() => go('requests')}
        count={c.incoming.length > 0 ? c.incoming.length : undefined}
      >
        {!limit && (
          <div className="ch-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={received} className={`ch-tab ${received ? 'is-on' : ''}`} onClick={() => setTab('received')}>
              {label.tab_received} {c.incoming.length > 0 && <b>{c.incoming.length}</b>}
            </button>
            <button type="button" role="tab" aria-selected={!received} className={`ch-tab ${!received ? 'is-on' : ''}`} onClick={() => setTab('sent')}>
              {label.tab_sent} {c.outgoing.length > 0 && <b>{c.outgoing.length}</b>}
            </button>
          </div>
        )}
      </SectionHead>
      {shown.length === 0 && <Empty>{received ? label.empty_req : label.empty_sent}</Empty>}
      <div className="ch-dev-grid">
        {shown.map((p) => (
          <PersonCard key={p.email} p={p} sub={mutualText(p, label)}>
            {received ? (
              <div className="ch-action-duo">
                <button type="button" className="ch-btn ch-btn--primary" disabled={c.busy} onClick={() => c.accept(p.requestId)}>
                  {label.confirm}
                </button>
                <button type="button" className="ch-btn ch-btn--secondary" disabled={c.busy} onClick={() => c.removeRequest(p.requestId)}>
                  {label.delete}
                </button>
              </div>
            ) : (
              <button type="button" className="ch-btn ch-btn--secondary" disabled={c.busy} onClick={() => c.removeRequest(p.requestId)}>
                {label.cancel_req}
              </button>
            )}
          </PersonCard>
        ))}
      </div>
    </section>
  );
}

function SuggestionsSection({ c, label, limit, go, filter = 'all' }) {
  const filtered = useMemo(() => {
    let list = c.suggestions;
    if (filter === 'vibe') {
      list = list.filter((p) => getDevProfile(p).role.includes('Vibe'));
    } else if (filter === 'ai') {
      list = list.filter((p) => getDevProfile(p).role.includes('AI'));
    } else if (filter === 'fullstack') {
      list = list.filter((p) => getDevProfile(p).role.includes('Fullstack') || getDevProfile(p).role.includes('Artisan'));
    }
    return list;
  }, [c.suggestions, filter]);

  const shown = limit ? filtered.slice(0, limit) : filtered;

  return (
    <section className="ch-section">
      <SectionHead
        title={label.sug_title}
        action={limit ? label.see_all : null}
        onAction={() => go('suggestions')}
        count={c.suggestions.length}
      />
      {shown.length === 0 && <Empty>{label.empty_sug}</Empty>}
      <div className="ch-dev-grid">
        {shown.map((p) => (
          <PersonCard key={p.email} p={p} sub={mutualText(p, label)}>
            <RelationActions p={p} c={c} label={label} onHide={c.hideSuggestion} />
          </PersonCard>
        ))}
      </div>
    </section>
  );
}

function FriendsSection({ c, label }) {
  const [q, setQ] = useState('');
  const shown = c.friends.filter((f) => f.name?.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (list, email, on) => (on ? c.removeFromList(list.id, email) : c.addToList(list.id, email));
  const drop = (p) => {
    if (window.confirm(fmt(label.unfriend_confirm, { name: p.name }))) c.unfriend(p.requestId, p.email);
  };

  return (
    <section className="ch-section">
      <SectionHead title={label.nav_friends} count={c.friends.length} />
      <div className="ch-search-bar-wrap">
        <input className="ch-input ch-input--search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={label.filter_ph} aria-label={label.filter_ph} />
      </div>
      {shown.length === 0 && <Empty>{c.friends.length === 0 ? label.empty_friends : label.empty_search}</Empty>}
      <div className="ch-dev-grid">
        {shown.map((p) => (
          <PersonCard key={p.email} p={p} sub={mutualText(p, label)}>
            <div className="ch-action-duo">
              <ListMenu email={p.email} lists={c.lists} label={label} onToggle={toggle} />
              <button type="button" className="ch-btn ch-btn--danger-ghost" disabled={c.busy} onClick={() => drop(p)}>
                {label.unfriend}
              </button>
            </div>
          </PersonCard>
        ))}
      </div>
    </section>
  );
}

function BirthdaysSection({ c, label, lang }) {
  const { today, upcoming, missing } = useMemo(() => {
    const t = []; const u = []; const m = [];
    c.friends.forEach((f) => {
      const nb = nextBirthday(f.birthday);
      if (!nb) m.push(f);
      else if (nb.days === 0) t.push({ ...f, nb });
      else if (nb.days <= 30) u.push({ ...f, nb });
    });
    u.sort((a, b) => a.nb.days - b.nb.days);
    return { today: t, upcoming: u, missing: m };
  }, [c.friends]);

  const dateText = (nb) => {
    try { return new Date(2000, nb.month - 1, nb.day).toLocaleDateString(lang, { day: 'numeric', month: 'long' }); }
    catch { return `${nb.day}/${nb.month}`; }
  };
  const when = (nb) => (nb.days === 1 ? label.bd_tomorrow : fmt(label.bd_in_days, { n: nb.days }));
  const age = (nb) => (nb.age > 0 && nb.age < 120 ? ` · ${fmt(label.bd_turning, { n: nb.age })}` : '');

  const Row = ({ p, right }) => {
    const { role } = getDevProfile(p);
    return (
      <li className="ch-milestone-row">
        <Avatar p={p} size="md" />
        <div className="ch-milestone-main">
          <div className="ch-milestone-name-wrap">
            <strong>{p.name}</strong>
            <span className="ch-milestone-badge">{role}</span>
          </div>
          <small>{p.nb ? `${dateText(p.nb)}${age(p.nb)}` : label.bd_missing}</small>
        </div>
        {right && <span className="ch-pill-accent">{right}</span>}
      </li>
    );
  };

  return (
    <section className="ch-section">
      <SectionHead title={label.nav_birthdays} />
      <div className="ch-milestone-block">
        <h3 className="ch-h3">🎉 {label.bd_today}</h3>
        {today.length === 0 ? <Empty>Hôm nay không có kỷ niệm nào</Empty> : (
          <ul className="ch-milestone-list">{today.map((p) => <Row key={p.email} p={p} right="🎂 Chúc mừng!" />)}</ul>
        )}

        <h3 className="ch-h3">⏳ {label.bd_upcoming}</h3>
        {upcoming.length === 0 ? <Empty>{label.bd_none}</Empty> : (
          <ul className="ch-milestone-list">{upcoming.map((p) => <Row key={p.email} p={p} right={when(p.nb)} />)}</ul>
        )}

        {missing.length > 0 && (
          <>
            <h3 className="ch-h3">📝 {label.bd_missing}</h3>
            <ul className="ch-milestone-list">{missing.map((p) => <Row key={p.email} p={p} />)}</ul>
          </>
        )}
      </div>
    </section>
  );
}

function ListsSection({ c, label, params, setParams }) {
  const [name, setName] = useState('');
  const [pick, setPick] = useState('');
  const selId = Number(params.get('list')) || null;
  const sel = c.lists.find((l) => l.id === selId) || null;
  const select = (id) => setParams(id ? { list: String(id) } : {});

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await c.createList(name);
    if (id) { setName(''); select(id); }
  };
  const rename = () => {
    const next = window.prompt(label.list_prompt, sel.name);
    if (next && next.trim() && next.trim() !== sel.name) c.renameList(sel.id, next);
  };
  const remove = async () => {
    if (!window.confirm(fmt(label.list_confirm, { name: sel.name }))) return;
    if (await c.deleteList(sel.id)) select(null);
  };
  const addPicked = async () => {
    if (!pick) return;
    if (await c.addToList(sel.id, pick)) setPick('');
  };

  const members = sel ? sel.emails.map((e) => c.person(e)) : [];
  const candidates = sel ? c.friends.filter((f) => !sel.emails.includes(f.email)) : [];

  return (
    <section className="ch-section">
      <SectionHead title={label.lists_title} count={c.lists.length} />
      <form className="ch-inline-form" onSubmit={create}>
        <input className="ch-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
          placeholder={label.list_new_ph} aria-label={label.list_new_ph} />
        <button type="submit" className="ch-btn ch-btn--primary ch-btn--auto" disabled={c.busy || !name.trim()}>
          {label.list_create}
        </button>
      </form>

      {c.lists.length === 0 ? <Empty>{label.list_none}</Empty> : (
        <div className="ch-squad-chips">
          {c.lists.map((l) => (
            <button key={l.id} type="button" className={`ch-squad-chip ${sel?.id === l.id ? 'is-on' : ''}`} onClick={() => select(l.id)}>
              <span className="ch-squad-icon">👥</span> {l.name} <b>{l.emails.length}</b>
            </button>
          ))}
        </div>
      )}

      {c.lists.length > 0 && !sel && <Empty>{label.list_pick_one}</Empty>}

      {sel && (
        <div className="ch-panel">
          <div className="ch-panel-head">
            <div>
              <h3 className="ch-h3 ch-h3--flat">Squad: {sel.name}</h3>
              <p className="ch-lead">{members.length} thành viên trong nhóm dự án</p>
            </div>
            <div className="ch-inline ch-inline--tight">
              <button type="button" className="ch-btn ch-btn--secondary ch-btn--auto" onClick={rename} disabled={c.busy}>{label.list_rename}</button>
              <button type="button" className="ch-btn ch-btn--danger-ghost ch-btn--auto" onClick={remove} disabled={c.busy}>{label.list_delete}</button>
            </div>
          </div>

          <div className="ch-inline-form">
            <select className="ch-input" value={pick} onChange={(e) => setPick(e.target.value)} aria-label={label.list_add_pick}>
              <option value="">{label.list_add_pick}</option>
              {candidates.map((f) => <option key={f.email} value={f.email}>{f.name} ({f.email})</option>)}
            </select>
            <button type="button" className="ch-btn ch-btn--primary ch-btn--auto" onClick={addPicked} disabled={c.busy || !pick}>{label.list_add}</button>
          </div>

          {members.length === 0 ? <Empty>{label.list_empty}</Empty> : (
            <div className="ch-dev-grid">
              {members.map((p) => (
                <PersonCard key={p.email} p={p} sub={label.no_mutual}>
                  <button type="button" className="ch-btn ch-btn--danger-ghost" disabled={c.busy} onClick={() => c.removeFromList(sel.id, p.email)}>
                    {label.list_remove}
                  </button>
                </PersonCard>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SearchSection({ c, label, q }) {
  const term = q.trim().toLowerCase();
  const idq = (/^(?:id\s*)?#?(\d{4,8})$/.exec(term) || [])[1];
  const results = useMemo(() => {
    if (!term) return [];
    return [...c.byEmail.values()]
      .filter((p) => p.email !== c.me && (p.name?.toLowerCase().includes(term) || p.email.includes(term) || (idq && p.public_id?.startsWith(idq))))
      .map((p) => ({ ...p, mutual: 0 }))
      .slice(0, 60);
  }, [c.byEmail, c.me, term, idq]);

  return (
    <section className="ch-section">
      <SectionHead title={fmt(label.search_title, { q })} count={results.length} />
      {results.length === 0 && <Empty>{label.empty_search}</Empty>}
      <div className="ch-dev-grid">
        {results.map((p) => (
          <PersonCard key={p.email} p={p} sub={p.bio || label.no_mutual}>
            <RelationActions p={p} c={c} label={label} />
          </PersonCard>
        ))}
      </div>
    </section>
  );
}

function LanguagePanel({ label }) {
  const { lang, setLang, languages } = useLanguage();
  return (
    <div className="ch-panel">
      <h3 className="ch-h3 ch-h3--flat">{label.lang_title}</h3>
      <p className="ch-lead">{label.lang_sub}</p>
      <ul className="ch-langs">
        {languages.map((l) => {
          const on = l.code === lang;
          return (
            <li key={l.code}>
              <button type="button" className={`ch-lang ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => setLang(l.code)}>
                <span className="ch-lang-flag" aria-hidden="true">{l.flag}</span>
                <span className="ch-lang-name">{l.label}</span>
                {on && <span className="ch-lang-tag">{label.current}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProfileForm({ c, label }) {
  const [form, setForm] = useState({ name: '', birthday: '', bio: '' });
  const p = c.myProfile;
  const [copied, setCopied] = useState(false);
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(p.public_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };
  useEffect(() => {
    setForm({ name: p?.name || '', birthday: p?.birthday || '', bio: p?.bio || '' });
  }, [p?.name, p?.birthday, p?.bio]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => { e.preventDefault(); c.saveProfile(form); };

  return (
    <form className="ch-panel ch-form" onSubmit={submit}>
      <h3 className="ch-h3 ch-h3--flat">{label.profile}</h3>
      {p?.public_id && (
        <div className="ch-uid-card">
          <div className="ch-uid-top">
            <span className="ch-uid-badge">{label.uid_label}</span>
            <button type="button" className="ch-btn ch-btn--sm ch-btn--secondary" onClick={copyId}>
              {copied ? label.uid_copied : label.uid_copy}
            </button>
          </div>
          <code className="ch-uid-code">#{p.public_id}</code>
          <p className="ch-uid-hint">{label.uid_hint}</p>
        </div>
      )}
      <label>{label.display_name}
        <input className="ch-input" value={form.name} maxLength={60} onChange={set('name')} />
      </label>
      <label>{label.birthday}
        <input className="ch-input" type="date" value={form.birthday} max={new Date().toISOString().slice(0, 10)} onChange={set('birthday')} />
      </label>
      <label>{label.bio}
        <textarea className="ch-input ch-textarea" value={form.bio} maxLength={200} placeholder={label.bio_ph} onChange={set('bio')} />
      </label>
      <button type="submit" className="ch-btn ch-btn--primary ch-btn--auto" disabled={c.busy}>{label.save}</button>
    </form>
  );
}

/* ---------------- Trang chính ---------------- */

export default function CommunityHub() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [params, setParams] = useSearchParams();
  const { lang } = useLanguage();
  const { openModal } = useUI();
  const label = { ...TEXT.en, ...(TEXT[lang] || {}) };
  const c = useCommunity();
  const loggedIn = Boolean(c.me);

  const [searchText, setSearchText] = useState(params.get('q') || '');
  const [topics, setTopics] = useState([]);
  const [topicsState, setTopicsState] = useState('loading');
  const [hiddenTopics, setHiddenTopics] = useState(() => new Set());
  const [hubFilter, setHubFilter] = useState('all');

  const active = section || 'home';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*, topic_messages(count)')
          .order('last_reply_time', { ascending: false })
          .limit(60);
        if (error) throw error;
        if (alive) { setTopics(data || []); setTopicsState('ok'); }
      } catch (err) {
        console.error(err);
        if (alive) setTopicsState('failed');
      }
    })();
    return () => { alive = false; };
  }, []);

  const visibleTopics = useMemo(() => topics.filter((t) => !hiddenTopics.has(t.id)), [topics, hiddenTopics]);

  const todayBirthdays = useMemo(
    () => c.friends.filter((f) => nextBirthday(f.birthday)?.days === 0),
    [c.friends]
  );

  if (section === 'language') return <Navigate to="/community/settings" replace />;
  if (!SECTIONS.includes(active)) return <Navigate to="/community" replace />;

  const go = (id) => navigate(id === 'home' ? '/community' : `/community/${id}`);
  const openTopic = (t) => navigate(`/community/forum?thread=${t.id}`);
  const onSearch = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    if (q) navigate(`/community/search?q=${encodeURIComponent(q)}`);
  };

  const needsLogin = NEEDS_LOGIN.includes(active) && !loggedIn;

  const topicsBlock = (limit) => {
    const list = limit ? visibleTopics.slice(0, limit) : visibleTopics;
    return (
      <section className="ch-section">
        <SectionHead title={label.topics_title} action={limit ? label.see_all : null} onAction={() => go('topics')} count={visibleTopics.length} />
        {topicsState === 'loading' && <Empty>{label.loading}</Empty>}
        {topicsState === 'failed' && <Empty>{label.err_failed}</Empty>}
        {topicsState === 'ok' && list.length === 0 && <Empty>{label.empty_topics}</Empty>}
        <div className="ch-topic-grid">
          {list.map((t) => (
            <TopicCard key={t.id} topic={t} label={label} onOpen={openTopic}
              onHide={(id) => setHiddenTopics((prev) => new Set(prev).add(id))} />
          ))}
        </div>
      </section>
    );
  };

  const loginPrompt = (
    <div className="ch-alert ch-alert--login">
      <div className="ch-alert-icon">⚡</div>
      <div className="ch-alert-body">
        <h4>Tham gia Mạng Lưới GitXplore</h4>
        <p>{label.login_need}</p>
        <button type="button" className="ch-btn ch-btn--primary ch-btn--auto" onClick={() => openModal('signin')}>
          {label.login_btn}
        </button>
      </div>
    </div>
  );

  const dataProblem = loggedIn && c.error && (
    <div className="ch-alert ch-alert--warn" role="alert">
      <strong>{c.error === 'missing' ? label.err_missing_title : label.err_failed}</strong>
      {c.error === 'missing' && <p>{label.err_missing_body}</p>}
      <button type="button" className="ch-btn ch-btn--auto" onClick={c.reload}>{label.retry}</button>
    </div>
  );

  const friendContent = () => {
    if (c.loading) return <Empty>{label.loading}</Empty>;
    if (c.error) return null;
    switch (active) {
      case 'requests': return <RequestsSection c={c} label={label} go={go} />;
      case 'suggestions': return <SuggestionsSection c={c} label={label} go={go} filter={hubFilter} />;
      case 'friends': return <FriendsSection c={c} label={label} />;
      case 'birthdays': return <BirthdaysSection c={c} label={label} lang={lang} />;
      case 'lists': return <ListsSection c={c} label={label} params={params} setParams={setParams} />;
      case 'search': return <SearchSection c={c} label={label} q={params.get('q') || ''} />;
      default: return null;
    }
  };

  const homeContent = () => (
    <>
      {/* ===== Hero Header Banner ===== */}
      <div className="ch-hero">
        <div className="ch-hero-content">
          <div className="ch-hero-badge">
            <span className="ch-hero-beacon" />
            <span>GITXPLORE BUILDER NETWORK</span>
          </div>
          <h1 className="ch-hero-title">⚡ Mạng Lưới Kỹ Sư & Vibe Coders</h1>
          <p className="ch-hero-desc">
            Không gian kết nối kỹ sư mã nguồn mở, Vibe Coders và AI Builders toàn cầu. Trao đổi prompt, tìm đồng đội làm dự án và cùng nhau kiến tạo tương lai phần mềm.
          </p>
          <div className="ch-hero-stats">
            <div className="ch-stat-pill">
              <strong>{c.friends.length}</strong>
              <span>Đã kết nối</span>
            </div>
            <div className="ch-stat-pill">
              <strong>{c.suggestions.length}</strong>
              <span>Builders đề xuất</span>
            </div>
            <div className="ch-stat-pill">
              <strong>{visibleTopics.length}</strong>
              <span>Chủ đề thảo luận</span>
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="ch-hero-filters">
          {[
            { id: 'all', label: '🌐 Tất cả Builders' },
            { id: 'vibe', label: '⚡ Vibe Coders' },
            { id: 'ai', label: '🤖 Trí tuệ AI' },
            { id: 'fullstack', label: '🚀 Fullstack & Web' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ch-filter-btn ${hubFilter === f.id ? 'is-active' : ''}`}
              onClick={() => setHubFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loggedIn && !c.loading && !c.error && todayBirthdays.length > 0 && (
        <button type="button" className="ch-celebrate-banner" onClick={() => go('birthdays')}>
          <span className="ch-celebrate-icon">🎉</span>
          <span>{fmt(label.bd_banner, { names: todayBirthdays.map((p) => p.name).join(', ') })}</span>
        </button>
      )}

      {!loggedIn && loginPrompt}
      {loggedIn && c.loading && <Empty>{label.loading}</Empty>}

      {loggedIn && !c.loading && !c.error && (
        <>
          {c.incoming.length > 0 && (
            <>
              <RequestsSection c={c} label={label} limit={4} go={go} />
              <div className="ch-divider" />
            </>
          )}
          <SuggestionsSection c={c} label={label} limit={6} go={go} filter={hubFilter} />
          <div className="ch-divider" />
        </>
      )}

      {topicsBlock(4)}
    </>
  );

  return (
    <div className="ch">
      <TopNav />

      <div className="ch-shell">
        {/* ===== TECH SIDEBAR ===== */}
        <aside className="ch-side" aria-label={label.title}>
          <div className="ch-side-top">
            <div className="ch-side-brand">
              <span className="ch-side-pulse" />
              <h2 className="ch-side-title">{label.title}</h2>
            </div>
            <button type="button" className="ch-gear-btn" onClick={() => go('settings')} aria-label={label.nav_settings} title={label.nav_settings}>
              {ICON.settings}
            </button>
          </div>

          <form className="ch-search-box" onSubmit={onSearch} role="search">
            <span className="ch-search-ico">{ICON.search}</span>
            <input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder={label.search_ph} aria-label={label.search_ph} />
          </form>

          <div className="ch-side-section">
            <p className="ch-side-label">KHÁM PHÁ & KẾT NỐI</p>
            <nav className="ch-nav">
              {NAV.map((it) => {
                const badge = it.id === 'requests' ? c.incoming.length : (it.id === 'friends' ? c.friends.length : 0);
                return (
                  <button key={it.id} type="button" className={`ch-item ${active === it.id ? 'is-on' : ''}`}
                    aria-current={active === it.id ? 'page' : undefined} onClick={() => go(it.id)}>
                    <span className="ch-ico">{ICON[it.id]}</span>
                    <span className="ch-item-label">{label[it.key]}</span>
                    {badge > 0 && <span className={`ch-badge ${it.id === 'requests' ? 'ch-badge--red' : ''}`}>{badge}</span>}
                    {it.chev && <span className="ch-chev" aria-hidden="true">›</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="ch-side-section">
            <p className="ch-side-label">{label.group_forum}</p>
            <nav className="ch-nav">
              <button type="button" className={`ch-item ${active === 'topics' ? 'is-on' : ''}`} onClick={() => go('topics')}>
                <span className="ch-ico">{ICON.topics}</span>
                <span className="ch-item-label">{label.nav_topics}</span>
                {visibleTopics.length > 0 && <span className="ch-badge ch-badge--subtle">{visibleTopics.length}</span>}
              </button>
            </nav>
          </div>

          <div className="ch-side-section">
            <p className="ch-side-label">{label.group_settings}</p>
            <nav className="ch-nav">
              <button type="button" className={`ch-item ${active === 'settings' ? 'is-on' : ''}`} onClick={() => go('settings')}>
                <span className="ch-ico">{ICON.settings}</span>
                <span className="ch-item-label">{label.nav_settings}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* ===== NỘI DUNG CHÍNH ===== */}
        <main className="ch-content">
          {NEEDS_LOGIN.includes(active) || active === 'home' ? dataProblem : null}

          {active === 'home' && homeContent()}
          {needsLogin && loginPrompt}
          {!needsLogin && NEEDS_LOGIN.includes(active) && friendContent()}
          {active === 'topics' && topicsBlock()}
          {active === 'settings' && (
            <section className="ch-section">
              <SectionHead title={label.settings_title} />
              {loggedIn ? (!c.loading && !c.error && <ProfileForm c={c} label={label} />) : loginPrompt}
              <LanguagePanel label={label} />
            </section>
          )}
        </main>
      </div>

      {c.notice && (
        <div className={`ch-toast ${c.notice.type === 'err' ? 'is-err' : ''}`} role="status">
          <span className="ch-toast-dot" />
          {c.notice.key ? label[c.notice.key] : c.notice.text}
        </div>
      )}
    </div>
  );
}
