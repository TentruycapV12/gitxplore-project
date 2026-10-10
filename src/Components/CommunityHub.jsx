import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import TopNav from '../Components/TopNav.jsx';
import './CommunityHub.css';

/* Chữ của trang này. Chỉ có vi/en, ngôn ngữ khác tự rơi về tiếng Anh. */
const TEXT = {
  vi: {
    brand: 'GitXplore',
    title: 'Cộng đồng',
    sub: 'Thảo luận, hỏi đáp và kết nối với các lập trình viên khác trên GitXplore.',
    home: 'Trang chủ cộng đồng',
    group_explore: 'Khám phá',
    group_settings: 'Cài đặt',
    forum: 'Diễn đàn thảo luận',
    topics: 'Chủ đề mới',
    members: 'Thành viên',
    language: 'Ngôn ngữ',
    topics_title: 'Chủ đề mới',
    members_title: 'Thành viên bạn có thể biết',
    see_all: 'Xem tất cả',
    open: 'Xem chủ đề',
    hide: 'Ẩn',
    view_posts: 'Xem bài viết',
    replies: 'phản hồi',
    posts: 'bài viết',
    loading: 'Đang tải…',
    empty: 'Chưa có chủ đề nào.',
    failed: 'Không tải được dữ liệu. Thử lại sau nhé.',
    lang_title: 'Ngôn ngữ',
    lang_sub: 'Chọn ngôn ngữ hiển thị của GitXplore. Lựa chọn được lưu trên trình duyệt này.',
    current: 'Đang dùng',
    open_forum: 'Mở diễn đàn',
  },
  en: {
    brand: 'GitXplore',
    title: 'Community',
    sub: 'Discuss, ask questions and connect with other developers on GitXplore.',
    home: 'Community home',
    group_explore: 'Explore',
    group_settings: 'Settings',
    forum: 'Discussion forum',
    topics: 'New topics',
    members: 'Members',
    language: 'Language',
    topics_title: 'New topics',
    members_title: 'People you may know',
    see_all: 'See all',
    open: 'View topic',
    hide: 'Hide',
    view_posts: 'View posts',
    replies: 'replies',
    posts: 'posts',
    loading: 'Loading…',
    empty: 'No topics yet.',
    failed: "Couldn't load data. Please try again later.",
    lang_title: 'Language',
    lang_sub: 'Choose the display language for GitXplore. Saved on this browser.',
    current: 'Current',
    open_forum: 'Open forum',
  },
};

const MENU = [
  { id: 'topics', icon: '💬', key: 'topics' },
  { id: 'members', icon: '👥', key: 'members' },
];
const SECTIONS = ['home', 'topics', 'members', 'language'];

const initial = (name) => (name ? String(name).trim().charAt(0).toUpperCase() : '?');

function TopicCard({ topic, label, onOpen, onHide }) {
  const replies = topic.topic_messages?.[0]?.count || 0;
  return (
    <article className="ch-card">
      <div className="ch-card-cover">
        <span>{initial(topic.author_name)}</span>
      </div>
      <div className="ch-card-body">
        <h3 className="ch-card-title">{topic.title}</h3>
        <p className="ch-card-meta">
          {topic.author_name || '—'} · {replies} {label.replies}
        </p>
        <button type="button" className="ch-btn ch-btn--primary" onClick={() => onOpen(topic)}>
          {label.open}
        </button>
        <button type="button" className="ch-btn" onClick={() => onHide(topic.id)}>
          {label.hide}
        </button>
      </div>
    </article>
  );
}

function MemberCard({ member, label, onOpen }) {
  return (
    <article className="ch-card">
      <div className="ch-card-cover ch-card-cover--member">
        <span>{initial(member.name)}</span>
      </div>
      <div className="ch-card-body">
        <h3 className="ch-card-title">{member.name}</h3>
        <p className="ch-card-meta">
          {member.count} {label.posts}
        </p>
        <button type="button" className="ch-btn ch-btn--primary" onClick={() => onOpen(member)}>
          {label.view_posts}
        </button>
      </div>
    </article>
  );
}

function LanguagePanel({ label }) {
  const { lang, setLang, languages } = useLanguage();
  return (
    <section className="ch-section">
      <h2 className="ch-h2">{label.lang_title}</h2>
      <p className="ch-lead">{label.lang_sub}</p>
      <ul className="ch-langs">
        {languages.map((l) => {
          const on = l.code === lang;
          return (
            <li key={l.code}>
              <button
                type="button"
                className={`ch-lang ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                onClick={() => setLang(l.code)}
              >
                <span className="ch-lang-flag" aria-hidden="true">{l.flag}</span>
                <span className="ch-lang-name">{l.label}</span>
                {on && <span className="ch-lang-tag">{label.current}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function CommunityHub() {
  const navigate = useNavigate();
  const { section } = useParams();
  const { lang } = useLanguage();
  const label = TEXT[lang] || TEXT.en;

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hidden, setHidden] = useState(() => new Set());

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
        if (alive) setTopics(data || []);
      } catch (err) {
        console.error(err);
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const visibleTopics = useMemo(() => topics.filter((t) => !hidden.has(t.id)), [topics, hidden]);

  // Gom tác giả từ các chủ đề để làm danh sách "thành viên".
  const members = useMemo(() => {
    const map = new Map();
    topics.forEach((t) => {
      if (!t.author_name) return;
      const m = map.get(t.author_name) || { name: t.author_name, count: 0, firstTopic: t };
      m.count += 1;
      map.set(t.author_name, m);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [topics]);

  if (!SECTIONS.includes(active)) return <Navigate to="/community" replace />;

  const go = (id) => navigate(id === 'home' ? '/community' : `/community/${id}`);
  const openTopic = (t) => navigate(`/community/forum?thread=${t.id}`);
  const hideTopic = (id) => setHidden((prev) => new Set(prev).add(id));

  const status = loading ? label.loading : failed ? label.failed : null;

  const topicsBlock = (limit) => {
    const list = limit ? visibleTopics.slice(0, limit) : visibleTopics;
    return (
      <section className="ch-section">
        <div className="ch-section-head">
          <h2 className="ch-h2">{label.topics_title}</h2>
          {limit && (
            <button type="button" className="ch-link" onClick={() => go('topics')}>{label.see_all}</button>
          )}
        </div>
        {status && <p className="ch-status">{status}</p>}
        {!status && list.length === 0 && <p className="ch-status">{label.empty}</p>}
        <div className="ch-grid">
          {list.map((t) => (
            <TopicCard key={t.id} topic={t} label={label} onOpen={openTopic} onHide={hideTopic} />
          ))}
        </div>
      </section>
    );
  };

  const membersBlock = (limit) => {
    const list = limit ? members.slice(0, limit) : members;
    return (
      <section className="ch-section">
        <div className="ch-section-head">
          <h2 className="ch-h2">{label.members_title}</h2>
          {limit && (
            <button type="button" className="ch-link" onClick={() => go('members')}>{label.see_all}</button>
          )}
        </div>
        {!status && list.length === 0 && <p className="ch-status">{label.empty}</p>}
        <div className="ch-grid">
          {list.map((m) => (
            <MemberCard key={m.name} member={m} label={label} onOpen={(x) => openTopic(x.firstTopic)} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="ch">
      <TopNav />

      <div className="ch-shell">
        {/* ===== SIDEBAR (kiểu Accounts Center) ===== */}
        <aside className="ch-side" aria-label={label.title}>
          <div className="ch-side-head">
            <div className="ch-brand"><span aria-hidden="true">♾️</span> {label.brand}</div>
            <h1 className="ch-title">{label.title}</h1>
            <p className="ch-sub">{label.sub}</p>
          </div>

          <button
            type="button"
            className={`ch-main-item ${active === 'home' ? 'is-on' : ''}`}
            onClick={() => go('home')}
          >
            <span aria-hidden="true">🏠</span> {label.home}
          </button>

          <div>
            <p className="ch-group">{label.group_explore}</p>
            <nav className="ch-nav">
              <button type="button" className="ch-item" onClick={() => navigate('/community/forum')}>
                <span aria-hidden="true">🗂️</span> {label.forum}
              </button>
              {MENU.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className={`ch-item ${active === it.id ? 'is-on' : ''}`}
                  onClick={() => go(it.id)}
                >
                  <span aria-hidden="true">{it.icon}</span> {label[it.key]}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="ch-group">{label.group_settings}</p>
            <nav className="ch-nav">
              <button
                type="button"
                className={`ch-item ${active === 'language' ? 'is-on' : ''}`}
                onClick={() => go('language')}
              >
                <span aria-hidden="true">🌐</span> {label.language}
              </button>
            </nav>
          </div>
        </aside>

        {/* ===== NỘI DUNG ===== */}
        <main className="ch-content">
          {active === 'home' && (
            <>
              {topicsBlock(4)}
              <hr className="ch-hr" />
              {membersBlock(5)}
            </>
          )}
          {active === 'topics' && topicsBlock()}
          {active === 'members' && membersBlock()}
          {active === 'language' && <LanguagePanel label={label} />}
        </main>
      </div>
    </div>
  );
}
