import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import './VibeExplainerSection.css';

const VIBE_VIDEOS = [
  {
    id: 'v1',
    platform: 'youtube',
    badgeText: 'YouTube Shorts / Clip',
    title: 'Vibe Coding Là Gì? Cuộc Cách Mạng Lập Trình Bằng Trò Chuyện AI',
    desc: 'Andrej Karpathy (cựu Giám đốc AI Tesla / OpenAI) khởi xướng xu hướng lập trình bằng cảm xúc và ngôn ngữ tự nhiên thay vì gõ code thủ công.',
    duration: '03:20',
    views: '🔥 1.4M views',
    thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    embedUrl: 'https://www.youtube.com/embed/yvPzS0_Oa3U?autoplay=1',
    externalUrl: 'https://www.youtube.com/results?search_query=vibe+coding+andrej+karpathy',
  },
  {
    id: 'v2',
    platform: 'tiktok',
    badgeText: 'TikTok Viral Clip',
    title: 'Thử Thách Tạo Game Hoàn Chỉnh Trong 60s Bằng Vibe Coding',
    desc: 'Clip TikTok triệu view: Người không chuyên dùng Cursor IDE ra lệnh bằng 1 câu prompt tiếng Việt và tạo ra ngay game chơi mượt mà.',
    duration: '00:58',
    views: '🚀 890K views',
    thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    embedUrl: 'https://www.youtube.com/embed/yvPzS0_Oa3U?autoplay=1',
    externalUrl: 'https://www.tiktok.com/tag/vibecoding',
  },
  {
    id: 'v3',
    platform: 'facebook',
    badgeText: 'Facebook Reels / Video',
    title: 'Quy Trình 3 Bước Ra Mắt Web App Bán Hàng Cho Người Mới',
    desc: 'Video thực tế: Cách chuẩn bị ý tưởng, thiết lập file .cursorrules và chỉ đạo AI Agent xây dựng Landing page kinh doanh trong 5 phút.',
    duration: '01:15',
    views: '⭐ 620K views',
    thumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    embedUrl: 'https://www.youtube.com/embed/yvPzS0_Oa3U?autoplay=1',
    externalUrl: 'https://www.facebook.com/watch/?q=vibe+coding',
  },
  {
    id: 'v4',
    platform: 'youtube',
    badgeText: 'YouTube Tutorial',
    title: 'Bí Quyết Prompting Chuẩn: Ra Lệnh Cho AI Viết Code Không Lỗi',
    desc: 'Cách dùng Claude Code & Cursor hiệu quả: Không bị ảo giác code, tự động sinh test và xuất sản phẩm chạy ngay.',
    duration: '00:52',
    views: '⚡ 750K views',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    embedUrl: 'https://www.youtube.com/embed/yvPzS0_Oa3U?autoplay=1',
    externalUrl: 'https://www.youtube.com/hashtag/vibecoding',
  },
];

const STARTER_VIBES = [
  {
    id: 'cafe',
    title: '☕ Quán Cà Phê Cyber Chill',
    category: 'Landing Page & Bán Hàng',
    icon: '☕',
    level: 'Dễ • 30 giây',
    desc: 'Trang web quán cà phê hiện đại với menu chọn món, giỏ hàng tính tiền và nút đổi chế độ sáng/tối.',
    prompt: 'Tạo một trang web quán cà phê hiện đại phong cách cyberpunk chill, có menu chọn đồ uống, giỏ hàng tính tiền và nút chuyển chế độ Dark/Light mode.',
    templateId: 'cafe',
  },
  {
    id: 'snake',
    title: '🐍 Game Rắn Săn Mồi Neon',
    category: 'Game 2D & Canvas',
    icon: '🐍',
    level: 'Thú vị • 45 giây',
    desc: 'Mini game rắn săn mồi ánh sáng Neon, có tính điểm, điều khiển bằng bàn phím hoặc nút ảo trên điện thoại.',
    prompt: 'Tạo game Rắn Săn Mồi Neon phong cách Cyberpunk bằng HTML5 Canvas, có tính điểm, điều khiển bằng bàn phím và nút cảm ứng, hiệu ứng phát sáng khi ăn mồi.',
    templateId: 'snake',
  },
  {
    id: 'pomodoro',
    title: '⏱️ Pomodoro Kỷ Luật Thép',
    category: 'Công Cụ Năng Suất',
    icon: '⏱️',
    level: 'Dễ • 20 giây',
    desc: 'Đồng hồ 25 phút tập trung cao độ phong cách Iron Man Stark HUD, có chuông báo và bộ đếm phiên làm việc.',
    prompt: 'Tạo đồng hồ Pomodoro 25 phút đếm ngược phong cách Iron Man Stark HUD, có nút Bắt đầu, Tạm dừng, Làm lại và chuông báo.',
    templateId: 'pomodoro',
  },
  {
    id: 'todo',
    title: '📝 To-Do Studio Kính Mờ',
    category: 'Web App Quản Lý',
    icon: '📝',
    level: 'Dễ • 35 giây',
    desc: 'Ứng dụng quản lý mục tiêu phong cách Glassmorphism, lọc công việc đang làm/hoàn thành và tự lưu trên máy.',
    prompt: 'Tạo ứng dụng To-Do List phong cách kính mờ Glassmorphism, có bộ lọc công việc (Tất cả, Đang làm, Hoàn thành), lưu localStorage và hiệu ứng mượt mà.',
    templateId: 'todo',
  },
  {
    id: 'fireworks',
    title: '🎆 Pháo Hoa Hạt 3D Tương Tác',
    category: 'Đồ Họa & Sự Kiện',
    icon: '🎆',
    level: 'Siêu dễ • 15 giây',
    desc: 'Trang hiệu ứng pháo hoa hạt đa sắc màu bung tỏa theo cú click chuột hoặc chạm màn hình kèm lời chúc mừng.',
    prompt: 'Tạo một trang web hiệu ứng pháo hoa tương tác bằng HTML5 Canvas, khi click hoặc chạm màn hình thì bắn chùm pháo hoa hạt neon nhiều màu sắc bung tỏa cùng lời chúc mừng.',
    templateId: 'fireworks',
  },
];

export default function VibeExplainerSection({ onClose }) {
  const { lang } = useLanguage();
  const { openPlayground } = useUI();
  const [activeTab, setActiveTab] = useState('concept'); // 'concept' | 'videos' | 'starters' | 'workflow'
  const [playingVideo, setPlayingVideo] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const handleCopyPrompt = async (promptText) => {
    try {
      await navigator.clipboard.writeText(promptText);
      showToast(lang === 'vi' ? '✓ Đã sao chép Vibe Prompt! Dán vào Cursor / Claude để chạy' : '✓ Prompt copied! Paste into Cursor / Claude');
    } catch {
      showToast(promptText.slice(0, 30) + '...');
    }
  };

  return (
    <div className="vbe-wrapper">
      {/* Top Bar */}
      <div className="vbe-top-bar">
        <div className="vbe-badge-row">
          <div className="vbe-badge">
            <span className="vbe-badge-pulse" />
            <span>{lang === 'vi' ? 'CẨM NANG VIBE CODING 2025 - 2026' : 'VIBE CODING STARTER GUIDE'}</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {lang === 'vi' ? 'Dành cho người mới bắt đầu tiếp cận lập trình thế hệ mới' : 'For beginners entering the AI coding era'}
          </span>
        </div>
        {onClose && (
          <button type="button" className="vbe-close-btn" onClick={onClose}>
            ✕ {lang === 'vi' ? 'Thu gọn' : 'Collapse'}
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="vbe-tabs-nav">
        <button
          type="button"
          className={`vbe-tab-btn ${activeTab === 'concept' ? 'active' : ''}`}
          onClick={() => setActiveTab('concept')}
        >
          <span>💡</span>
          <span>{lang === 'vi' ? 'Vibe Coding Là Gì?' : 'What is Vibe Coding?'}</span>
        </button>

        <button
          type="button"
          className={`vbe-tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <span>🎬</span>
          <span>{lang === 'vi' ? 'Video Ngắn Minh Họa' : 'Short Video Clips'}</span>
          <span className="vbe-tab-pill">TikTok • YouTube • Reels</span>
        </button>

        <button
          type="button"
          className={`vbe-tab-btn ${activeTab === 'starters' ? 'active' : ''}`}
          onClick={() => setActiveTab('starters')}
        >
          <span>🧪</span>
          <span>{lang === 'vi' ? '5 Vibe Code Test Nhanh' : '5 Beginner Test Vibes'}</span>
          <span className="vbe-tab-pill">{lang === 'vi' ? 'Bấm là chạy' : '1-Click Run'}</span>
        </button>

        <button
          type="button"
          className={`vbe-tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          <span>🚀</span>
          <span>{lang === 'vi' ? 'Quy Trình 3 Bước' : '3-Step Workflow'}</span>
        </button>
      </div>

      {/* ===== TAB 1: KHÁI NIỆM & GIẢI THÍCH ===== */}
      {activeTab === 'concept' && (
        <div className="vbe-panel">
          <div className="vbe-concept-hero">
            <h2 className="vbe-concept-title">
              <span>⚡</span>
              <span>
                {lang === 'vi'
                  ? 'Vibe Coding Là Gì? Tại Sao Cả Thế Giới Đang Chuyển Sang Cách Này?'
                  : 'What is Vibe Coding & Why is it Taking Over?'}
              </span>
            </h2>

            {/* Quote Andrej Karpathy */}
            <div className="vbe-quote-box">
              <div className="vbe-quote-text">
                {lang === 'vi'
                  ? '“Tôi không còn phải viết từng dòng code nữa. Tôi chỉ cần ngắm nhìn, trò chuyện với AI bằng ngôn ngữ bình thường, chạy thử và tinh chỉnh. Tôi chỉ việc giữ cái Vibe sáng tạo, AI sẽ lo toàn bộ mã nguồn.”'
                  : '“I just see things, say things, run things, copy and paste things, and it mostly works... I don’t write code anymore, I just vibe with the AI.”'}
              </div>
              <div className="vbe-quote-author">
                — <strong>Andrej Karpathy</strong> ({lang === 'vi' ? 'Cựu Giám đốc AI Tesla & Đồng sáng lập OpenAI' : 'Former Director of AI at Tesla & OpenAI Co-founder'}, 2/2025)
              </div>
            </div>
          </div>

          {/* So sánh Đối Chiếu Trực Quan */}
          <div className="vbe-compare-grid">
            <div className="vbe-compare-card old">
              <div className="vbe-compare-header old">
                <span>🐢</span>
                <span>{lang === 'vi' ? 'LẬP TRÌNH TRUYỀN THỐNG (CŨ)' : 'TRADITIONAL CODING (OLD)'}</span>
              </div>
              <ul className="vbe-compare-list">
                <li>
                  <span>❌</span>
                  <span>{lang === 'vi' ? 'Phải học 6 - 12 tháng cú pháp HTML, CSS, JavaScript, Python.' : 'Requires 6-12 months learning complex syntax and rules.'}</span>
                </li>
                <li>
                  <span>❌</span>
                  <span>{lang === 'vi' ? 'Mất hàng giờ sửa lỗi dấu chấm phẩy (;), ngoặc nhọn ({}), thư viện không tương thích.' : 'Hours spent fixing syntax typos, missing semicolons & broken packages.'}</span>
                </li>
                <li>
                  <span>❌</span>
                  <span>{lang === 'vi' ? 'Chỉ dành cho dân kỹ sư chuyên ngành công nghệ thông tin.' : 'Limited strictly to professional software engineers.'}</span>
                </li>
              </ul>
            </div>

            <div className="vbe-compare-card new">
              <div className="vbe-compare-header new">
                <span>🚀</span>
                <span>{lang === 'vi' ? 'VIBE CODING THỜI ĐẠI AI (MỚI)' : 'VIBE CODING ERA (NEW)'}</span>
              </div>
              <ul className="vbe-compare-list">
                <li>
                  <span>✅</span>
                  <span>{lang === 'vi' ? 'Chỉ cần diễn đạt ý tưởng bằng tiếng Việt tự nhiên (ví dụ: "Tạo web bán trà sữa có đổi màu tối").' : 'Explain your ideas in plain human language to AI agents.'}</span>
                </li>
                <li>
                  <span>✅</span>
                  <span>{lang === 'vi' ? 'Chỉ 30 - 60 giây là có ngay ứng dụng, game hoặc website chạy thật trên máy.' : 'Build working apps, games, or sites in 30-60 seconds.'}</span>
                </li>
                <li>
                  <span>✅</span>
                  <span>{lang === 'vi' ? 'Bất kỳ ai (học sinh, designer, marketing, doanh chủ) đều làm chủ phần mềm!' : 'Anyone (students, designers, marketers, founders) can create software!'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mẹo Vibe Coding */}
          <div className="vbe-tips-row">
            <div className="vbe-tip-item">
              <strong>🎯 1. Rõ ràng về mong muốn</strong>
              <p>{lang === 'vi' ? 'Miêu tả cụ thể màu sắc, các nút bấm và hành động khi người dùng click vào.' : 'Describe buttons, colors, and user interactions specifically.'}</p>
            </div>
            <div className="vbe-tip-item">
              <strong>🪜 2. Đi từng bước nhỏ</strong>
              <p>{lang === 'vi' ? 'Bảo AI làm giao diện trước, sau đó mới thêm các tính năng nâng cao tiếp theo.' : 'Ask AI to generate UI first, then add deeper features step by step.'}</p>
            </div>
            <div className="vbe-tip-item">
              <strong>⚡ 3. Dùng Vibe Rules chuẩn</strong>
              <p>{lang === 'vi' ? 'Dán file .cursorrules từ GitXplore vào để AI code chuẩn kiến trúc, không bị lỗi vặt.' : 'Use verified .cursorrules from GitXplore to keep AI output spotless.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: VIDEO NGẮN MINH HỌA (TIKTOK / YOUTUBE / REELS) ===== */}
      {activeTab === 'videos' && (
        <div className="vbe-panel">
          <div className="vbe-videos-intro">
            <h3>🎬 {lang === 'vi' ? 'Video Ngắn Thực Tế: Xem Cách Vibe Coding Hoạt Động Trong 60 Giây' : 'Short Video Clips: Watch Vibe Coding in Action'}</h3>
            <p>{lang === 'vi' ? 'Tuyển tập các clip viral trên TikTok, YouTube Shorts và Facebook Reels giúp bạn hình dung lập trình bằng trò chuyện AI diễn ra như thế nào.' : 'Curated short viral clips from TikTok, YouTube & Facebook showcasing rapid AI development.'}</p>
          </div>

          <div className="vbe-videos-grid">
            {VIBE_VIDEOS.map((vid) => (
              <div key={vid.id} className="vbe-video-card">
                <div
                  className="vbe-video-thumb"
                  style={{ backgroundImage: `url(${vid.thumb})` }}
                  onClick={() => setPlayingVideo(vid)}
                >
                  <span className={`vbe-platform-badge ${vid.platform}`}>
                    {vid.platform === 'youtube' && '▶ YouTube'}
                    {vid.platform === 'tiktok' && '🎵 TikTok'}
                    {vid.platform === 'facebook' && '📘 Facebook'}
                  </span>
                  <div className="vbe-play-icon">▶</div>
                  <span className="vbe-duration-tag">{vid.duration}</span>
                </div>

                <div className="vbe-video-body">
                  <div className="vbe-video-title">{vid.title}</div>
                  <div className="vbe-video-desc">{vid.desc}</div>
                  <div className="vbe-video-footer">
                    <span className="vbe-video-views">{vid.views}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="vbe-video-link-btn"
                        onClick={() => setPlayingVideo(vid)}
                      >
                        👁️ {lang === 'vi' ? 'Xem clip' : 'Watch'}
                      </button>
                      <a
                        href={vid.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vbe-video-link-btn"
                        title={lang === 'vi' ? 'Mở trên ứng dụng gốc' : 'Open in app'}
                      >
                        ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 3: 5 VIBE CODE TEST NHANH CHO NGƯỜI MỚI ===== */}
      {activeTab === 'starters' && (
        <div className="vbe-panel">
          <div className="vbe-starters-intro">
            <h3>🧪 {lang === 'vi' ? '5 Mẫu Vibe Code Đơn Giản Cho Người Mới Bắt Đầu Test Ngay' : '5 Beginner Vibe Code Starters to Test Instantly'}</h3>
            <p>
              {lang === 'vi'
                ? 'Không cần cài đặt bất cứ thứ gì! Bấm nút "▶️ Chạy thử ngay" để mở Sandbox tương tác 120 FPS trên trình duyệt, hoặc bấm "📋 Sao chép Prompt" để mang sang Cursor / Claude / ChatGPT.'
                : 'Zero setup needed! Click "▶️ Run Sandbox" to launch live interactive apps, or copy the prompt for Cursor / Claude.'}
            </p>
          </div>

          <div className="vbe-starters-grid">
            {STARTER_VIBES.map((item) => (
              <div key={item.id} className="vbe-starter-card">
                <div className="vbe-starter-top">
                  <div className="vbe-starter-icon">{item.icon}</div>
                  <div className="vbe-starter-meta">
                    <div className="vbe-starter-title">{item.title}</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="vbe-starter-badge">{item.category}</span>
                      <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>• {item.level}</span>
                    </div>
                  </div>
                </div>

                <div className="vbe-starter-desc">{item.desc}</div>

                <div className="vbe-prompt-preview-box">
                  <div className="vbe-prompt-label">
                    <span>💬</span>
                    <span>{lang === 'vi' ? 'CÂU LỆNH PROMPT VIBE MẪU:' : 'STARTER VIBE PROMPT:'}</span>
                  </div>
                  <div className="vbe-prompt-text">{item.prompt}</div>
                </div>

                <div className="vbe-starter-actions">
                  <button
                    type="button"
                    className="vbe-btn-run"
                    onClick={() => openPlayground(item.templateId)}
                  >
                    <span>▶️</span>
                    <span>{lang === 'vi' ? 'Chạy thử Sandbox' : 'Run Live Sandbox'}</span>
                  </button>

                  <button
                    type="button"
                    className="vbe-btn-copy"
                    onClick={() => handleCopyPrompt(item.prompt)}
                    title={lang === 'vi' ? 'Sao chép Prompt này' : 'Copy prompt'}
                  >
                    <span>📋</span>
                    <span>{lang === 'vi' ? 'Copy Prompt' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 4: QUY TRÌNH 3 BƯỚC ===== */}
      {activeTab === 'workflow' && (
        <div className="vbe-panel">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.35)' }}>
              <div style={{ color: '#10b981', fontWeight: 800, fontSize: '12px', marginBottom: '6px', letterSpacing: '0.8px' }}>
                {lang === 'vi' ? 'BƯỚC 1: CÀI TRÌNH SOẠN THẢO AI' : 'STEP 1: INSTALL AI EDITOR'}
              </div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>
                {lang === 'vi' ? 'Tải Cursor IDE (cursor.com), Windsurf hoặc dùng VS Code kèm tiện ích Claude Code / GitHub Copilot.' : 'Download Cursor IDE, Windsurf or VS Code with Claude Code extension.'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.35)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '12px', marginBottom: '6px', letterSpacing: '0.8px' }}>
                {lang === 'vi' ? 'BƯỚC 2: SAO CHÉP RULE (.cursorrules)' : 'STEP 2: COPY RULE (.cursorrules)'}
              </div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>
                {lang === 'vi' ? 'Chọn 1 thẻ mẫu chuyên ngành bên dưới kho GitXplore và bấm nút ⚡ Sao chép Rule hoặc tải ZIP trọn gói.' : 'Select a verified template below and click ⚡ Copy Rule or download the ZIP bundle.'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.35)' }}>
              <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '12px', marginBottom: '6px', letterSpacing: '0.8px' }}>
                {lang === 'vi' ? 'BƯỚC 3: DÁN VÀO DỰ ÁN & RA LỆNH' : 'STEP 3: PASTE & PROMPT'}
              </div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>
                {lang === 'vi' ? 'Tạo file .cursorrules ở thư mục gốc dự án và bắt đầu chat bằng tiếng Việt để AI tự sinh mã nguồn!' : 'Create .cursorrules at project root and prompt naturally with AI to generate full code!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== VIDEO POPUP MODAL ===== */}
      {playingVideo && (
        <div className="vbe-modal-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="vbe-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="vbe-modal-header">
              <div className="vbe-modal-title">
                <span>🎬</span>
                <span>{playingVideo.title}</span>
              </div>
              <button
                type="button"
                className="vbe-modal-close"
                onClick={() => setPlayingVideo(null)}
              >
                ✕
              </button>
            </div>

            <div className="vbe-modal-body">
              <iframe
                src={playingVideo.embedUrl}
                title={playingVideo.title}
                className="vbe-modal-iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="vbe-modal-footer">
              <p>{playingVideo.desc}</p>
              <a
                href={playingVideo.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vbe-modal-ext-link"
              >
                <span>{lang === 'vi' ? 'Xem trên ứng dụng gốc' : 'Open in app'}</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="vbe-toast">
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
