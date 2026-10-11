import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './SupportModal.css';

// TODO: đổi sang link issues của repo thật, ví dụ https://github.com/<user>/<repo>/issues
const GITHUB_ISSUES_URL = 'https://github.com';
const SUPPORT_EMAIL = 'support@gitxplore.dev';

// Chuyển lỗi Supabase thành gợi ý dễ hiểu (đồng thời log đầy đủ ra console)
function getErrorHint(err) {
  const code = err?.code || '';
  const msg = err?.message || '';
  if (code === 'PGRST205' || code === '42P01') return 'Bảng support_tickets chưa tồn tại trên Supabase.';
  if (code === '42501' || /row-level security/i.test(msg)) return 'Bị chặn bởi RLS: thiếu policy INSERT cho bảng support_tickets.';
  if (code === 'PGRST204' || code === '42703') return 'Tên cột không khớp với bảng support_tickets.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Không kết nối được Supabase (kiểm tra mạng hoặc biến môi trường VITE_SUPABASE_URL).';
  if (/Invalid API key|JWT/i.test(msg)) return 'API key Supabase không hợp lệ (kiểm tra VITE_SUPABASE_ANON_KEY).';
  return msg;
}

export default function SupportModal({ onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const panelRef = useRef(null);

  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
  ];

  const types = [
    { id: 'bug', label: t('sp_bug'), hint: t('sp_bug_hint') },
    { id: 'feature', label: t('sp_feature'), hint: t('sp_feature_hint') },
    { id: 'account', label: t('sp_account'), hint: t('sp_account_hint') },
  ];

  const [tab, setTab] = useState('faq'); // 'faq' | 'form'
  const [openFaq, setOpenFaq] = useState(null);

  const [ticketType, setTicketType] = useState('bug');
  const [contact, setContact] = useState(user?.identifier || '');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [errorDetail, setErrorDetail] = useState('');

  const currentType = types.find((it) => it.id === ticketType) || types[0];
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
    setErrorDetail('');

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
    } catch (err) {
      // Giữ nguyên nội dung người dùng đã nhập để họ gửi lại
      console.error('Support ticket error:', err);
      setErrorDetail(getErrorHint(err));
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
            <h2 id="sp-title" className="sp-title">{t('sp_title')}</h2>
            <p className="sp-sub">{t('sp_sub')}</p>
          </div>
          <button type="button" className="sp-close" onClick={onClose} aria-label={t('ui_close') || 'Close'}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Chuyển giữa 2 việc người dùng hay làm nhất */}
        <div className="sp-tabs">
          <div className="sp-segment">
            <button type="button" aria-pressed={tab === 'faq'} onClick={() => setTab('faq')}>
              {t('sp_faq')}
            </button>
            <button type="button" aria-pressed={tab === 'form'} onClick={() => setTab('form')}>
              {t('sp_submit')}
            </button>
          </div>
        </div>

        {/* Nội dung — chỉ vùng này cuộn */}
        <div className="sp-body" data-lenis-prevent>
          {tab === 'faq' && (
            <div className="sp-fade">
              <ul className="sp-faq">
                {faqs.map((faq, i) => {
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
                {t('sp_not_found')}
                <button type="button" className="sp-link" onClick={() => setTab('form')}>
                  {t('sp_send_us')}
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
              <h3>{t('sp_done_title')}</h3>
              <p>{t('sp_done_msg', { contact: contact.trim() })}</p>
              <div className="sp-done-actions">
                <button type="button" className="sp-btn" onClick={sendAnother}>{t('sp_done_another')}</button>
                <button type="button" className="sp-btn sp-btn--primary" onClick={onClose}>{t('acc_btn_cancel') || 'Đóng'}</button>
              </div>
            </div>
          )}

          {tab === 'form' && status !== 'sent' && (
            <form className="sp-fade sp-form" onSubmit={handleSubmit}>
              <fieldset className="sp-field sp-types">
                <legend className="sp-label">{t('sp_type_label')}</legend>
                <div className="sp-segment sp-segment--full">
                  {types.map((tItem) => (
                    <label key={tItem.id}>
                      <input
                        type="radio"
                        name="sp-ticket-type"
                        value={tItem.id}
                        checked={ticketType === tItem.id}
                        onChange={() => setTicketType(tItem.id)}
                      />
                      <span>{tItem.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="sp-field">
                <label className="sp-label" htmlFor="sp-contact">{t('sp_contact_label')}</label>
                <input
                  id="sp-contact"
                  className="sp-input"
                  type="text"
                  autoComplete="email"
                  placeholder={t('sp_contact_ph')}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>

              <div className="sp-field">
                <label className="sp-label" htmlFor="sp-message">{t('sp_msg_label')}</label>
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
                  {t('sp_error_msg')}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                  {errorDetail && (
                    <>
                      <br />
                      <small>Chi tiết: {errorDetail}</small>
                    </>
                  )}
                </p>
              )}

              <div className="sp-actions">
                <button type="submit" className="sp-btn sp-btn--primary" disabled={!canSend}>
                  {status === 'sending' ? t('sp_sending') : t('sp_btn_submit')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Kênh khác — luôn nằm ở chân, không chiếm chỗ của nội dung chính */}
        <footer className="sp-foot">
          <span>{t('sp_other_channels')}</span>
          <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer">GitHub Issues</a>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Email</a>
          <span className="sp-soon">{t('sp_discord_soon')}</span>
        </footer>
      </div>
    </div>
  );
}
