import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import AdminDashboardModal from './AdminDashboardModal';

const PREFIX_MAP = {
  'General': { label: 'General', bg: '#291818', color: '#fef08a', border: '#f59e0b' },
  'Discussion': { label: 'Discussion', bg: '#291818', color: '#fef08a', border: '#f59e0b' },
  'Showcase': { label: 'Showcase', bg: '#1e3a8a', color: '#93c5fd', border: '#3b82f6' },
  'Question': { label: 'Question', bg: '#064e3b', color: '#6ee7b7', border: '#10b981' },
  'Warning': { label: 'Warning', bg: '#78350f', color: '#fde047', border: '#eab308' },
  'Source Code': { label: 'Source Code', bg: '#4c1d95', color: '#c4b5fd', border: '#8b5cf6' },
  'Thảo luận': { label: 'Discussion', bg: '#291818', color: '#fef08a', border: '#f59e0b' },
  'Chia sẻ': { label: 'Showcase', bg: '#1e3a8a', color: '#93c5fd', border: '#3b82f6' },
  'Hỏi đáp': { label: 'Question', bg: '#064e3b', color: '#6ee7b7', border: '#10b981' },
  'Cảnh báo': { label: 'Warning', bg: '#78350f', color: '#fde047', border: '#eab308' },
  'Mã nguồn': { label: 'Source Code', bg: '#4c1d95', color: '#c4b5fd', border: '#8b5cf6' },
};

const resolvePrefix = (prefix) => PREFIX_MAP[prefix] || PREFIX_MAP['Discussion'];

export default function CommunityForum({ context, onBack }) {
  const { user } = context;
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  
  // Tạo bài viết mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newPrefix, setNewPrefix] = useState('Discussion');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ lọc danh sách chủ đề
  const [filterMode, setFilterMode] = useState('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Quyền Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const commentsEndRef = useRef(null);

  // 1. Kiểm tra quyền Admin
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

  // 2. Lấy danh sách bài viết ngoài bảng XenForo
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
      .channel('realtime-topics-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, () => fetchTopics())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'topic_messages' }, () => fetchTopics())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 3. Mở chi tiết chủ đề
  const handleOpenTopic = async (topic) => {
    setActiveTopic(topic);
    window.history.pushState({}, '', `/community?thread=${topic.id}`);
    try {
      await supabase.rpc('increment_topic_views', { topic_row_id: topic.id });
    } catch (e) {
      console.error(e);
    }
  };

  // Trở về danh sách bảng ngoài
  const handleBackToList = () => {
    setActiveTopic(null);
    window.history.pushState({}, '', '/community');
    fetchTopics();
  };

  // 4. Lấy danh sách bình luận khi đang ở trong một chủ đề
  useEffect(() => {
    if (!activeTopic) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from('topic_messages')
        .select('*')
        .eq('topic_id', activeTopic.id)
        .order('created_at', { ascending: true });

      if (data) setComments(data);
    };

    fetchComments();

    const channel = supabase
      .channel(`thread-live-${activeTopic.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_messages', filter: `topic_id=eq.${activeTopic.id}` }, () => fetchComments())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeTopic]);

  // 5. Gửi bình luận trong phong cách Facebook Post
  const handleSendComment = async (e) => {
    e.preventDefault();
    const cleanComment = commentInput.trim();
    if (!cleanComment || !activeTopic) return;

    const sender = user?.name || user?.identifier || 'Member';
    const nowIso = new Date().toISOString();

    const { error } = await supabase.from('topic_messages').insert([
      { topic_id: activeTopic.id, user_name: sender, content: cleanComment }
    ]);

    if (!error) {
      setCommentInput('');
      await supabase.from('topics').update({
        last_reply_user: sender,
        last_reply_time: nowIso
      }).eq('id', activeTopic.id);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // Chọn ảnh khi tạo bài
  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Tạo chủ đề mới
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const author = user?.name || user?.identifier || 'Anonymous Member';
    let uploadedMediaUrl = null;

    try {
      if (selectedFile) {
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `forum/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, selectedFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('media').getPublicUrl(filePath);
          uploadedMediaUrl = data.publicUrl;
        }
        setUploading(false);
      }

      const { data, error } = await supabase
        .from('topics')
        .insert([{
          title: newTopicTitle.trim(),
          description: newTopicDesc.trim() || uploadedMediaUrl || null,
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
        setSelectedFile(null);
        setFilePreview(null);
        setShowCreateModal(false);
        handleOpenTopic(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin thao tác
  const handleTogglePin = async (e, topic) => {
    e.stopPropagation();
    await supabase.from('topics').update({ is_pinned: !topic.is_pinned }).eq('id', topic.id);
    fetchTopics();
  };

  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`ADMIN: Are you sure you want to delete "${topicTitle}"?`)) return;
    await supabase.from('topics').delete().eq('id', topicId);
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    if (activeTopic?.id === topicId) handleBackToList();
  };

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

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER DIỄN ĐÀN */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 5vw',
          background: '#120909',
          borderBottom: '1px solid #2b1414',
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
              <span>Welcome, <strong style={{ color: isAdmin ? '#ef4444' : '#fef08a' }}>{user.name}</strong></span>
            ) : 'Guest Mode'}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* GIAO DIỆN 1: BẢNG DANH SÁCH CHỦ ĐỀ BAN ĐẦU (ẢNH 1)      */}
      {/* ======================================================== */}
      {!activeTopic ? (
        <div style={{ flex: 1, padding: '24px 5vw', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
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

            {/* BẢNG CHỦ ĐỀ CHUẨN XENFORO */}
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
                <span>TITLE / STARTED BY</span>
                <span style={{ textAlign: 'center' }}>STATS</span>
                <span style={{ textAlign: 'left', paddingLeft: '12px' }}>LATEST REPLY</span>
                <span></span>
              </div>

              {sortedTopics.map((t) => {
                const prefixConfig = resolvePrefix(t.prefix);
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
                              background: prefixConfig.bg,
                              color: prefixConfig.color,
                              border: `1px solid ${prefixConfig.border}`,
                              padding: '1px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              lineHeight: 1.4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {prefixConfig.label}
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
                            title={t.is_pinned ? 'Unpin' : 'Pin'}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                          >
                            📌
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id, t.title); }}
                            title="Delete"
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
        </div>
      ) : (
        /* ======================================================== */
        /* GIAO DIỆN 2: CHI TIẾT BÀI VIẾT FACEBOOK GROUP (ẢNH 2 & 3) */
        /* ======================================================== */
        <div style={{ flex: 1, background: '#0b0606' }}>
          
          {/* COVER BANNER & GROUP BAR */}
          <div style={{ background: '#130a0a', borderBottom: '1px solid #261414' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
              <div
                style={{
                  height: '240px',
                  width: '100%',
                  borderRadius: '0 0 12px 12px',
                  background: 'linear-gradient(135deg, #450a0a 0%, #1c0a0a 50%, #1e1b4b 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '24px',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Group by EA Sports FC Online Vietnam
                  </span>
                  <h1 style={{ margin: '8px 0 4px', fontSize: '28px', fontWeight: 800, color: '#fff' }}>
                    Garena FC Online Việt Nam
                  </h1>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    🌐 Public group · <strong>524.5K members</strong>
                  </div>
                </div>
              </div>

              {/* TABS & BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['About', 'Discussion', 'Featured', 'People', 'Events', 'Media', 'Files'].map((tab, idx) => (
                    <button
                      key={tab}
                      style={{
                        background: idx === 1 ? '#2b1414' : 'transparent',
                        color: idx === 1 ? '#f59e0b' : '#9ca3af',
                        border: 'none',
                        borderBottom: idx === 1 ? '3px solid #f59e0b' : '3px solid transparent',
                        padding: '10px 14px',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    + Invite
                  </button>
                  <button style={{ background: '#261414', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    ↗ Share
                  </button>
                  <button style={{ background: '#261414', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    ✓ Joined ▾
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NỘI DUNG 2 CỘT CHUẨN FACEBOOK FEED */}
          <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
            
            {/* CỘT TRÁI: BÀI POST CHÍNH & KHUNG BÌNH LUẬN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', overflow: 'hidden' }}>
                {/* HEADER BÀI VIẾT */}
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #7f1d1d, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                      {activeTopic.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '14.5px' }}>
                        {activeTopic.author_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>
                        {formatForumTime(activeTopic.created_at)} · 🌐
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', background: '#291818', color: '#fef08a', padding: '3px 8px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
                    {resolvePrefix(activeTopic.prefix).label}
                  </span>
                </div>

                {/* TIÊU ĐỀ & NỘI DUNG BÀI ĐĂNG */}
                <div style={{ padding: '0 16px 14px' }}>
                  <h2 style={{ fontSize: '18px', margin: '0 0 8px', color: '#fff', fontWeight: 700 }}>
                    {activeTopic.title}
                  </h2>

                  {/* ẢNH/MEDIA ĐÍNH KÈM */}
                  {activeTopic.description && (activeTopic.description.startsWith('http') || activeTopic.description.startsWith('https')) ? (
                    <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
                      <img src={activeTopic.description} alt="Post Media" style={{ width: '100%', maxHeight: '550px', objectFit: 'contain' }} />
                    </div>
                  ) : activeTopic.description ? (
                    <div style={{ fontSize: '14.5px', color: '#d1d5db', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {activeTopic.description}
                    </div>
                  ) : null}
                </div>

                {/* LIKE / COMMENT COUNTER */}
                <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#9ca3af', borderTop: '1px solid #201010', borderBottom: '1px solid #201010' }}>
                  <span>👍 ❤️ 24</span>
                  <span>{comments.length} comments</span>
                </div>

                {/* NÚT THAO TÁC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 8px', borderBottom: '1px solid #201010' }}>
                  <button style={{ background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    👍 Like
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    💬 Comment
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    ↗ Share
                  </button>
                </div>

                {/* KHUNG BÌNH LUẬN FACEBOOK STYLE */}
                <div style={{ padding: '16px', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* DANH SÁCH BÌNH LUẬN */}
                  {comments.map((c) => (
                    <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#3b1818', color: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                        {c.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ background: '#1c0f0f', padding: '10px 14px', borderRadius: '16px', border: '1px solid #2b1414', maxWidth: '85%' }}>
                        <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '12.5px' }}>{c.user_name}</div>
                        <div style={{ fontSize: '13.5px', color: '#e5e7eb', marginTop: '3px', lineHeight: 1.5 }}>{c.content}</div>
                        <div style={{ fontSize: '10.5px', color: '#78716c', marginTop: '6px' }}>{formatForumTime(c.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />

                  {/* KHUNG NHẬP BÌNH LUẬN */}
                  <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      style={{ flex: 1, background: '#180d0d', border: '1px solid #2d1414', borderRadius: '20px', padding: '10px 16px', color: '#fff', fontSize: '13.5px', outline: 'none' }}
                    />
                    <button
                      type="submit"
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* CỘT PHẢI: WIDGET ABOUT & RECENT MEDIA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
              
              {/* BOX ABOUT */}
              <div style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: '#fef08a' }}>About</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
                  Đây là Group giao lưu và kết bạn chính thức của FC Online tại Việt Nam có liên kết trực tiếp tới fanpage EA Sports FC Online Vietnam...
                </p>

                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px' }}>🌐</span>
                    <div>
                      <strong style={{ color: '#fff' }}>Public</strong>
                      <div style={{ fontSize: '11px', color: '#78716c' }}>Anyone can see who's in the group and what they post.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px' }}>👁️</span>
                    <div>
                      <strong style={{ color: '#fff' }}>Visible</strong>
                      <div style={{ fontSize: '11px', color: '#78716c' }}>Anyone can find this group.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px' }}>⚽</span>
                    <div>
                      <strong style={{ color: '#fff' }}>Linked games</strong>
                      <div style={{ fontSize: '11px', color: '#78716c' }}>FIFA Online 4 / FC Online</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX RECENT MEDIA (ẢNH 2) */}
              <div style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fef08a' }}>Recent media</h3>
                  <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>See all</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ height: '90px', background: '#221111', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src="/frames/frame_0001.jpg" alt="Media 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ height: '90px', background: '#221111', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src="/frames/frame_0060.jpg" alt="Media 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL TẠO CHỦ ĐỀ MỚI */}
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
                placeholder="Topic description or message..."
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

              {filePreview && (
                <div style={{ position: 'relative' }}>
                  <img src={filePreview} alt="Preview" style={{ maxHeight: '180px', borderRadius: '6px', objectFit: 'cover' }} />
                  <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} style={{ position: 'absolute', top: '4px', left: '4px', background: '#000', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <label style={{ cursor: 'pointer', color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>
                  📷 Attach Image
                  <input type="file" accept="image/*" onChange={handleSelectFile} style={{ display: 'none' }} />
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
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
                    {isSubmitting || uploading ? 'Posting...' : 'Post Topic'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADMIN */}
      {showAdminModal && (
        <AdminDashboardModal context={context} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}