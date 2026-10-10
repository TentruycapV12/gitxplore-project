import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { useCommunity } from '../hooks/useCommunity';
import TopNav from './TopNav.jsx';
import './CommunityHub.css';

/* Chữ của trang này. Chỉ có vi/en, ngôn ngữ khác tự rơi về tiếng Anh. */
const TEXT = {
  vi: {
    brand: 'GitXplore',
    title: 'Cộng đồng',
    search_ph: 'Tìm kiếm thành viên',
    group_forum: 'Diễn đàn',
    group_settings: 'Cài đặt',
    nav_home: 'Trang chủ',
    nav_requests: 'Lời mời kết bạn',
    nav_suggestions: 'Gợi ý',
    nav_friends: 'Tất cả bạn bè',
    nav_birthdays: 'Sinh nhật',
    nav_lists: 'Danh sách tùy chỉnh',
    nav_forum: 'Diễn đàn thảo luận',
    nav_topics: 'Chủ đề mới',
    nav_settings: 'Hồ sơ & ngôn ngữ',
    req_title: 'Lời mời kết bạn',
    sug_title: 'Những người bạn có thể biết',
    topics_title: 'Chủ đề mới',
    see_all: 'Xem tất cả',
    confirm: 'Xác nhận',
    delete: 'Xóa',
    add: 'Thêm bạn bè',
    cancel_req: 'Hủy lời mời',
    hide: 'Gỡ',
    unfriend: 'Hủy kết bạn',
    is_friend: '✓ Bạn bè',
    in_list: 'Danh sách',
    view_topic: 'Xem chủ đề',
    hide_topic: 'Ẩn',
    mutual: '{n} bạn chung',
    no_mutual: 'Thành viên GitXplore',
    replies: 'phản hồi',
    tab_received: 'Đã nhận',
    tab_sent: 'Đã gửi',
    empty_req: 'Bạn không có lời mời nào.',
    empty_sent: 'Bạn chưa gửi lời mời nào.',
    empty_sug: 'Chưa có gợi ý nào. Khi có thêm thành viên vào cộng đồng, họ sẽ xuất hiện ở đây.',
    empty_friends: 'Bạn chưa có bạn bè nào. Hãy xem mục Gợi ý.',
    empty_search: 'Không tìm thấy ai.',
    empty_topics: 'Chưa có chủ đề nào.',
    friends_count: '{n} người bạn',
    filter_ph: 'Tìm trong danh sách bạn bè',
    search_title: 'Kết quả cho “{q}”',
    bd_banner: '🎂 Hôm nay là sinh nhật của {names}',
    bd_today: 'Sinh nhật hôm nay',
    bd_upcoming: 'Sắp tới (30 ngày)',
    bd_none: 'Không có sinh nhật nào trong 30 ngày tới.',
    bd_missing: 'Chưa cập nhật ngày sinh',
    bd_tomorrow: 'Ngày mai',
    bd_in_days: 'Còn {n} ngày',
    bd_turning: 'tròn {n} tuổi',
    lists_title: 'Danh sách tùy chỉnh',
    list_new_ph: 'Tên danh sách mới',
    list_create: 'Tạo',
    list_rename: 'Đổi tên',
    list_delete: 'Xóa danh sách',
    list_none: 'Chưa có danh sách nào.',
    list_empty: 'Danh sách này chưa có ai.',
    list_add_pick: 'Chọn bạn bè để thêm…',
    list_add: 'Thêm',
    list_remove: 'Xóa khỏi danh sách',
    list_confirm: 'Xóa danh sách “{name}”?',
    list_prompt: 'Tên mới cho danh sách',
    list_pick_one: 'Chọn một danh sách để xem.',
    unfriend_confirm: 'Hủy kết bạn với {name}?',
    settings_title: 'Hồ sơ & ngôn ngữ',
    profile: 'Hồ sơ cộng đồng',
    display_name: 'Tên hiển thị',
    birthday: 'Ngày sinh',
    bio: 'Giới thiệu',
    bio_ph: 'Vài dòng về bạn…',
    save: 'Lưu thay đổi',
    lang_title: 'Ngôn ngữ',
    lang_sub: 'Chọn ngôn ngữ hiển thị của GitXplore. Lựa chọn được lưu trên trình duyệt này.',
    current: 'Đang dùng',
    login_need: 'Đăng nhập để dùng tính năng bạn bè của cộng đồng.',
    login_btn: 'Đăng nhập',
    err_missing_title: 'Chưa thiết lập cơ sở dữ liệu cộng đồng',
    err_missing_body: 'Chạy file community_setup.sql trong Supabase → SQL Editor một lần, rồi bấm Thử lại.',
    err_failed: 'Không tải được dữ liệu cộng đồng.',
    retry: 'Thử lại',
    loading: 'Đang tải…',
    n_sent: 'Đã gửi lời mời kết bạn',
    n_accepted: 'Các bạn đã trở thành bạn bè',
    n_removed: 'Đã xóa',
    n_unfriended: 'Đã hủy kết bạn',
    n_list_created: 'Đã tạo danh sách',
    n_list_deleted: 'Đã xóa danh sách',
    n_list_updated: 'Đã cập nhật danh sách',
    n_saved: 'Đã lưu hồ sơ',
  },
  en: {
    brand: 'GitXplore',
    title: 'Community',
    search_ph: 'Search members',
    group_forum: 'Forum',
    group_settings: 'Settings',
    nav_home: 'Home',
    nav_requests: 'Friend requests',
    nav_suggestions: 'Suggestions',
    nav_friends: 'All friends',
    nav_birthdays: 'Birthdays',
    nav_lists: 'Custom lists',
    nav_forum: 'Discussion forum',
    nav_topics: 'New topics',
    nav_settings: 'Profile & language',
    req_title: 'Friend requests',
    sug_title: 'People you may know',
    topics_title: 'New topics',
    see_all: 'See all',
    confirm: 'Confirm',
    delete: 'Delete',
    add: 'Add friend',
    cancel_req: 'Cancel request',
    hide: 'Remove',
    unfriend: 'Unfriend',
    is_friend: '✓ Friends',
    in_list: 'Lists',
    view_topic: 'View topic',
    hide_topic: 'Hide',
    mutual: '{n} mutual friends',
    no_mutual: 'GitXplore member',
    replies: 'replies',
    tab_received: 'Received',
    tab_sent: 'Sent',
    empty_req: 'You have no requests.',
    empty_sent: "You haven't sent any requests.",
    empty_sug: 'No suggestions yet. They will show up as more members join the community.',
    empty_friends: 'You have no friends yet. Check out Suggestions.',
    empty_search: 'No one found.',
    empty_topics: 'No topics yet.',
    friends_count: '{n} friends',
    filter_ph: 'Search your friends',
    search_title: 'Results for “{q}”',
    bd_banner: '🎂 Today is the birthday of {names}',
    bd_today: "Today's birthdays",
    bd_upcoming: 'Upcoming (30 days)',
    bd_none: 'No birthdays in the next 30 days.',
    bd_missing: 'Birthday not set',
    bd_tomorrow: 'Tomorrow',
    bd_in_days: 'In {n} days',
    bd_turning: 'turning {n}',
    lists_title: 'Custom lists',
    list_new_ph: 'New list name',
    list_create: 'Create',
    list_rename: 'Rename',
    list_delete: 'Delete list',
    list_none: 'No lists yet.',
    list_empty: 'This list is empty.',
    list_add_pick: 'Pick a friend to add…',
    list_add: 'Add',
    list_remove: 'Remove from list',
    list_confirm: 'Delete the list “{name}”?',
    list_prompt: 'New name for the list',
    list_pick_one: 'Pick a list to view it.',
    unfriend_confirm: 'Unfriend {name}?',
    settings_title: 'Profile & language',
    profile: 'Community profile',
    display_name: 'Display name',
    birthday: 'Birthday',
    bio: 'About',
    bio_ph: 'A few lines about you…',
    save: 'Save changes',
    lang_title: 'Language',
    lang_sub: 'Choose the display language for GitXplore. Saved on this browser.',
    current: 'Current',
    login_need: 'Sign in to use the community friends features.',
    login_btn: 'Sign in',
    err_missing_title: 'Community database is not set up',
    err_missing_body: 'Run community_setup.sql once in Supabase → SQL Editor, then press Retry.',
    err_failed: "Couldn't load community data.",
    retry: 'Retry',
    loading: 'Loading…',
    n_sent: 'Friend request sent',
    n_accepted: 'You are now friends',
    n_removed: 'Removed',
    n_unfriended: 'Unfriended',
    n_list_created: 'List created',
    n_list_deleted: 'List deleted',
    n_list_updated: 'List updated',
    n_saved: 'Profile saved',
  },
};

const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const SECTIONS = ['home', 'requests', 'suggestions', 'friends', 'birthdays', 'lists', 'topics', 'settings', 'search'];
const NEEDS_LOGIN = ['requests', 'suggestions', 'friends', 'birthdays', 'lists', 'search'];

const Ico = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
  { id: 'requests', key: 'nav_requests', chev: true },
  { id: 'suggestions', key: 'nav_suggestions', chev: true },
  { id: 'friends', key: 'nav_friends', chev: true },
  { id: 'birthdays', key: 'nav_birthdays' },
  { id: 'lists', key: 'nav_lists', chev: true },
];

const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');
const hueOf = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const coverStyle = (p) => {
  const h = hueOf(p.email || p.name);
  return { background: `linear-gradient(135deg, hsl(${h} 55% 28%), hsl(${(h + 45) % 360} 70% 42%))` };
};

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

function PersonCard({ p, sub, children }) {
  return (
    <article className="ch-card">
      <div className="ch-card-cover" style={p.avatar_url ? undefined : coverStyle(p)}>
        {p.avatar_url
          ? <img src={p.avatar_url} alt="" referrerPolicy="no-referrer" />
          : <span>{initial(p.name)}</span>}
      </div>
      <div className="ch-card-body">
        <h3 className="ch-card-title">{p.name}</h3>
        <p className="ch-card-meta">{sub}</p>
        {children}
      </div>
    </article>
  );
}

function Avatar({ p }) {
  return p.avatar_url
    ? <img className="ch-av" src={p.avatar_url} alt="" referrerPolicy="no-referrer" />
    : <span className="ch-av" style={coverStyle(p)}>{initial(p.name)}</span>;
}

function TopicCard({ topic, label, onOpen, onHide }) {
  const replies = topic.topic_messages?.[0]?.count || 0;
  return (
    <article className="ch-card">
      <div className="ch-card-cover" style={coverStyle({ name: topic.author_name })}>
        <span>{initial(topic.author_name)}</span>
      </div>
      <div className="ch-card-body">
        <h3 className="ch-card-title">{topic.title}</h3>
        <p className="ch-card-meta">{topic.author_name || '—'} · {replies} {label.replies}</p>
        <button type="button" className="ch-btn ch-btn--primary" onClick={() => onOpen(topic)}>{label.view_topic}</button>
        <button type="button" className="ch-btn" onClick={() => onHide(topic.id)}>{label.hide_topic}</button>
      </div>
    </article>
  );
}

function ListMenu({ email, lists, label, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ch-pop-wrap">
      <button type="button" className="ch-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
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
  if (r?.state === 'friend') return <span className="ch-pill">{label.is_friend}</span>;
  if (r?.state === 'incoming') {
    return (
      <>
        <button type="button" className="ch-btn ch-btn--primary" disabled={c.busy} onClick={() => c.accept(r.id)}>{label.confirm}</button>
        <button type="button" className="ch-btn" disabled={c.busy} onClick={() => c.removeRequest(r.id)}>{label.delete}</button>
      </>
    );
  }
  if (r?.state === 'outgoing') {
    return <button type="button" className="ch-btn" disabled={c.busy} onClick={() => c.removeRequest(r.id)}>{label.cancel_req}</button>;
  }
  return (
    <>
      <button type="button" className="ch-btn ch-btn--primary" disabled={c.busy} onClick={() => c.sendRequest(p.email)}>{label.add}</button>
      {onHide && <button type="button" className="ch-btn" onClick={() => onHide(p.email)}>{label.hide}</button>}
    </>
  );
}

const mutualText = (p, label) => (p.mutual > 0 ? fmt(label.mutual, { n: p.mutual }) : label.no_mutual);

function Empty({ children }) { return <p className="ch-status">{children}</p>; }

function SectionHead({ title, action, onAction, children }) {
  return (
    <div className="ch-section-head">
      <h2 className="ch-h2">{title}</h2>
      {action && <button type="button" className="ch-link" onClick={onAction}>{action}</button>}
      {children}
    </div>
  );
}

/* ---------------- Các mục ---------------- */

function RequestsSection({ c, label, limit, go }) {
  const [tab, setTab] = useState('received');
  const received = tab === 'received';
  const list = received ? c.incoming : c.outgoing;
  const shown = limit ? list.slice(0, limit) : list;
  return (
    <section className="ch-section">
      <SectionHead title={label.req_title} action={limit ? label.see_all : null} onAction={() => go('requests')}>
        {!limit && (
          <div className="ch-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={received} className={`ch-tab ${received ? 'is-on' : ''}`} onClick={() => setTab('received')}>
              {label.tab_received}{c.incoming.length > 0 && <b>{c.incoming.length}</b>}
            </button>
            <button type="button" role="tab" aria-selected={!received} className={`ch-tab ${!received ? 'is-on' : ''}`} onClick={() => setTab('sent')}>
              {label.tab_sent}{c.outgoing.length > 0 && <b>{c.outgoing.length}</b>}
            </button>
          </div>
        )}
      </SectionHead>
      {shown.length === 0 && <Empty>{received ? label.empty_req : label.empty_sent}</Empty>}
      <div className="ch-grid">
        {shown.map((p) => (
          <PersonCard key={p.email} p={p} sub={mutualText(p, label)}>
            {received ? (
              <>
                <button type="button" className="ch-btn ch-btn--primary" disabled={c.busy} onClick={() => c.accept(p.requestId)}>{label.confirm}</button>
                <button type="button" className="ch-btn" disabled={c.busy} onClick={() => c.removeRequest(p.requestId)}>{label.delete}</button>
              </>
            ) : (
              <button type="button" className="ch-btn" disabled={c.busy} onClick={() => c.removeRequest(p.requestId)}>{label.cancel_req}</button>
            )}
          </PersonCard>
        ))}
      </div>
    </section>
  );
}

function SuggestionsSection({ c, label, limit, go }) {
  const shown = limit ? c.suggestions.slice(0, limit) : c.suggestions;
  return (
    <section className="ch-section">
      <SectionHead title={label.sug_title} action={limit ? label.see_all : null} onAction={() => go('suggestions')} />
      {shown.length === 0 && <Empty>{label.empty_sug}</Empty>}
      <div className="ch-grid">
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
      <SectionHead title={label.nav_friends}>
        <span className="ch-count">{fmt(label.friends_count, { n: c.friends.length })}</span>
      </SectionHead>
      <input className="ch-input ch-input--wide" type="search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={label.filter_ph} aria-label={label.filter_ph} />
      {shown.length === 0 && <Empty>{c.friends.length === 0 ? label.empty_friends : label.empty_search}</Empty>}
      <div className="ch-grid">
        {shown.map((p) => (
          <PersonCard key={p.email} p={p} sub={mutualText(p, label)}>
            <ListMenu email={p.email} lists={c.lists} label={label} onToggle={toggle} />
            <button type="button" className="ch-btn" disabled={c.busy} onClick={() => drop(p)}>{label.unfriend}</button>
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

  const Row = ({ p, right }) => (
    <li className="ch-row">
      <Avatar p={p} />
      <div className="ch-row-main">
        <strong>{p.name}</strong>
        <small>{p.nb ? `${dateText(p.nb)}${age(p.nb)}` : ''}</small>
      </div>
      {right && <span className="ch-pill ch-pill--accent">{right}</span>}
    </li>
  );

  return (
    <section className="ch-section">
      <SectionHead title={label.nav_birthdays} />
      <h3 className="ch-h3">🎂 {label.bd_today}</h3>
      {today.length === 0 ? <Empty>—</Empty> : (
        <ul className="ch-rows">{today.map((p) => <Row key={p.email} p={p} right="🎉" />)}</ul>
      )}
      <h3 className="ch-h3">{label.bd_upcoming}</h3>
      {upcoming.length === 0 ? <Empty>{label.bd_none}</Empty> : (
        <ul className="ch-rows">{upcoming.map((p) => <Row key={p.email} p={p} right={when(p.nb)} />)}</ul>
      )}
      {missing.length > 0 && (
        <>
          <h3 className="ch-h3">{label.bd_missing}</h3>
          <ul className="ch-rows">{missing.map((p) => <Row key={p.email} p={p} />)}</ul>
        </>
      )}
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
      <SectionHead title={label.lists_title} />
      <form className="ch-inline" onSubmit={create}>
        <input className="ch-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
          placeholder={label.list_new_ph} aria-label={label.list_new_ph} />
        <button type="submit" className="ch-btn ch-btn--primary ch-btn--auto" disabled={c.busy || !name.trim()}>{label.list_create}</button>
      </form>

      {c.lists.length === 0 ? <Empty>{label.list_none}</Empty> : (
        <div className="ch-chips">
          {c.lists.map((l) => (
            <button key={l.id} type="button" className={`ch-chip ${sel?.id === l.id ? 'is-on' : ''}`} onClick={() => select(l.id)}>
              {l.name} <b>{l.emails.length}</b>
            </button>
          ))}
        </div>
      )}

      {c.lists.length > 0 && !sel && <Empty>{label.list_pick_one}</Empty>}

      {sel && (
        <div className="ch-panel">
          <div className="ch-panel-head">
            <h3 className="ch-h3 ch-h3--flat">{sel.name}</h3>
            <div className="ch-inline ch-inline--tight">
              <button type="button" className="ch-btn ch-btn--auto" onClick={rename} disabled={c.busy}>{label.list_rename}</button>
              <button type="button" className="ch-btn ch-btn--auto ch-btn--danger" onClick={remove} disabled={c.busy}>{label.list_delete}</button>
            </div>
          </div>

          <div className="ch-inline">
            <select className="ch-input" value={pick} onChange={(e) => setPick(e.target.value)} aria-label={label.list_add_pick}>
              <option value="">{label.list_add_pick}</option>
              {candidates.map((f) => <option key={f.email} value={f.email}>{f.name}</option>)}
            </select>
            <button type="button" className="ch-btn ch-btn--primary ch-btn--auto" onClick={addPicked} disabled={c.busy || !pick}>{label.list_add}</button>
          </div>

          {members.length === 0 ? <Empty>{label.list_empty}</Empty> : (
            <div className="ch-grid">
              {members.map((p) => (
                <PersonCard key={p.email} p={p} sub={mutualText({ mutual: 0 }, label)}>
                  <button type="button" className="ch-btn" disabled={c.busy} onClick={() => c.removeFromList(sel.id, p.email)}>{label.list_remove}</button>
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
  const results = useMemo(() => {
    if (!term) return [];
    return [...c.byEmail.values()]
      .filter((p) => p.email !== c.me && (p.name?.toLowerCase().includes(term) || p.email.includes(term)))
      .map((p) => ({ ...p, mutual: 0 }))
      .slice(0, 60);
  }, [c.byEmail, c.me, term]);
  return (
    <section className="ch-section">
      <SectionHead title={fmt(label.search_title, { q })} />
      {results.length === 0 && <Empty>{label.empty_search}</Empty>}
      <div className="ch-grid">
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
  useEffect(() => {
    setForm({ name: p?.name || '', birthday: p?.birthday || '', bio: p?.bio || '' });
  }, [p?.name, p?.birthday, p?.bio]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => { e.preventDefault(); c.saveProfile(form); };
  return (
    <form className="ch-panel ch-form" onSubmit={submit}>
      <h3 className="ch-h3 ch-h3--flat">{label.profile}</h3>
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
  const label = TEXT[lang] || TEXT.en;
  const c = useCommunity();
  const loggedIn = Boolean(c.me);

  const [searchText, setSearchText] = useState(params.get('q') || '');
  const [topics, setTopics] = useState([]);
  const [topicsState, setTopicsState] = useState('loading'); // loading | ok | failed
  const [hiddenTopics, setHiddenTopics] = useState(() => new Set());

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
        <SectionHead title={label.topics_title} action={limit ? label.see_all : null} onAction={() => go('topics')} />
        {topicsState === 'loading' && <Empty>{label.loading}</Empty>}
        {topicsState === 'failed' && <Empty>{label.err_failed}</Empty>}
        {topicsState === 'ok' && list.length === 0 && <Empty>{label.empty_topics}</Empty>}
        <div className="ch-grid">
          {list.map((t) => (
            <TopicCard key={t.id} topic={t} label={label} onOpen={openTopic}
              onHide={(id) => setHiddenTopics((prev) => new Set(prev).add(id))} />
          ))}
        </div>
      </section>
    );
  };

  const loginPrompt = (
    <div className="ch-alert">
      <p>{label.login_need}</p>
      <button type="button" className="ch-btn ch-btn--primary ch-btn--auto" onClick={() => openModal('signin')}>{label.login_btn}</button>
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
      case 'suggestions': return <SuggestionsSection c={c} label={label} go={go} />;
      case 'friends': return <FriendsSection c={c} label={label} />;
      case 'birthdays': return <BirthdaysSection c={c} label={label} lang={lang} />;
      case 'lists': return <ListsSection c={c} label={label} params={params} setParams={setParams} />;
      case 'search': return <SearchSection c={c} label={label} q={params.get('q') || ''} />;
      default: return null;
    }
  };

  const homeContent = () => (
    <>
      {loggedIn && !c.loading && !c.error && todayBirthdays.length > 0 && (
        <button type="button" className="ch-banner" onClick={() => go('birthdays')}>
          {fmt(label.bd_banner, { names: todayBirthdays.map((p) => p.name).join(', ') })}
        </button>
      )}
      {!loggedIn && loginPrompt}
      {loggedIn && c.loading && <Empty>{label.loading}</Empty>}
      {loggedIn && !c.loading && !c.error && (
        <>
          {c.incoming.length > 0 && (
            <>
              <RequestsSection c={c} label={label} limit={5} go={go} />
              <hr className="ch-hr" />
            </>
          )}
          <SuggestionsSection c={c} label={label} limit={6} go={go} />
          <hr className="ch-hr" />
        </>
      )}
      {topicsBlock(4)}
    </>
  );

  return (
    <div className="ch">
      <TopNav />

      <div className="ch-shell">
        {/* ===== SIDEBAR ===== */}
        <aside className="ch-side" aria-label={label.title}>
          <div className="ch-side-top">
            <h1 className="ch-title">{label.title}</h1>
            <button type="button" className="ch-gear" onClick={() => go('settings')} aria-label={label.nav_settings} title={label.nav_settings}>
              {ICON.settings}
            </button>
          </div>

          <form className="ch-search" onSubmit={onSearch} role="search">
            <span className="ch-search-ico">{ICON.search}</span>
            <input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder={label.search_ph} aria-label={label.search_ph} />
          </form>

          <nav className="ch-nav" aria-label={label.title}>
            {NAV.map((it) => {
              const badge = it.id === 'requests' ? c.incoming.length : 0;
              return (
                <button key={it.id} type="button" className={`ch-item ${active === it.id ? 'is-on' : ''}`}
                  aria-current={active === it.id ? 'page' : undefined} onClick={() => go(it.id)}>
                  <span className="ch-ico">{ICON[it.id]}</span>
                  <span className="ch-item-label">{label[it.key]}</span>
                  {badge > 0 && <span className="ch-badge">{badge}</span>}
                  {it.chev && <span className="ch-chev" aria-hidden="true">›</span>}
                </button>
              );
            })}
          </nav>

          <div className="ch-zone">
            <p className="ch-group">{label.group_forum}</p>
            <nav className="ch-nav">
              <button type="button" className="ch-item" onClick={() => navigate('/community/forum')}>
                <span className="ch-ico">{ICON.forum}</span><span className="ch-item-label">{label.nav_forum}</span>
                <span className="ch-chev" aria-hidden="true">›</span>
              </button>
              <button type="button" className={`ch-item ${active === 'topics' ? 'is-on' : ''}`} onClick={() => go('topics')}>
                <span className="ch-ico">{ICON.topics}</span><span className="ch-item-label">{label.nav_topics}</span>
              </button>
            </nav>
          </div>

          <div className="ch-zone">
            <p className="ch-group">{label.group_settings}</p>
            <nav className="ch-nav">
              <button type="button" className={`ch-item ${active === 'settings' ? 'is-on' : ''}`} onClick={() => go('settings')}>
                <span className="ch-ico">{ICON.settings}</span><span className="ch-item-label">{label.nav_settings}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* ===== NỘI DUNG ===== */}
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
          {c.notice.key ? label[c.notice.key] : c.notice.text}
        </div>
      )}
    </div>
  );
}
