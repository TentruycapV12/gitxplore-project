import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

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
  const chatEndRef = useRef(null);
  const threadContainerRef = useRef(null);

  // 1. Tải danh sách chủ đề
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
      console.error('Lỗi kết nối Supabase:', err);
    }
  };

  useEffect(() => {
    fetchTopics();

    const topicsChannel = supabase
      .channel('realtime-topics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'topics' },
        (payload) => {
          setTopics((prev) => {
            const exists = prev.some((t) => t.id === payload.new.id);
            return exists ? prev : [payload.new, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(topicsChannel);
    };
  }, []);

  // 2. Lấy danh sách tin nhắn của Topic được chọn
  useEffect(() => {
    if (!activeTopic) return;
    setCurrentPage(1); // Reset về trang 1 khi đổi chủ đề

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
        console.error('Lỗi tải tin nhắn:', err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`topic-thread-${activeTopic.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'topic_messages',
          filter: `topic_id=eq.${activeTopic.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const updated = [...prev, payload.new];
            // Tự động nhảy sang trang cuối khi có bài mới xuất hiện
            const newTotalPages = Math.ceil(updated.length / POSTS_PER_PAGE);
            setCurrentPage(newTotalPages);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTopic]);

  // Cuộn lên đầu bài viết khi chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 3. Tạo chủ đề mới
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    const cleanTitle = newTopicTitle.trim();
    if (!cleanTitle || isSubmitting) return;

    setIsSubmitting(true);
    const author = user?.name || user?.identifier || 'Khách vãng lai';

    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([
          {
            title: cleanTitle,
            description: newTopicDesc.trim() || null,
            author_name: author,
          },
        ])
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

  // 4. Gửi bài trả lời
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanMsg = msgInput.trim();
    if (!cleanMsg || !activeTopic) return;

    const sender = user?.name || user?.identifier || 'Thành viên';

    try {
      const { error } = await supabase.from('topic_messages').insert([
        {
          topic_id: activeTopic.id,
          user_name: sender,
          content: cleanMsg,
        },
      ]);

      if (!error) {
        setMsgInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Upload File (Ảnh/Video)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeTopic) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `forum/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

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

  // Định dạng thời gian rõ ràng: Giờ:Phút, Ngày/Tháng/Năm
  const formatPostTime = (isoString) => {
    if (!isoString) return 'Vừa xong';
    const date = new Date(isoString);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dateStr} lúc ${timeStr}`;
  };

  // Tính toán phân trang
  const totalPages = Math.ceil(messages.length / POSTS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentMessages = messages.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* THANH ĐIỀU HƯỚNG HEADER */}
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

        <div style={{ fontSize: '13px', color: '#a8a29e' }}>
          {user ? `Xin chào, ${user.name || user.identifier}` : 'Chế độ khách'}
        </div>
      </header>

      {/* THÂN DIỄN ĐÀN */}
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
          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '15px', textTransform: 'uppercase' }}>
            Tạo chủ đề mới
          </h3>
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

          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '14px' }}>
            Danh sách chủ đề ({topics.length})
          </h3>

          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}
          >
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
                  transition: '0.15s ease',
                }}
              >
                <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '13.5px', lineHeight: 1.4 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '6px' }}>
                  Bởi: {t.author_name}
                </div>
              </div>
            ))}

            {topics.length === 0 && (
              <div style={{ color: '#78716c', textAlign: 'center', marginTop: '30px', fontSize: '13px' }}>
                Chưa có chủ đề nào được tạo.
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT CHỦ ĐỀ & PHÂN TRANG */}
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
              {/* PHẦN ĐẦU CHỦ ĐỀ VÀ CỤM PHÂN TRANG TRÊN */}
              <div style={{ paddingBottom: '14px', borderBottom: '1px solid #2e1717' }}>
                <span style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chủ đề thảo luận
                </span>
                <h1 style={{ margin: '4px 0 6px', color: '#fff', fontSize: '22px', fontWeight: 600 }}>
                  {activeTopic.title}
                </h1>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#8c827a' }}>
                    Người đăng: <span style={{ color: '#fef08a' }}>{activeTopic.author_name}</span> • 🕒 {formatPostTime(activeTopic.created_at)}
                  </div>

                  {/* NÚT BẤM PHÂN TRANG KIỂU DIỄN ĐÀN */}
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
                          style={{
                            height: '30px',
                            padding: '0 10px',
                            border: '1px solid #331d1d',
                            background: '#1e1111',
                            color: '#f59e0b',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Tiếp ▸
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* DANH SÁCH 10 BÀI VIẾT TRONG TRANG */}
              <div
                ref={threadContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
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
                      {/* CỘT THÔNG TIN TÁC GIẢ BÊN TRÁI */}
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

                        <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '13px', wordBreak: 'break-word' }}>
                          {m.user_name}
                        </div>
                        <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', background: '#241212', padding: '2px 8px', borderRadius: '4px' }}>
                          Thành viên
                        </span>
                      </div>

                      {/* CỘT NỘI DUNG VÀ THỜI GIAN BÊN PHẢI */}
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 18px', minHeight: '110px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #241313',
                            paddingBottom: '8px',
                            marginBottom: '12px',
                            fontSize: '11.5px',
                            color: '#78716c',
                          }}
                        >
                          <span>🕒 {formatPostTime(m.created_at)}</span>
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>#{globalPostNumber}</span>
                        </div>

                        <div style={{ flex: 1, fontSize: '14px', color: '#e5e7eb', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </div>

                        {m.media_url && m.media_type === 'image' && (
                          <div style={{ marginTop: '12px' }}>
                            <img
                              src={m.media_url}
                              alt="Đính kèm"
                              style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', border: '1px solid #331919' }}
                            />
                          </div>
                        )}

                        {m.media_url && m.media_type === 'video' && (
                          <div style={{ marginTop: '12px' }}>
                            <video
                              src={m.media_url}
                              controls
                              style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '6px', border: '1px solid #331919' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* PHÂN TRANG DƯỚI & KHUNG TRẢ LỜI */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', paddingBottom: '10px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      style={{
                        minWidth: '28px',
                        height: '26px',
                        border: p === currentPage ? '1px solid #f59e0b' : '1px solid #331d1d',
                        background: p === currentPage ? '#f59e0b' : '#1e1111',
                        color: p === currentPage ? '#000' : '#f3f4f6',
                        fontWeight: p === currentPage ? 700 : 500,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  paddingTop: '12px',
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

                <button type="submit" className="link-btn btn-primary" style={{ padding: '10px 22px' }}>
                  Trả lời
                </button>
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
    </div>
  );
}