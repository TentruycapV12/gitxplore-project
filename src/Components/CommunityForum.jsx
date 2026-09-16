import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import AdminDashboardModal from './AdminDashboardModal';

const POSTS_PER_PAGE = 10;

export default function CommunityForum({ context, onBack }) {
  const { user } = context;
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const chatEndRef = useRef(null);
  const threadContainerRef = useRef(null);

  // Kiểm tra quyền Admin dựa trên email đăng nhập
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

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTopics(data);
        if (data.length > 0 && !activeTopic) {
          setActiveTopic(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTopics();

    const topicsChannel = supabase
      .channel('realtime-topics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topics' },
        () => fetchTopics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(topicsChannel);
    };
  }, []);

  useEffect(() => {
    if (!activeTopic) return;
    setCurrentPage(1);

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('topic_messages')
          .select('*')
          .eq('topic_id', activeTopic.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`topic-thread-${activeTopic.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topic_messages', filter: `topic_id=eq.${activeTopic.id}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTopic]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ADMIN: XÓA CHỦ ĐỀ
  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`ADMIN: Bạn có chắc chắn muốn xóa chủ đề "${topicTitle}" và toàn bộ bài viết liên quan?`)) return;

    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (!error) {
      await supabase.from('activity_logs').insert([
        { actor_email: user.identifier, action: 'Xóa chủ đề', target: topicTitle }
      ]);
      setTopics(topics.filter((t) => t.id !== topicId));
      setActiveTopic(null);
    } else {
      alert('Không thể xóa: ' + error.message);
    }
  };

  // ADMIN: XÓA BÀI VI PHẠM
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('ADMIN: Bạn có chắc muốn gỡ bỏ phản hồi này?')) return;

    const { error } = await supabase.from('topic_messages').delete().eq('id', msgId);
    if (!error) {
      await supabase.from('activity_logs').insert([
        { actor_email: user.identifier, action: 'Xóa bài viết', target: `ID: ${msgId}` }
      ]);
      setMessages(messages.filter((m) => m.id !== msgId));
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    const cleanTitle = newTopicTitle.trim();
    if (!cleanTitle || isSubmitting) return;

    setIsSubmitting(true);
    const author = user?.name || user?.identifier || 'Khách vãng lai';

    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([{ title: cleanTitle, description: newTopicDesc.trim() || null, author_name: author }])
        .select();

      if (!error && data && data.length > 0) {
        const created = data[0];
        setTopics((prev) => [created, ...prev]);
        setActiveTopic(created);
        setNewTopicTitle('');
        setNewTopicDesc('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanMsg = msgInput.trim();
    if (!cleanMsg || !activeTopic) return;

    const sender = user?.name || user?.identifier || 'Thành viên';

    try {
      const { error } = await supabase.from('topic_messages').insert([
        { topic_id: activeTopic.id, user_name: sender, content: cleanMsg }
      ]);
      if (!error) setMsgInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeTopic) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `forum/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('media').getPublicUrl(filePath);
        const isVideo = file.type.startsWith('video');

        await supabase.from('topic_messages').insert([
          {
            topic_id: activeTopic.id,
            user_name: user?.name || user?.identifier || 'Thành viên',
            content: '',
            media_url: data.publicUrl,
            media_type: isVideo ? 'video' : 'image',
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatPostTime = (isoString) => {
    if (!isoString) return 'Vừa xong';
    const date = new Date(isoString);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dateStr} lúc ${timeStr}`;
  };

  const totalPages = Math.ceil(messages.length / POSTS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentMessages = messages.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER DIỄN ĐÀN */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 4vw',
          background: '#120909',
          borderBottom: '1px solid #2b1414',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onBack}
            className="link-btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
          >
            ← Trang Chủ
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
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              👑 Quản trị hệ thống
            </button>
          )}

          <div style={{ fontSize: '13px', color: '#a8a29e' }}>
            {user ? (
              <span>
                Xin chào, <strong style={{ color: isAdmin ? '#ef4444' : '#fef08a' }}>{user.name}</strong> {isAdmin && '(Admin)'}
              </span>
            ) : 'Chế độ khách'}
          </div>
        </div>
      </header>

      {/* BODY DIỄN ĐÀN */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '20px',
          padding: '20px 4vw',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          height: 'calc(100vh - 72px)',
        }}
      >
        {/* CỘT TRÁI: DANH SÁCH CHỦ ĐỀ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: '#130a0a',
            border: '1px solid #291515',
            borderRadius: '12px',
            padding: '16px',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '15px', textTransform: 'uppercase' }}>Tạo chủ đề mới</h3>
          <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Nhập tiêu đề thảo luận..."
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              className="lusion-search"
              style={{ width: '100%', borderRadius: '8px' }}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="link-btn btn-primary"
              style={{ justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : '+ Đăng chủ đề'}
            </button>
          </form>

          <div style={{ height: '1px', background: '#291515', margin: '2px 0' }} />

          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '14px' }}>Danh sách chủ đề ({topics.length})</h3>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {topics.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTopic(t)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: activeTopic?.id === t.id ? '#2b1313' : '#1a0d0d',
                  border: activeTopic?.id === t.id ? '1px solid #f59e0b' : '1px solid #2b1717',
                  position: 'relative'
                }}
              >
                <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '13.5px', paddingRight: isAdmin ? '24px' : '0' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '6px' }}>Bởi: {t.author_name}</div>

                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTopic(t.id, t.title);
                    }}
                    title="Xóa chủ đề vi phạm (Admin)"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT BÀI VIẾT */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#130a0a',
            border: '1px solid #291515',
            borderRadius: '12px',
            padding: '18px 20px',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {activeTopic ? (
            <>
              <div style={{ paddingBottom: '14px', borderBottom: '1px solid #2e1717' }}>
                <span style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase' }}>Chủ đề thảo luận</span>
                <h1 style={{ margin: '4px 0 6px', color: '#fff', fontSize: '22px', fontWeight: 600 }}>{activeTopic.title}</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#8c827a' }}>
                    Người đăng: <span style={{ color: '#fef08a' }}>{activeTopic.author_name}</span> • 🕒 {formatPostTime(activeTopic.created_at)}
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          style={{
                            minWidth: '32px',
                            height: '30px',
                            padding: '0 6px',
                            border: p === currentPage ? '1px solid #f59e0b' : '1px solid #331d1d',
                            background: p === currentPage ? '#f59e0b' : '#1e1111',
                            color: p === currentPage ? '#000' : '#f3f4f6',
                            fontWeight: p === currentPage ? 700 : 500,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                      {currentPage < totalPages && (
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          style={{ height: '30px', padding: '0 10px', border: '1px solid #331d1d', background: '#1e1111', color: '#f59e0b', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Tiếp ▸
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BÀI VIẾT */}
              <div
                ref={threadContainerRef}
                style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {currentMessages.map((m, idx) => {
                  const globalPostNumber = startIndex + idx + 1;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '150px 1fr',
                        background: '#190e0e',
                        border: '1px solid #2a1515',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          background: '#140b0b',
                          padding: '16px 12px',
                          borderRight: '1px solid #2a1515',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
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
                        <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '13px' }}>{m.user_name}</div>
                        <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', background: '#241212', padding: '2px 8px', borderRadius: '4px' }}>
                          Thành viên
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 18px', minHeight: '110px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #241313', paddingBottom: '8px', marginBottom: '12px', fontSize: '11.5px', color: '#78716c' }}>
                          <span>🕒 {formatPostTime(m.created_at)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>#{globalPostNumber}</span>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteMessage(m.id)}
                                title="Xóa bình luận vi phạm"
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                              >
                                ✕ Xóa
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ flex: 1, fontSize: '14px', color: '#e5e7eb', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</div>

                        {m.media_url && m.media_type === 'image' && (
                          <div style={{ marginTop: '12px' }}>
                            <img src={m.media_url} alt="Đính kèm" style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', border: '1px solid #331919' }} />
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

              {/* FORM TRẢ LỜI */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #2e1717' }}>
                <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', background: '#241414', padding: '10px 16px', borderRadius: '8px', color: '#fef08a', fontSize: '13px', whiteSpace: 'nowrap', border: '1px solid #3d2020' }}>
                  📎 {uploading ? 'Đang tải...' : 'Tệp đính kèm'}
                  <input type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
                <input
                  type="text"
                  placeholder="Viết câu trả lời của bạn..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="lusion-search"
                  style={{ flex: 1, borderRadius: '8px' }}
                />
                <button type="submit" className="link-btn btn-primary" style={{ padding: '10px 22px' }}>Trả lời</button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#78716c' }}>
              <h3>Chưa chọn chủ đề</h3>
              <p>Chọn một chủ đề bên danh sách trái để xem các phản hồi.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL QUẢN TRỊ ADMIN */}
      {showAdminModal && (
        <AdminDashboardModal context={context} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}