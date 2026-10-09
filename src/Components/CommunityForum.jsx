import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import AdminDashboardModal from './AdminDashboardModal';
import './CommunityForum.css';

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

const TAG_COLORS = {
  Discussion: '#f59e0b',
  Showcase: '#60a5fa',
  Question: '#34d399',
  Warning: '#fbbf24',
  'Source Code': '#a78bfa',
};

const IMAGE_RE = /\.(jpeg|jpg|gif|png|webp)/i;
const isUrl = (text) => !!text && (text.startsWith('http://') || text.startsWith('https://'));

const formatRelative = (iso) => {
  if (!iso) return 'just now';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Icon = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconBack = () => <Icon><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>;
const IconPin = ({ filled }) => (
  <Icon size={16}><path d="M12 17v5M9 3h6l-1 7 3 3v2H7v-2l3-3-1-7z" fill={filled ? 'currentColor' : 'none'} /></Icon>
);
const IconTrash = () => <Icon size={16}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Icon>;
const IconClip = () => <Icon><path d="M21 12.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l8-8" /></Icon>;
const IconThumb = ({ filled }) => (
  <Icon><path d="M7 10v11H3V10h4zM7 10l4-8c1.7 0 3 1.3 3 3v3h5.5a2 2 0 0 1 2 2.3l-1.4 8a2 2 0 0 1-2 1.7H7" fill={filled ? 'currentColor' : 'none'} /></Icon>
);
const IconShare = () => <Icon><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" /></Icon>;
const IconFile = () => <Icon size={32}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" /></Icon>;

export default function CommunityForum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const onBack = () => navigate('/');
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

  // Bộ lọc
  const [filterMode, setFilterMode] = useState('newest');
  
  // Quyền Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const commentsEndRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentFileInputRef = useRef(null);

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
    if (!activeTopic) return;
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

      const { error } = await supabase.from('topic_messages').insert([
        { 
          topic_id: activeTopic.id, 
          user_name: sender, 
          content: cleanComment || (commentFile?.type.startsWith('image/') ? '📷 Photo' : '📎 Attachment'),
          media_url: uploadedMediaUrl
        }
      ]);

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
          likes_count: 0,
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

  const tagStyle = (prefix) => ({ '--tag': TAG_COLORS[resolvePrefix(prefix).label] || TAG_COLORS.Discussion });

  const FILTERS = [
    { id: 'newest', label: 'Latest' },
    { id: 'replies', label: 'Most active' },
    { id: 'pinned', label: 'Pinned' },
  ];

  return (
    <div className={`cf ${isAdmin ? 'cf--admin' : ''}`}>
      {/* HEADER */}
      <header className="cf-header">
        <div className="cf-header-left">
          <button type="button" className="cf-btn" onClick={activeTopic ? handleBackToList : onBack}>
            <IconBack /> {activeTopic ? 'All topics' : 'Home'}
          </button>
          <div className="cf-brand">GIT<span>XPLORE</span> FORUM</div>
        </div>

        <div className="cf-header-right">
          {isAdmin && (
            <button type="button" className="cf-btn" onClick={() => setShowAdminModal(true)}>
              Admin console
            </button>
          )}
          <div className="cf-user">
            {user ? (
              <>
                <span className="cf-avatar cf-avatar--sm">{user.name?.charAt(0).toUpperCase()}</span>
                <strong className="cf-user-name">{user.name}</strong>
                {isAdmin && <span className="cf-badge-admin">Admin</span>}
              </>
            ) : (
              'Guest mode'
            )}
          </div>
        </div>
      </header>

      {!activeTopic ? (
        /* ===== DANH SÁCH CHỦ ĐỀ ===== */
        <main className="cf-main">
          <div className="cf-page-head">
            <div>
              <h1 className="cf-page-title">Community Discussions</h1>
              <p className="cf-page-sub">
                {topics.length} {topics.length === 1 ? 'discussion' : 'discussions'} across all open-source repositories
              </p>
            </div>

            <div className="cf-toolbar">
              <div className="cf-segment" role="group" aria-label="Sort topics">
                {FILTERS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={filterMode === f.id} onClick={() => setFilterMode(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button type="button" className="cf-btn cf-btn--primary" onClick={() => setShowCreateModal(true)}>
                + New topic
              </button>
            </div>
          </div>

          <div className="cf-list">
            {sortedTopics.length > 0 && (
              <div className="cf-list-head">
                <span>Topic</span>
                <span className="cf-right">Replies</span>
                <span className="cf-right">Views</span>
                <span>Last activity</span>
                {isAdmin && <span />}
              </div>
            )}

            {sortedTopics.map((t) => {
              const prefixConfig = resolvePrefix(t.prefix);
              const replyCount = t.topic_messages?.[0]?.count || 0;
              const lastUser = t.last_reply_user || t.author_name;
              const lastTime = t.last_reply_time || t.created_at;

              return (
                <div
                  key={t.id}
                  className={`cf-row ${t.is_pinned ? 'cf-row--pinned' : ''}`}
                  role="link"
                  tabIndex={0}
                  onClick={() => handleOpenTopic(t)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenTopic(t)}
                >
                  <div className="cf-row-main">
                    <span className="cf-avatar">{t.author_name.charAt(0).toUpperCase()}</span>
                    <div className="cf-row-text">
                      <h2 className="cf-row-title">
                        {t.is_pinned && <span className="cf-pin-mark" title="Pinned"><IconPin filled /></span>}
                        <span>{t.title}</span>
                      </h2>
                      <div className="cf-row-meta">
                        <span className="cf-tag" style={tagStyle(t.prefix)}>{prefixConfig.label}</span>
                        <span><b>{t.author_name}</b></span>
                        <span>{formatRelative(t.created_at)}</span>
                        <span className="cf-mobile-only">· {replyCount} replies · {formatViewCount(t.views_count)} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="cf-stat"><strong>{replyCount}</strong><span>replies</span></div>
                  <div className="cf-stat"><strong>{formatViewCount(t.views_count)}</strong><span>views</span></div>

                  <div className="cf-last">
                    <div className="cf-last-when" title={formatForumTime(lastTime)}>{formatRelative(lastTime)}</div>
                    <div className="cf-last-who">by {lastUser}</div>
                  </div>

                  {isAdmin && (
                    <div className="cf-actions">
                      <button
                        type="button"
                        className={`cf-icon-btn ${t.is_pinned ? 'cf-icon-btn--on' : ''}`}
                        onClick={(e) => handleTogglePin(e, t)}
                        title={t.is_pinned ? 'Unpin' : 'Pin'}
                        aria-label={t.is_pinned ? 'Unpin topic' : 'Pin topic'}
                      >
                        <IconPin filled={t.is_pinned} />
                      </button>
                      <button
                        type="button"
                        className="cf-icon-btn cf-icon-btn--danger"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id, t.title); }}
                        title="Delete"
                        aria-label="Delete topic"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {sortedTopics.length === 0 && (
              <div className="cf-empty">
                <strong>No discussions yet</strong>
                Be the first to start a thread.
              </div>
            )}
          </div>
        </main>
      ) : (
        /* ===== CHI TIẾT BÀI VIẾT ===== */
        <div className="cf-thread">
          <article>
            <span className="cf-tag" style={tagStyle(activeTopic.prefix)}>{resolvePrefix(activeTopic.prefix).label}</span>
            <h1 className="cf-thread-title">{activeTopic.title}</h1>

            <div className="cf-byline">
              <span className="cf-avatar cf-avatar--lg">{activeTopic.author_name.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{activeTopic.author_name}</strong>
                {formatForumTime(activeTopic.created_at)}
              </div>
            </div>

            {isUrl(activeTopic.description) ? (
              <div className="cf-body-media">
                <img src={activeTopic.description} alt="Post media" />
              </div>
            ) : (
              activeTopic.description && <div className="cf-body">{activeTopic.description}</div>
            )}

            <div className="cf-actionbar">
              <button type="button" className={`cf-btn ${hasLiked ? 'cf-btn--active' : ''}`} onClick={handleToggleLike} aria-pressed={hasLiked}>
                <IconThumb filled={hasLiked} /> {hasLiked ? 'Liked' : 'Like'} · {likesCount}
              </button>
              <button type="button" className="cf-btn" onClick={handleShare}>
                <IconShare /> Share
              </button>
            </div>
          </article>

          <div className="cf-tabs" role="tablist">
            <button type="button" role="tab" className="cf-tab" aria-selected={threadTab === 'Discussion'} onClick={() => setThreadTab('Discussion')}>
              Discussion <span className="cf-count">{comments.length}</span>
            </button>
            <button type="button" role="tab" className="cf-tab" aria-selected={threadTab === 'Files'} onClick={() => setThreadTab('Files')}>
              Files <span className="cf-count">{mediaFiles.length}</span>
            </button>
          </div>

          {threadTab === 'Discussion' && (
            <>
              <div className="cf-comments">
                {comments.length === 0 && (
                  <div className="cf-empty">
                    <strong>No comments yet</strong>
                    Start the conversation below.
                  </div>
                )}

                {comments.map((c) => (
                  <div key={c.id} className="cf-comment">
                    <span className="cf-avatar">{c.user_name.charAt(0).toUpperCase()}</span>
                    <div className="cf-comment-body">
                      <div className="cf-comment-head">
                        <strong>{c.user_name}</strong>
                        <time title={formatForumTime(c.created_at)}>{formatRelative(c.created_at)}</time>
                      </div>

                      {c.content && <p className="cf-comment-text">{c.content}</p>}

                      {c.media_url &&
                        (IMAGE_RE.test(c.media_url) ? (
                          <a className="cf-attach" href={c.media_url} target="_blank" rel="noopener noreferrer">
                            <img src={c.media_url} alt="Attachment" />
                          </a>
                        ) : (
                          <a className="cf-attach-link" href={c.media_url} target="_blank" rel="noopener noreferrer">
                            <IconClip /> View attachment
                          </a>
                        ))}
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>

              <div className="cf-composer">
                {commentFilePreview && (
                  <div className="cf-file-chip">
                    {commentFilePreview !== 'file' ? <img src={commentFilePreview} alt="Preview" /> : <IconClip />}
                    <span className="name">{commentFile?.name}</span>
                    <button
                      type="button"
                      className="cf-icon-btn cf-icon-btn--danger"
                      aria-label="Remove attachment"
                      onClick={() => { setCommentFile(null); setCommentFilePreview(null); }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <form className="cf-composer-form" onSubmit={handleSendComment}>
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder="Write a comment..."
                    aria-label="Write a comment"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <input
                    ref={commentFileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                    onChange={handleSelectCommentFile}
                    style={{ display: 'none' }}
                  />
                  <button type="button" className="cf-icon-btn" title="Attach photo or file" aria-label="Attach photo or file" onClick={() => commentFileInputRef.current?.click()}>
                    <IconClip />
                  </button>
                  <button type="submit" className="cf-btn cf-btn--primary" disabled={isCommentUploading}>
                    {isCommentUploading ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}

          {threadTab === 'Files' &&
            (mediaFiles.length > 0 ? (
              <div className="cf-files">
                {mediaFiles.map((file, idx) => (
                  <div key={idx} className="cf-file-card">
                    <div className="cf-file-thumb">
                      {IMAGE_RE.test(file.url) ? <img src={file.url} alt={`File ${idx + 1}`} /> : <IconFile />}
                    </div>
                    <div className="cf-file-foot">
                      <span>by {file.author}</span>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">View ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cf-empty">
                <strong>No files yet</strong>
                Images and attachments shared in this thread will show up here.
              </div>
            ))}
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
                <label style={{ cursor: 'pointer', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
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
        <AdminDashboardModal onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}
