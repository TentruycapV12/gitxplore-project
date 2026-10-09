import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const FAQS = [
  {
    q: 'Làm thế nào để lưu một repository vào danh sách cá nhân?',
    a: 'Bạn chỉ cần nhấn vào dự án bất kỳ trong mục Khám phá (Explore), sau đó bấm nút "Lưu Repo" hoặc vào trang Accounts Center > Saved Repositories để quản lý toàn bộ kho mã nguồn đã đánh dấu.'
  },
  {
    q: 'Dự án trên GitXplore được đồng bộ như thế nào?',
    a: 'Các dự án mã nguồn mở được cập nhật định kỳ từ GitHub API. Bạn có thể xem mã nguồn, số sao (stars), forks và lệnh git clone trực tiếp tại Project Modal.'
  },
  {
    q: 'Làm sao để liên kết tài khoản GitHub hoặc Google?',
    a: 'Đăng nhập vào hệ thống, truy cập Accounts Center > Connected experiences, sau đó chọn Link GitHub hoặc Google Gateway để đồng bộ danh tính.'
  },
  {
    q: 'Làm thế nào để xuất hoặc xóa dữ liệu của tôi?',
    a: 'Truy cập mục "Your information and permissions" trong Accounts Center, nhấn "Export JSON" để tải toàn bộ dữ liệu cá nhân về máy tính bất cứ lúc nào.'
  }
];

export default function SupportModal({ onClose }) {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Feedback / Ticket state
  const [ticketType, setTicketType] = useState('bug');
  const [message, setMessage] = useState('');
  const [senderContact, setSenderContact] = useState(user?.identifier || '');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);

    try {
      await supabase.from('support_tickets').insert([
        {
          user_contact: senderContact.trim() || 'Anonymous',
          ticket_type: ticketType,
          message: message.trim(),
          created_at: new Date().toISOString()
        }
      ]);
    } catch {
      const old = JSON.parse(localStorage.getItem('gxp_tickets') || '[]');
      old.push({ type: ticketType, msg: message, contact: senderContact, time: new Date() });
      localStorage.setItem('gxp_tickets', JSON.stringify(old));
    }

    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setMessage('');
      setTimeout(() => setSentSuccess(false), 3500);
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '750px',
          width: '92%',
          maxHeight: '88vh',
          background: '#0d0707',
          border: '1px solid #3d1b1b',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          color: '#fef3c7',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #291212', paddingBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <span>🎧</span> Help & Assistance Hub
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: '#fff' }}>
              Bạn cần hỗ trợ điều gì?
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#a8a29e' }}>
              Tra cứu nhanh câu hỏi thường gặp hoặc gửi yêu cầu trực tiếp cho đội ngũ GitXplore.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: '#1c0d0d',
              border: '1px solid #381a1a',
              color: '#d1d5db',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 1. Direct Channels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', margin: '20px 0' }}>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            style={{ textDecoration: 'none', background: '#160a0a', border: '1px solid #2b1414', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ fontSize: '24px' }}>🐙</div>
            <div>
              <strong style={{ color: '#fff', fontSize: '13.5px', display: 'block' }}>GitHub Issues</strong>
              <span style={{ color: '#9ca3af', fontSize: '11.5px' }}>Báo lỗi mã nguồn ↗</span>
            </div>
          </a>

          <div 
            onClick={() => alert('Kênh Discord chính thức của GitXplore sẽ ra mắt trong bản cập nhật tới!')}
            style={{ background: '#160a0a', border: '1px solid #2b1414', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '24px' }}>💬</div>
            <div>
              <strong style={{ color: '#fff', fontSize: '13.5px', display: 'block' }}>Discord Chat</strong>
              <span style={{ color: '#9ca3af', fontSize: '11.5px' }}>Trò chuyện cộng đồng</span>
            </div>
          </div>

          <a 
            href="mailto:support@gitxplore.dev" 
            style={{ textDecoration: 'none', background: '#160a0a', border: '1px solid #2b1414', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ fontSize: '24px' }}>✉️</div>
            <div>
              <strong style={{ color: '#fff', fontSize: '13.5px', display: 'block' }}>Email Support</strong>
              <span style={{ color: '#9ca3af', fontSize: '11.5px' }}>Phản hồi nhanh</span>
            </div>
          </a>
        </div>

        {/* 2. FAQ Accordion */}
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '15px', color: '#fef08a', margin: '0 0 10px' }}>
            ⚡ Câu hỏi thường gặp
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQS.map((faq, idx) => (
              <div key={idx} style={{ background: '#140808', border: '1px solid #241111', borderRadius: '10px', overflow: 'hidden' }}>
                <div 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '13.5px', color: '#f3f4f6' }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: '#f59e0b', fontSize: '13px' }}>{activeFaq === idx ? '▲' : '▼'}</span>
                </div>
                {activeFaq === idx && (
                  <div style={{ padding: '0 16px 14px', color: '#a8a29e', fontSize: '13px', lineHeight: 1.6, borderTop: '1px solid #1c0d0d', paddingTop: '10px' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Send Feedback Form */}
        <div style={{ background: '#140808', border: '1px solid #2b1414', borderRadius: '14px', padding: '18px' }}>
          <h3 style={{ fontSize: '15px', color: '#fef08a', margin: '0 0 12px' }}>
            📝 Gửi phản hồi / Báo lỗi trực tiếp
          </h3>

          <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'bug', label: '🐛 Báo lỗi Bug' },
                { id: 'feature', label: '💡 Ý tưởng mới' },
                { id: 'account', label: '🔐 Tài khoản' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setTicketType(pill.id)}
                  style={{
                    background: ticketType === pill.id ? 'linear-gradient(135deg, #7f1d1d, #c2410c)' : '#1e0e0e',
                    color: ticketType === pill.id ? '#fff' : '#9ca3af',
                    border: '1px solid #381a1a',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#8c827a', marginBottom: '4px' }}>
                Email / Số điện thoại liên hệ
              </label>
              <input 
                type="text" 
                placeholder="email@example.com..."
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
                className="lusion-search"
                style={{ width: '100%', borderRadius: '8px', fontSize: '13px', padding: '8px 12px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#8c827a', marginBottom: '4px' }}>
                Nội dung chi tiết
              </label>
              <textarea 
                rows={3}
                placeholder="Mô tả sự cố bạn gặp phải..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d0606',
                  border: '1px solid #381a1a',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {sentSuccess ? (
                <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 600 }}>
                  ✓ Đã gửi thành công! Cảm ơn bạn.
                </span>
              ) : <span />}
              <button 
                type="submit" 
                disabled={isSending}
                className="link-btn btn-primary"
                style={{ padding: '8px 24px', fontSize: '13px' }}
              >
                {isSending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}