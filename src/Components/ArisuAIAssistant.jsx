import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import './ArisuAIAssistant.css';

// SVG Icons
const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  close: 'M18 6L6 18M6 6l12 12',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  volumeMute: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
};

import { supabase } from '../supabaseClient';
import { getDevExpertResponse, getArisuAnimeResponse, detectLanguage } from './arisuAiLogic';

// Gọi Supabase Edge Function 'chat-ai' (LLM Gemini/Groq), tự động fallback về offline engine
async function requestAIResponse(textToSend, currentAttachments, lang, user, aiMode) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        prompt: textToSend,
        mode: aiMode,
        appLang: lang,
        userName: user?.name || user?.identifier || null,
        attachments: currentAttachments?.map((a) => ({ name: a.name, type: a.type })) || [],
      },
    });

    const isFailedReply = !data?.reply ||
      typeof data.reply !== 'string' ||
      data.reply.trim() === '' ||
      data.reply.includes('chưa thể xử lý yêu cầu') ||
      data.reply.includes('lỗi lúc này');

    if (!error && !isFailedReply) {
      return data.reply;
    }
  } catch (err) {
    console.warn('Supabase Edge Function chưa cấu hình hoặc không kết nối được, chuyển về Offline Engine:', err);
  }

  // Fallback an toàn 100% về engine nội tại
  if (aiMode === 'dev') {
    return getDevExpertResponse(textToSend, currentAttachments, lang, user);
  }
  return getArisuAnimeResponse(textToSend, currentAttachments, lang, user);
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="arisu-code-block" style={{ margin: '8px 0', background: '#09050d', border: '1px solid #331f42', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid #231530', fontSize: '11px', color: '#a78bfa' }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          style={{ background: 'transparent', border: 'none', color: copied ? '#4ade80' : '#cbd5e1', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
        >
          {copied ? '✓ Đã sao chép' : '📋 Sao chép mã'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px', overflowX: 'auto', fontSize: '12.5px', color: '#f3e8ff', fontFamily: 'Consolas, monospace', lineHeight: 1.5 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedMessage({ text }) {
  if (!text) return null;

  // Split by code blocks ```lang ... ```
  const parts = [];
  const regex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || 'code', code: match[2].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return (
    <div className="arisu-bubble-text">
      {parts.map((p, idx) => {
        if (p.type === 'code') {
          return <CodeBlock key={idx} language={p.lang} code={p.code} />;
        }
        return p.content.split('\n').map((line, lineIdx) => {
          if (!line.trim()) return <div key={lineIdx} style={{ height: '6px' }} />;
          const inlineParts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
          return (
            <p key={lineIdx} style={{ margin: '3px 0' }}>
              {inlineParts.map((ip, ipIdx) => {
                if (ip.startsWith('`') && ip.endsWith('`')) {
                  return (
                    <code
                      key={ipIdx}
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fef08a',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'Consolas, monospace',
                      }}
                    >
                      {ip.slice(1, -1)}
                    </code>
                  );
                }
                if (ip.startsWith('**') && ip.endsWith('**')) {
                  return <strong key={ipIdx} style={{ color: '#fff', fontWeight: 700 }}>{ip.slice(2, -2)}</strong>;
                }
                return ip;
              })}
            </p>
          );
        });
      })}
    </div>
  );
}

export default function ArisuAIAssistant() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [aiMode, setAiMode] = useState(() => localStorage.getItem('gx_ai_mode') || 'dev'); // 'dev' | 'arisu'
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('gx_arisu_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const messagesAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Khởi tạo tin nhắn chào nếu chưa có
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: lang === 'vi'
            ? 'Chào bạn! Tôi là Trợ lý Kỹ thuật & Vibe Coding của GitXplore. Tôi có thể hỗ trợ bạn viết code, giải đáp React/Vite/CSS, phân tích lỗi hoặc chia sẻ cấu hình .cursorrules & MCP Servers. Bạn cũng có thể bấm chuyển đổi sang chế độ **🌸 Arisu Chibi** bất kỳ lúc nào!'
            : 'Welcome! I am GitXplore Developer & Vibe Coding Assistant. I can assist with React, Vite, CSS, bug triage, .cursorrules and MCP servers. You can also switch to **🌸 Arisu Chibi** mode anytime!',
          timestamp: Date.now(),
        },
      ]);
    }
  }, [lang, messages.length]);

  // Lưu lịch sử chat
  useEffect(() => {
    try {
      localStorage.setItem('gx_arisu_chat_history', JSON.stringify(messages));
    } catch {
      // storage full or private mode
    }
  }, [messages]);

  // Hàm cuộn xuống đáy an toàn
  const scrollToBottom = (smooth = true) => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  };

  // Chỉ cuộn xuống khi mở modal hoặc khi tin nhắn mới xuất hiện
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (messages.length > 0 || isTyping)) {
      scrollToBottom(true);
    }
  }, [messages.length, isTyping, isOpen]);

  // Lắng nghe sự kiện con lăn chuột: CÁCH LY HOÀN TOÀN KHỎI LENIS ĐỂ CUỘN LÊN/XUỐNG 100% MƯỢT
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // Lắng nghe sự kiện mở trợ lý AI từ bất kỳ nút bấm nào trên toàn trang
  useEffect(() => {
    const handleOpenAI = (e) => {
      setIsOpen(true);
      const query = e.detail?.query;
      if (query) {
        setTimeout(() => {
          handleSend(query);
        }, 120);
      }
    };

    window.addEventListener('open-arisu-ai', handleOpenAI);
    return () => window.removeEventListener('open-arisu-ai', handleOpenAI);
  }, []);

  // Khởi tạo SpeechRecognition (Ghi âm)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'vi' ? 'vi-VN' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US';

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  // Chức năng bật / tắt ghi âm
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(lang === 'vi' ? 'Trình duyệt của bạn chưa hỗ trợ Web Speech API. Hãy dùng Chrome hoặc Edge!' : 'Web Speech API is not supported in this browser. Please use Chrome or Edge!');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  // Gửi tin nhắn (Hỗ trợ gọi LLM qua Supabase Edge Function và tự động fallback)
  const handleSend = async (overrideText) => {
    const textToSend = (typeof overrideText === 'string' ? overrideText : inputText).trim();
    if (!textToSend && attachments.length === 0) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    const currentAttachments = [...attachments];
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const responseText = await requestAIResponse(textToSend, currentAttachments, lang, user, aiMode);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: aiMode === 'dev' ? 'dev' : 'arisu',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);

      if (Math.random() > 0.65) {
        addNotification({
          type: 'system',
          actor: { name: aiMode === 'dev' ? 'Dev Expert AI' : 'Arisu AI', avatarChar: aiMode === 'dev' ? 'D' : 'A' },
          title: lang === 'vi' ? 'đã giải đáp thắc mắc của bạn' : 'answered your technical inquiry',
          content: responseText.slice(0, 65) + '...',
          category: 'system',
        });
      }
    } catch {
      setIsTyping(false);
    }
  };

  // Xử lý gửi tệp tài liệu / code
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: 'file',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            data: event.target.result,
          },
        ]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // Xử lý gửi ảnh hoặc video
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      const isVideo = file.type.startsWith('video');
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: isVideo ? 'video' : 'image',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            url: event.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Chèn link
  const handleInsertLink = () => {
    const url = prompt(lang === 'vi' ? 'Nhập đường link nhiệm vụ muốn chia sẻ với Arisu:' : 'Enter URL to share with Arisu:');
    if (url && url.startsWith('http')) {
      setInputText((prev) => (prev ? `${prev} ${url}` : url));
    }
  };

  // Xóa đoạn chat
  const handleClearChat = () => {
    if (window.confirm(lang === 'vi' ? 'Sensei có muốn xóa lịch sử chat và quay về Save Point ban đầu?' : 'Reset conversation and return to Save Point?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'arisu',
          text: t('arisu_welcome'),
          timestamp: Date.now(),
        },
      ]);
      localStorage.removeItem('gx_arisu_chat_history');
    }
  };

  const handleChipClick = (promptText) => {
    handleSend(promptText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="arisu-assistant-container">
      {/* ===== 1. CỬA SỔ CHAT KHÔNG KHUÔN (FRAMELESS GLASS CHAT) ===== */}
      {isOpen && (
        <aside
          className="arisu-chat-modal"
          role="dialog"
          aria-label={aiMode === 'dev' ? 'Dev Expert AI' : t('arisu_title')}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header Glassmorphism với Mode Switcher */}
          <div className="arisu-modal-header" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 18px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div className="arisu-header-avatar-group">
                <div className="arisu-avatar-wrap">
                  {aiMode === 'dev' ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'grid', placeItems: 'center', fontSize: '18px', border: '1.5px solid rgba(245, 158, 11, 0.6)', color: '#fff', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }}>
                      ⚡
                    </div>
                  ) : (
                    <img src="/arisu.png" alt="Arisu" className="arisu-avatar-img" />
                  )}
                  <span className="arisu-status-dot" title="Online" />
                </div>
                <div className="arisu-header-info">
                  <h3 className="arisu-header-title">
                    {aiMode === 'dev' ? 'Dev Expert AI' : t('arisu_title')}
                  </h3>
                  <span className="arisu-header-sub">
                    {aiMode === 'dev'
                      ? (lang === 'vi' ? 'Chuyên gia Full-Stack & Vibe Coding' : 'Senior Full-Stack & Vibe Assistant')
                      : t('arisu_sub')}
                  </span>
                </div>
              </div>

              <div className="arisu-header-actions">
                <button
                  type="button"
                  className="arisu-icon-btn"
                  onClick={() => setSoundEnabled(v => !v)}
                  title={soundEnabled ? 'Tắt âm thanh (Mute)' : 'Bật âm thanh (Sound On)'}
                  style={{ color: soundEnabled ? '#38bdf8' : '#78716c' }}
                >
                  <Ico d={soundEnabled ? ICONS.volume : ICONS.volumeMute} size={15} />
                </button>
                <button
                  type="button"
                  className="arisu-icon-btn"
                  onClick={handleClearChat}
                  title={t('arisu_clear')}
                >
                  <Ico d={ICONS.trash} size={15} />
                </button>
                <button
                  type="button"
                  className="arisu-icon-btn arisu-close-btn"
                  onClick={() => setIsOpen(false)}
                  title="Đóng chat"
                >
                  <Ico d={ICONS.close} size={16} />
                </button>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.45)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => { setAiMode('dev'); localStorage.setItem('gx_ai_mode', 'dev'); }}
                style={{
                  flex: 1,
                  background: aiMode === 'dev' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'transparent',
                  color: aiMode === 'dev' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡</span> Dev Expert Mode
              </button>
              <button
                type="button"
                onClick={() => { setAiMode('arisu'); localStorage.setItem('gx_ai_mode', 'arisu'); }}
                style={{
                  flex: 1,
                  background: aiMode === 'arisu' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
                  color: aiMode === 'arisu' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🌸</span> Arisu Chibi Mode
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="arisu-chips-bar">
            <button
              type="button"
              className="arisu-chip"
              style={{ background: 'rgba(16, 185, 129, 0.22)', borderColor: 'rgba(16, 185, 129, 0.45)', color: '#6ee7b7' }}
              onClick={() => handleChipClick(lang === 'vi' ? 'Mã nguồn mở là gì? Giải thích siêu đơn giản cho người chưa biết code!' : 'What is open source? Explain simply for beginners!')}
            >
              🌱 Mã nguồn mở là gì?
            </button>
            <button
              type="button"
              className="arisu-chip"
              style={{ background: 'rgba(16, 185, 129, 0.22)', borderColor: 'rgba(16, 185, 129, 0.45)', color: '#6ee7b7' }}
              onClick={() => handleChipClick(lang === 'vi' ? 'Tôi không biết code thì dùng trang web này làm gì?' : 'I do not know how to code, what can I do on this website?')}
            >
              🚀 Chưa biết code làm gì?
            </button>
            {aiMode === 'dev' ? (
              <>
                <button
                  type="button"
                  className="arisu-chip"
                  onClick={() => handleChipClick(lang === 'vi' ? 'Hướng dẫn cấu hình .cursorrules chuẩn Vibe Coding?' : 'How to configure .cursorrules for Vibe Coding?')}
                >
                  ⚡ Mẫu .cursorrules
                </button>
                <button
                  type="button"
                  className="arisu-chip"
                  onClick={() => handleChipClick(lang === 'vi' ? 'Giải thích sự khác biệt giữa useMemo và useCallback?' : 'Difference between useMemo and useCallback?')}
                >
                  ⚛️ useMemo vs useCallback
                </button>
                <button
                  type="button"
                  className="arisu-chip"
                  onClick={() => handleChipClick(lang === 'vi' ? 'Làm sao để sửa lỗi CORS trong Vite và React?' : 'How to fix CORS error in Vite and React?')}
                >
                  🛠️ Khắc phục CORS
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="arisu-chip"
                  onClick={() => handleChipClick(lang === 'vi' ? 'Làm sao để dùng các mẫu Vibe Coding?' : 'How to use Vibe Coding templates?')}
                >
                  {t('arisu_chip_vibe')}
                </button>
                <button
                  type="button"
                  className="arisu-chip"
                  onClick={() => handleChipClick(lang === 'vi' ? 'Arisu là ai trong Blue Archive?' : 'Who is Arisu in Blue Archive?')}
                >
                  {t('arisu_chip_who')}
                </button>
              </>
            )}
          </div>

          {/* Messages Flow - HỖ TRỢ CON LĂN CHUỘT CUỘN LÊN / XUỐNG 100% MƯỢT MÀ */}
          <div
            ref={messagesAreaRef}
            className="arisu-messages-area"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
          >
            {messages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div key={msg.id} className={`arisu-bubble-row ${isMe ? 'is-user' : 'is-arisu'}`}>
                  {!isMe && (
                    <div className="arisu-msg-chibi">
                      {msg.sender === 'dev' ? (
                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '13px' }}>
                          ⚡
                        </div>
                      ) : (
                        <img src="/arisu.png" alt="Arisu" />
                      )}
                    </div>
                  )}

                  <div className="arisu-msg-content">
                    {/* Attachments preview inside message bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="arisu-msg-attachments">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className={`arisu-att-bubble ${att.type}`}>
                            {att.type === 'image' && (
                              <img src={att.url} alt={att.name} className="arisu-att-img" />
                            )}
                            {att.type === 'video' && (
                              <video src={att.url} controls className="arisu-att-video" />
                            )}
                            {att.type === 'file' && (
                              <div className="arisu-att-file-pill">
                                <span>📄 {att.name}</span>
                                <small>({att.size})</small>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text content with formatted code blocks */}
                    {msg.text && (
                      <FormattedMessage text={msg.text} />
                    )}

                    <span className="arisu-msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="arisu-bubble-row is-arisu">
                <div className="arisu-msg-chibi">
                  {aiMode === 'dev' ? (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '13px' }}>
                      ⚡
                    </div>
                  ) : (
                    <img src="/arisu.png" alt="Arisu" />
                  )}
                </div>
                <div className="arisu-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {/* Pending Attachments Bar */}
          {attachments.length > 0 && (
            <div className="arisu-pending-attachments">
              {attachments.map((att, i) => (
                <div key={i} className="arisu-pending-pill">
                  {att.type === 'image' ? '🖼️' : att.type === 'video' ? '🎥' : '📄'}
                  <span className="arisu-pending-name">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    title="Xóa tệp này"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recording Status Bar */}
          {isRecording && (
            <div className="arisu-recording-bar">
              <span className="arisu-recording-wave" />
              <span>{t('arisu_recording')}</span>
              <button type="button" onClick={toggleRecording}>Dừng</button>
            </div>
          )}

          {/* Chat Input Toolbar & Box */}
          <div className="arisu-input-panel">
            {/* Action Tools */}
            <div className="arisu-tools-row">
              <button
                type="button"
                className={`arisu-tool-btn ${isRecording ? 'is-active-mic' : ''}`}
                onClick={toggleRecording}
                title={t('arisu_record_btn')}
              >
                <Ico d={ICONS.mic} size={16} />
              </button>

              <button
                type="button"
                className="arisu-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title={t('arisu_upload_file')}
              >
                <Ico d={ICONS.clip} size={16} />
              </button>

              <button
                type="button"
                className="arisu-tool-btn"
                onClick={() => mediaInputRef.current?.click()}
                title={t('arisu_upload_media')}
              >
                <Ico d={ICONS.image} size={16} />
              </button>

              <button
                type="button"
                className="arisu-tool-btn"
                onClick={handleInsertLink}
                title="Dán liên kết (URL)"
              >
                <Ico d={ICONS.link} size={16} />
              </button>
            </div>

            {/* Input & Send Button */}
            <div className="arisu-input-box">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('arisu_ph')}
                rows={1}
                className="arisu-textarea"
              />

              <button
                type="button"
                className={`arisu-send-btn ${inputText.trim() || attachments.length ? 'is-ready' : ''}`}
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                title="Gửi tin nhắn"
              >
                <Ico d={ICONS.send} size={17} />
              </button>
            </div>

            {/* Hidden native inputs for file uploads */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleMediaUpload}
            />
          </div>
        </aside>
      )}

      {/* ===== 2. NÚT KÍCH HOẠT HÌNH ARISU (THAY THẾ CON NHỘNG) ===== */}
      <div className="arisu-launcher-wrapper">
        {!isOpen && (
          <div className="arisu-speech-bubble" onClick={() => setIsOpen(true)}>
            <span>{t('arisu_floating_hint')}</span>
          </div>
        )}

        <button
          type="button"
          className={`arisu-chibi-button ${isOpen ? 'is-active' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          title="Arisu • Trợ lý AI Blue Archive"
          aria-label="Arisu AI Assistant"
        >
          <div className="arisu-aura-ring" />
          <img src="/arisu.png" alt="Arisu Blue Archive" className="arisu-chibi-avatar" />
          <span className="arisu-badge-dot" />
        </button>
      </div>
    </div>
  );
}
