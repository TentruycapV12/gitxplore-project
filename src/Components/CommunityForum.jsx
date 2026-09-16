import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function CommunityForum({ context, onBack }) {
  const { user } = context;
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef(null);

  // 1. Lấy danh sách topics ban đầu
  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Lỗi tải danh sách topics:', error.message);
      } else if (data) {
        setTopics(data);
      }
    } catch (err) {
      console.error('Lỗi kết nối Supabase:', err);
    }
  };

  useEffect(() => {
    fetchTopics();

    // Lắng nghe realtime khi có ai đó tạo topic mới
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

  // 2. Lấy tin nhắn và lắng nghe khi activeTopic thay đổi
  useEffect(() => {
    if (!activeTopic) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('topic_messages')
          .select('*')
          .eq('topic_id', activeTopic.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Lỗi tải tin nhắn:', error.message);
        } else if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Lỗi kết nối tin nhắn:', err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`topic-chat-${activeTopic.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'topic_messages',
          filter: `topic_id=eq.${activeTopic.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTopic]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Đăng chủ đề mới
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    const cleanTitle = newTopicTitle.trim();
    if (!cleanTitle || isSubmitting) return;

    setIsSubmitting(true);
    const author = user?.name || user?.identifier || 'Khách ẩn danh';

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

      if (error) {
        console.error('Lỗi tạo chủ đề:', error);
        alert('Không thể tạo chủ đề: ' + (error.message || 'Kiểm tra lại quyền RLS của bảng topics trên Supabase'));
      } else if (data && data.length > 0) {
        const created = data[0];
        setTopics((prev) => {
          const exists = prev.some((t) => t.id === created.id);
          return exists ? prev : [created, ...prev];
        });
        setActiveTopic(created);
        setNewTopicTitle('');
        setNewTopicDesc('');
      }
    } catch (err) {
      console.error('Lỗi khi gửi dữ liệu:', err);
      alert('Không thể kết nối đến máy chủ cơ sở dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Gửi tin nhắn
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

      if (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        alert('Không gửi được tin nhắn: ' + error.message);
      } else {
        setMsgInput('');
      }
    } catch (err) {
      console.error('Lỗi kết nối tin nhắn:', err);
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

      if (uploadError) {
        console.error('Lỗi tải tệp:', uploadError);
        alert('Lỗi tải tệp lên Storage: ' + uploadError.message);
      } else {
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
      console.error('Lỗi lưu trữ:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* THANH ĐIỀU HƯỚNG */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 4vw',
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

      {/* KHÔNG GIAN LÀM VIỆC FULL PAGE */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '24px',
          padding: '24px 4vw',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          overflow: 'hidden',
          height: 'calc(100vh - 75px)',
        }}
      >
        {/* CỘT TRÁI: DANH SÁCH & TẠO CHỦ ĐỀ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#130a0a',
            border: '1px solid #291515',
            borderRadius: '14px',
            padding: '18px',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '16px' }}>Tạo chủ đề mới</h3>
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

          <div style={{ height: '1px', background: '#291515', margin: '4px 0' }} />

          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '15px' }}>
            Tất cả chủ đề ({topics.length})
          </h3>

          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '4px',
            }}
          >
            {topics.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTopic(t)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: activeTopic?.id === t.id ? '#2b1313' : '#1a0d0d',
                  border: activeTopic?.id === t.id ? '1px solid #f59e0b' : '1px solid #2b1717',
                  transition: '0.2s ease',
                }}
              >
                <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '14px' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '12px', color: '#a8a29e', marginTop: '6px' }}>
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

        {/* CỘT PHẢI: CHI TIẾT CHỦ ĐỀ & TIN NHẮN */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#130a0a',
            border: '1px solid #291515',
            borderRadius: '14px',
            padding: '18px',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {activeTopic ? (
            <>
              <div style={{ paddingBottom: '14px', borderBottom: '1px solid #291515' }}>
                <span style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase' }}>
                  Đang thảo luận
                </span>
                <h2 style={{ margin: '4px 0 0', color: '#fff', fontSize: '20px' }}>
                  {activeTopic.title}
                </h2>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {messages.map((m) => {
                  const isMine = m.user_name === (user?.name || user?.identifier);
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: '#1c0f0f',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        maxWidth: '75%',
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        border: isMine ? '1px solid #f59e0b' : '1px solid #331919',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, marginBottom: '6px' }}>
                        {m.user_name}
                      </div>
                      {m.content && (
                        <div style={{ fontSize: '14px', color: '#f3f4f6', lineHeight: 1.5 }}>
                          {m.content}
                        </div>
                      )}
                      {m.media_url && m.media_type === 'image' && (
                        <img
                          src={m.media_url}
                          alt="Đính kèm"
                          style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', marginTop: '10px' }}
                        />
                      )}
                      {m.media_url && m.media_type === 'video' && (
                        <video
                          src={m.media_url}
                          controls
                          style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', marginTop: '10px' }}
                        />
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '12px' }}>
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
                  📎 {uploading ? 'Đang tải...' : 'Ảnh / Video'}
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
                  placeholder="Gửi tin nhắn trong chủ đề này..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="lusion-search"
                  style={{ flex: 1, borderRadius: '8px' }}
                />
                <button type="submit" className="link-btn btn-primary" style={{ padding: '10px 22px' }}>
                  Gửi
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#78716c' }}>
              <h3>Chưa chọn chủ đề</h3>
              <p>Chọn một chủ đề bên danh sách trái hoặc tạo mới để xem cuộc thảo luận.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}