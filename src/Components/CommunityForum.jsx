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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const chatEndRef = useRef(null);
  const threadContainerRef = useRef(null);

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

  // Lấy danh sách chủ đề
  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTopics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTopics();

    const topicsChannel = supabase
      .channel('realtime-topics-list')
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

  // Lấy bình luận khi vào xem chi tiết một Topic
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

  // Điều hướng vào chủ đề
  const handleOpenTopic = (topic) => {
    setActiveTopic(topic);
    window.history.pushState({}, '', `/community?thread=${topic.id}`);
  };

  // Quay lại danh sách chủ đề
  const handleBackToList = () => {
    setActiveTopic(null);
    window.history.pushState({}, '', '/community');
  };

  // Tạo chủ đề mới
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
        setNewTopicTitle('');
        setNewTopicDesc('');
        setShowCreateModal(false);
        handleOpenTopic(created);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin xóa chủ đề
  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`ADMIN: Bạn có chắc chắn muốn xóa chủ đề "${topicTitle}"?`)) return;

    const { error } = await supabase.from('topics').delete().eq('id', topicId);
    if (!error) {
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      if (activeTopic?.id === topicId) {
        handleBackToList();
      }
    }
  };

  // Gửi bình luận
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

  // Tải tệp lên
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
    return `${date.toLocaleDateString('vi-VN')} lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const totalPages = Math.ceil(messages.length / POSTS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentMessages = messages.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* THANH HEADER CHÍNH */}
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
            ← {activeTopic ? 'Danh sách chủ đề' : 'Trang Chủ'}
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

      {/* VÙNG CHÍNH */}
      <div style={{ flex: 1, padding: '24px 5vw', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* TẦNG 1: GIAO DIỆN BẢNG DANH SÁCH CHỦ ĐỀ */}
        {!activeTopic ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#fef08a' }}>Chủ Đề Thảo Luận</h1>
                <p style={{ margin: '6px 0 0', color: '#a8a29e', fontSize: '14px' }}>
                  Nơi trao đổi, chia sẻ mã nguồn và thảo luận công nghệ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="link-btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '14px' }}
              >
                + Đăng chủ đề mới
              </button>
            </div>

            {/* BẢNG CHỦ ĐỀ PHONG CÁCH XENFORO */}
            <div style={{ background: '#130a0a', border: '1px solid #291515', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 180px 50px',
                  padding: '12px 20px',
                  background: '#1c0f0f',
                  borderBottom: '1px solid #291515',
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <span>Tiêu đề</span>
                <span style={{ textAlign: 'center' }}>Người tạo</span>
                <span style={{ textAlign: 'center' }}>Thời gian</span>
                <span></span>
              </div>

              {topics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenTopic(t)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 140px 180px 50px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #221212',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1a0d0d')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{t.title}</div>
                    {t.description && (
                      <div style={{ color: '#78716c', fontSize: '12px', marginTop: '4px' }}>
                        {t.description}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', color: '#fef08a', fontSize: '13px' }}>
                    {t.author_name}
                  </div>

                  <div style={{ textAlign: 'center', color: '#8c827a', fontSize: '12px' }}>
                    {formatPostTime(t.created_at)}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(t.id, t.title);
                        }}
                        title="Xóa chủ đề"
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {topics.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#78716c', fontSize: '14px' }}>
                  Chưa có chủ đề nào được đăng. Hãy là người đầu tiên mở thảo luận!
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TẦNG 2: GIAO DIỆN CHI TIẾT BÀI VIẾT TOÀN TRANG */
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
            {/* TIÊU ĐỀ BÀI VIẾT */}
            <div style={{ borderBottom: '1px solid #2e1717', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Chủ đề thảo luận
                  </span>
                  <h1 style={{ margin: '6px 0', fontSize: '26px', color: '#fff' }}>{activeTopic.title}</h1>
                  <div style={{ fontSize: '12.5px', color: '#8c827a' }}>
                    Đăng bởi: <span style={{ color: '#fef08a' }}>{activeTopic.author_name}</span> • 🕒 {formatPostTime(activeTopic.created_at)}
                  </div>
                </div>

                {/* THANH PHÂN TRANG */}
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

            {/* DANH SÁCH BÀI VIẾT */}
            <div
              ref={threadContainerRef}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}
            >
              {currentMessages.map((m, idx) => {
                const globalIndex = startIndex + idx + 1;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '170px 1fr',
                      background: '#180e0e',
                      border: '1px solid #291515',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* CỘT PROFILE BÊN TRÁI */}
                    <div
                      style={{
                        background: '#130b0b',
                        padding: '16px',
                        borderRight: '1px solid #291515',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7f1d1d, #c2410c)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '20px',
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
                        Thành viên
                      </span>
                    </div>

                    {/* CỘT NỘI DUNG BÊN PHẢI */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #241313', paddingBottom: '8px', marginBottom: '12px', fontSize: '11.5px', color: '#78716c' }}>
                        <span>🕒 {formatPostTime(m.created_at)}</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>#{globalIndex}</span>
                      </div>

                      <div style={{ flex: 1, fontSize: '14.5px', color: '#e5e7eb', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </div>

                      {m.media_url && m.media_type === 'image' && (
                        <div style={{ marginTop: '12px' }}>
                          <img src={m.media_url} alt="Media" style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', border: '1px solid #331919' }} />
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
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #2e1717',
              }}
            >
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
                📎 {uploading ? 'Đang tải...' : 'Tệp đính kèm'}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>

              <input
                type="text"
                placeholder="Viết câu trả lời của bạn..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                className="lusion-search"
                style={{ flex: 1, borderRadius: '8px' }}
              />

              <button type="submit" className="link-btn btn-primary" style={{ padding: '10px 24px' }}>
                Trả lời
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL TẠO CHỦ ĐỀ MỚI */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%', padding: '24px', background: '#120909', border: '1px solid #381a1a', borderRadius: '12px' }}
          >
            <h2 style={{ margin: '0 0 16px', color: '#fef08a', fontSize: '18px' }}>Tạo chủ đề thảo luận mới</h2>
            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Tiêu đề chủ đề..."
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="lusion-search"
                style={{ width: '100%', borderRadius: '6px' }}
                required
              />
              <textarea
                placeholder="Mô tả ngắn hoặc nội dung mở đầu (không bắt buộc)..."
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
                  Hủy
                </button>
                <button
                  type="submit"
                  className="link-btn btn-primary"
                  style={{ padding: '8px 20px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo chủ đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUẢN TRỊ ADMIN */}
      {showAdminModal && (
        <AdminDashboardModal context={context} onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}