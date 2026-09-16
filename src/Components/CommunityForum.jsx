import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function CommunityForum({ context }) {
  const { user, closeModal } = context;
  const [topics, setTopics] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef(null);

  const fetchTopics = async () => {
    const { data } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTopics(data);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (!activeTopic) return;

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
      .channel(`topic-${activeTopic.id}`)
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

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const author = user?.name || 'Khách ẩn danh';

    const { data, error } = await supabase
      .from('topics')
      .insert([
        {
          title: newTopicTitle,
          description: newTopicDesc,
          author_name: author,
        },
      ])
      .select();

    if (!error && data) {
      setTopics([data[0], ...topics]);
      setActiveTopic(data[0]);
      setNewTopicTitle('');
      setNewTopicDesc('');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    await supabase.from('topic_messages').insert([
      {
        topic_id: activeTopic.id,
        user_name: user?.name || 'Thành viên',
        content: msgInput,
      },
    ]);
    setMsgInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `forum/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (!uploadError) {
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const isVideo = file.type.startsWith('video');

      await supabase.from('topic_messages').insert([
        {
          topic_id: activeTopic.id,
          user_name: user?.name || 'Thành viên',
          content: '',
          media_url: data.publicUrl,
          media_type: isVideo ? 'video' : 'image',
        },
      ]);
    }
    setUploading(false);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1050px',
          width: '92%',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: '#0d0707',
          border: '1px solid #331d1d',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '14px',
            borderBottom: '1px solid #2b1717',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px' }}>
              GitXplore Community
            </span>
            <h2 style={{ margin: '4px 0 0', color: '#fff', fontSize: '20px' }}>
              Diễn Đàn & Chủ Đề Thảo Luận
            </h2>
          </div>
          <button className="modal-close" onClick={closeModal} style={{ position: 'static' }}>
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            flex: 1,
            overflow: 'hidden',
            gap: '20px',
            marginTop: '16px',
          }}
        >
          {/* CỘT TRÁI: TẠO & DANH SÁCH CHỦ ĐỀ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderRight: '1px solid #241414',
              paddingRight: '16px',
              overflow: 'hidden',
            }}
          >
            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="+ Tiêu đề chủ đề mới..."
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="lusion-search"
                style={{ width: '100%', fontSize: '13px', borderRadius: '8px' }}
              />
              <button
                type="submit"
                className="link-btn btn-primary"
                style={{ justifyContent: 'center', padding: '8px', fontSize: '13px' }}
              >
                Đăng chủ đề
              </button>
            </form>

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
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: activeTopic?.id === t.id ? '#261212' : '#140c0c',
                    border: activeTopic?.id === t.id ? '1px solid #f59e0b' : '1px solid #241414',
                    transition: '0.2s',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '14px' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '6px' }}>
                    Tạo bởi: {t.author_name}
                  </div>
                </div>
              ))}
              {topics.length === 0 && (
                <p style={{ color: '#78716c', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
                  Chưa có chủ đề nào. Hãy tạo đầu tiên!
                </p>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG CHAT & MEDIA */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
            {activeTopic ? (
              <>
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid #241414' }}>
                  <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '17px' }}>
                    {activeTopic.title}
                  </h3>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: '#1a0e0e',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        maxWidth: '80%',
                        alignSelf: m.user_name === user?.name ? 'flex-end' : 'flex-start',
                        border: '1px solid #2b1717',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>
                        {m.user_name}
                      </div>
                      {m.content && <div style={{ fontSize: '13.5px', color: '#f3f4f6', lineHeight: 1.5 }}>{m.content}</div>}
                      {m.media_url && m.media_type === 'image' && (
                        <img
                          src={m.media_url}
                          alt="Đính kèm"
                          style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', marginTop: '8px' }}
                        />
                      )}
                      {m.media_url && m.media_type === 'video' && (
                        <video
                          src={m.media_url}
                          controls
                          style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', marginTop: '8px' }}
                        />
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '10px' }}
                >
                  <label
                    style={{
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      background: '#241414',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: '#fef08a',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
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
                    placeholder="Nhập nội dung thảo luận..."
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    className="lusion-search"
                    style={{ flex: 1, borderRadius: '8px' }}
                  />
                  <button type="submit" className="link-btn btn-primary" style={{ padding: '10px 18px' }}>
                    Gửi
                  </button>
                </form>
              </>
            ) : (
              <div style={{ margin: 'auto', color: '#78716c', fontSize: '14px', textAlign: 'center' }}>
                Chọn một chủ đề bên trái hoặc tạo chủ đề mới để bắt đầu thảo luận.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}