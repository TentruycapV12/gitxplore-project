import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import AdminDashboardModal from './AdminDashboardModal';

export default function CommunityForum({ context, onBack }) {
  const { user } = context;
  const [topics, setTopics] = useState([]);
  const [activeTab, setActiveTab] = useState('Discussion');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  // State quản lý bình luận theo từng bài viết
  const [expandedComments, setExpandedComments] = useState({});
  const [topicComments, setTopicComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // Kiểm tra quyền Admin
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

  // Lấy danh sách bài viết
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*, topic_messages(count)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTopics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('realtime-fb-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, () => fetchPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'topic_messages' }, () => fetchPosts())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Tải bình luận của 1 bài viết cụ thể
  const fetchCommentsForTopic = async (topicId) => {
    const { data } = await supabase
      .from('topic_messages')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (data) {
      setTopicComments((prev) => ({ ...prev, [topicId]: data }));
    }
  };

  const toggleComments = (topicId) => {
    const nextState = !expandedComments[topicId];
    setExpandedComments((prev) => ({ ...prev, [topicId]: nextState }));
    if (nextState && !topicComments[topicId]) {
      fetchCommentsForTopic(topicId);
    }
  };

  // Chọn ảnh/video đính kèm bài đăng
  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Đăng bài viết mới (Facebook Post)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedFile) return;
    setIsSubmitting(true);

    const author = user?.name || user?.identifier || 'Anonymous Member';
    let uploadedMediaUrl = null;
    let mediaType = null;

    try {
      if (selectedFile) {
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `feed/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, selectedFile);
        
        if (!uploadError) {
          const { data } = supabase.storage.from('media').getPublicUrl(filePath);
          uploadedMediaUrl = data.publicUrl;
          mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
        }
        setUploading(false);
      }

      const { data, error } = await supabase.from('topics').insert([{
        title: newPostContent.trim(),
        description: uploadedMediaUrl, // Lưu URL media vào description
        author_name: author,
        prefix: mediaType || 'Discussion',
        views_count: 1,
        last_reply_user: author,
        last_reply_time: new Date().toISOString()
      }]).select();

      if (!error && data) {
        setNewPostContent('');
        setSelectedFile(null);
        setFilePreview(null);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gửi bình luận dưới bài viết
  const handleSendComment = async (topicId) => {
    const inputVal = commentInputs[topicId]?.trim();
    if (!inputVal) return;

    const sender = user?.name || user?.identifier || 'Member';
    const { error } = await supabase.from('topic_messages').insert([
      { topic_id: topicId, user_name: sender, content: inputVal }
    ]);

    if (!error) {
      setCommentInputs((prev) => ({ ...prev, [topicId]: '' }));
      fetchCommentsForTopic(topicId);
      await supabase.from('topics').update({
        last_reply_user: sender,
        last_reply_time: new Date().toISOString()
      }).eq('id', topicId);
    }
  };

  // Admin xóa bài viết
  const handleDeletePost = async (topicId) => {
    if (!window.confirm('ADMIN: Are you sure you want to delete this post?')) return;
    await supabase.from('topics').delete().eq('id', topicId);
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const formatPostTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0b0606', color: '#e4e6eb', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' }}>
      
      {/* TOP NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4vw', background: '#140a0a', borderBottom: '1px solid #261414' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            className="link-btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '20px', cursor: 'pointer' }}
          >
            ← Back to Home
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fef08a', letterSpacing: '0.5px' }}>
            GIT<span style={{ color: '#ef4444' }}>XPLORE</span> COMMUNITY
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <button
              onClick={() => setShowAdminModal(true)}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '18px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
            >
              👑 Admin Console
            </button>
          )}
          <div style={{ fontSize: '13px', color: '#a8a29e' }}>
            {user ? (
              <span>Welcome, <strong style={{ color: '#fef08a' }}>{user.name}</strong></span>
            ) : 'Guest Mode'}
          </div>
        </div>
      </nav>

      {/* GROUP HEADER (COVER & TITLE) */}
      <div style={{ background: '#130a0a', borderBottom: '1px solid #261414' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          {/* BANNER COVER */}
          <div
            style={{
              height: '260px',
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
                Official Group
              </span>
              <h1 style={{ margin: '8px 0 4px', fontSize: '28px', fontWeight: 800, color: '#fff' }}>
                GitXplore Global Community
              </h1>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                🌐 Public group · <strong>52.4K members</strong>
              </div>
            </div>
          </div>

          {/* ACTION BAR & TABS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['About', 'Discussion', 'Featured', 'Media', 'Files'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? '#2b1414' : 'transparent',
                    color: activeTab === tab ? '#f59e0b' : '#9ca3af',
                    border: 'none',
                    borderBottom: activeTab === tab ? '3px solid #f59e0b' : '3px solid transparent',
                    padding: '10px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    borderRadius: '6px 6px 0 0'
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

      {/* FEED & SIDEBAR CONTAINER */}
      <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* CỘT TRÁI: DÒNG THỜI GIAN BÀI VIẾT (FEED) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* KHUNG SOẠN BÀI VIẾT (WRITE SOMETHING...) */}
          <div style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <input
                type="text"
                placeholder="Write something to the community..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                style={{ flex: 1, background: '#1e0f0f', border: '1px solid #331a1a', borderRadius: '24px', padding: '12px 18px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            {/* PREVIEW ẢNH NẾU CHỌN */}
            {filePreview && (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <img src={filePreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} />
                <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: '#000000aa', border: 'none', color: '#fff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            <div style={{ borderTop: '1px solid #221212', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>
                📷 Photo / Video
                <input type="file" accept="image/*,video/*" onChange={handleSelectFile} style={{ display: 'none' }} />
              </label>
              
              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isSubmitting || (!newPostContent.trim() && !selectedFile)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 22px',
                  borderRadius: '18px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: (!newPostContent.trim() && !selectedFile) ? 0.5 : 1
                }}
              >
                {uploading ? 'Uploading...' : 'Post'}
              </button>
            </div>
          </div>

          {/* DANH SÁCH BÀI ĐĂNG (POST CARDS) */}
          {topics.map((post) => {
            const hasMedia = post.description && (post.description.startsWith('http') || post.description.startsWith('https'));
            const isVideo = post.prefix === 'video';
            const comments = topicComments[post.id] || [];
            const isCommentsOpen = !!expandedComments[post.id];

            return (
              <div key={post.id} style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', overflow: 'hidden' }}>
                {/* HEADER BÀI VIẾT */}
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #7f1d1d, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                      {post.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '14.5px' }}>
                        {post.author_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>
                        {formatPostTime(post.created_at)} · 🌐
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      title="Delete post"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* NỘI DUNG CHỮ */}
                <div style={{ padding: '0 16px 12px', fontSize: '14.5px', lineHeight: 1.5, color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                  {post.title}
                </div>

                {/* MEDIA ĐÍNH KÈM */}
                {hasMedia && (
                  <div style={{ background: '#000', maxHeight: '500px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    {isVideo ? (
                      <video src={post.description} controls style={{ width: '100%', maxHeight: '500px' }} />
                    ) : (
                      <img src={post.description} alt="Post Media" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                    )}
                  </div>
                )}

                {/* THỐNG KÊ (LIKES, COMMENTS) */}
                <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#9ca3af', borderBottom: '1px solid #201010' }}>
                  <span>👍 ❤️ 24</span>
                  <span onClick={() => toggleComments(post.id)} style={{ cursor: 'pointer' }}>
                    {post.topic_messages?.[0]?.count || 0} comments
                  </span>
                </div>

                {/* CÁC NÚT LIKE / COMMENT / SHARE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '4px 8px', borderBottom: isCommentsOpen ? '1px solid #201010' : 'none' }}>
                  <button style={{ background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    👍 Like
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={{ background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    💬 Comment
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: '#d1d5db', padding: '8px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    ↗ Share
                  </button>
                </div>

                {/* KHUNG BÌNH LUẬN TRỰC TIẾP */}
                {isCommentsOpen && (
                  <div style={{ padding: '14px 16px', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* DANH SÁCH BÌNH LUẬN ĐÃ CÓ */}
                    {comments.map((c) => (
                      <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b1818', color: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                          {c.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ background: '#1c0f0f', padding: '8px 12px', borderRadius: '14px', border: '1px solid #2b1414', maxWidth: '85%' }}>
                          <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '12px' }}>{c.user_name}</div>
                          <div style={{ fontSize: '13px', color: '#e5e7eb', marginTop: '2px' }}>{c.content}</div>
                        </div>
                      </div>
                    ))}

                    {/* KHUNG NHẬP BÌNH LUẬN */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                        style={{ flex: 1, background: '#180d0d', border: '1px solid #2d1414', borderRadius: '18px', padding: '8px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
                      />
                      <button
                        onClick={() => handleSendComment(post.id)}
                        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {topics.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#78716c', background: '#140a0a', borderRadius: '10px' }}>
              No posts in this group yet. Be the first to share!
            </div>
          )}
        </div>

        {/* CỘT PHẢI: WIDGET "ABOUT GROUP" */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '70px' }}>
          <div style={{ background: '#140a0a', border: '1px solid #261414', borderRadius: '10px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: '#fef08a' }}>About</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', lineHeight: 1.5 }}>
              This is the official community feed for GitXplore contributors, developers, and open-source fans worldwide.
            </p>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>🌐</span>
                <div>
                  <strong style={{ color: '#fff' }}>Public</strong>
                  <div style={{ fontSize: '11.5px', color: '#78716c' }}>Anyone can see who's in the group and what they post.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>👁️</span>
                <div>
                  <strong style={{ color: '#fff' }}>Visible</strong>
                  <div style={{ fontSize: '11.5px', color: '#78716c' }}>Anyone can find this group.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <div>
                  <strong style={{ color: '#fff' }}>Active Hub</strong>
                  <div style={{ fontSize: '11.5px', color: '#78716c' }}>Instant updates & real-time reactions.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ADMIN DASHBOARD MODAL */}
      {showAdminModal && (
        <AdminDashboardModal context={context} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}