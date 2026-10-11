import { useState, useRef, useEffect, useMemo } from 'react';
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
  micActive: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  close: 'M18 6L6 18M6 6l12 12',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  volumeMute: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
};

// Trí tuệ nhận thức & câu trả lời giả lập thông minh theo ngữ cảnh
const getArisuResponse = (text, attachments, lang, user) => {
  const q = (text || '').toLowerCase().trim();
  const userName = user?.name || (lang === 'vi' ? 'Sensei' : 'Sensei');

  // Kiểm tra file hoặc media đính kèm
  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some((a) => a.type === 'image');
    const hasVideo = attachments.some((a) => a.type === 'video');
    const hasDoc = attachments.some((a) => a.type === 'file');

    if (hasImage) {
      if (lang === 'vi') {
        return `Panpakapan! Arisu đã nhận được hình ảnh của ${userName}! 📸\n\nArisu đã quan sát rất kỹ: Giao diện và chi tiết hiển thị rất rõ nét. Nếu ${userName} muốn Arisu chuyển đổi hình ảnh này thành code React + Tailwind CSS hoặc tối ưu màu sắc UI theo chuẩn Vibe Coding, hãy nói cho Arisu biết nhé!`;
      }
      return `Panpakapan! Arisu has analyzed the image from ${userName}! 📸\n\nThe visual details look crisp! Arisu can help convert this mockup into React + Tailwind CSS code, or guide you on how to structure the components. What is your quest for this image, Sensei?`;
    }

    if (hasVideo) {
      if (lang === 'vi') {
        return `Panpakapan! Video clip của ${userName} đã tải lên thành công! 🎥\n\nArisu đã ghi lại toàn bộ hoạt ảnh và thao tác trong video. Arisu có thể giúp phân tích lỗi UI, hiệu ứng animation 60fps hoặc xây dựng timeline tương tác tương tự!`;
      }
      return `Panpakapan! Video received successfully! 🎥\n\nHero Arisu is reviewing the motion sequence. Let me know if you want me to reproduce the animations using GSAP or debug any UI glitches shown here!`;
    }

    if (hasDoc) {
      const fileName = attachments[0].name;
      if (lang === 'vi') {
        return `Panpakapan! Arisu đã tải tệp **${fileName}** vào bộ nhớ đệm! 📄\n\nArisu đã đọc và phân tích cấu trúc mã nguồn. Tệp này hoàn toàn tương thích với các quy tắc Vibe Coding và Claude Code templates. ${userName} có muốn Arisu tối ưu hóa hoặc viết tài liệu README cho tệp này không?`;
      }
      return `Panpakapan! Arisu loaded **${fileName}** into memory! 📄\n\nCode structure inspected and ready for optimization. Arisu can refactor it, generate unit tests, or apply Vibe Coding .cursorrules. How shall we proceed, Sensei?`;
    }
  }

  // Câu hỏi về Vibe Coding / aitmpl
  if (q.includes('vibe') || q.includes('aitmpl') || q.includes('template') || q.includes('mẫu') || q.includes('cursor')) {
    if (lang === 'vi') {
      return `Panpakapan! Vibe Coding Hub là khu vực đặc biệt lấy cảm hứng từ **aitmpl.com**! ⚡\n\nTại đây, ${userName} có thể tìm thấy:\n• **Skills**: Hướng dẫn AI thiết kế UI, tối ưu thuật toán.\n• **AI Agents**: Đặc vụ tự hành thực hiện tác vụ độc lập.\n• **MCP Protocols**: Kết nối Claude và Cursor trực tiếp tới cơ sở dữ liệu & GitHub API.\n• **.cursorrules**: Quy tắc định dạng code chuẩn quốc tế.\n\n${userName} có thể bấm vào nút **"Vibe"** trên thanh menu hoặc gõ \`/vibe\` để trải nghiệm ngay nhé!`;
    }
    return `Panpakapan! The Vibe Coding Hub is inspired by **aitmpl.com**! ⚡\n\nHere you will find:\n• **Skills**: UI design, full-stack architecture skills for AI.\n• **AI Agents**: Autonomous task runners.\n• **MCP Servers**: Model Context Protocol servers connecting LLMs to tools.\n• **.cursorrules**: International coding rules.\n\nVisit the **Vibe** tab in the top navigation to explore 32+ standardized templates!`;
  }

  // Câu hỏi về cách lưu repo / bookmark
  if (q.includes('lưu') || q.includes('save') || q.includes('bookmark') || q.includes('yêu thích')) {
    if (lang === 'vi') {
      return `Dạ, lưu kho lưu trữ trên GitXplore rất đơn giản ạ! ⭐\n\n1. Khi xem bất kỳ dự án nào tại trang chủ hoặc tìm kiếm, bấm nút **"Lưu Repo"** (hình ngôi sao hoặc bookmark).\n2. Để xem lại danh sách, ${userName} hãy vào **Trung tâm tài khoản > Kho lưu trữ đã lưu** (\`/accountscenter/saved\`).\n3. ${userName} còn có thể xuất danh sách này thành JSON để sao lưu bất kỳ lúc nào!`;
    }
    return `Saving repositories is super easy, Sensei! ⭐\n\n1. Click the **"Save Repo"** button (bookmark/star icon) on any project card or modal.\n2. Access your saved list anytime under **Accounts Center > Saved Repositories** (\`/accountscenter/saved\`).\n3. You can also export your list to JSON anytime!`;
  }

  // Câu hỏi về bảo mật / accounts center
  if (q.includes('bảo mật') || q.includes('security') || q.includes('tài khoản') || q.includes('account') || q.includes('mật khẩu')) {
    if (lang === 'vi') {
      return `Về bảo mật tài khoản: 🛡️\n\n• GitXplore sử dụng mã hóa token phiên an toàn và xác thực Google One-Tap.\n• ${userName} có thể vào **Trung tâm tài khoản (\`/accountscenter\`)** để quản lý thông tin cá nhân, liên kết GitHub/Google, và kiểm tra quyền riêng tư.\n• Không ai có thể xem dữ liệu riêng tư của ${userName} ngoài chính bạn!`;
    }
    return `Regarding Account Security: 🛡️\n\n• GitXplore utilizes secure token storage and Google One-Tap authentication.\n• Manage your credentials and linked accounts in the **Accounts Center (\`/accountscenter\`)**.\n• Your personal data and saved vault are fully protected and exportable!`;
  }

  // Câu hỏi về Arisu là ai
  if (q.includes('arisu') || q.includes('ai thế') || q.includes('who are you') || q.includes('blue archive') || q.includes('dũng giả')) {
    if (lang === 'vi') {
      return `Panpakapan! Em là **Tendou Arisu** (アリス), thành viên của CLB Phát triển Game tại Học viện Thiên Niên Kỷ (Millennium Science School) trong Blue Archive! 🎮\n\nNhiệm vụ của em trong chuyến phiêu lưu này là trở thành **Dũng giả Trợ lý AI**, đồng hành cùng ${userName} khám phá mã nguồn mở, gỡ lỗi code và xây dựng những dự án phần mềm tuyệt vời nhất! Trực thăng và vũ khí siêu điện từ "Sword of Light" của em luôn sẵn sàng! ⚔️✨`;
    }
    return `Panpakapan! I am **Tendou Arisu** (アリス) from the Game Development Department at Millennium Science School in Blue Archive! 🎮\n\nMy primary quest here is to serve as Sensei's AI Assistant Hero, exploring open-source treasures, debugging code, and mastering Vibe Coding! My railgun "Sword of Light" is charged and ready! ⚔️✨`;
  }

  // Câu hỏi về code / react / vite
  if (q.includes('react') || q.includes('code') || q.includes('lập trình') || q.includes('javascript') || q.includes('css')) {
    if (lang === 'vi') {
      return `Arisu rất thích lập trình! 💻 Dự án GitXplore này được xây dựng bằng **React 19**, **Vite**, **GSAP** cho animation và bảng màu hiện đại.\n\nNếu ${userName} có đoạn code nào cần Arisu giải thích, tối ưu tốc độ hoặc sửa lỗi, hãy dán trực tiếp vào đây hoặc bấm nút kẹp giấy 📎 để gửi tệp cho Arisu nhé!`;
    }
    return `Arisu loves programming! 💻 This platform is powered by **React 19**, **Vite**, and **GSAP** micro-interactions.\n\nIf Sensei has any code snippets to refactor, explain, or optimize, feel free to paste them here or attach a file with the paperclip button 📎!`;
  }

  // Phản hồi chào chung
  if (lang === 'vi') {
    return `Panpakapan! Arisu đã nhận được thông tin từ ${userName}: "${text}".\n\nDũng giả Arisu luôn sẵn sàng đồng hành cùng bạn! Bạn có muốn Arisu hướng dẫn tìm kiếm kho lưu trữ GitHub, xem tin tức công nghệ mới (/news), hay trải nghiệm bộ mẫu Vibe Coding Hub không?`;
  }
  return `Panpakapan! Hero Arisu received your request: "${text}".\n\nI am ready for any quest! Would Sensei like me to guide you to trending GitHub repositories, the latest developer news (/news), or the Vibe Coding Hub?`;
};

export default function ArisuAIAssistant() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [attachments, setAttachments] = useState([]); // [{ name, type, url, size }]
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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Khởi tạo tin nhắn chào nếu chưa có
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'arisu',
          text: t('arisu_welcome'),
          timestamp: Date.now(),
        },
      ]);
    }
  }, [t, messages.length]);

  // Lưu lịch sử chat
  useEffect(() => {
    try {
      localStorage.setItem('gx_arisu_chat_history', JSON.stringify(messages));
    } catch {
      // storage full or private mode
    }
  }, [messages]);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

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

  // Đọc phát âm của Arisu (Text-to-Speech)
  const speakText = (text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
      utterance.pitch = 1.25; // Giọng hơi trong trẻo phong cách Arisu
      utterance.rate = 1.05;
      utterance.lang = lang === 'vi' ? 'vi-VN' : lang === 'ja' ? 'ja-JP' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  // Gửi tin nhắn
  const handleSend = () => {
    const textToSend = inputText.trim();
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

    // AI Phản hồi sau một khoảng thời gian tự nhiên
    setTimeout(() => {
      const responseText = getArisuResponse(textToSend, currentAttachments, lang, user);
      const arisuMsg = {
        id: `arisu-${Date.now()}`,
        sender: 'arisu',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, arisuMsg]);
      setIsTyping(false);
      speakText(responseText);

      // Thêm thông báo hệ thống nếu đây là tương tác đầu
      if (Math.random() > 0.6) {
        addNotification({
          type: 'system',
          actor: { name: 'Arisu AI', avatarChar: 'A' },
          title: lang === 'vi' ? 'đã hỗ trợ bạn một câu hỏi' : 'assisted you with an inquiry',
          content: responseText.slice(0, 70) + '...',
          category: 'system',
        });
      }
    }, 900);
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
    const url = prompt(lang === 'vi' ? 'Nhập đường link bạn muốn gửi cho Arisu:' : 'Enter URL to share with Arisu:');
    if (url && url.startsWith('http')) {
      setInputText((prev) => (prev ? `${prev} ${url}` : url));
    }
  };

  // Xóa đoạn chat
  const handleClearChat = () => {
    if (window.confirm(lang === 'vi' ? 'Bạn có muốn làm mới cuộc trò chuyện với Arisu?' : 'Reset conversation with Arisu?')) {
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

  // Click vào gợi ý nhanh
  const handleChipClick = (promptText) => {
    setInputText(promptText);
  };

  // Xử lý nhấn phím Enter
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
        <aside className="arisu-chat-modal" role="dialog" aria-label={t('arisu_title')}>
          {/* Header Glassmorphism */}
          <div className="arisu-modal-header">
            <div className="arisu-header-avatar-group">
              <div className="arisu-avatar-wrap">
                <img src="/arisu.png" alt="Arisu" className="arisu-avatar-img" />
                <span className="arisu-status-dot" title="Online" />
              </div>
              <div className="arisu-header-info">
                <h3 className="arisu-header-title">{t('arisu_title')}</h3>
                <span className="arisu-header-sub">{t('arisu_sub')}</span>
              </div>
            </div>

            <div className="arisu-header-actions">
              <button
                type="button"
                className="arisu-icon-btn"
                onClick={() => setSoundEnabled((v) => !v)}
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                <Ico d={soundEnabled ? ICONS.volume : ICONS.volumeMute} size={16} />
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

          {/* Quick Action Chips */}
          <div className="arisu-chips-bar">
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
              onClick={() => handleChipClick(lang === 'vi' ? 'Hướng dẫn cách lưu và xuất repo yêu thích?' : 'How to save and export repositories?')}
            >
              {t('arisu_chip_save')}
            </button>
            <button
              type="button"
              className="arisu-chip"
              onClick={() => handleChipClick(lang === 'vi' ? 'Tài khoản của tôi được bảo mật thế nào?' : 'How is my account secured?')}
            >
              {t('arisu_chip_security')}
            </button>
            <button
              type="button"
              className="arisu-chip"
              onClick={() => handleChipClick(lang === 'vi' ? 'Arisu là ai trong Blue Archive?' : 'Who is Arisu in Blue Archive?')}
            >
              {t('arisu_chip_who')}
            </button>
          </div>

          {/* Messages Flow */}
          <div className="arisu-messages-area">
            {messages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div key={msg.id} className={`arisu-bubble-row ${isMe ? 'is-user' : 'is-arisu'}`}>
                  {!isMe && (
                    <div className="arisu-msg-chibi">
                      <img src="/arisu.png" alt="Arisu" />
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

                    {/* Text content with markdown formatting */}
                    {msg.text && (
                      <div className="arisu-bubble-text">
                        {msg.text.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
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
                  <img src="/arisu.png" alt="Arisu" />
                </div>
                <div className="arisu-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
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
