import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Toàn bộ dữ liệu + hành động của phần bạn bè trong Cộng đồng.
 * Khóa người dùng là email viết thường (giống bảng user_roles của dự án).
 * Cần chạy community_setup.sql trong Supabase một lần.
 */

const HIDE_KEY = 'gx_hidden_suggestions';

const isMissingTable = (err) =>
  !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message || ''));

const readHidden = (me) => {
  try { return JSON.parse(localStorage.getItem(`${HIDE_KEY}_${me}`) || '[]'); } catch { return []; }
};

const byName = (a, b) => (a.name || '').localeCompare(b.name || '');

export function useCommunity() {
  const { user, updateUser } = useAuth();
  const me = user?.identifier ? user.identifier.toLowerCase() : null;
  const myName = user?.name;
  const myAvatar = user?.avatarUrl;

  const [data, setData] = useState({ profiles: [], friendships: [], lists: [], members: [] });
  const [loading, setLoading] = useState(Boolean(me));
  const [error, setError] = useState(null); // null | 'missing' | 'failed'
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'err', key?, text? }
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(() => (me ? readHidden(me) : []));

  useEffect(() => { setHidden(me ? readHidden(me) : []); }, [me]);

  // ---------- Tải dữ liệu ----------
  const load = useCallback(async (silent = false) => {
    if (!me) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      // Tạo hồ sơ của mình nếu chưa có (không ghi đè nếu đã có).
      const seed = await supabase
        .from('profiles')
        .upsert(
          { email: me, name: myName || me.split('@')[0], avatar_url: myAvatar || null },
          { onConflict: 'email', ignoreDuplicates: true }
        );
      if (seed.error) throw seed.error;

      const [p, f, l] = await Promise.all([
        supabase.from('profiles').select('*').limit(500),
        supabase.from('friendships').select('*').limit(3000),
        supabase.from('friend_lists').select('*').eq('owner', me).order('created_at'),
      ]);
      for (const r of [p, f, l]) if (r.error) throw r.error;

      let members = [];
      const ids = l.data.map((x) => x.id);
      if (ids.length) {
        const m = await supabase.from('friend_list_members').select('*').in('list_id', ids);
        if (m.error) throw m.error;
        members = m.data;
      }
      setData({ profiles: p.data, friendships: f.data, lists: l.data, members });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(isMissingTable(err) ? 'missing' : 'failed');
    } finally {
      setLoading(false);
    }
  }, [me, myName, myAvatar]);

  useEffect(() => { load(false); }, [load]);

  // Realtime: có lời mời / chấp nhận mới thì tự cập nhật.
  useEffect(() => {
    if (!me) return undefined;
    const channel = supabase
      .channel(`community-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [me, load]);

  // Thông báo tự tắt sau 3 giây.
  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(id);
  }, [notice]);

  // ---------- Dữ liệu suy ra ----------
  const derived = useMemo(() => {
    const byEmail = new Map(data.profiles.map((p) => [p.email, p]));
    const person = (email) => byEmail.get(email) || { email, name: email.split('@')[0] };

    const rel = new Map(); // email -> { state: friend | incoming | outgoing, id }
    const friendsOf = new Map();
    const link = (a, b) => {
      if (!friendsOf.has(a)) friendsOf.set(a, new Set());
      friendsOf.get(a).add(b);
    };
    data.friendships.forEach((f) => {
      if (f.status === 'accepted') { link(f.requester, f.addressee); link(f.addressee, f.requester); }
      if (f.requester === me) {
        rel.set(f.addressee, { state: f.status === 'accepted' ? 'friend' : 'outgoing', id: f.id });
      } else if (f.addressee === me) {
        rel.set(f.requester, { state: f.status === 'accepted' ? 'friend' : 'incoming', id: f.id });
      }
    });

    const myFriends = friendsOf.get(me) || new Set();
    const mutual = (email) => {
      const s = friendsOf.get(email);
      if (!s) return 0;
      let n = 0;
      myFriends.forEach((x) => { if (s.has(x)) n += 1; });
      return n;
    };
    const pick = (state) =>
      [...rel.entries()]
        .filter(([, r]) => r.state === state)
        .map(([email, r]) => ({ ...person(email), requestId: r.id, mutual: mutual(email) }));

    const friends = pick('friend').sort(byName);
    const incoming = pick('incoming');
    const outgoing = pick('outgoing');

    const suggestions = data.profiles
      .filter((p) => {
        if (p.email === me || hidden.includes(p.email)) return false;
        const r = rel.get(p.email);
        return !r || r.state === 'outgoing';
      })
      .map((p) => ({ ...p, mutual: mutual(p.email), requestId: rel.get(p.email)?.id }))
      .sort((a, b) => b.mutual - a.mutual || byName(a, b));

    const lists = data.lists.map((l) => ({
      ...l,
      emails: data.members.filter((m) => m.list_id === l.id).map((m) => m.member),
    }));

    return { byEmail, person, rel, friends, incoming, outgoing, suggestions, lists };
  }, [data, me, hidden]);

  // ---------- Hành động ----------
  const run = useCallback(async (fn, okKey) => {
    setBusy(true);
    try {
      const res = await fn();
      if (res?.error) throw res.error;
      await load(true);
      if (okKey) setNotice({ type: 'ok', key: okKey });
      return true;
    } catch (err) {
      console.error(err);
      setNotice({ type: 'err', text: err.message || 'Error' });
      return false;
    } finally {
      setBusy(false);
    }
  }, [load]);

  const accept = (requestId) =>
    run(() => supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId), 'n_accepted');

  const removeRequest = (requestId) =>
    run(() => supabase.from('friendships').delete().eq('id', requestId), 'n_removed');

  const sendRequest = (email) => {
    const r = derived.rel.get(email);
    if (r?.state === 'incoming') return accept(r.id); // họ đã mời mình → coi như xác nhận
    if (r) return Promise.resolve(false);
    return run(
      () => supabase.from('friendships').insert({ requester: me, addressee: email, status: 'pending' }),
      'n_sent'
    );
  };

  const unfriend = (requestId, email) =>
    run(async () => {
      const r = await supabase.from('friendships').delete().eq('id', requestId);
      if (r.error) return r;
      const ids = data.lists.map((l) => l.id);
      if (!ids.length) return r;
      return supabase.from('friend_list_members').delete().eq('member', email).in('list_id', ids);
    }, 'n_unfriended');

  const createList = async (name) => {
    let id = null;
    const ok = await run(async () => {
      const r = await supabase.from('friend_lists').insert({ owner: me, name: name.trim() }).select().single();
      id = r.data?.id ?? null;
      return r;
    }, 'n_list_created');
    return ok ? id : null;
  };

  const renameList = (id, name) =>
    run(() => supabase.from('friend_lists').update({ name: name.trim() }).eq('id', id), 'n_list_updated');

  const deleteList = (id) =>
    run(() => supabase.from('friend_lists').delete().eq('id', id), 'n_list_deleted');

  const addToList = (listId, email) =>
    run(
      () => supabase.from('friend_list_members').upsert({ list_id: listId, member: email }, { onConflict: 'list_id,member', ignoreDuplicates: true }),
      'n_list_updated'
    );

  const removeFromList = (listId, email) =>
    run(() => supabase.from('friend_list_members').delete().eq('list_id', listId).eq('member', email), 'n_list_updated');

  const saveProfile = async ({ name, birthday, bio }) => {
    const cleanName = (name || '').trim() || myName || me.split('@')[0];
    const ok = await run(
      () => supabase.from('profiles').upsert(
        { email: me, name: cleanName, birthday: birthday || null, bio: bio?.trim() || null },
        { onConflict: 'email' }
      ),
      'n_saved'
    );
    if (ok && cleanName !== myName) updateUser({ name: cleanName }); // diễn đàn dùng user.name làm tên tác giả
    return ok;
  };

  const hideSuggestion = (email) => {
    setHidden((prev) => {
      const next = [...new Set([...prev, email])];
      try { localStorage.setItem(`${HIDE_KEY}_${me}`, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  return {
    me,
    loading,
    error,
    notice,
    busy,
    reload: () => load(false),
    myProfile: derived.byEmail.get(me) || null,
    ...derived,
    accept,
    removeRequest,
    sendRequest,
    unfriend,
    createList,
    renameList,
    deleteList,
    addToList,
    removeFromList,
    saveProfile,
    hideSuggestion,
  };
}
