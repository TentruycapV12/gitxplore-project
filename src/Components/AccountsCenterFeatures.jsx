import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* ============================================================
 * AccountsCenterFeatures.jsx
 * Toàn bộ chức năng chi tiết của Accounts Center.
 * - Dữ liệu cài đặt lưu localStorage theo từng tài khoản (key: ac_<identifier>)
 * - Đổi mật khẩu / đăng xuất thiết bị khác / xác minh email: dùng Supabase thật
 * - Stars, followers, organizations: gọi GitHub public API thật
 * - Thanh toán chỉ là DEMO: chỉ lưu 4 số cuối + hạn thẻ, không bao giờ lưu số thẻ đầy đủ
 * ============================================================ */

/* ---------- store ---------- */
export function useAcStore(id) {
  const key = `ac_${id || 'guest'}`;
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  };
  const [store, setStore] = useState(read);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setStore(read()); }, [key]);
  const patch = useCallback((p) => setStore((prev) => {
    const next = { ...prev, ...(typeof p === 'function' ? p(prev) : p) };
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  }), [key]);
  return [store, patch];
}

/** Gọi hàm này ở ô tìm kiếm của app để Search history có dữ liệu thật */
export function recordSearch(identifier, query) {
  try {
    const key = `ac_${identifier}`;
    const s = JSON.parse(localStorage.getItem(key) || '{}');
    if (s.saveSearch === false || !query?.trim()) return;
    const list = [query.trim(), ...(s.searches || []).filter((q) => q !== query.trim())].slice(0, 30);
    localStorage.setItem(key, JSON.stringify({ ...s, searches: list }));
  } catch { /* ignore */ }
}

/* ---------- helpers ---------- */
const S = {
  card: { background: '#180d0d', border: '1px solid #2b1414', borderRadius: 10, padding: '12px 14px' },
  muted: { fontSize: 12, color: '#9ca3af' },
  label: { display: 'block', fontSize: 12, color: '#a8a29e', marginBottom: 4 },
  col: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  input: { width: '100%', borderRadius: 8 },
  ok: { color: '#22c55e', fontSize: 12.5, margin: 0 },
  err: { color: '#f87171', fontSize: 12.5, margin: 0 },
  white: { color: '#fff', fontSize: 13.5 },
};

const Btn = ({ kind = 'primary', style, ...r }) => (
  <button type="button" className={`link-btn btn-${kind}`} style={{ padding: '8px 16px', fontSize: 12.5, ...style }} {...r} />
);
const Msg = ({ m }) => (m ? <p style={m.err ? S.err : S.ok}>{m.err || m.ok}</p> : null);
const Switch = ({ checked, onChange, label, hint }) => (
  <label style={{ ...S.card, ...S.row, cursor: 'pointer' }}>
    <span>
      <span style={S.white}>{label}</span>
      {hint && <span style={{ ...S.muted, display: 'block' }}>{hint}</span>}
    </span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }} />
  </label>
);
const Item = ({ left, right, sub }) => (
  <div style={{ ...S.card, ...S.row }}>
    <div style={{ minWidth: 0 }}>
      <div style={S.white}>{left}</div>
      {sub && <div style={S.muted}>{sub}</div>}
    </div>
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{right}</div>
  </div>
);
const fmt = (d) => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function getDevice() {
  const ua = navigator.userAgent;
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const o = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  return `${b} on ${o}`;
}
async function gh(path) {
  const r = await fetch(`https://api.github.com/${path}`);
  if (!r.ok) throw new Error(r.status === 404 ? 'Not found on GitHub.' : r.status === 403 ? 'GitHub rate limit reached, try again later.' : `GitHub error ${r.status}`);
  return r.json();
}
const luhn = (n) => {
  let s = 0; let alt = false;
  for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; }
  return s % 10 === 0;
};
const brandOf = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : /^35/.test(n) ? 'JCB' : 'Card');
const genCodes = () => Array.from({ length: 8 }, () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase().replace(/(.{4})/, '$1-'));

/* ---------- 1. Toggle-style modals ---------- */
const TOGGLES = {
  sharing: { intro: 'Choose what is shared between the accounts in this Accounts Center.', items: [['shareActivity', 'Cross-post repository activity', true], ['shareSaved', 'Share saved repositories across profiles', false], ['shareName', 'Use the same display name on all profiles', true]] },
  showcases: { intro: 'Control which project milestones appear in the community.', items: [['showMilestones', 'Show latest project milestones in Community', true], ['showcaseSaved', 'Feature my saved repositories on my profile', false], ['showcaseCommits', 'Show recent commit activity', true]] },
  repolinks: { intro: 'Decide how links to your repositories behave.', items: [['repoLinks', 'Show GitHub links on my repositories', true], ['linksNewTab', 'Open repository links in a new tab', true]] },
  sync_avatar: { intro: 'Automatically use your primary GitHub avatar across Forum and Explorer.', items: [['syncAvatar', 'Avatar synchronization', true]] },
};
function ToggleModal({ type, title, store, patch, log, close }) {
  const cfg = TOGGLES[type];
  return (
    <div style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>{cfg.intro}</p>
      {cfg.items.map(([k, l, d]) => (
        <Switch key={k} label={l} checked={store[k] ?? d} onChange={(v) => { patch({ [k]: v }); log(title, `${l}: ${v ? 'on' : 'off'}`); }} />
      ))}
      <Btn onClick={close}>Done</Btn>
    </div>
  );
}

/* ---------- 2. Security ---------- */
function PasswordModal({ user, store, patch, log }) {
  const [f, setF] = useState({ old: '', next: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const needOld = user?.provider === 'email' || !!store.pwHash;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const strength = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(f.next)).length;

  const submit = async (e) => {
    e.preventDefault(); setMsg(null);
    if (f.next.length < 8) return setMsg({ err: 'New password must be at least 8 characters.' });
    if (f.next !== f.confirm) return setMsg({ err: 'New passwords do not match.' });
    if (needOld && f.next === f.old) return setMsg({ err: 'New password must differ from the current one.' });
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (user?.provider === 'email') {
          const { error } = await supabase.auth.signInWithPassword({ email: user.identifier, password: f.old });
          if (error) throw new Error('Current password is incorrect.');
        }
        const { error } = await supabase.auth.updateUser({ password: f.next });
        if (error) throw error;
      } else {
        if (store.pwHash && store.pwHash !== (await sha256(f.old))) throw new Error('Current password is incorrect.');
        patch({ pwHash: await sha256(f.next) });
      }
      patch({ pwChangedAt: new Date().toISOString() });
      log('Password changed', 'Your account password was updated');
      setMsg({ ok: 'Password updated successfully.' });
      setF({ old: '', next: '', confirm: '' });
    } catch (er) { setMsg({ err: er.message || 'Could not update password.' }); }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} style={S.col}>
      {store.pwChangedAt && <p style={S.muted}>Last changed: {fmt(store.pwChangedAt)}</p>}
      {needOld && (
        <div><label style={S.label}>Current password</label>
          <input type="password" required value={f.old} onChange={set('old')} className="lusion-search" style={S.input} autoComplete="current-password" /></div>
      )}
      <div><label style={S.label}>New password</label>
        <input type="password" required value={f.next} onChange={set('next')} className="lusion-search" style={S.input} autoComplete="new-password" />
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? ['#ef4444', '#f59e0b', '#84cc16', '#22c55e'][strength - 1] : '#2b1414' }} />)}
        </div></div>
      <div><label style={S.label}>Confirm new password</label>
        <input type="password" required value={f.confirm} onChange={set('confirm')} className="lusion-search" style={S.input} autoComplete="new-password" /></div>
      <Msg m={msg} />
      <button type="submit" disabled={busy} className="link-btn btn-primary">{busy ? 'Updating...' : 'Update Password'}</button>
    </form>
  );
}

function TwoFactorModal({ store, patch, log }) {
  const [msg, setMsg] = useState(null);
  const on = !!store.twoFactor;
  const codes = store.backupCodes || [];
  const toggle = () => {
    const next = !on;
    patch({ twoFactor: next, backupCodes: next && !codes.length ? genCodes() : codes });
    log('Two-factor authentication', next ? 'Enabled' : 'Disabled');
  };
  const copy = async () => { try { await navigator.clipboard.writeText(codes.join('\n')); setMsg({ ok: 'Backup codes copied.' }); } catch { setMsg({ err: 'Could not copy.' }); } };
  return (
    <div style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>Require a verification step whenever you sign in from an unknown workstation.</p>
      <Item left="Two-factor security" sub={on ? 'Currently active' : 'Disabled'} right={<Btn kind="secondary" onClick={toggle}>{on ? 'Turn off' : 'Turn on'}</Btn>} />
      {on && (
        <>
          <div style={S.card}>
            <div style={{ ...S.white, marginBottom: 8 }}>Backup codes</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontFamily: 'monospace', color: '#fef08a', fontSize: 13 }}>
              {codes.map((c) => <span key={c}>{c}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="secondary" onClick={copy}>Copy codes</Btn>
            <Btn kind="secondary" onClick={() => { patch({ backupCodes: genCodes() }); setMsg({ ok: 'New backup codes generated.' }); }}>Regenerate</Btn>
          </div>
          <p style={{ ...S.muted, margin: 0 }}>Codes are kept on this device only. Store them somewhere safe.</p>
        </>
      )}
      <Msg m={msg} />
    </div>
  );
}

function SavedLoginModal({ store, patch, log }) {
  const list = store.savedLogins ?? [{ id: 'current', name: getDevice(), at: new Date().toISOString() }];
  const remove = (id) => { patch({ savedLogins: list.filter((x) => x.id !== id) }); log('Saved login removed', 'A remembered browser was removed'); };
  return (
    <div style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>Browsers that remember your sign-in:</p>
      {list.length === 0 && <p style={S.muted}>No saved browsers.</p>}
      {list.map((x, i) => (
        <Item key={x.id} left={x.name} sub={i === 0 ? 'This browser' : fmt(x.at)} right={<Btn kind="secondary" onClick={() => remove(x.id)}>Remove</Btn>} />
      ))}
      {list.length > 0 && <Btn kind="secondary" onClick={() => { patch({ savedLogins: [] }); log('Saved logins purged', 'All saved browsers removed'); }}>Remove all saved browsers</Btn>}
    </div>
  );
}

function PasskeyModal({ user, store, patch, log }) {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const list = store.passkeys || [];
  const add = async () => {
    setMsg(null);
    if (!window.PublicKeyCredential || !navigator.credentials) return setMsg({ err: 'This browser does not support passkeys.' });
    setBusy(true);
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'GitXplore' },
          user: { id: new TextEncoder().encode(user.identifier), name: user.identifier, displayName: user.name || user.identifier },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { userVerification: 'preferred' },
          timeout: 60000,
        },
      });
      const cid = btoa(String.fromCharCode(...new Uint8Array(cred.rawId))).slice(0, 16);
      const label = name.trim() || `${getDevice()} passkey`;
      patch({ passkeys: [...list, { id: cid, name: label, at: new Date().toISOString() }] });
      log('Passkey registered', label);
      setName(''); setMsg({ ok: 'Passkey registered on this device.' });
    } catch (er) { setMsg({ err: er.name === 'NotAllowedError' ? 'Passkey setup was cancelled.' : er.message }); }
    setBusy(false);
  };
  return (
    <div style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>Sign in with your fingerprint, face or Windows Hello PIN.</p>
      {list.map((p) => (
        <Item key={p.id} left={`🔑 ${p.name}`} sub={`Added ${fmt(p.at)}`} right={<Btn kind="secondary" onClick={() => { patch({ passkeys: list.filter((x) => x.id !== p.id) }); log('Passkey removed', p.name); }}>Remove</Btn>} />
      ))}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Passkey name (optional)" className="lusion-search" style={S.input} />
      <Msg m={msg} />
      <Btn onClick={add} disabled={busy}>{busy ? 'Waiting for device...' : '🔑 Register passkey'}</Btn>
    </div>
  );
}

function SessionsModal({ log }) {
  const [msg, setMsg] = useState(null);
  const out = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) return setMsg({ err: error.message });
    log('Sessions', 'Signed out of all other sessions');
    setMsg({ ok: 'All other sessions have been signed out.' });
  };
  return (
    <div style={S.col}>
      <div style={{ ...S.card, borderLeft: '3px solid #22c55e' }}>
        <div style={S.white}>{getDevice()}</div>
        <div style={S.muted}>Current session</div>
      </div>
      <Msg m={msg} />
      <Btn kind="secondary" onClick={out}>Log out of all other sessions</Btn>
    </div>
  );
}

function EmailsModal({ user, store, patch }) {
  return (
    <div style={S.col}>
      <Switch label="Email me about new sign-ins" checked={store.loginAlerts ?? true} onChange={(v) => patch({ loginAlerts: v })} />
      <Switch label="Product & release emails" checked={store.productEmails ?? false} onChange={(v) => patch({ productEmails: v })} />
      <div style={S.card}><div style={{ color: '#fef08a', fontSize: 13, fontWeight: 600 }}>GitXplore Welcome Confirmation</div><div style={S.muted}>Sent to {user?.identifier}</div></div>
    </div>
  );
}

function CheckupModal({ user, store, open, close }) {
  let phone = '';
  try { phone = JSON.parse(localStorage.getItem(`details_${user.identifier}`) || '{}').phone || ''; } catch { /* ignore */ }
  const checks = [
    ['Two-factor authentication is on', !!store.twoFactor, { title: 'Two-factor authentication', type: '2fa' }],
    ['A passkey is registered', (store.passkeys || []).length > 0, { title: 'Passkey Management', type: 'passkey' }],
    ['Backup codes generated', (store.backupCodes || []).length > 0, { title: 'Two-factor authentication', type: '2fa' }],
    ['Sign-in alert emails are on', store.loginAlerts ?? true, { title: 'Recent emails', type: 'emails' }],
    ['Recovery phone number added', !!phone, null],
  ];
  const pass = checks.filter((c) => c[1]).length;
  const color = pass === checks.length ? '#22c55e' : pass >= 3 ? '#f59e0b' : '#ef4444';
  return (
    <div style={S.col}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>🛡️</div>
        <h4 style={{ margin: '4px 0', color, fontSize: 16 }}>{pass}/{checks.length} checks passed</h4>
      </div>
      {checks.map(([label, ok, target]) => (
        <Item key={label} left={`${ok ? '✅' : '⚠️'} ${label}`} right={!ok && target ? <Btn kind="secondary" onClick={() => open(target)}>Fix</Btn> : null} />
      ))}
      <Btn onClick={close}>Done</Btn>
    </div>
  );
}

/* ---------- 3. Connected experiences ---------- */
function GhSyncModal({ store, patch, saved, log }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    setBusy(true); setErr('');
    const stars = { ...(store.stars || {}) }; let fails = 0;
    for (const p of saved) {
      const m = /github\.com\/([^/]+)\/([^/#?]+)/.exec(p.githubUrl || '');
      if (!m) { fails++; continue; }
      try { stars[p.id] = (await gh(`repos/${m[1]}/${m[2].replace(/\.git$/, '')}`)).stargazers_count; } catch (e) { fails++; if (/rate limit/.test(e.message)) { setErr(e.message); break; } }
    }
    patch({ stars, lastSync: new Date().toISOString() });
    log('GitHub sync', `Refreshed ${saved.length - fails}/${saved.length} saved repositories`);
    setBusy(false);
  };
  return (
    <div style={S.col}>
      <Switch label="Auto-sync saved repositories" checked={store.autoSync ?? true} onChange={(v) => patch({ autoSync: v })} />
      <p style={{ ...S.muted, margin: 0 }}>Last sync: {store.lastSync ? fmt(store.lastSync) : 'never'}</p>
      {saved.map((p) => (
        <Item key={p.id} left={p.name} right={<span style={{ color: '#fbbf24', fontSize: 13 }}>⭐ {store.stars?.[p.id] != null ? store.stars[p.id].toLocaleString() : '—'}</span>} />
      ))}
      {err && <p style={S.err}>{err}</p>}
      <Btn onClick={run} disabled={busy || !saved.length}>{busy ? 'Syncing...' : '🔄 Sync now'}</Btn>
    </div>
  );
}

function DevicesModal({ store, patch, log }) {
  const [name, setName] = useState('');
  const list = store.devices ?? [{ id: 'current', name: getDevice(), on: true }];
  const save = (devices) => patch({ devices });
  return (
    <div style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>Choose which devices receive streamed code snippets.</p>
      {list.map((d) => (
        <Item key={d.id} left={d.name} sub={d.on ? 'Streaming enabled' : 'Paused'}
          right={<>
            <Btn kind="secondary" onClick={() => save(list.map((x) => (x.id === d.id ? { ...x, on: !x.on } : x)))}>{d.on ? 'Pause' : 'Enable'}</Btn>
            {d.id !== 'current' && <Btn kind="secondary" onClick={() => { save(list.filter((x) => x.id !== d.id)); log('Device removed', d.name); }}>✕</Btn>}
          </>} />
      ))}
      <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; save([...list, { id: String(Date.now()), name: name.trim(), on: true }]); log('Device added', name.trim()); setName(''); }} style={{ display: 'flex', gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add device (e.g. Work laptop)" className="lusion-search" style={{ flex: 1, borderRadius: 8 }} />
        <button type="submit" className="link-btn btn-primary" style={{ padding: '8px 16px' }}>Add</button>
      </form>
    </div>
  );
}

function FollowingModal({ store, patch, log }) {
  const [u, setU] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const list = store.following || [];
  const add = async (e) => {
    e.preventDefault();
    const name = u.trim().replace(/^@/, '');
    if (!name) return;
    if (list.some((x) => x.login.toLowerCase() === name.toLowerCase())) return setErr('Already following this developer.');
    setBusy(true); setErr('');
    try {
      const d = await gh(`users/${encodeURIComponent(name)}`);
      patch({ following: [...list, { login: d.login, name: d.name, avatar: d.avatar_url, url: d.html_url }] });
      log('Followed developer', d.login); setU('');
    } catch (er) { setErr(er.message); }
    setBusy(false);
  };
  return (
    <div style={S.col}>
      <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
        <input value={u} onChange={(e) => setU(e.target.value)} placeholder="GitHub username" className="lusion-search" style={{ flex: 1, borderRadius: 8 }} />
        <button type="submit" disabled={busy} className="link-btn btn-primary" style={{ padding: '8px 16px' }}>{busy ? '...' : 'Follow'}</button>
      </form>
      {err && <p style={S.err}>{err}</p>}
      <p style={{ ...S.muted, margin: 0 }}>Following {list.length} developer{list.length === 1 ? '' : 's'}</p>
      {list.map((d) => (
        <Item key={d.login}
          left={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><img src={d.avatar} alt="" width="28" height="28" style={{ borderRadius: '50%' }} />{d.name || d.login}</span>}
          sub={`@${d.login}`}
          right={<>
            <a href={d.url} target="_blank" rel="noreferrer" className="link-btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Profile ↗</a>
            <Btn kind="secondary" onClick={() => patch({ following: list.filter((x) => x.login !== d.login) })}>Unfollow</Btn>
          </>} />
      ))}
    </div>
  );
}

/* ---------- 4. Information & permissions ---------- */
function AccessModal({ user, store, onExport }) {
  const [msg, setMsg] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const { pwHash, backupCodes, ...safe } = store;
  const text = JSON.stringify({ user, settings: safe }, null, 2);
  return (
    <div style={S.col}>
      <pre style={{ ...S.card, margin: 0, maxHeight: 260, overflow: 'auto', fontSize: 11.5, color: '#fef08a', whiteSpace: 'pre-wrap' }}>{text}</pre>
      <Msg m={msg} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn kind="secondary" onClick={async () => { try { await navigator.clipboard.writeText(text); setMsg({ ok: 'Copied.' }); } catch { setMsg({ err: 'Could not copy.' }); } }}>Copy</Btn>
        <Btn onClick={onExport}>Download JSON</Btn>
      </div>
    </div>
  );
}

function OrgsModal({ store, patch }) {
  const [u, setU] = useState(store.ghUser || '');
  const [orgs, setOrgs] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (name) => {
    if (!name) return;
    setBusy(true); setErr('');
    try { setOrgs(await gh(`users/${encodeURIComponent(name)}/orgs`)); patch({ ghUser: name }); } catch (e) { setErr(e.message); setOrgs(null); }
    setBusy(false);
  }, [patch]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (store.ghUser) load(store.ghUser); }, []);
  return (
    <div style={S.col}>
      <form onSubmit={(e) => { e.preventDefault(); load(u.trim().replace(/^@/, '')); }} style={{ display: 'flex', gap: 8 }}>
        <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Your GitHub username" className="lusion-search" style={{ flex: 1, borderRadius: 8 }} />
        <button type="submit" disabled={busy} className="link-btn btn-primary" style={{ padding: '8px 16px' }}>{busy ? '...' : 'Load'}</button>
      </form>
      {err && <p style={S.err}>{err}</p>}
      {orgs && orgs.length === 0 && <p style={S.muted}>No public organizations found.</p>}
      {(orgs || []).map((o) => (
        <Item key={o.id} left={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><img src={o.avatar_url} alt="" width="26" height="26" style={{ borderRadius: 6 }} />{o.login}</span>}
          right={<a href={`https://github.com/${o.login}`} target="_blank" rel="noreferrer" className="link-btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Open ↗</a>} />
      ))}
    </div>
  );
}

function TokensModal({ user, store, patch, log }) {
  const prov = String(user?.provider || '').toLowerCase();
  const revoked = store.revokedTokens || {};
  const tokens = prov && prov !== 'local' && prov !== 'email' ? [{ id: prov, name: prov === 'github' ? 'GitHub' : user.provider, scopes: 'read:user, user:email' }] : [];
  return (
    <div style={S.col}>
      {tokens.length === 0 && <p style={S.muted}>No OAuth tokens. You sign in with email/password or a local account.</p>}
      {tokens.map((t) => (
        <Item key={t.id} left={`${t.name} OAuth`} sub={`Scopes: ${t.scopes} • ${revoked[t.id] ? 'Hidden from GitXplore' : 'Active'}`}
          right={<Btn kind="secondary" onClick={() => { patch({ revokedTokens: { ...revoked, [t.id]: !revoked[t.id] } }); log('OAuth token', `${t.name} ${revoked[t.id] ? 'restored' : 'revoked'}`); }}>{revoked[t.id] ? 'Restore' : 'Revoke'}</Btn>} />
      ))}
      {tokens.some((t) => t.id === 'github') && (
        <a href="https://github.com/settings/applications" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 12.5 }}>Fully revoke access in your GitHub settings ↗</a>
      )}
    </div>
  );
}

function ExternalModal({ user, store, patch, log }) {
  const [d, setD] = useState('');
  const gitLinked = String(user?.provider || '').toLowerCase() === 'github';
  return (
    <div style={S.col}>
      <Item left="🐙 GitHub" sub={gitLinked ? 'Linked via sign-in' : 'Not linked'} right={<span style={{ color: gitLinked ? '#22c55e' : '#9ca3af', fontSize: 12.5 }}>{gitLinked ? 'Linked' : '—'}</span>} />
      {store.discord ? (
        <Item left="💬 Discord" sub={store.discord} right={<Btn kind="secondary" onClick={() => { patch({ discord: '' }); log('External accounts', 'Discord unlinked'); }}>Unlink</Btn>} />
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (!d.trim()) return; patch({ discord: d.trim() }); log('External accounts', `Discord linked (${d.trim()})`); setD(''); }} style={{ display: 'flex', gap: 8 }}>
          <input value={d} onChange={(e) => setD(e.target.value)} placeholder="Discord username" className="lusion-search" style={{ flex: 1, borderRadius: 8 }} />
          <button type="submit" className="link-btn btn-primary" style={{ padding: '8px 16px' }}>Link</button>
        </form>
      )}
    </div>
  );
}

function IdentityModal({ user }) {
  const [info, setInfo] = useState(undefined);
  const [msg, setMsg] = useState(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setInfo(data?.user || null)).catch(() => setInfo(null)); }, []);
  const verified = !!info?.email_confirmed_at;
  const resend = async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.identifier });
    setMsg(error ? { err: error.message } : { ok: 'Verification email sent.' });
  };
  if (info === undefined) return <p style={S.muted}>Checking...</p>;
  if (!info) return <p style={S.muted}>This is a local account on this device, so identity cannot be verified by an email provider.</p>;
  return (
    <div style={S.col}>
      <Item left={verified ? '✅ Email verified' : '⚠️ Email not verified'} sub={verified ? `${info.email} • ${fmt(info.email_confirmed_at)}` : info.email} />
      <Item left="Provider" sub={info.app_metadata?.provider || 'email'} />
      <Item left="Account created" sub={fmt(info.created_at)} />
      <Msg m={msg} />
      {!verified && <Btn onClick={resend}>Resend verification email</Btn>}
    </div>
  );
}

function SearchHistoryModal({ store, patch, log }) {
  const list = store.searches ?? ['three.js shaders', 'supabase realtime', 'react lenis smooth scroll'];
  return (
    <div style={S.col}>
      <Switch label="Save search history" checked={store.saveSearch ?? true} onChange={(v) => patch({ saveSearch: v })} />
      {list.length === 0 && <p style={S.muted}>No saved searches.</p>}
      {list.map((q) => <Item key={q} left={`"${q}"`} right={<Btn kind="secondary" onClick={() => patch({ searches: list.filter((x) => x !== q) })}>✕</Btn>} />)}
      {list.length > 0 && <Btn kind="secondary" onClick={() => { patch({ searches: [] }); log('Search history', 'Cleared'); }}>Clear search history</Btn>}
    </div>
  );
}

/* ---------- 5. Activity & tracking ---------- */
const TRACKERS = { react: ['React Open Source', 'facebook/react'], next: ['Next.js Framework', 'vercel/next.js'], gsap: ['GSAP Animations', 'greensock/GSAP'] };
function TrackersModal({ store, patch, log }) {
  const [repo, setRepo] = useState('');
  const [err, setErr] = useState('');
  const on = store.trackers || {};
  const custom = store.customTrackers || [];
  const add = (e) => {
    e.preventDefault();
    const v = repo.trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(v)) return setErr('Use the format owner/repo.');
    if (custom.includes(v)) return setErr('Already tracked.');
    patch({ customTrackers: [...custom, v] }); log('Tracking repository', v); setRepo(''); setErr('');
  };
  return (
    <div style={S.col}>
      {Object.entries(TRACKERS).map(([k, [label, slug]]) => (
        <Switch key={k} label={label} hint={slug} checked={on[k] ?? true} onChange={(v) => { patch({ trackers: { ...on, [k]: v } }); log('Tracker', `${label}: ${v ? 'on' : 'off'}`); }} />
      ))}
      {custom.map((c) => (
        <Item key={c} left={c} right={<>
          <a href={`https://github.com/${c}`} target="_blank" rel="noreferrer" className="link-btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>↗</a>
          <Btn kind="secondary" onClick={() => patch({ customTrackers: custom.filter((x) => x !== c) })}>Remove</Btn>
        </>} />
      ))}
      <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
        <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo (e.g. vuejs/core)" className="lusion-search" style={{ flex: 1, borderRadius: 8 }} />
        <button type="submit" className="link-btn btn-primary" style={{ padding: '8px 16px' }}>Track</button>
      </form>
      {err && <p style={S.err}>{err}</p>}
      <div><label style={S.label}>Update frequency</label>
        <select value={store.trackFreq || 'daily'} onChange={(e) => patch({ trackFreq: e.target.value })} className="lusion-search" style={S.input}>
          <option value="realtime">Real-time</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option>
        </select></div>
    </div>
  );
}

const TOPICS = { ai: 'Artificial Intelligence & Neural Networks', webgl: 'WebGL, WebGPU & 3D Shaders', cloud: 'Cloud Native & Edge Computing' };
function TopicsModal({ store, patch, log }) {
  const [t, setT] = useState('');
  const on = store.topics || {};
  const custom = store.customTopics || [];
  return (
    <div style={S.col}>
      {Object.entries(TOPICS).map(([k, label]) => (
        <Switch key={k} label={label} checked={on[k] ?? true} onChange={(v) => patch({ topics: { ...on, [k]: v } })} />
      ))}
      {custom.map((c) => <Item key={c} left={c} right={<Btn kind="secondary" onClick={() => patch({ customTopics: custom.filter((x) => x !== c) })}>Remove</Btn>} />)}
      <form onSubmit={(e) => { e.preventDefault(); const v = t.trim(); if (!v || custom.includes(v)) return; patch({ customTopics: [...custom, v] }); log('Monitored topic', v); setT(''); }} style={{ display: 'flex', gap: 8 }}>
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a topic (e.g. Rust, WebAssembly)" className="lusion-search" style={{ flex: 1, borderRadius: 8 }} />
        <button type="submit" className="link-btn btn-primary" style={{ padding: '8px 16px' }}>Add</button>
      </form>
    </div>
  );
}

/* ---------- 6. Billing (DEMO – không xử lý thanh toán thật) ---------- */
function PaymentModal({ store, patch, log }) {
  const [f, setF] = useState({ num: '', exp: '', name: '' });
  const [msg, setMsg] = useState(null);
  const cards = store.cards || [];
  const submit = (e) => {
    e.preventDefault();
    const digits = f.num.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(digits) || !luhn(digits)) return setMsg({ err: 'Card number is invalid.' });
    const m = /^(\d{2})\/(\d{2})$/.exec(f.exp);
    if (!m || +m[1] < 1 || +m[1] > 12) return setMsg({ err: 'Expiry must be MM/YY.' });
    const now = new Date();
    if (2000 + +m[2] < now.getFullYear() || (2000 + +m[2] === now.getFullYear() && +m[1] < now.getMonth() + 1)) return setMsg({ err: 'This card has expired.' });
    const last4 = digits.slice(-4);
    if (cards.some((c) => c.last4 === last4 && c.exp === f.exp)) return setMsg({ err: 'This card is already saved.' });
    const card = { id: String(Date.now()), brand: brandOf(digits), last4, exp: f.exp, name: f.name.trim(), default: cards.length === 0 };
    patch({ cards: [...cards, card] });
    log('Payment method added', `${card.brand} •••• ${last4}`);
    setF({ num: '', exp: '', name: '' }); setMsg({ ok: 'Card saved.' });
  };
  return (
    <div style={S.col}>
      {cards.map((c) => (
        <Item key={c.id} left={`💳 ${c.brand} •••• ${c.last4}`} sub={`Expires ${c.exp}${c.default ? ' • Default' : ''}`}
          right={<>
            {!c.default && <Btn kind="secondary" onClick={() => patch({ cards: cards.map((x) => ({ ...x, default: x.id === c.id })) })}>Make default</Btn>}
            <Btn kind="secondary" onClick={() => { const rest = cards.filter((x) => x.id !== c.id); if (c.default && rest[0]) rest[0] = { ...rest[0], default: true }; patch({ cards: rest }); log('Payment method removed', `${c.brand} •••• ${c.last4}`); }}>Remove</Btn>
          </>} />
      ))}
      <form onSubmit={submit} style={S.col}>
        <div><label style={S.label}>Card number</label>
          <input required inputMode="numeric" placeholder="4242 4242 4242 4242" value={f.num} onChange={(e) => setF({ ...f, num: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })} className="lusion-search" style={S.input} autoComplete="off" /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><label style={S.label}>Expiry (MM/YY)</label>
            <input required placeholder="12/28" value={f.exp} onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4); if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`; setF({ ...f, exp: v }); }} className="lusion-search" style={S.input} autoComplete="off" /></div>
          <div style={{ flex: 1 }}><label style={S.label}>Name on card</label>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="lusion-search" style={S.input} /></div>
        </div>
        <Msg m={msg} />
        <button type="submit" className="link-btn btn-primary">Save payment card</button>
        <p style={{ ...S.muted, margin: 0 }}>Demo only: just the last 4 digits and expiry are kept on this device. No real charge is made.</p>
      </form>
    </div>
  );
}

function AddressModal({ store, patch, log, close }) {
  const [a, setA] = useState(store.address || '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); patch({ address: a.trim() }); log('Billing address', 'Updated'); close(); }} style={S.col}>
      <div><label style={S.label}>Billing address</label>
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Street, city, country" className="lusion-search" style={S.input} /></div>
      <button type="submit" className="link-btn btn-primary">Save address</button>
    </form>
  );
}

export function TransactionsView({ store }) {
  const [f, setF] = useState('All');
  const all = store.transactions || [];
  const list = f === 'All' ? all : all.filter((t) => t.type === f);
  const csv = () => {
    const rows = [['Date', 'Type', 'Description', 'Amount (USD)', 'Method'], ...all.map((t) => [t.date, t.type, t.desc, t.amount, t.card])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gitxplore_transactions.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {['All', 'Donations', 'Sponsorships', 'API Credits', 'Subscriptions', 'Others'].map((pill) => (
          <button key={pill} type="button" onClick={() => setF(pill)} style={{ background: f === pill ? '#1f2937' : '#140a0a', color: f === pill ? '#fff' : '#9ca3af', border: '1px solid #2b1414', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{pill}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 48, color: '#6b7280' }}>👝</div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#fff' }}>Your transactions</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', maxWidth: 420, lineHeight: 1.5 }}>
            {all.length ? `No ${f.toLowerCase()} transactions yet.` : "Looks like you don't have any transactions from the last two years. Any sponsorship contributions or receipts will appear here."}
          </p>
        </div>
      ) : (
        <div style={S.col}>
          {list.map((t) => (
            <Item key={t.id} left={t.desc} sub={`${t.type} • ${fmt(t.date)} • ${t.card}`} right={<strong style={{ color: '#fef08a' }}>${Number(t.amount).toFixed(2)}</strong>} />
          ))}
          <div style={{ ...S.row, marginTop: 4 }}>
            <span style={S.muted}>Total: ${list.reduce((s, t) => s + Number(t.amount), 0).toFixed(2)}</span>
            <Btn kind="secondary" onClick={csv}>Download CSV</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 7. Sponsorships ---------- */
function SponsorModal({ store, patch, log, open }) {
  const [creator, setCreator] = useState('');
  const [amount, setAmount] = useState(5);
  const [monthly, setMonthly] = useState(true);
  const [msg, setMsg] = useState(null);
  const cards = store.cards || [];
  const submit = (e) => {
    e.preventDefault();
    const amt = Number(amount); const who = creator.trim();
    if (!who) return setMsg({ err: 'Enter a creator or repository.' });
    if (!(amt >= 1 && amt <= 1000)) return setMsg({ err: 'Amount must be between $1 and $1000.' });
    if (!cards.length) return setMsg({ err: 'Add a payment method first.' });
    const card = cards.find((c) => c.default) || cards[0];
    const id = Date.now(); const now = new Date().toISOString();
    patch((p) => ({
      transactions: [{ id, type: monthly ? 'Sponsorships' : 'Donations', desc: `${monthly ? 'Monthly sponsorship' : 'Donation'} to ${who}`, amount: amt, date: now, card: `${card.brand} •••• ${card.last4}` }, ...(p.transactions || [])],
      subs: monthly ? [{ id, creator: who, amount: amt, since: now, active: true }, ...(p.subs || [])] : (p.subs || []),
    }));
    log(monthly ? 'Sponsorship started' : 'Donation sent', `$${amt} → ${who}`);
    setMsg({ ok: monthly ? 'Sponsorship started. Manage it in Sponsorships & Subscriptions.' : 'Donation recorded. Thank you!' });
    setCreator('');
  };
  return (
    <form onSubmit={submit} style={S.col}>
      <div><label style={S.label}>Creator or repository</label>
        <input value={creator} onChange={(e) => setCreator(e.target.value)} placeholder="e.g. mrdoob or vitejs/vite" className="lusion-search" style={S.input} /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[5, 25, 100].map((v) => (
          <button key={v} type="button" onClick={() => setAmount(v)} style={{ flex: 1, background: Number(amount) === v ? '#261414' : '#180d0d', border: '1px solid #3d1b1b', color: '#fbbf24', padding: 10, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>${v}</button>
        ))}
        <input type="number" min="1" max="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="lusion-search" style={{ width: 90, borderRadius: 8 }} />
      </div>
      <Switch label="Repeat every month" checked={monthly} onChange={setMonthly} />
      <Msg m={msg} />
      {!cards.length && <Btn kind="secondary" onClick={() => open({ title: 'Add a payment method', type: 'add_payment' })}>Add a payment method</Btn>}
      <button type="submit" className="link-btn btn-primary">{monthly ? 'Start sponsorship' : 'Send donation'}</button>
      <p style={{ ...S.muted, margin: 0 }}>Demo only: no real charge is made.</p>
    </form>
  );
}

export function SubscriptionsList({ store, patch, log }) {
  const subs = store.subs || [];
  if (!subs.length) return <p style={{ ...S.muted, margin: 0 }}>You have no active sponsorships yet.</p>;
  const cancel = (s) => { patch({ subs: subs.map((x) => (x.id === s.id ? { ...x, active: false, endedAt: new Date().toISOString() } : x)) }); log('Sponsorship cancelled', s.creator); };
  return (
    <div style={S.col}>
      {subs.map((s) => (
        <Item key={s.id} left={`⭐ ${s.creator}`} sub={s.active ? `$${s.amount}/month • since ${fmt(s.since)}` : `Cancelled ${fmt(s.endedAt)}`}
          right={s.active ? <Btn kind="secondary" onClick={() => cancel(s)}>Cancel</Btn> : <span style={S.muted}>Ended</span>} />
      ))}
    </div>
  );
}

/* ---------- 8. Manage accounts ---------- */
function AddAccountModal({ store, patch, log, close }) {
  const [provider, setProvider] = useState('GitHub');
  const [handle, setHandle] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const linked = store.linked || [];
  const submit = async (e) => {
    e.preventDefault();
    const h = handle.trim().replace(/^@/, '');
    if (!h) return;
    if (linked.some((x) => x.provider === provider && x.handle.toLowerCase() === h.toLowerCase())) return setErr('This account is already linked.');
    setBusy(true); setErr('');
    try {
      let acc = { id: String(Date.now()), provider, handle: h, name: h, at: new Date().toISOString() };
      if (provider === 'GitHub') {
        const d = await gh(`users/${encodeURIComponent(h)}`);
        acc = { ...acc, handle: d.login, name: d.name || d.login, avatar: d.avatar_url };
      }
      patch({ linked: [...linked, acc] }); log('Account linked', `${provider}: ${acc.handle}`); close();
    } catch (er) { setErr(er.message); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>Link another developer account to this Accounts Center.</p>
      <select value={provider} onChange={(e) => setProvider(e.target.value)} className="lusion-search" style={S.input}>
        <option>GitHub</option><option>GitLab</option><option>Bitbucket</option>
      </select>
      <input required placeholder="username" value={handle} onChange={(e) => setHandle(e.target.value)} className="lusion-search" style={S.input} />
      {err && <p style={S.err}>{err}</p>}
      <button type="submit" disabled={busy} className="link-btn btn-primary">{busy ? 'Checking...' : 'Authorize & Connect'}</button>
    </form>
  );
}

function AccountManageModal({ arg, user, store, patch, log, close, onExport }) {
  const acc = (store.linked || []).find((x) => x.id === arg);
  if (arg !== 'primary' && acc) {
    return (
      <div style={S.col}>
        <Item left={acc.name} sub={`${acc.provider} • @${acc.handle} • linked ${fmt(acc.at)}`} />
        <Btn kind="secondary" onClick={() => { patch({ linked: store.linked.filter((x) => x.id !== acc.id) }); log('Account disconnected', `${acc.provider}: ${acc.handle}`); close(); }}>Disconnect account</Btn>
      </div>
    );
  }
  const wipe = () => {
    if (!window.confirm('Delete all GitXplore data stored on this device for this account?')) return;
    ['ac_', 'details_', 'saved_', 'hist_'].forEach((p) => localStorage.removeItem(p + user.identifier));
    window.location.reload();
  };
  return (
    <div style={S.col}>
      <Item left={user?.name} sub={`${user?.identifier} • ${user?.provider || 'local'} • session active`} />
      <Btn kind="secondary" onClick={onExport}>Export my data</Btn>
      <Btn kind="secondary" onClick={wipe} style={{ color: '#f87171' }}>Delete data stored on this device</Btn>
    </div>
  );
}

export function LinkedAccountsList({ store, open }) {
  const list = store.linked || [];
  return (
    <>
      {list.map((a) => (
        <div key={a.id} style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: 14, padding: '14px 20px', ...S.row }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {a.avatar ? <img src={a.avatar} alt="" width="38" height="38" style={{ borderRadius: '50%' }} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#7f1d1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{a.name[0]?.toUpperCase()}</div>}
            <div><strong style={{ color: '#fff', fontSize: 14 }}>{a.name}</strong><div style={S.muted}>{a.provider} • @{a.handle}</div></div>
          </div>
          <button type="button" onClick={() => open({ title: 'Manage account', type: 'account_manage', arg: a.id })} style={{ background: '#261212', color: '#fef08a', border: '1px solid #3d1b1b', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Manage</button>
        </div>
      ))}
    </>
  );
}

/* ---------- 9. Roadmap & AI Glasses ---------- */
function RoadmapModal({ store, patch }) {
  const items = [['unified', 'Unified workspace'], ['reposync', 'Repository synchronization'], ['collab', 'Real-time collaboration']];
  const on = store.roadmap || {};
  return (
    <div style={S.col}>
      <p style={{ ...S.muted, margin: 0 }}>Get notified when these GitXplore Developer Account features ship.</p>
      {items.map(([k, l]) => <Switch key={k} label={l} hint={on[k] ? 'You will be notified' : 'Notify me'} checked={!!on[k]} onChange={(v) => patch({ roadmap: { ...on, [k]: v } })} />)}
    </div>
  );
}
function GlassesModal({ user, store, patch, log }) {
  const joined = !!store.glassesWaitlist;
  return (
    <div style={{ ...S.col, textAlign: 'center' }}>
      <div style={{ fontSize: 44 }}>🕶️</div>
      <p style={{ ...S.muted, margin: 0 }}>Smart assistant integration for your developer workflow.</p>
      {joined ? <p style={S.ok}>You are on the waitlist ({user.identifier}).</p> : null}
      <Btn onClick={() => { patch({ glassesWaitlist: !joined }); log('AI Glasses', joined ? 'Left waitlist' : 'Joined waitlist'); }}>{joined ? 'Leave waitlist' : 'Join waitlist'}</Btn>
    </div>
  );
}

/* ---------- router ---------- */
export default function FeatureModal(props) {
  const { type, title } = props;
  if (TOGGLES[type]) return <ToggleModal {...props} />;
  switch (type) {
    case 'password': return <PasswordModal {...props} />;
    case '2fa': return <TwoFactorModal {...props} />;
    case 'saved_login': return <SavedLoginModal {...props} />;
    case 'passkey': return <PasskeyModal {...props} />;
    case 'sessions': return <SessionsModal {...props} />;
    case 'emails': return <EmailsModal {...props} />;
    case 'checkup': return <CheckupModal {...props} />;
    case 'ghsync': return <GhSyncModal {...props} />;
    case 'workstations': return <DevicesModal {...props} />;
    case 'following': return <FollowingModal {...props} />;
    case 'access_info': return <AccessModal {...props} />;
    case 'orgs': return <OrgsModal {...props} />;
    case 'tokens': return <TokensModal {...props} />;
    case 'external': return <ExternalModal {...props} />;
    case 'identity': return <IdentityModal {...props} />;
    case 'search_history': return <SearchHistoryModal {...props} />;
    case 'trackers': return <TrackersModal {...props} />;
    case 'topics': return <TopicsModal {...props} />;
    case 'add_payment': return <PaymentModal {...props} />;
    case 'address': return <AddressModal {...props} />;
    case 'sponsor_creator': return <SponsorModal {...props} />;
    case 'add_account': return <AddAccountModal {...props} />;
    case 'account_manage': return <AccountManageModal {...props} />;
    case 'roadmap': return <RoadmapModal {...props} />;
    case 'ai_glasses': return <GlassesModal {...props} />;
    default: return <p style={S.muted}>{title}</p>;
  }
}
