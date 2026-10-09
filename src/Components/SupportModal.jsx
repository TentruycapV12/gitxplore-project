import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './SupportModal.css';

// TODO: đổi sang link issues của repo thật, ví dụ https://github.com/<user>/<repo>/issues
const GITHUB_ISSUES_URL = 'https://github.com';
const SUPPORT_EMAIL = 'support@gitxplore.dev';

const FAQS = [
  {
    q: 'Làm thế nào để lưu một repository vào danh sách cá nhân?',
    a: 'Mở một dự án bất kỳ trong mục Khám phá (Explore), rồi bấm "Lưu Repo". Để xem lại, vào Accounts Center > Saved Repositories.',
  },
  {
    q: 'Dự án trên GitXplore được đồng bộ như thế nào?',
    a: 'Các dự án mã nguồn mở được cập nhật định kỳ từ GitHub API. Bạn có thể xem mã nguồn, số sao (stars), forks và lệnh git clone ngay trong cửa sổ chi tiết dự án.',
  },
  {
    q: 'Làm sao để liên kết tài khoản GitHub hoặc Google?',
    a: 'Đăng nhập, vào Accounts Center > Connected experiences, rồi chọn Link GitHub hoặc Google.',
  },
  {
    q: 'Làm thế nào để xuất hoặc xóa dữ liệu của tôi?',
    a: 'Vào "Your information and permissions" trong Accounts Center. Bấm "Export JSON" để tải toàn bộ dữ liệu cá nhân về máy bất cứ lúc nào.',
  },
];

// id giữ nguyên như bản cũ để không ảnh hưởng dữ liệu trong bảng support_tickets
const TYPES = [
  { id: 'bug', label: 'Báo lỗi', hint: 'Bạn đang làm gì và điều gì đã xảy ra? Ghi rõ trang bị lỗi nếu có thể.' },
  { id: 'feature', label: 'Góp ý', hint: 'Bạn muốn GitXplore làm được thêm điều gì?' },
  { id: 'account', label: 'Tài khoản', hint: 'Mô tả vấn đề về đăng nhập, liên kết hoặc dữ liệu tài khoản của bạn.' },
];

export default function SupportModal({ onClose }) {
  const { user } = useAuth();
  const panelRef = useRef(null);

  const [tab, setTab] = useState('faq'); // 'faq' | 'form'
  const [openFaq, setOpenFaq] = useState(null);

  const [ticketType, setTicketType] = useState('bug');
  const [contact, setContact] = useState(user?.identifier || '');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'

  const currentType = TYPES.find((t) => t.id === ticketType);
  const canSend = message.trim() && contact.trim() && status !== 'sending';

  // Khoá cuộn nền, đưa focus vào hộp thoại, trả focus khi đóng
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    // Giữ focus trong hộp thoại khi bấm Tab
    if (e.key === 'Tab') {
      const items = panelRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input, textarea'
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setStatus('sending');

    try {
      const { error } = await supabase.from('support_tickets').insert([
        {
          user_contact: contact.trim(),
          ticket_type: ticketType,
          message: message.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      setStatus('sent');
    } catch {
      // Giữ nguyên nội dung người dùng đã nhập để họ gửi lại
      setStatus('error');
    }
  };

  const sendAnother = () => {
    setMessage('');
    setStatus('idle');
  };

  return (
    <div
      className="sp-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="sp"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-title"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className="sp-head">
          <div>
            <h2 id="sp-title" className="sp-title">Hỗ trợ</h2>
            <p className="sp-sub">Tìm câu trả lời nhanh hoặc gửi yêu cầu cho đội ngũ GitXplore.</p>
          </div>
          <button type="button" className="sp-close" onClick={onClose} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Chuyển giữa 2 việc người dùng hay làm nhất */}
        <div className="sp-tabs">
          <div className="sp-segment">
            <button type="button" aria-pressed={tab === 'faq'} onClick={() => setTab('faq')}>
              Câu hỏi thường gặp
            </button>
            <button type="button" aria-pressed={tab === 'form'} onClick={() => setTab('form')}>
              Gửi yêu cầu
            </button>
          </div>
        </div>

        {/* Nội dung — chỉ vùng này cuộn */}
        <div className="sp-body" data-lenis-prevent>
          {tab === 'faq' && (
            <div className="sp-fade">
              <ul className="sp-faq">
                {FAQS.map((faq, i) => {
                  const open = openFaq === i;
                  return (
                    <li key={faq.q} className="sp-faq-item">
                      <button
                        type="button"
                        className="sp-faq-q"
                        aria-expanded={open}
                        aria-controls={`sp-faq-a-${i}`}
                        onClick={() => setOpenFaq(open ? null : i)}
                      >
                        <span>{faq.q}</span>
                        <svg className="sp-chev" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {open && (
                        <p id={`sp-faq-a-${i}`} className="sp-faq-a">{faq.a}</p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <p className="sp-fallback">
                Chưa thấy câu trả lời?{' '}
                <button type="button" className="sp-link" onClick={() => setTab('form')}>
                  Gửi yêu cầu cho chúng tôi
                </button>
              </p>
            </div>
          )}

          {tab === 'form' && status === 'sent' && (
            <div className="sp-fade sp-done" role="status">
              <span className="sp-done-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3>Đã nhận yêu cầu của bạn</h3>
              <p>Chúng tôi sẽ liên hệ qua <strong>{contact.trim()}</strong> khi có phản hồi.</p>
              <div className="sp-done-actions">
                <button type="button" className="sp-btn" onClick={sendAnother}>Gửi yêu cầu khác</button>
                <button type="button" className="sp-btn sp-btn--primary" onClick={onClose}>Đóng</button>
              </div>
            </div>
          )}

          {tab === 'form' && status !== 'sent' && (
            <form className="sp-fade sp-form" onSubmit={handleSubmit}>
              <fieldset className="sp-field sp-types">
                <legend className="sp-label">Bạn muốn gửi gì?</legend>
                <div className="sp-segment sp-segment--full">
                  {TYPES.map((t) => (
                    <label key={t.id}>
                      <input
                        type="radio"
                        name="sp-ticket-type"
                        value={t.id}
                        checked={ticketType === t.id}
                        onChange={() => setTicketType(t.id)}
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="sp-field">
                <label className="sp-label" htmlFor="sp-contact">Email hoặc số điện thoại</label>
                <input
                  id="sp-contact"
                  className="sp-input"
                  type="text"
                  autoComplete="email"
                  placeholder="Để chúng tôi liên hệ lại với bạn"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>

              <div className="sp-field">
                <label className="sp-label" htmlFor="sp-message">Nội dung</label>
                <textarea
                  id="sp-message"
                  className="sp-input sp-textarea"
                  rows={5}
                  maxLength={2000}
                  placeholder={currentType.hint}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {status === 'error' && (
                <p className="sp-error" role="alert">
                  Chưa gửi được yêu cầu. Nội dung của bạn vẫn còn nguyên, hãy thử lại hoặc gửi email tới{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </p>
              )}

              <div className="sp-actions">
                <button type="submit" className="sp-btn sp-btn--primary" disabled={!canSend}>
                  {status === 'sending' ? 'Đang gửi…' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Kênh khác — luôn nằm ở chân, không chiếm chỗ của nội dung chính */}
        <footer className="sp-foot">
          <span>Kênh khác:</span>
          <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer">GitHub Issues</a>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Email</a>
          <span className="sp-soon">Discord (sắp ra mắt)</span>
        </footer>
      </div>
    </div>
  );
}
