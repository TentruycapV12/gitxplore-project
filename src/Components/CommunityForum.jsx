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
    <div style={{ width: '100%', minHeight: '100vh', background: '#090505', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* THANH ĐIỀU HƯỚNG RIÊNG CỦA TRANG COMMUNITY */}
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
          {user ? `Xin chào, ${user.name}` : 'Chế độ khách'}
        </div>
      </header>

      {/* THÂN TRANG TOÀN MÀN HÌNH */}
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
        {/* CỘT TRÁI: DANH SÁCH & FORM TẠO TOPIC */}
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
            />
            <button type="submit" className="link-btn btn-primary" style={{ justifyContent: 'center' }}>
              + Đăng chủ đề
            </button>
          </form>

          <div style={{ height: '1px', background: '#291515', margin: '4px 0' }} />

          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '15px' }}>Tất cả chủ đề ({topics.length})</h3>
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
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
                <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '14px' }}>{t.title}</div>
                <div style={{ fontSize: '12px', color: '#a8a29e', marginTop: '6px' }}>Bởi: {t.author_name}</div>
              </div>
            ))}
            {topics.length === 0 && (
              <div style={{ color: '#78716c', textAlign: 'center', marginTop: '30px', fontSize: '13px' }}>
                Chưa có chủ đề nào được tạo.
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG TRÒ CHUYỆN VÀ ĐĂNG FILE */}
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
                <span style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase' }}>Đang thảo luận</span>
                <h2 style={{ margin: '4px 0 0', color: '#fff', fontSize: '20px' }}>{activeTopic.title}</h2>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: '#1c0f0f',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      maxWidth: '75%',
                      alignSelf: m.user_name === user?.name ? 'flex-end' : 'flex-start',
                      border: '1px solid #331919',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, marginBottom: '6px' }}>
                      {m.user_name}
                    </div>
                    {m.content && <div style={{ fontSize: '14px', color: '#f3f4f6', lineHeight: 1.5 }}>{m.content}</div>}
                    {m.media_url && m.media_type === 'image' && (
                      <img src={m.media_url} alt="Media" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', marginTop: '10px' }} />
                    )}
                    {m.media_url && m.media_type === 'video' && (
                      <video src={m.media_url} controls style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', marginTop: '10px' }} />
                    )}
                  </div>
                ))}
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