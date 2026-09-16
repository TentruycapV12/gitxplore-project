import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import AdminDashboardModal from './AdminDashboardModal';

const POSTS_PER_PAGE = 10;

// Forum Prefix tags & Styling
const PREFIX_STYLES = {
  'General': { bg: '#291818', color: '#fef08a', border: '#f59e0b' },
  'Discussion': { bg: '#291818', color: '#fef08a', border: '#f59e0b' },
  'Showcase': { bg: '#1e3a8a', color: '#93c5fd', border: '#3b82f6' },
  'Question': { bg: '#064e3b', color: '#6ee7b7', border: '#10b981' },
  'Warning': { bg: '#78350f', color: '#fde047', border: '#eab308' },
  'Source Code': { bg: '#4c1d95', color: '#c4b5fd', border: '#8b5cf6' },
};

export default function CommunityForum({ context, onBack }) {
  const { user } = context;
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newPrefix, setNewPrefix] = useState('Discussion');
  const [msgInput, setMsgInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterMode, setFilterMode] = useState('newest'); // 'newest', 'replies', 'pinned'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const chatEndRef = useRef(null);
  const threadContainerRef = useRef(null);

  // Check Admin role
  useEffect(() => {
    const checkRole = async () => {
      if (!user?.identifier) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('email', user.identifier.toLowerCase())
        .maybeSingle();

      if (data?.role === 'admin' && data?.status !== 'banned') {
        setIsAdmin(true);
      }
    };
    checkRole();
  }, [user]);

  // Fetch topics
  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*, topic_messages(count)')
        .order('is_pinned', { ascending: false })
        .order('last_reply_time', { ascending: false });

      if (!error && data) {
        setTopics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTopics();

    const channel = supabase
      .channel('realtime-topics-xenforo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, () => fetchTopics())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'topic_messages' }, () => fetchTopics())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleOpenTopic = async (topic) => {
    setActiveTopic(topic);
    window.history.pushState({}, '', `/community?thread=${topic.id}`);
    try {
      await supabase.rpc('increment_topic_views', { topic_row_id: topic.id });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackToList = () => {
    setActiveTopic(null);
    window.history.pushState({}, '', '/community');
    fetchTopics();
  };

  useEffect(() => {
    if (!activeTopic) return;
    setCurrentPage(1);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('topic_messages')
        .select('*')
        .eq('topic_id', activeTopic.id)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`thread-live-${activeTopic.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topic_messages', filter: `topic_id=eq.${activeTopic.id}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeTopic]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const author = user?.name || user?.identifier || 'Anonymous Guest';

    const { data, error } = await supabase
      .from('topics')
      .insert([{
        title: newTopicTitle.trim(),
        description: newTopicDesc.trim() || null,
        author_name: author,
        prefix: newPrefix,
        views_count: 1,
        last_reply_user: author,
        last_reply_time: new Date().toISOString()
      }])
      .select();

    if (!error && data && data.length > 0) {
      setNewTopicTitle('');
      setNewTopicDesc('');
      setShowCreateModal(false);
      handleOpenTopic(data[0]);
    }
    setIsSubmitting(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeTopic) return;

    const sender = user?.name || user?.identifier || 'Member';
    const nowIso = new Date().toISOString();

    const { error } = await supabase.from('topic_messages').insert([
      { topic_id: activeTopic.id, user_name: sender, content: msgInput.trim() }
    ]);

    if (!error) {
      setMsgInput('');
      await supabase.from('topics').update({
        last_reply_user: sender,
        last_reply_time: nowIso
      }).eq('id', activeTopic.id);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeTopic) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `forum/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabase.storage.from('media').upload(filePath, file);
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const isVideo = file.type.startsWith('video');
      const sender = user?.name || user?.identifier || 'Member';

      await supabase.from('topic_messages').insert([
        {
          topic_id: activeTopic.id,
          user_name: sender,
          content: '',
          media_url: data.publicUrl,
          media_type: isVideo ? 'video' : 'image'
        }
      ]);

      await supabase.from('topics').update({
        last_reply_user: sender,
        last_reply_time: new Date().toISOString()
      }).eq('id', activeTopic.id);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleTogglePin = async (e, topic) => {
    e.stopPropagation();
    await supabase.from('topics').update({ is_pinned: !topic.is_pinned }).eq('id', topic.id);
    fetchTopics();
  };

  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`ADMIN: Are you sure you want to delete topic "${topicTitle}"?`)) return;
    await supabase.from('topics').delete().eq('id', topicId);
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    if (activeTopic?.id === topicId) handleBackToList();
  };

  // Format English Time
  const formatForumTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
  };

  const formatViewCount = (count) => {
    if (!count || count < 1000) return count || 1;
    return `${(count / 1000).toFixed(1)}K`;
  };

  const sortedTopics = [...topics].sort((a, b) => {
    if (filterMode === 'pinned') return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
    if (filterMode === 'replies') {
      const countA = a.topic_messages?.[0]?.count || 0;
      const countB = b.topic_messages?.[0]?.count || 0;
      return countB - countA;
    }
    return new Date(b.last_reply_time || b.created_at) - new Date(a.last_reply_time || a.created_at);
  });

  const totalPages = Math.ceil(messages.length / POSTS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentMessages = messages.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 5vw',
          background: '#120909',
          borderBottom: '1px solid #2b1414',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={activeTopic ? handleBackToList : onBack}
            className="link-btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
          >
            ← {activeTopic ? 'All Topics' : 'Home'}
          </button>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fef08a', letterSpacing: '1px' }}>
            GIT<span style={{ color: '#ef4444' }}>XPLORE</span> FORUM
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isAdmin && (
            <button
              onClick={() => setShowAdminModal(true)}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              👑 Admin Console
            </button>
          )}
          <div style={{ fontSize: '13px', color: '#a8a29e' }}>
            {user ? (
              <span>
                Welcome, <strong style={{ color: isAdmin ? '#ef4444' : '#fef08a' }}>{user.name}</strong> {isAdmin && '(Admin)'}
              </span>
            ) : 'Guest Mode'}
          </div>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, padding: '24px 5vw', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* VIEW 1: TOPIC LIST */}
        {!activeTopic ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#fef08a' }}>Community Discussions</h1>
                <p style={{ margin: '4px 0 0', color: '#a8a29e', fontSize: '13.5px' }}>
                  {topics.length} discussions across all open-source repositories
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    style={{
                      background: '#1c0f0f',
                      color: '#fef08a',
                      border: '1px solid #381a1a',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Filter ▾
                  </button>

                  {showFilterDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '42px',
                        background: '#160b0b',
                        border: '1px solid #3d1b1b',
                        borderRadius: '8px',
                        padding: '6px 0',
                        width: '170px',
                        zIndex: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                    >
                      <button
                        onClick={() => { setFilterMode('newest'); setShowFilterDropdown(false); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'transparent', border: 'none', color: filterMode === 'newest' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '12.5px' }}
                      >
                        ● Latest Replies
                      </button>
                      <button
                        onClick={() => { setFilterMode('replies'); setShowFilterDropdown(false); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'transparent', border: 'none', color: filterMode === 'replies' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '12.5px' }}
                      >
                        ● Most Active
                      </button>
                      <button
                        onClick={() => { setFilterMode('pinned'); setShowFilterDropdown(false); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'transparent', border: 'none', color: filterMode === 'pinned' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '12.5px' }}
                      >
                        ● Pinned Threads
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="link-btn btn-primary"
                  style={{ padding: '9px 18px', fontSize: '13.5px' }}
                >
                  + Post New Topic
                </button>
              </div>
            </div>

            {/* TOPICS TABLE */}
            <div style={{ background: '#120909', border: '1px solid #2a1515', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 220px 40px',
                  padding: '12px 20px',
                  background: '#190d0d',
                  borderBottom: '1px solid #2a1515',
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <span>Title / Started by</span>
                <span style={{ textAlign: 'center' }}>Stats</span>
                <span style={{ textAlign: 'left', paddingLeft: '12px' }}>Latest Reply</span>
                <span></span>
              </div>

              {sortedTopics.map((t) => {
                const prefixInfo = PREFIX_STYLES[t.prefix] || PREFIX_STYLES['Discussion'];
                const replyCount = t.topic_messages?.[0]?.count || 0;
                const lastUser = t.last_reply_user || t.author_name;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTopic(t)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 140px 220px 40px',
                      padding: '14px 20px',
                      borderBottom: '1px solid #1f1010',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: t.is_pinned ? '#1c0c0c' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1a0e0e')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = t.is_pinned ? '#1c0c0c' : 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7f1d1d, #c2410c)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '15px',
                          flexShrink: 0,
                        }}
                      >
                        {t.author_name.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {t.is_pinned && <span title="Pinned Topic" style={{ color: '#ef4444', fontSize: '13px' }}>📌</span>}

                          <span
                            style={{
                              background: prefixInfo.bg,
                              color: prefixInfo.color,
                              border: `1px solid ${prefixInfo.border}`,
                              padding: '1px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              lineHeight: 1.4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.prefix || 'Discussion'}
                          </span>

                          <span style={{ color: '#f3f4f6', fontSize: '14.5px', fontWeight: 600, wordBreak: 'break-word' }}>
                            {t.title}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#8c827a', marginTop: '4px' }}>
                          <span style={{ color: '#fef08a' }}>{t.author_name}</span> • {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#9ca3af' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span>Replies:</span>
                        <strong style={{ color: '#fff' }}>{replyCount}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                        <span>Views:</span>
                        <strong style={{ color: '#fff' }}>{formatViewCount(t.views_count)}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#2b1414',
                          border: '1px solid #4a1d1d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fbbf24',
                          fontSize: '12px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {lastUser.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatForumTime(t.last_reply_time || t.created_at)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#a8a29e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastUser}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={(e) => handleTogglePin(e, t)}
                            title={t.is_pinned ? 'Unpin thread' : 'Pin thread'}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                          >
                            📌
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id, t.title); }}
                            title="Delete topic"
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {sortedTopics.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#78716c', fontSize: '14px' }}>
                  No discussions found. Be the first to start a thread!
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: THREAD POSTS DETAIL */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#130a0a',
              border: '1px solid #291515',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '75vh',
            }}
          >
            <div style={{ borderBottom: '1px solid #2e1717', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeTopic.is_pinned && <span style={{ color: '#ef4444' }}>📌</span>}
                    <span
                      style={{
                        background: (PREFIX_STYLES[activeTopic.prefix] || PREFIX_STYLES['Discussion']).bg,
                        color: (PREFIX_STYLES[activeTopic.prefix] || PREFIX_STYLES['Discussion']).color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                    >
                      {activeTopic.prefix || 'Discussion'}
                    </span>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>{activeTopic.title}</h1>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#8c827a', marginTop: '6px' }}>
                    Thread Starter: <span style={{ color: '#fef08a' }}>{activeTopic.author_name}</span> • 🕒 {formatForumTime(activeTopic.created_at)}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setCurrentPage(p);
                          threadContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          minWidth: '32px',
                          height: '30px',
                          border: p === currentPage ? '1px solid #f59e0b' : '1px solid #331d1d',
                          background: p === currentPage ? '#f59e0b' : '#1e1111',
                          color: p === currentPage ? '#000' : '#f3f4f6',
                          borderRadius: '4px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* POSTS LIST */}
            <div ref={threadContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {currentMessages.map((m, idx) => {
                const globalIndex = startIndex + idx + 1;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 1fr',
                      background: '#180e0e',
                      border: '1px solid #291515',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ background: '#130b0b', padding: '16px', borderRight: '1px solid #291515', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7f1d1d, #c2410c)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '18px',
                          marginBottom: '8px',
                          border: '2px solid rgba(254, 240, 138, 0.2)',
                        }}
                      >
                        {(m.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '13px', wordBreak: 'break-word' }}>
                        {m.user_name}
                      </div>
                      <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', background: '#241212', padding: '2px 8px', borderRadius: '4px' }}>
                        Member
                      </span>
                    </div>

                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #241313', paddingBottom: '8px', marginBottom: '12px', fontSize: '11.5px', color: '#78716c' }}>
                        <span>🕒 {formatForumTime(m.created_at)}</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>#{globalIndex}</span>
                      </div>

                      <div style={{ flex: 1, fontSize: '14.5px', color: '#e5e7eb', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </div>

                      {m.media_url && m.media_type === 'image' && (
                        <div style={{ marginTop: '12px' }}>
                          <img src={m.media_url} alt="Attached Media" style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', border: '1px solid #331919' }} />
                        </div>
                      )}

                      {m.media_url && m.media_type === 'video' && (
                        <div style={{ marginTop: '12px' }}>
                          <video src={m.media_url} controls style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', border: '1px solid #331919' }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* REPLY FORM */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #2e1717' }}>
              <label
                style={{
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  background: '#241414',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  color: '#fef08a',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  border: '1px solid #3d2020',
                }}
              >
                📎 {uploading ? 'Uploading...' : 'Attach Media'}
                <input type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>

              <input
                type="text"
                placeholder="Write your response here..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                className="lusion-search"
                style={{ flex: 1, borderRadius: '8px' }}
              />

              <button type="submit" className="link-btn btn-primary" style={{ padding: '10px 24px' }}>
                Post Reply
              </button>
            </form>
          </div>
        )}
      </div>

      {/* CREATE TOPIC MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px', width: '92%', padding: '24px', background: '#120909', border: '1px solid #381a1a', borderRadius: '12px' }}
          >
            <h2 style={{ margin: '0 0 16px', color: '#fef08a', fontSize: '18px' }}>Create New Topic</h2>
            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  style={{
                    background: '#1a0d0d',
                    color: '#fef08a',
                    border: '1px solid #381a1a',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                  }}
                >
                  <option value="Discussion">[Discussion]</option>
                  <option value="Showcase">[Showcase]</option>
                  <option value="Question">[Question]</option>
                  <option value="Source Code">[Source Code]</option>
                  <option value="Warning">[Warning]</option>
                </select>

                <input
                  type="text"
                  placeholder="Topic title..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="lusion-search"
                  style={{ flex: 1, borderRadius: '6px' }}
                  required
                />
              </div>

              <textarea
                placeholder="Brief summary or introductory content..."
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: '#1a0d0d',
                  border: '1px solid #381a1a',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="link-btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="link-btn btn-primary"
                  style={{ padding: '8px 20px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN MODAL */}
      {showAdminModal && (
        <AdminDashboardModal context={context} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}