import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import AdminDashboardModal from './AdminDashboardModal';
import UidTag from './UidTag';

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

const GRID_COLS = '1fr 140px 220px 112px';
const stillActive = (until) => !until || new Date(until) > new Date();

// Chèn dòng mới; nếu database chưa có cột tùy chọn (chưa chạy SQL) thì thử lại không có các cột đó.
const insertWithFallback = async (table, row, optionalKeys) => {
  let res = await supabase.from(table).insert([row]).select();
  if (res.error && /column|schema cache/i.test(res.error.message || '')) {
    const slim = { ...row };
    optionalKeys.forEach((k) => delete slim[k]);
    res = await supabase.from(table).insert([slim]).select();
  }
  return res;
};

export default function CommunityForum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const onBack = () => navigate('/');            // <-- dòng mới: về thẳng trang chủ
  const [topics, setTopics] = useState([]);
  // Bài viết đang mở nằm trên URL (?thread=ID) → link chia sẻ mở thẳng đúng bài, Back hoạt động đúng.
  const [searchParams, setSearchParams] = useSearchParams();
  const threadId = searchParams.get('thread');
  const [threadTab, setThreadTab] = useState('Discussion');
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  
  // State đính kèm file trong bình luận
  const [commentFile, setCommentFile] = useState(null);
  const [commentFilePreview, setCommentFilePreview] = useState(null);
  const [isCommentUploading, setIsCommentUploading] = useState(false);
  
  // Like state
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Tạo bài viết mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newPrefix, setNewPrefix] = useState('Discussion');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ lọc & Tìm kiếm tức thì
  const [filterMode, setFilterMode] = useState('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Quyền & trạng thái của người đang đăng nhập (admin / editor / support / member)
  const [access, setAccess] = useState({ role: 'member', status: 'active', banReason: null, bannedUntil: null, mutedUntil: null });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [profileIds, setProfileIds] = useState(() => new Map()); // tên → ID (chỉ khi tên không bị trùng)

  const isBanned = access.status === 'banned' && stillActive(access.bannedUntil);
  const isMuted = stillActive(access.mutedUntil) && Boolean(access.mutedUntil);
  const isAdmin = access.role === 'admin' && !isBanned;
  const isStaff = ['admin', 'editor', 'support'].includes(access.role) && !isBanned;
  const canModerate = ['admin', 'editor'].includes(access.role) && !isBanned;
  const canPost = !isBanned && !isMuted;

  const commentsEndRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentFileInputRef = useRef(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user?.identifier) {
        setAccess({ role: 'member', status: 'active', banReason: null, bannedUntil: null, mutedUntil: null });
        return;
      }
      const email = user.identifier.toLowerCase();
      let res = await supabase
        .from('user_roles')
        .select('role, status, ban_reason, banned_until, muted_until')
        .eq('email', email)
        .maybeSingle();
      // Chưa chạy SQL (thiếu cột mới) → đọc bản cũ để Admin vẫn vào được.
      if (res.error) res = await supabase.from('user_roles').select('role, status').eq('email', email).maybeSingle();
      const d = res.data;
      setAccess({
        role: d?.role || 'member',
        status: d?.status || 'active',
        banReason: d?.ban_reason || null,
        bannedUntil: d?.banned_until || null,
        mutedUntil: d?.muted_until || null,
      });
    };
    checkRole();
  }, [user]);

  // Bảng tên → ID để hiện ID cạnh tên (kể cả bài cũ chưa lưu ID). Tên trùng nhau thì không đoán.
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('profiles').select('name, public_id').limit(2000);
      if (error || !data) return;
      const map = new Map();
      const dup = new Set();
      data.forEach((p) => {
        if (!p.name || !p.public_id) return;
        if (map.has(p.name) && map.get(p.name) !== p.public_id) dup.add(p.name);
        else map.set(p.name, p.public_id);
      });
      dup.forEach((n) => map.delete(n));
      setProfileIds(map);
    })();
  }, []);

  // Thông báo của admin (bỏ qua nếu bảng chưa tồn tại)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('announcements').select('*').eq('is_active', true)
        .order('created_at', { ascending: false }).limit(5);
      if (!error && data) setAnnouncements(data.filter((a) => stillActive(a.expires_at)));
    })();
  }, []);

  const idOf = (storedId, name) => storedId || profileIds.get(name) || null;

  const logAction = async (action, target) => {
    if (!user?.identifier) return;
    await supabase.from('activity_logs').insert([{ actor_email: user.identifier, action, target }]);
  };

  const fetchTopics = useCallback(async () => {
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
  }, []);


  useEffect(() => {
    fetchTopics();

    const channel = supabase
      .channel('realtime-topics-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, () => fetchTopics())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'topic_messages' }, () => fetchTopics())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchTopics]);

  // useMemo: chỉ tìm lại khi danh sách hoặc id trên URL đổi.
  const activeTopic = useMemo(
    () => topics.find((t) => String(t.id) === threadId) ?? null,
    [topics, threadId]
  );

  // Đổi sang bài khác (hoặc về danh sách) thì reset phần state riêng của bài.
  useEffect(() => {
    setThreadTab('Discussion');
    setHasLiked(false);
    setCommentFile(null);
    setCommentFilePreview(null);
  }, [threadId]);

  useEffect(() => {
    setLikesCount(activeTopic?.likes_count || 0);
  }, [activeTopic?.id, activeTopic?.likes_count]);

  const handleOpenTopic = async (topic) => {
    setSearchParams({ thread: topic.id });
    try {
      await supabase.rpc('increment_topic_views', { topic_row_id: topic.id });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackToList = () => {
    setSearchParams({});
    fetchTopics();
  };

  useEffect(() => {
    if (!threadId) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from('topic_messages')
        .select('*')
        .eq('topic_id', threadId)
        .order('created_at', { ascending: true });

      if (data) setComments(data);
    };

    fetchComments();

    const channel = supabase
      .channel(`thread-live-${threadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_messages', filter: `topic_id=eq.${threadId}` }, () => fetchComments())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [threadId]);

  const handleToggleLike = async () => {
    if (!activeTopic || isBanned) return;
    const nextLiked = !hasLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setHasLiked(nextLiked);
    setLikesCount(nextCount);

    await supabase.from('topics').update({ likes_count: nextCount }).eq('id', activeTopic.id);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!\n' + shareUrl);
    }).catch(() => {
      prompt('Copy this link:', shareUrl);
    });
  };

  // Chọn file đính kèm trong bình luận
  const handleSelectCommentFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentFile(file);
      if (file.type.startsWith('image/')) {
        setCommentFilePreview(URL.createObjectURL(file));
      } else {
        setCommentFilePreview('file');
      }
    }
  };

  // Gửi bình luận (hỗ trợ kèm ảnh/tệp)
  const handleSendComment = async (e) => {
    e.preventDefault();
    const cleanComment = commentInput.trim();
    if ((!cleanComment && !commentFile) || !activeTopic || isCommentUploading) return;
    if (!canPost || (activeTopic.is_locked && !canModerate)) return;

    setIsCommentUploading(true);
    const sender = user?.name || user?.identifier || 'Member';
    const nowIso = new Date().toISOString();
    let uploadedMediaUrl = null;

    try {
      if (commentFile) {
        const fileExt = commentFile.name.split('.').pop();
        const filePath = `comments/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, commentFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('media').getPublicUrl(filePath);
          uploadedMediaUrl = data.publicUrl;
        }
      }

      const { error } = await insertWithFallback('topic_messages', {
        topic_id: activeTopic.id,
        user_name: sender,
        user_public_id: user?.publicId || null,
        content: cleanComment || (commentFile?.type.startsWith('image/') ? '📷 Photo' : '📎 Attachment'),
        media_url: uploadedMediaUrl,
      }, ['user_public_id']);

      if (!error) {
        setCommentInput('');
        setCommentFile(null);
        setCommentFilePreview(null);
        await supabase.from('topics').update({
          last_reply_user: sender,
          last_reply_time: nowIso
        }).eq('id', activeTopic.id);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommentUploading(false);
    }
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || isSubmitting || !canPost) return;

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

      const { data, error } = await insertWithFallback('topics', {
        title: newTopicTitle.trim(),
        description: newTopicDesc.trim() || uploadedMediaUrl || null,
        author_name: author,
        author_public_id: user?.publicId || null,
        prefix: newPrefix,
        views_count: 1,
        likes_count: 0,
        last_reply_user: author,
        last_reply_time: new Date().toISOString(),
      }, ['author_public_id']);

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

  const handleTogglePin = async (e, topic) => {
    e.stopPropagation();
    await supabase.from('topics').update({ is_pinned: !topic.is_pinned }).eq('id', topic.id);
    logAction(topic.is_pinned ? 'Unpin Topic' : 'Pin Topic', `#${topic.id} ${topic.title}`);
    fetchTopics();
  };

  const handleToggleLock = async (e, topic) => {
    e.stopPropagation();
    const { error } = await supabase.from('topics').update({ is_locked: !topic.is_locked }).eq('id', topic.id);
    if (error) { alert('Cannot lock topic. Did you run supabase_admin_setup.sql?\n' + error.message); return; }
    logAction(topic.is_locked ? 'Unlock Topic' : 'Lock Topic', `#${topic.id} ${topic.title}`);
    fetchTopics();
  };

  const handleDeleteComment = async (c) => {
    if (!window.confirm(`Delete this comment by ${c.user_name}?`)) return;
    await supabase.from('topic_messages').delete().eq('id', c.id);
    logAction('Delete Comment', `${c.user_name}: ${(c.content || '').slice(0, 60)}`);
    setComments((prev) => prev.filter((x) => x.id !== c.id));
  };

  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`ADMIN: Are you sure you want to delete "${topicTitle}"?`)) return;
    await supabase.from('topics').delete().eq('id', topicId);
    logAction('Delete Topic', `#${topicId} ${topicTitle}`);
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

  const totalReplies = useMemo(() => {
    return topics.reduce((acc, t) => acc + (t.topic_messages?.[0]?.count || 0), 0);
  }, [topics]);

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (searchQuery.trim()) {
        const sq = searchQuery.toLowerCase().trim();
        const titleMatch = (t.title || '').toLowerCase().includes(sq);
        const descMatch = (t.description || '').toLowerCase().includes(sq);
        const authorMatch = (t.author_name || '').toLowerCase().includes(sq);
        if (!titleMatch && !descMatch && !authorMatch) return false;
      }
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Pinned') {
          if (!t.is_pinned) return false;
        } else {
          const resolved = resolvePrefix(t.prefix).label;
          if (resolved.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }
      }
      return true;
    });
  }, [topics, searchQuery, selectedCategory]);

  const sortedTopics = useMemo(() => {
    return [...filteredTopics].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
      if (filterMode === 'replies') {
        const countA = a.topic_messages?.[0]?.count || 0;
        const countB = b.topic_messages?.[0]?.count || 0;
        return countB - countA;
      }
      if (filterMode === 'views') {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      return new Date(b.last_reply_time || b.created_at) - new Date(a.last_reply_time || a.created_at);
    });
  }, [filteredTopics, filterMode]);

  // Gom toàn bộ ảnh/file của bài viết và bình luận hiển thị trong tab Files[cite: 39]
  const mediaFiles = [];
  if (activeTopic?.description && (activeTopic.description.startsWith('http://') || activeTopic.description.startsWith('https://'))) {
    mediaFiles.push({ url: activeTopic.description, author: activeTopic.author_name, date: activeTopic.created_at });
  }
  comments.forEach((c) => {
    if (c.media_url) {
      mediaFiles.push({ url: c.media_url, author: c.user_name, date: c.created_at });
    }
  });

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
          {isStaff && (
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
              👑 {isAdmin ? 'Admin Console' : access.role === 'editor' ? 'Moderator Console' : 'Support Console'}
            </button>
          )}
          <div style={{ fontSize: '13px', color: '#a8a29e' }}>
            {user ? (
              <span>Welcome, <strong style={{ color: isStaff ? '#ef4444' : '#fef08a' }}>{user.name}</strong><UidTag id={user.publicId} /></span>
            ) : 'Guest Mode'}
          </div>
        </div>
      </header>

      {/* THÔNG BÁO CỦA ADMIN */}
      {announcements.map((a) => {
        const tone = { info: ['#1e3a8a', '#93c5fd', '📢'], warning: ['#78350f', '#fde047', '⚠️'], danger: ['#7f1d1d', '#fca5a5', '🚨'] }[a.level] || ['#1e3a8a', '#93c5fd', '📢'];
        return (
          <div key={a.id} style={{ background: tone[0], color: tone[1], padding: '10px 5vw', fontSize: '13.5px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            {tone[2]} {a.message}
          </div>
        );
      })}

      {/* TÀI KHOẢN BỊ BAN / MUTE */}
      {isBanned && (
        <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '10px 5vw', fontSize: '13.5px' }}>
          🚫 Your account is suspended{access.bannedUntil ? ` until ${new Date(access.bannedUntil).toLocaleString('en-US')}` : ' permanently'}.
          {access.banReason ? ` Reason: ${access.banReason}` : ''} You can read the forum but cannot post, comment or like.
        </div>
      )}
      {!isBanned && isMuted && (
        <div style={{ background: '#78350f', color: '#fde68a', padding: '10px 5vw', fontSize: '13.5px' }}>
          🔇 You are muted until {new Date(access.mutedUntil).toLocaleString('en-US')} — you cannot post or comment right now.
        </div>
      )}

      {/* TẦNG 1: BẢNG DANH SÁCH CHỦ ĐỀ HIỆN ĐẠI & TINH TẾ */}
      {!activeTopic ? (
        <div style={{ flex: 1, padding: '24px 5vw 48px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* 1. HERO SHOWCASE & QUICK ACTION BANNER */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.45) 0%, rgba(20, 10, 10, 0.95) 50%, rgba(245, 158, 11, 0.18) 100%)',
              border: '1px solid #3d1b1b',
              borderRadius: '20px',
              padding: '28px 32px',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '24px',
              boxShadow: '0 10px 35px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{ maxWidth: '650px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, color: '#fef08a', marginBottom: '12px' }}>
                  ⚡ KIVOTOS DEVELOPER COMMUNITY
                </div>
                <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  Diễn Đàn Công Nghệ <span style={{ color: '#f59e0b' }}>GitXplore</span>
                </h1>
                <p style={{ margin: 0, color: '#d1d5db', fontSize: '14.5px', lineHeight: 1.6 }}>
                  Nơi trao đổi giải pháp lập trình, chia sẻ mã nguồn mở và kết nối với các nhà phát triển tài năng. Đặt câu hỏi và nhận trợ giúp tức thì!
                </p>

                {/* Micro Stats */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#fef08a' }}>
                    <span style={{ fontSize: '16px' }}>📁</span>
                    <strong>{topics.length}</strong> <span style={{ color: '#9ca3af' }}>Chủ đề</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#fef08a' }}>
                    <span style={{ fontSize: '16px' }}>💬</span>
                    <strong>{totalReplies}</strong> <span style={{ color: '#9ca3af' }}>Phản hồi</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#fef08a' }}>
                    <span style={{ fontSize: '16px' }}>🚀</span>
                    <span style={{ color: '#a7f3d0' }}>Trực tuyến & Sôi nổi</span>
                  </div>
                </div>
              </div>

              {/* Nút Tạo Chủ Đề Nổi Bật */}
              <button
                type="button"
                onClick={() => (canPost ? setShowCreateModal(true) : alert(isBanned ? 'Tài khoản của bạn đang bị khóa.' : 'Bạn đang bị tắt tiếng và không thể đăng bài.'))}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #d97706)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: canPost ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
                  transition: 'all 0.2s',
                  opacity: canPost ? 1 : 0.6
                }}
                onMouseEnter={(e) => { if (canPost) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ fontSize: '18px' }}>✏️</span>
                <span>+ Đăng Chủ Đề Mới</span>
              </button>
            </div>
          </div>

          {/* 2. THANH TÌM KIẾM TỨC THÌ & BỘ LỌC 1-CHẠM (QUICK SEARCH & CATEGORY PILLS) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
            
            {/* Search Input Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  flex: 1,
                  minWidth: '280px',
                  background: '#160b0b',
                  border: '1px solid #351717',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                }}
              >
                <span style={{ fontSize: '16px', color: '#f59e0b' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm chủ đề, câu hỏi, mã nguồn, tên tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}
                    title="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sắp xếp dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  style={{
                    background: '#1c0f0f',
                    color: '#fef08a',
                    border: '1px solid #3d1b1b',
                    padding: '11px 18px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Sắp xếp: {filterMode === 'newest' ? 'Mới nhất' : filterMode === 'replies' ? 'Nhiều phản hồi' : filterMode === 'views' ? 'Lượt xem' : 'Đã ghim'}</span>
                  <span>▾</span>
                </button>

                {showFilterDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      background: '#190d0d',
                      border: '1px solid #3d1b1b',
                      borderRadius: '12px',
                      padding: '6px 0',
                      width: '180px',
                      zIndex: 20,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                    }}
                  >
                    <button
                      onClick={() => { setFilterMode('newest'); setShowFilterDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: 'transparent', border: 'none', color: filterMode === 'newest' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ● Phản hồi mới nhất
                    </button>
                    <button
                      onClick={() => { setFilterMode('replies'); setShowFilterDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: 'transparent', border: 'none', color: filterMode === 'replies' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ● Nhiều thảo luận nhất
                    </button>
                    <button
                      onClick={() => { setFilterMode('views'); setShowFilterDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: 'transparent', border: 'none', color: filterMode === 'views' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ● Lượt xem cao nhất
                    </button>
                    <button
                      onClick={() => { setFilterMode('pinned'); setShowFilterDropdown(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: 'transparent', border: 'none', color: filterMode === 'pinned' ? '#f59e0b' : '#d1d5db', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ● Ưu tiên bài đã ghim
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dải nút Category Pills (1-Chạm) */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'All', label: 'Tất cả' },
                { id: 'Discussion', label: '💬 Thảo luận' },
                { id: 'Question', label: '💡 Hỏi đáp' },
                { id: 'Showcase', label: '🚀 Chia sẻ' },
                { id: 'Source Code', label: '📦 Mã nguồn' },
                { id: 'Warning', label: '⚠️ Cảnh báo' },
                { id: 'Pinned', label: '📌 Đã ghim' },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.25))' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#fef08a' : '#cbd5e1',
                      border: isActive ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.09)',
                      padding: '7px 16px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. BỐ CỤC 2 CỘT: FEED CHÍNH & BENTO TIỆN ÍCH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start' }}>
            
            {/* CỘT CHÍNH: DANH SÁCH THẺ BÀI VIẾT (FEED CARDS) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sortedTopics.map((t) => {
                const prefixConfig = resolvePrefix(t.prefix);
                const replyCount = t.topic_messages?.[0]?.count || 0;
                const lastUser = t.last_reply_user || t.author_name;
                const hasImg = t.description && (t.description.startsWith('http://') || t.description.startsWith('https://'));

                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTopic(t)}
                    style={{
                      background: t.is_pinned ? 'linear-gradient(135deg, #1f0e0e, #140909)' : '#150a0a',
                      border: t.is_pinned ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #281414',
                      borderRadius: '16px',
                      padding: '18px 22px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = t.is_pinned ? 'rgba(245, 158, 11, 0.45)' : '#281414';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
                    }}
                  >
                    {/* Hàng 1: Category Badge + Pinned + Creation Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: prefixConfig.bg,
                            color: prefixConfig.color,
                            border: `1px solid ${prefixConfig.border}`,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase'
                          }}
                        >
                          {prefixConfig.label}
                        </span>

                        {t.is_pinned && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700 }}>
                            📌 ĐÃ GHIM
                          </span>
                        )}

                        {t.is_locked && (
                          <span style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#cbd5e1', border: '1px solid rgba(100, 116, 139, 0.4)', borderRadius: '999px', padding: '2px 9px', fontSize: '11px', fontWeight: 700 }}>
                            🔒 ĐÃ KHÓA
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '12px', color: '#78716c' }}>
                        {formatForumTime(t.created_at)}
                      </span>
                    </div>

                    {/* Hàng 2: Tiêu đề & Tóm tắt */}
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '17.5px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        {t.title}
                      </h3>
                      {t.description && !hasImg && (
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '13.5px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {t.description}
                        </p>
                      )}
                    </div>

                    {/* Hàng 3: Tác giả & Thống kê tương tác */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7f1d1d, #c2410c)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            flexShrink: 0
                          }}
                        >
                          {t.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#e5e7eb' }}>
                          <span style={{ fontWeight: 600, color: '#fef08a' }}>{t.author_name}</span>
                          <UidTag id={idOf(t.author_public_id, t.author_name)} />
                        </div>
                      </div>

                      {/* Thống kê tương tác */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12.5px', color: '#9ca3af' }}>
                        <span title="Số phản hồi" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          💬 <strong style={{ color: '#fff' }}>{replyCount}</strong>
                        </span>
                        <span title="Lượt thích" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          👍 <strong style={{ color: '#fff' }}>{t.likes_count || 0}</strong>
                        </span>
                        <span title="Lượt xem" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          👁️ <strong style={{ color: '#fff' }}>{formatViewCount(t.views_count)}</strong>
                        </span>

                        {canModerate && (
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => handleTogglePin(e, t)} title={t.is_pinned ? 'Bỏ ghim' : 'Ghim'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                              📌
                            </button>
                            <button onClick={(e) => handleToggleLock(e, t)} title={t.is_locked ? 'Mở khóa' : 'Khóa'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                              {t.is_locked ? '🔓' : '🔒'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id, t.title); }} title="Xóa" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Trạng thái rỗng khi tìm kiếm không ra */}
              {sortedTopics.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: '#120909', border: '1px dashed #351717', borderRadius: '16px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                  <h3 style={{ margin: '0 0 6px', color: '#fef08a', fontSize: '18px' }}>Không tìm thấy chủ đề nào</h3>
                  <p style={{ margin: '0 0 16px', color: '#9ca3af', fontSize: '14px' }}>
                    {searchQuery ? `Không có kết quả nào phù hợp với từ khóa "${searchQuery}".` : 'Chưa có thảo luận nào trong danh mục này.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    style={{ background: '#261414', color: '#fef08a', border: '1px solid #3d1b1b', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    Xem tất cả chủ đề
                  </button>
                </div>
              )}
            </div>

            {/* CỘT PHỤ (BENTO RAIL TIỆN ÍCH NHANH) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Card 1: Hướng dẫn nhanh */}
              <div style={{ background: '#140a0a', border: '1px solid #2b1414', borderRadius: '16px', padding: '18px 20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14.5px', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💡</span> <span>Mẹo đăng thảo luận</span>
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#a8a29e', fontSize: '12.5px', lineHeight: 1.6 }}>
                  <li>Đặt tiêu đề ngắn gọn, rõ ràng trọng tâm.</li>
                  <li>Chọn đúng danh mục (Hỏi đáp, Thảo luận, Mã nguồn...).</li>
                  <li>Đính kèm ảnh chụp màn hình lỗi để được giải đáp nhanh hơn.</li>
                </ul>
              </div>

              {/* Card 2: Chủ đề sôi nổi nhất */}
              <div style={{ background: '#140a0a', border: '1px solid #2b1414', borderRadius: '16px', padding: '18px 20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14.5px', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔥</span> <span>Thảo luận sôi nổi</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[...topics]
                    .sort((a, b) => (b.topic_messages?.[0]?.count || 0) - (a.topic_messages?.[0]?.count || 0))
                    .slice(0, 3)
                    .map((top) => (
                      <div
                        key={top.id}
                        onClick={() => handleOpenTopic(top)}
                        style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                      >
                        <div style={{ fontSize: '13px', color: '#f3f4f6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {top.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>
                          💬 {top.topic_messages?.[0]?.count || 0} phản hồi · bởi {top.author_name}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Card 3: Khám phá Vibe Coding */}
              <div style={{ background: 'linear-gradient(135deg, rgba(30, 27, 46, 0.6), rgba(14, 11, 24, 0.9))', border: '1px solid rgba(125, 211, 252, 0.25)', borderRadius: '16px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <strong style={{ color: '#7dd3fc', fontSize: '14px' }}>Vibe Coding Hub</strong>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Khám phá các mẫu .cursorrules, MCP Servers & AI Skills lấy cảm hứng từ aitmpl.com.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/vibe')}
                  style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#7dd3fc', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                >
                  Xem Mẫu Vibe Coding →
                </button>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* TẦNG 2: CHI TIẾT BÀI VIẾT (TINH GỌN, KHÔNG TRÙNG LẶP TIÊU ĐỀ) */
        <div style={{ flex: 1, background: '#0b0606', padding: '24px 5vw 48px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG: QUAY LẠI & HÀNH ĐỘNG */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                onClick={handleBackToList}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fef08a',
                  padding: '9px 18px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              >
                ← Quay lại danh sách chủ đề
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleToggleLike}
                  style={{
                    background: hasLiked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: hasLiked ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: hasLiked ? '#f59e0b' : '#d1d5db',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  👍 {hasLiked ? 'Đã thích' : 'Thích'} ({likesCount})
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ↗ Chia sẻ
                </button>
              </div>
            </div>

            {/* CARD BÀI VIẾT CHÍNH (MAIN POST HERO - DUY NHẤT 1 TIÊU ĐỀ) */}
            <div style={{ background: '#140a0a', border: '1px solid #281414', borderRadius: '18px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}>
              
              {/* Header tác giả & Danh mục */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7f1d1d, #c2410c)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    {activeTopic.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '15px' }}>
                      {activeTopic.author_name}
                      <UidTag id={idOf(activeTopic.author_public_id, activeTopic.author_name)} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      Đăng vào {formatForumTime(activeTopic.created_at)} · 🌐 Công khai
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    background: resolvePrefix(activeTopic.prefix).bg,
                    color: resolvePrefix(activeTopic.prefix).color,
                    border: `1px solid ${resolvePrefix(activeTopic.prefix).border}`,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {resolvePrefix(activeTopic.prefix).label}
                </span>
              </div>

              {/* Tiêu đề bài viết DUY NHẤT */}
              <h1 style={{ margin: '0 0 12px', fontSize: '23px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
                {activeTopic.title}
              </h1>

              {/* Mô tả & Phương tiện đính kèm */}
              {activeTopic.description && (activeTopic.description.startsWith('http://') || activeTopic.description.startsWith('https://')) ? (
                <div style={{ background: '#080404', borderRadius: '12px', overflow: 'hidden', marginTop: '12px', border: '1px solid #281414' }}>
                  <img src={activeTopic.description} alt="Post Media" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                </div>
              ) : activeTopic.description ? (
                <div style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {activeTopic.description}
                </div>
              ) : null}
            </div>

            {/* TABS CHUYỂN ĐỔI: CUỘC TRÒ CHUYỆN & TỆP ĐÍNH KÈM */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #281414', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => setThreadTab('Discussion')}
                style={{
                  background: threadTab === 'Discussion' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  color: threadTab === 'Discussion' ? '#f59e0b' : '#9ca3af',
                  border: 'none',
                  borderBottom: threadTab === 'Discussion' ? '3px solid #f59e0b' : '3px solid transparent',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0'
                }}
              >
                💬 Trò chuyện & Thảo luận ({comments.length})
              </button>

              <button
                type="button"
                onClick={() => setThreadTab('Files')}
                style={{
                  background: threadTab === 'Files' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  color: threadTab === 'Files' ? '#f59e0b' : '#9ca3af',
                  border: 'none',
                  borderBottom: threadTab === 'Files' ? '3px solid #f59e0b' : '3px solid transparent',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📁 Tệp & Ảnh ({mediaFiles.length})
              </button>
            </div>

            {/* TAB 1: DISCUSSION - LUỒNG TRÒ CHUYỆN */}
            {threadTab === 'Discussion' && (
              <div style={{ background: '#120808', border: '1px solid #281414', borderRadius: '18px', overflow: 'hidden' }}>

                {/* DANH SÁCH BÌNH LUẬN & KHUNG TRÒ CHUYỆN HIỆN ĐẠI */}
                <div style={{ padding: '20px 18px', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Tiêu đề & trạng thái luồng thảo luận */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #1f1010' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💬 Trao đổi & Thảo luận</span>
                      <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        {comments.length}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#78716c' }}>
                      Tin nhắn của bạn: Bên phải (Cam hổ phách dịu) · Người khác: Bên trái
                    </div>
                  </div>

                  {/* Trạng thái chưa có bình luận */}
                  {comments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#a8a29e', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '32px' }}>💬</div>
                      <div style={{ fontWeight: 600, color: '#f5f5f4', fontSize: '14.5px' }}>Chưa có tin nhắn nào trong chủ đề này</div>
                      <div style={{ fontSize: '12.5px', color: '#78716c', maxWidth: '380px' }}>
                        Hãy là người đầu tiên tham gia cuộc trò chuyện, trao đổi quan điểm hoặc chia sẻ hình ảnh/tệp!
                      </div>
                    </div>
                  )}

                  {/* Danh sách tin nhắn bình luận */}
                  {comments.map((c) => {
                    const myPublicId = user?.publicId;
                    const myName = (user?.name || user?.identifier || '').trim().toLowerCase();
                    const commentAuthor = (c.user_name || '').trim().toLowerCase();
                    const isMyComment = Boolean(
                      (myPublicId && c.user_public_id && myPublicId === c.user_public_id) ||
                      (myName && commentAuthor && myName === commentAuthor)
                    );

                    return (
                      <div 
                        key={c.id} 
                        style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          alignItems: 'flex-start',
                          flexDirection: isMyComment ? 'row-reverse' : 'row',
                          alignSelf: isMyComment ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          marginLeft: isMyComment ? 'auto' : '0',
                          marginRight: isMyComment ? '0' : 'auto',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        {/* Avatar */}
                        <div 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            background: isMyComment 
                              ? 'linear-gradient(135deg, #d97706, #b45309)' 
                              : '#2b1414', 
                            color: isMyComment ? '#ffffff' : '#fef08a', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 700, 
                            fontSize: '12.5px', 
                            flexShrink: 0,
                            border: isMyComment 
                              ? '1px solid rgba(254, 240, 138, 0.4)' 
                              : '1px solid #4a2121',
                            boxShadow: isMyComment 
                              ? '0 2px 8px rgba(245, 158, 11, 0.3)' 
                              : 'none'
                          }}
                        >
                          {c.user_name.charAt(0).toUpperCase()}
                        </div>

                        {/* Bong bóng tin nhắn (Bubble) */}
                        <div 
                          style={{ 
                            background: isMyComment 
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.12))' 
                              : 'rgba(25, 15, 15, 0.94)', 
                            border: isMyComment 
                              ? '1px solid rgba(245, 158, 11, 0.35)' 
                              : '1px solid #331919',
                            borderRadius: isMyComment ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            padding: '10px 14px', 
                            maxWidth: '100%',
                            boxShadow: isMyComment 
                              ? '0 4px 16px rgba(0, 0, 0, 0.25)' 
                              : '0 4px 14px rgba(0, 0, 0, 0.3)',
                            backdropFilter: isMyComment ? 'blur(10px)' : 'none',
                            WebkitBackdropFilter: isMyComment ? 'blur(10px)' : 'none',
                            minWidth: '120px'
                          }}
                        >
                          {/* Header tên tác giả + tag */}
                          <div 
                            style={{ 
                              fontWeight: 600, 
                              color: '#fef08a', 
                              fontSize: '12.5px', 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '6px',
                              justifyContent: isMyComment ? 'flex-end' : 'flex-start'
                            }}
                          >
                            {(canModerate || isMyComment) && isMyComment && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c)}
                                title="Xóa tin nhắn của bạn"
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: '0 4px', opacity: 0.8 }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                              >
                                🗑️
                              </button>
                            )}
                            {isMyComment && (
                              <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.25)', color: '#fef08a', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                Bạn
                              </span>
                            )}
                            <span>{c.user_name}</span>
                            <UidTag id={idOf(c.user_public_id, c.user_name)} />
                            {canModerate && !isMyComment && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c)}
                                title="Delete comment"
                                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', paddingLeft: '8px' }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          
                          {/* Nội dung chữ */}
                          {c.content && (
                            <div 
                              style={{ 
                                fontSize: '13.5px', 
                                color: isMyComment ? '#ffffff' : '#e5e7eb', 
                                marginTop: '4px', 
                                lineHeight: 1.55,
                                textAlign: 'left',
                                wordBreak: 'break-word'
                              }}
                            >
                              {c.content}
                            </div>
                          )}

                          {/* Ảnh đính kèm trong bình luận */}
                          {c.media_url && (
                            <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px' }}>
                              {c.media_url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                <a href={c.media_url} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={c.media_url} 
                                    alt="Attached" 
                                    style={{ 
                                      width: '100%', 
                                      maxHeight: '220px', 
                                      objectFit: 'cover', 
                                      borderRadius: '8px', 
                                      border: isMyComment ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)' 
                                    }} 
                                  />
                                </a>
                              ) : (
                                <a 
                                  href={c.media_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    color: isMyComment ? '#fef08a' : '#60a5fa', 
                                    fontSize: '12px', 
                                    textDecoration: 'none',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: isMyComment ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #331919'
                                  }}
                                >
                                  📎 Xem / Tải tệp đính kèm
                                </a>
                              )}
                            </div>
                          )}

                          {/* Thời gian gửi */}
                          <div 
                            style={{ 
                              fontSize: '10px', 
                              color: isMyComment ? '#fcd34d' : '#78716c', 
                              opacity: isMyComment ? 0.75 : 1,
                              marginTop: '6px',
                              textAlign: isMyComment ? 'right' : 'left'
                            }}
                          >
                            {formatForumTime(c.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />

                  {/* KHUNG PREVIEW FILE ĐANG CHỌN TRƯỚC KHI BÌNH LUẬN */}
                  {commentFilePreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a0d0d', border: '1px solid #381a1a', padding: '8px 12px', borderRadius: '10px', width: 'fit-content' }}>
                      {commentFilePreview !== 'file' ? (
                        <img src={commentFilePreview} alt="Preview" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <span style={{ fontSize: '20px' }}>📎</span>
                      )}
                      <span style={{ fontSize: '12px', color: '#fef08a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {commentFile?.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { setCommentFile(null); setCommentFilePreview(null); }}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* KHUNG NHẬP BÌNH LUẬN KÈM NÚT ĐÍNH KÈM */}
                  {(!canPost || (activeTopic.is_locked && !canModerate)) ? (
                    <div style={{ marginTop: '6px', padding: '12px 16px', borderRadius: '12px', background: '#1a0d0d', border: '1px dashed #381a1a', color: '#a8a29e', fontSize: '13px', textAlign: 'center' }}>
                      {isBanned ? '🚫 Your account is suspended.' : isMuted ? '🔇 You are muted right now.' : '🔒 This topic is locked — no new comments.'}
                    </div>
                  ) : (
                  <form 
                    onSubmit={handleSendComment} 
                    style={{ 
                      display: 'flex', 
                      gap: '10px', 
                      alignItems: 'center', 
                      marginTop: '8px',
                      background: '#160b0b',
                      padding: '6px 8px 6px 16px',
                      borderRadius: '28px',
                      border: '1px solid #351717',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <input
                      ref={commentInputRef}
                      type="text"
                      placeholder={user ? "Nhập tin nhắn hoặc bình luận..." : "Đăng nhập để tham gia trò chuyện..."}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />

                    {/* NÚT CHỌN ẢNH / TỆP ĐÍNH KÈM */}
                    <input
                      ref={commentFileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                      onChange={handleSelectCommentFile}
                      style={{ display: 'none' }}
                    />

                    <button
                      type="button"
                      onClick={() => commentFileInputRef.current?.click()}
                      title="Đính kèm ảnh hoặc tệp"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fef08a',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                    >
                      📎
                    </button>

                    <button
                      type="submit"
                      disabled={isCommentUploading}
                      style={{ 
                        background: isCommentUploading ? '#78716c' : 'linear-gradient(135deg, #ef4444, #dc2626)', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '9px 20px', 
                        borderRadius: '22px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        cursor: isCommentUploading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => { if (!isCommentUploading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {isCommentUploading ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FILES (XEM TOÀN BỘ TỆP VÀ HÌNH ẢNH CỦA CHỦ ĐỀ) */}
            {threadTab === 'Files' && (
              <div style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#fef08a', fontSize: '18px' }}>Attached Files & Media</h3>
                
                {mediaFiles.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {mediaFiles.map((file, idx) => (
                      <div key={idx} style={{ background: '#1c0f0f', border: '1px solid #331919', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '140px', background: '#0a0505', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {file.url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                            <img src={file.url} alt={`File ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '32px' }}>📄</span>
                          )}
                        </div>
                        <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#a8a29e' }}>By {file.author}</div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: '#2b1414', color: '#fef08a', padding: '4px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '11.5px', fontWeight: 600 }}
                          >
                            View ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#78716c', padding: '40px 0', fontSize: '14px' }}>
                    No files or media attachments uploaded in this thread yet.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL TẠO CHỦ ĐỀ */}
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
        <AdminDashboardModal role={access.role} onClose={() => setShowAdminModal(false)} onChanged={fetchTopics} />
      )}
    </div>
  );
}
