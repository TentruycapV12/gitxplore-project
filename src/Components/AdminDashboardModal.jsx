import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import UidTag from './UidTag';

/**
 * Admin Console.
 *  - admin  : toàn quyền (tất cả tab)
 *  - editor : kiểm duyệt nội dung (Overview, Content, Logs)
 *  - support: xử lý ticket hỗ trợ (Overview, Tickets)
 * Cần chạy supabase_admin_setup.sql một lần để có các cột/bảng mới.
 */

const TABS = [
  { id: 'overview', label: '📊 Overview', roles: ['admin', 'editor', 'support'] },
  { id: 'members', label: '👥 Members', roles: ['admin'] },
  { id: 'content', label: '🗂️ Content', roles: ['admin', 'editor'] },
  { id: 'tickets', label: '🎫 Tickets', roles: ['admin', 'support'] },
  { id: 'announce', label: '📢 Announcements', roles: ['admin'] },
  { id: 'logs', label: '🕒 Audit Logs', roles: ['admin', 'editor'] },
];

const ROLES = ['member', 'support', 'editor', 'admin'];
const ROLE_COLOR = { admin: '#ef4444', editor: '#60a5fa', support: '#34d399', member: '#a8a29e' };

const DURATIONS = [
  { v: '1h', label: '1 hour', ms: 3600e3 },
  { v: '24h', label: '24 hours', ms: 24 * 3600e3 },
  { v: '7d', label: '7 days', ms: 7 * 24 * 3600e3 },
  { v: '30d', label: '30 days', ms: 30 * 24 * 3600e3 },
  { v: 'perm', label: 'Permanent', ms: null },
];

const FAR_FUTURE = '2999-12-31T00:00:00.000Z';
const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-US') : '—');
const stillActive = (until) => !until || new Date(until) > new Date();
const isMissing = (err) => !!err && /does not exist|schema cache|column|42P01|42703|PGRST20[45]/i.test(`${err.code || ''} ${err.message || ''}`);
const SETUP_HINT = 'Database is missing the new columns/tables — run supabase_admin_setup.sql in Supabase → SQL Editor once.';

/* ---------- style helpers ---------- */
const S = {
  card: { background: '#180d0d', border: '1px solid #291515', borderRadius: '8px', padding: '10px 14px' },
  input: { background: '#1c0f0f', color: '#f3f4f6', border: '1px solid #381a1a', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', outline: 'none' },
  select: { background: '#261212', color: '#fcd34d', border: '1px solid #451a1a', borderRadius: '6px', padding: '6px 8px', fontSize: '12px' },
  muted: { color: '#8c827a', fontSize: '12px' },
};
const btn = (bg, color = '#fff', border = 'none') => ({
  background: bg, color, border, padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
});
const Badge = ({ color, children }) => (
  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', color, border: `1px solid ${color}`, textTransform: 'uppercase', letterSpacing: '.4px' }}>{children}</span>
);
const Empty = ({ children }) => <div style={{ ...S.muted, textAlign: 'center', padding: '30px 0' }}>{children}</div>;

/** ID gõ kiểu "#123456", "id 123456" hoặc "123456" → "123456" */
const parseId = (q) => (/^(?:id\s*)?#?(\d{4,8})$/i.exec((q || '').trim()) || [])[1] || null;

/* =====================================================================
   OVERVIEW
   ===================================================================== */
function OverviewTab({ ctx }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const count = async (table, f) => {
      let q = supabase.from(table).select('*', { count: 'exact', head: true });
      if (f) q = f(q);
      const { count: n, error } = await q;
      return error ? null : n;
    };
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    (async () => {
      const [members, newWeek, topics, comments, banned, tickets, ann] = await Promise.all([
        count('profiles'),
        count('profiles', (q) => q.gte('created_at', weekAgo)),
        count('topics'),
        count('topic_messages'),
        count('user_roles', (q) => q.eq('status', 'banned')),
        count('support_tickets', (q) => q.or('status.is.null,status.neq.resolved')),
        count('announcements', (q) => q.eq('is_active', true)),
      ]);
      setStats({ members, newWeek, topics, comments, banned, tickets, ann });
    })();
  }, []);

  const items = [
    ['👥', 'Members', stats?.members, '#fef08a'],
    ['🆕', 'New this week', stats?.newWeek, '#34d399'],
    ['💬', 'Topics', stats?.topics, '#60a5fa'],
    ['📝', 'Comments', stats?.comments, '#60a5fa'],
    ['🚫', 'Banned accounts', stats?.banned, '#ef4444'],
    ['🎫', 'Open tickets', stats?.tickets, '#f59e0b'],
    ['📢', 'Active announcements', stats?.ann, '#a78bfa'],
  ];
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <p style={{ ...S.muted, margin: '0 0 12px' }}>
        Signed in as <strong style={{ color: '#fef08a' }}>{ctx.me.name}</strong>
        {ctx.me.publicId && <UidTag id={ctx.me.publicId} />} · role: <Badge color={ROLE_COLOR[ctx.role] || '#a8a29e'}>{ctx.role}</Badge>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
        {items.map(([icon, label, value, color]) => (
          <div key={label} style={{ ...S.card, padding: '16px' }}>
            <div style={{ fontSize: '22px' }}>{icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color, marginTop: '6px' }}>{stats ? (value ?? '—') : '…'}</div>
            <div style={S.muted}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ ...S.muted, marginTop: '16px', lineHeight: 1.6 }}>
        Tip: roles — <b>admin</b> manages everything, <b>editor</b> moderates content (pin, lock, delete), <b>support</b> handles tickets.
        Search any member by their <b>#ID</b> in the Members tab.
      </p>
    </div>
  );
}

/* =====================================================================
   MEMBERS
   ===================================================================== */
function MembersTab({ ctx }) {
  const { me, log, notify } = ctx;
  const myEmail = me.identifier?.toLowerCase();
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [fRole, setFRole] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [assign, setAssign] = useState({ who: '', role: 'member' });
  const [punish, setPunish] = useState(null); // { email, name, type: 'ban' | 'mute' }
  const [form, setForm] = useState({ reason: '', dur: '24h' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('*').limit(2000),
      supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.data) setProfiles(p.data);
    if (r.data) setRoles(r.data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Gộp hồ sơ + quyền theo email (người mới được gán quyền nhưng chưa đăng nhập vẫn hiện).
  const members = useMemo(() => {
    const roleBy = new Map(roles.map((r) => [r.email?.toLowerCase(), r]));
    const rows = profiles.map((p) => ({ ...p, email: p.email?.toLowerCase(), r: roleBy.get(p.email?.toLowerCase()) }));
    const seen = new Set(rows.map((x) => x.email));
    roles.forEach((r) => {
      const e = r.email?.toLowerCase();
      if (e && !seen.has(e)) rows.push({ email: e, name: e.split('@')[0], public_id: null, r });
    });
    return rows.map((m) => {
      const role = m.r?.role || 'member';
      const banned = m.r?.status === 'banned' && stillActive(m.r?.banned_until);
      const muted = Boolean(m.r?.muted_until) && stillActive(m.r?.muted_until);
      return { ...m, role, banned, muted };
    });
  }, [profiles, roles]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^#/, '');
    return members
      .filter((m) => {
        if (fRole !== 'all' && m.role !== fRole) return false;
        if (fStatus === 'banned' && !m.banned) return false;
        if (fStatus === 'muted' && !m.muted) return false;
        if (fStatus === 'active' && (m.banned || m.muted)) return false;
        if (!term) return true;
        return (m.name || '').toLowerCase().includes(term) || m.email.includes(term) || (m.public_id || '').startsWith(term.replace(/^id\s*/, ''));
      })
      .sort((a, b) => (b.role === 'admin') - (a.role === 'admin') || (a.name || '').localeCompare(b.name || ''))
      .slice(0, 200);
  }, [members, search, fRole, fStatus]);

  // Ghi vào user_roles (cập nhật nếu đã có hàng, ngược lại tạo mới). Thiếu cột mới → báo cách sửa.
  const save = async (email, patch, okText) => {
    const exists = roles.some((r) => r.email?.toLowerCase() === email);
    let res = exists
      ? await supabase.from('user_roles').update(patch).eq('email', email)
      : await supabase.from('user_roles').insert([{ email, role: 'member', status: 'active', ...patch }]);
    if (res.error && isMissing(res.error)) {
      const slim = Object.fromEntries(Object.entries(patch).filter(([k]) => ['role', 'status'].includes(k)));
      if (Object.keys(slim).length) {
        res = exists
          ? await supabase.from('user_roles').update(slim).eq('email', email)
          : await supabase.from('user_roles').insert([{ email, role: 'member', status: 'active', ...slim }]);
        if (!res.error) { notify('err', SETUP_HINT); await load(); return true; }
      }
      notify('err', SETUP_HINT);
      return false;
    }
    if (res.error) { notify('err', res.error.message); return false; }
    if (okText) notify('ok', okText);
    await load();
    return true;
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const raw = assign.who.trim();
    if (!raw) return;
    const id = parseId(raw);
    let email = raw.toLowerCase();
    if (id) {
      const hit = profiles.find((p) => p.public_id === id);
      if (!hit) { notify('err', `No member with ID #${id}`); return; }
      email = hit.email.toLowerCase();
    }
    if (email === myEmail) { notify('err', 'You cannot change your own role.'); return; }
    if (await save(email, { role: assign.role, status: 'active' }, `Role of ${email} set to ${assign.role}`)) {
      log('Grant Permissions', `${email} (${assign.role})`);
      setAssign({ who: '', role: 'member' });
    }
  };

  const setRole = async (m, role) => {
    if (await save(m.email, { role }, `${m.name} is now ${role}`)) log('Update Role', `${m.email} -> ${role}`);
  };

  const submitPunish = async (e) => {
    e.preventDefault();
    const d = DURATIONS.find((x) => x.v === form.dur);
    const until = d.ms ? new Date(Date.now() + d.ms).toISOString() : null;
    const { email, name, type } = punish;
    const ok = type === 'ban'
      ? await save(email, { status: 'banned', ban_reason: form.reason.trim() || null, banned_until: until }, `${name} banned (${d.label})`)
      : await save(email, { muted_until: until || FAR_FUTURE }, `${name} muted (${d.label})`);
    if (ok) {
      log(type === 'ban' ? 'Ban User' : 'Mute User', `${email} · ${d.label}${form.reason.trim() ? ` · ${form.reason.trim()}` : ''}`);
      setPunish(null);
      setForm({ reason: '', dur: '24h' });
    }
  };

  const lift = async (m, type) => {
    const patch = type === 'ban' ? { status: 'active', ban_reason: null, banned_until: null } : { muted_until: null };
    if (await save(m.email, patch, type === 'ban' ? `${m.name} unbanned` : `${m.name} unmuted`)) {
      log(type === 'ban' ? 'Unban User' : 'Unmute User', m.email);
    }
  };

  const revoke = async (m) => {
    if (!window.confirm(`Reset ${m.name} (${m.email}) back to a normal member and clear any ban/mute?`)) return;
    const { error } = await supabase.from('user_roles').delete().eq('email', m.email);
    if (error) { notify('err', error.message); return; }
    log('Revoke User Role', m.email);
    notify('ok', `${m.name} reset to member`);
    load();
  };

  const copyId = async (id) => {
    try { await navigator.clipboard.writeText(id); notify('ok', `Copied ID ${id}`); } catch { notify('err', 'Clipboard blocked'); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
      <form onSubmit={handleAssign} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          style={{ ...S.input, flex: 1, minWidth: '220px' }}
          placeholder="Assign role — enter member email or #ID (e.g. #48291375)"
          value={assign.who}
          onChange={(e) => setAssign((a) => ({ ...a, who: e.target.value }))}
          required
        />
        <select style={S.select} value={assign.role} onChange={(e) => setAssign((a) => ({ ...a, role: e.target.value }))}>
          {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
        </select>
        <button type="submit" className="link-btn btn-primary" style={{ padding: '0 16px' }}>+ Assign Role</button>
      </form>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          style={{ ...S.input, flex: 1, minWidth: '220px' }}
          placeholder="🔍 Search by name, email or #ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={S.select} value={fRole} onChange={(e) => setFRole(e.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={S.select} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="muted">Muted</option>
        </select>
      </div>

      {punish && (
        <form onSubmit={submitPunish} style={{ ...S.card, borderColor: '#7f1d1d', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <strong style={{ color: '#fca5a5', fontSize: '13px' }}>
            {punish.type === 'ban' ? '🚫 Ban' : '🔇 Mute'} {punish.name}
          </strong>
          <input
            style={{ ...S.input, flex: 1, minWidth: '180px' }}
            placeholder="Reason (shown to the user)"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <select style={S.select} value={form.dur} onChange={(e) => setForm((f) => ({ ...f, dur: e.target.value }))}>
            {DURATIONS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}
          </select>
          <button type="submit" style={btn('#dc2626')}>Confirm</button>
          <button type="button" style={btn('transparent', '#d1d5db', '1px solid #451a1a')} onClick={() => setPunish(null)}>Cancel</button>
        </form>
      )}

      <div style={{ ...S.muted }}>{shown.length} of {members.length} members</div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        {loading && <Empty>Loading…</Empty>}
        {!loading && shown.length === 0 && <Empty>No members match.</Empty>}
        {shown.map((m) => {
          const self = m.email === myEmail;
          return (
            <div key={m.email} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" referrerPolicy="no-referrer" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7f1d1d,#c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{(m.name || '?').charAt(0).toUpperCase()}</div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '13.5px' }}>
                    {m.name}
                    {m.public_id
                      ? <button type="button" onClick={() => copyId(m.public_id)} title="Click to copy ID" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><UidTag id={m.public_id} /></button>
                      : <span style={{ ...S.muted, marginLeft: '6px' }}>(no ID yet)</span>}
                    {self && <span style={{ ...S.muted, marginLeft: '6px' }}>· you</span>}
                  </div>
                  <div style={{ ...S.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge color={ROLE_COLOR[m.role]}>{m.role}</Badge>
                    {m.banned && <Badge color="#ef4444">banned{m.r?.banned_until ? ` → ${fmtDate(m.r.banned_until)}` : ' · permanent'}</Badge>}
                    {m.muted && <Badge color="#f59e0b">muted → {fmtDate(m.r.muted_until)}</Badge>}
                    {!m.banned && !m.muted && <span style={{ fontSize: '11px', color: '#10b981' }}>● Active</span>}
                    {m.banned && m.r?.ban_reason && <span style={S.muted}>“{m.r.ban_reason}”</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <select style={S.select} value={m.role} disabled={self} onChange={(e) => setRole(m, e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
                </select>
                {m.muted
                  ? <button style={btn('#065f46')} disabled={self} onClick={() => lift(m, 'mute')}>Unmute</button>
                  : <button style={btn('#78350f')} disabled={self} onClick={() => setPunish({ email: m.email, name: m.name, type: 'mute' })}>Mute</button>}
                {m.banned
                  ? <button style={btn('#065f46')} disabled={self} onClick={() => lift(m, 'ban')}>Unban</button>
                  : <button style={btn('#7f1d1d')} disabled={self} onClick={() => setPunish({ email: m.email, name: m.name, type: 'ban' })}>Ban</button>}
                <button style={btn('transparent', '#f87171', '1px solid #451a1a')} disabled={self || !m.r} onClick={() => revoke(m)} title="Reset to plain member and clear ban/mute">Reset</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =====================================================================
   CONTENT (topics + comments)
   ===================================================================== */
function ContentTab({ ctx }) {
  const { log, notify, onChanged } = ctx;
  const [view, setView] = useState('topics');
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([
      supabase.from('topics').select('*, topic_messages(count)').order('created_at', { ascending: false }).limit(300),
      supabase.from('topic_messages').select('*').order('created_at', { ascending: false }).limit(300),
    ]);
    if (t.data) setTopics(t.data);
    if (c.data) setComments(c.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const titleOf = useMemo(() => new Map(topics.map((t) => [t.id, t.title])), [topics]);
  const term = search.trim().toLowerCase().replace(/^#/, '');

  const topicRows = topics.filter((t) =>
    !term || (t.title || '').toLowerCase().includes(term) || (t.author_name || '').toLowerCase().includes(term) || (t.author_public_id || '').startsWith(term));
  const commentRows = comments.filter((c) =>
    !term || (c.content || '').toLowerCase().includes(term) || (c.user_name || '').toLowerCase().includes(term) || (c.user_public_id || '').startsWith(term));

  const done = async (action, target, text) => { log(action, target); notify('ok', text); await load(); onChanged?.(); };

  const pin = async (t) => {
    const { error } = await supabase.from('topics').update({ is_pinned: !t.is_pinned }).eq('id', t.id);
    if (error) return notify('err', error.message);
    return done(t.is_pinned ? 'Unpin Topic' : 'Pin Topic', `#${t.id} ${t.title}`, t.is_pinned ? 'Unpinned' : 'Pinned');
  };
  const lock = async (t) => {
    const { error } = await supabase.from('topics').update({ is_locked: !t.is_locked }).eq('id', t.id);
    if (error) return notify('err', isMissing(error) ? SETUP_HINT : error.message);
    return done(t.is_locked ? 'Unlock Topic' : 'Lock Topic', `#${t.id} ${t.title}`, t.is_locked ? 'Unlocked' : 'Locked');
  };
  const rename = async (t) => {
    const title = window.prompt('New title:', t.title);
    if (!title || !title.trim() || title.trim() === t.title) return null;
    const { error } = await supabase.from('topics').update({ title: title.trim() }).eq('id', t.id);
    if (error) return notify('err', error.message);
    return done('Edit Topic', `#${t.id} "${t.title}" -> "${title.trim()}"`, 'Title updated');
  };
  const removeTopic = async (t) => {
    if (!window.confirm(`Delete topic "${t.title}" and all its comments?`)) return null;
    const { error } = await supabase.from('topics').delete().eq('id', t.id);
    if (error) return notify('err', error.message);
    return done('Delete Topic', `#${t.id} ${t.title}`, 'Topic deleted');
  };
  const removeComment = async (c) => {
    if (!window.confirm(`Delete this comment by ${c.user_name}?`)) return null;
    const { error } = await supabase.from('topic_messages').delete().eq('id', c.id);
    if (error) return notify('err', error.message);
    return done('Delete Comment', `${c.user_name}: ${(c.content || '').slice(0, 60)}`, 'Comment deleted');
  };

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setView(id)} style={btn(view === id ? '#2b1414' : 'transparent', view === id ? '#f59e0b' : '#9ca3af', view === id ? '1px solid #4a1d1d' : '1px solid transparent')}>{label}</button>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {tabBtn('topics', `Topics (${topics.length})`)}
        {tabBtn('comments', `Comments (${comments.length})`)}
        <input style={{ ...S.input, flex: 1, minWidth: '200px' }} placeholder="🔍 Search title, text, author or #ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        {view === 'topics' && topicRows.map((t) => (
          <div key={t.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '13.5px', wordBreak: 'break-word' }}>
                {t.is_pinned && '📌 '}{t.is_locked && '🔒 '}{t.title}
              </div>
              <div style={S.muted}>
                {t.author_name}<UidTag id={t.author_public_id} /> · {fmtDate(t.created_at)} · {t.topic_messages?.[0]?.count || 0} replies · {t.views_count || 0} views
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={btn('#2b1414', '#fef08a', '1px solid #3d1b1b')} onClick={() => pin(t)}>{t.is_pinned ? 'Unpin' : 'Pin'}</button>
              <button style={btn('#2b1414', '#fef08a', '1px solid #3d1b1b')} onClick={() => lock(t)}>{t.is_locked ? 'Unlock' : 'Lock'}</button>
              <button style={btn('#2b1414', '#fef08a', '1px solid #3d1b1b')} onClick={() => rename(t)}>Edit</button>
              <button style={btn('#7f1d1d')} onClick={() => removeTopic(t)}>Delete</button>
            </div>
          </div>
        ))}
        {view === 'topics' && topicRows.length === 0 && <Empty>No topics found.</Empty>}

        {view === 'comments' && commentRows.map((c) => (
          <div key={c.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '12.5px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{c.user_name}</span><UidTag id={c.user_public_id} />
                <span style={S.muted}> in “{titleOf.get(c.topic_id) || `topic #${c.topic_id}`}”</span>
              </div>
              <div style={{ color: '#e5e7eb', fontSize: '13px', margin: '3px 0', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{c.content}</div>
              {c.media_url && <a href={c.media_url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '12px' }}>📎 attachment</a>}
              <div style={{ ...S.muted, fontSize: '10.5px' }}>{fmtDate(c.created_at)}</div>
            </div>
            <button style={btn('#7f1d1d')} onClick={() => removeComment(c)}>Delete</button>
          </div>
        ))}
        {view === 'comments' && commentRows.length === 0 && <Empty>No comments found.</Empty>}
      </div>
    </div>
  );
}

/* =====================================================================
   TICKETS
   ===================================================================== */
function TicketsTab({ ctx }) {
  const { me, log, notify } = ctx;
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) notify('err', error.message);
    if (data) setTickets(data);
    setLoading(false);
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const statusOf = (t) => t.status || 'open';
  const shown = tickets.filter((t) => filter === 'all' || statusOf(t) === filter);
  const color = { open: '#f59e0b', in_progress: '#60a5fa', resolved: '#10b981' };

  const setStatus = async (t, status) => {
    const { error } = await supabase.from('support_tickets').update({ status, handled_by: me.identifier }).eq('id', t.id);
    if (error) return notify('err', isMissing(error) ? SETUP_HINT : error.message);
    log('Ticket ' + status.replace('_', ' '), `${t.user_contact} · ${(t.message || '').slice(0, 40)}`);
    return load();
  };
  const remove = async (t) => {
    if (!window.confirm('Delete this ticket permanently?')) return null;
    const { error } = await supabase.from('support_tickets').delete().eq('id', t.id);
    if (error) return notify('err', error.message);
    log('Delete Ticket', `${t.user_contact} · ${(t.message || '').slice(0, 40)}`);
    return load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['open', 'in_progress', 'resolved', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={btn(filter === f ? '#f59e0b' : '#1e0e0e', filter === f ? '#000' : '#d1d5db')}>
            {f.replace('_', ' ')} {f !== 'all' && `(${tickets.filter((t) => statusOf(t) === f).length})`}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        {loading && <Empty>Loading…</Empty>}
        {!loading && shown.length === 0 && <Empty>No tickets here. 🎉</Empty>}
        {shown.map((t) => (
          <div key={t.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge color={color[statusOf(t)] || '#a8a29e'}>{statusOf(t).replace('_', ' ')}</Badge>
                <Badge color="#a78bfa">{t.ticket_type || 'general'}</Badge>
                <span style={{ color: '#fef08a', fontSize: '13px', fontWeight: 600 }}>{t.user_contact}</span>
              </div>
              <span style={{ ...S.muted, fontSize: '11px' }}>{fmtDate(t.created_at)}</span>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '13px', margin: '8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t.message}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {statusOf(t) === 'open' && <button style={btn('#1e3a8a')} onClick={() => setStatus(t, 'in_progress')}>Start</button>}
              {statusOf(t) !== 'resolved' && <button style={btn('#065f46')} onClick={() => setStatus(t, 'resolved')}>Resolve</button>}
              {statusOf(t) === 'resolved' && <button style={btn('#78350f')} onClick={() => setStatus(t, 'open')}>Reopen</button>}
              {/@/.test(t.user_contact || '') && (
                <a href={`mailto:${t.user_contact}?subject=${encodeURIComponent('Re: your GitXplore support ticket')}`} style={{ ...btn('#2b1414', '#fef08a', '1px solid #3d1b1b'), textDecoration: 'none' }}>✉ Reply</a>
              )}
              <button style={btn('transparent', '#f87171', '1px solid #451a1a')} onClick={() => remove(t)}>Delete</button>
              {t.handled_by && <span style={S.muted}>handled by {t.handled_by}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =====================================================================
   ANNOUNCEMENTS
   ===================================================================== */
function AnnouncementsTab({ ctx }) {
  const { me, log, notify } = ctx;
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ message: '', level: 'info', exp: 'none' });
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) { setMissing(isMissing(error)); return; }
    setMissing(false);
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    const msg = form.message.trim();
    if (!msg) return;
    const days = { none: null, 1: 1, 7: 7, 30: 30 }[form.exp];
    const { error } = await supabase.from('announcements').insert([{
      message: msg, level: form.level, is_active: true, created_by: me.identifier,
      expires_at: days ? new Date(Date.now() + days * 864e5).toISOString() : null,
    }]);
    if (error) return notify('err', isMissing(error) ? SETUP_HINT : error.message);
    log('Post Announcement', msg.slice(0, 80));
    notify('ok', 'Announcement published — shows at the top of the forum');
    setForm({ message: '', level: 'info', exp: 'none' });
    return load();
  };
  const toggle = async (a) => {
    await supabase.from('announcements').update({ is_active: !a.is_active }).eq('id', a.id);
    log(a.is_active ? 'Hide Announcement' : 'Show Announcement', a.message.slice(0, 60));
    load();
  };
  const remove = async (a) => {
    if (!window.confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', a.id);
    log('Delete Announcement', a.message.slice(0, 60));
    load();
  };

  const lvColor = { info: '#60a5fa', warning: '#eab308', danger: '#ef4444' };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
      {missing && <div style={{ ...S.card, borderColor: '#7f1d1d', color: '#fca5a5', fontSize: '12.5px' }}>{SETUP_HINT}</div>}
      <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          style={{ ...S.input, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Write an announcement shown to everyone at the top of the forum…"
          value={form.message}
          maxLength={300}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select style={S.select} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
            <option value="info">📢 Info</option>
            <option value="warning">⚠️ Warning</option>
            <option value="danger">🚨 Urgent</option>
          </select>
          <select style={S.select} value={form.exp} onChange={(e) => setForm((f) => ({ ...f, exp: e.target.value }))}>
            <option value="none">No expiry</option>
            <option value="1">Expires in 1 day</option>
            <option value="7">Expires in 7 days</option>
            <option value="30">Expires in 30 days</option>
          </select>
          <button type="submit" className="link-btn btn-primary" style={{ padding: '6px 16px' }}>Publish</button>
        </div>
      </form>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {list.length === 0 && !missing && <Empty>No announcements yet.</Empty>}
        {list.map((a) => {
          const expired = !stillActive(a.expires_at);
          return (
            <div key={a.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', opacity: a.is_active && !expired ? 1 : 0.55 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                  <Badge color={lvColor[a.level] || '#60a5fa'}>{a.level}</Badge>
                  {expired && <Badge color="#78716c">expired</Badge>}
                  {!a.is_active && <Badge color="#78716c">hidden</Badge>}
                </div>
                <div style={{ color: '#e5e7eb', fontSize: '13px', wordBreak: 'break-word' }}>{a.message}</div>
                <div style={{ ...S.muted, fontSize: '10.5px' }}>{fmtDate(a.created_at)} · {a.created_by}{a.expires_at ? ` · until ${fmtDate(a.expires_at)}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={btn('#2b1414', '#fef08a', '1px solid #3d1b1b')} onClick={() => toggle(a)}>{a.is_active ? 'Hide' : 'Show'}</button>
                <button style={btn('#7f1d1d')} onClick={() => remove(a)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =====================================================================
   AUDIT LOGS
   ===================================================================== */
function LogsTab({ ctx }) {
  const { log, notify, role } = ctx;
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');

  const load = useCallback(async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500);
    if (data) setLogs(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const term = search.trim().toLowerCase();
  const shown = logs.filter((l) =>
    (action === 'all' || l.action === action) &&
    (!term || `${l.actor_email} ${l.action} ${l.target || ''}`.toLowerCase().includes(term)));

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['time,actor,action,target', ...shown.map((l) => [l.created_at, l.actor_email, l.action, l.target].map(esc).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearOld = async () => {
    if (!window.confirm('Delete all audit logs older than 30 days? This cannot be undone.')) return;
    const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
    const { error } = await supabase.from('activity_logs').delete().lt('created_at', cutoff);
    if (error) { notify('err', error.message); return; }
    await log('Clear Old Logs', `older than ${cutoff.slice(0, 10)}`);
    notify('ok', 'Old logs cleared');
    load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input style={{ ...S.input, flex: 1, minWidth: '200px' }} placeholder="🔍 Filter by actor, action or target…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={S.select} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button style={btn('#1e3a8a')} onClick={exportCsv}>⬇ Export CSV</button>
        {role === 'admin' && <button style={btn('transparent', '#f87171', '1px solid #451a1a')} onClick={clearOld}>Clear &gt; 30 days</button>}
      </div>
      <div style={S.muted}>{shown.length} entries</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shown.map((l) => (
          <div key={l.id} style={{ ...S.card, fontSize: '12.5px' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{l.actor_email}</span> performed: <span style={{ color: '#f87171' }}>{l.action}</span>
            {l.target && <span style={{ color: '#9ca3af' }}> → ({l.target})</span>}
            <div style={{ fontSize: '10.5px', color: '#78716c', marginTop: '4px' }}>{fmtDate(l.created_at)}</div>
          </div>
        ))}
        {shown.length === 0 && <Empty>No log entries.</Empty>}
      </div>
    </div>
  );
}

/* =====================================================================
   MODAL
   ===================================================================== */
export default function AdminDashboardModal({ onClose, role = 'admin', onChanged }) {
  const { user } = useAuth();
  const tabs = TABS.filter((t) => t.roles.includes(role));
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview');
  const [notice, setNotice] = useState(null);

  const notify = useCallback((type, text) => setNotice({ type, text, at: Date.now() }), []);
  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(id);
  }, [notice]);

  const log = useCallback(async (action, target) => {
    await supabase.from('activity_logs').insert([{ actor_email: user.identifier, action, target }]);
  }, [user.identifier]);

  const ctx = { me: user, role, log, notify, onChanged };
  const title = role === 'admin' ? 'Admin Console' : role === 'editor' ? 'Moderator Console' : 'Support Console';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1000px', width: '94%', height: '84vh', display: 'flex', flexDirection: 'column', padding: '24px', background: '#0e0707', border: '1px solid #3d1b1b', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2b1414', paddingBottom: '12px' }}>
          <div>
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Administration</span>
            <h2 style={{ margin: '4px 0 0', color: '#fef08a', fontSize: '20px' }}>{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? '#f59e0b' : '#1e0e0e',
                color: activeTab === t.id ? '#000' : '#d1d5db',
                border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {notice && (
          <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', background: notice.type === 'ok' ? '#052e22' : '#3b1111', color: notice.type === 'ok' ? '#6ee7b7' : '#fca5a5', border: `1px solid ${notice.type === 'ok' ? '#065f46' : '#7f1d1d'}` }}>
            {notice.type === 'ok' ? '✓ ' : '⚠ '}{notice.text}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '14px', overflow: 'hidden' }}>
          {activeTab === 'overview' && <OverviewTab ctx={ctx} />}
          {activeTab === 'members' && <MembersTab ctx={ctx} />}
          {activeTab === 'content' && <ContentTab ctx={ctx} />}
          {activeTab === 'tickets' && <TicketsTab ctx={ctx} />}
          {activeTab === 'announce' && <AnnouncementsTab ctx={ctx} />}
          {activeTab === 'logs' && <LogsTab ctx={ctx} />}
        </div>
      </div>
    </div>
  );
}
