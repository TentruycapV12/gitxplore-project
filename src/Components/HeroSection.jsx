import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { scrollToId } from '../lib/scroll';
import TopNav from './TopNav.jsx';
import './HeroSection.css';

export default function HeroSection() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isVi = lang === 'vi';

  // Interactive Card Tab: 'prompt' | 'sandbox' | 'arisu'
  const [activeTab, setActiveTab] = useState('prompt');
  const [copied, setCopied] = useState(false);

  const samplePrompt = isVi
    ? 'Tạo game Rắn Săn Mồi Neon Cyberpunk bằng HTML5 Canvas, có tính điểm, âm thanh vui tai và điều khiển phím mũi tên.'
    : 'Build a Neon Cyberpunk Snake Game using HTML5 Canvas with score tracking, sound effects, and arrow key controls.';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(samplePrompt).then(() => {
      setCopied(true);
      // Phát âm thanh ting nhẹ nhàng nếu audio context khả dụng
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch {
        /* audio block/mute */
      }
      setTimeout(() => setCopied(false), 2400);
    });
  };

  const handleAskArisu = (question) => {
    window.dispatchEvent(
      new CustomEvent('open-arisu-ai', {
        detail: { query: question }
      })
    );
  };

  const handleOpenTour = () => {
    window.dispatchEvent(new CustomEvent('open-quick-tour'));
  };

  return (
    <section className="hero-wrap" aria-label="Hero Section">
      {/* 1. Ambient Background Lighting & Tech Grid (0 byte image assets) */}
      <div className="hero-bg-lights">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>
      <div className="hero-grid-pattern" />
      <div className="hero-horizon-glow" />

      {/* 2. Top Navigation Bar */}
      <TopNav />

      {/* 3. Main Hero Content (2 Columns Grid) */}
      <div className="hero-container">
        {/* Left Column: Heading, Subtitle & Action CTAs */}
        <div className="hero-left">
          {/* Badge Pill */}
          <div className="hero-badge-pill">
            <span className="hero-badge-dot" />
            <span>
              {isVi
                ? '✨ NỀN TẢNG MÃ NGUỒN MỞ THẾ HỆ MỚI • AI & VIBE CODING'
                : '✨ NEXT-GEN OPEN SOURCE • AI & VIBE CODING PLATFORM'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="hero-heading">
            {isVi ? 'KHÁM PHÁ MÃ NGUỒN MỞ' : 'EXPLORE OPEN SOURCE'}
            <span className="hero-gradient-text">
              {isVi ? 'TỰ TẠO APP VỚI AI' : 'BUILD APPS WITH AI'}
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="hero-description">
            {isVi
              ? 'Trải nghiệm hơn 50+ ứng dụng thực tế với Live Demo ngay trên trình duyệt mà không cần cài đặt. Tự động sinh mã nguồn bằng Prompt cùng Vibe Hub và học tập 24/7 cùng Trợ lý AI Arisu.'
              : 'Explore 50+ curated open-source projects with zero-setup Live Demos. Generate code from plain ideas with Vibe Hub and learn effortlessly with AI Companion Arisu.'}
          </p>

          {/* CTA Action Buttons */}
          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-btn-primary"
              onClick={() => scrollToId('beginner-guide')}
              title={isVi ? 'Nhập môn trong 3 phút' : '3-Minute Crash Course'}
            >
              <span>🌱</span>
              <span>{isVi ? '3 Phút Nhập Môn ↓' : '3-Min Crash Course ↓'}</span>
            </button>

            <button
              type="button"
              className="hero-btn-secondary"
              onClick={() => navigate('/vibe')}
              title={isVi ? 'Tự tạo ứng dụng tại Vibe Hub' : 'Build Apps in Vibe Hub'}
            >
              <span>⚡</span>
              <span>{isVi ? 'Tự Làm App (Vibe Hub) ↗' : 'Build App (Vibe Hub) ↗'}</span>
            </button>

            <button
              type="button"
              className="hero-btn-tour"
              onClick={handleOpenTour}
              title={isVi ? 'Dạo quanh trang web trong 30 giây' : '30-second guided tour'}
            >
              <span>🧭</span>
              <span>{isVi ? 'Tour 30 Giây' : '30s Tour'}</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToId('explore')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#fcd34d',
                padding: '13px 20px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
            >
              <span>🚀</span>
              <span>{isVi ? 'Live Demo ↓' : 'Live Demos ↓'}</span>
            </button>
          </div>

          {/* Trust Metrics Bar */}
          <div className="hero-metrics">
            <div className="hero-metric-item">
              <span className="hero-metric-val">50+</span>
              <span>{isVi ? 'Kho Mã Nguồn' : 'Curated Repos'}</span>
            </div>
            <span style={{ opacity: 0.3 }}>•</span>
            <div className="hero-metric-item">
              <span className="hero-metric-val">1-Click</span>
              <span>{isVi ? 'Live Demo Sandbox' : 'Live Sandboxes'}</span>
            </div>
            <span style={{ opacity: 0.3 }}>•</span>
            <div className="hero-metric-item">
              <span className="hero-metric-val">AI Agent</span>
              <span>{isVi ? 'Trợ lý Arisu' : 'Arisu Companion'}</span>
            </div>
            <span style={{ opacity: 0.3 }}>•</span>
            <div className="hero-metric-item">
              <span className="hero-metric-val">100% Free</span>
              <span>{isVi ? 'Mã Nguồn Mở' : 'Open Source'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive High-Tech Studio Mockup Card */}
        <div className="hero-right">
          <div className="hero-mockup-card">
            {/* Window Top Bar */}
            <div className="hero-card-header">
              <div className="hero-window-dots">
                <span className="hero-dot red" />
                <span className="hero-dot yellow" />
                <span className="hero-dot green" />
              </div>

              <div className="hero-window-title">
                <span>⚡ GitXplore Studio</span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>v2.5</span>
              </div>

              <div className="hero-live-badge">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Switcher Tabs */}
            <div className="hero-tabs-dock">
              <button
                type="button"
                className={`hero-tab-btn ${activeTab === 'prompt' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('prompt')}
              >
                <span>⚡</span>
                <span>{isVi ? 'Vibe Prompt' : 'Vibe Prompt'}</span>
              </button>

              <button
                type="button"
                className={`hero-tab-btn ${activeTab === 'sandbox' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('sandbox')}
              >
                <span>💻</span>
                <span>{isVi ? 'Live Sandbox' : 'Live Sandbox'}</span>
              </button>

              <button
                type="button"
                className={`hero-tab-btn ${activeTab === 'arisu' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('arisu')}
              >
                <span>🤖</span>
                <span>{isVi ? 'Trợ Lý Arisu' : 'Arisu AI'}</span>
              </button>
            </div>

            {/* Card Body by Tab */}
            <div className="hero-card-body">
              {activeTab === 'prompt' && (
                <div>
                  <div className="hero-prompt-preview">
                    <div className="hero-prompt-label">
                      <span>✨ PROMPT SPECIFICATION</span>
                      <span style={{ opacity: 0.5, fontSize: '10px' }}>(One-Click Copy)</span>
                    </div>
                    <p className="hero-prompt-text">
                      "{samplePrompt}"
                    </p>
                  </div>

                  <div className="hero-prompt-actions">
                    <button
                      type="button"
                      className="hero-action-copy"
                      onClick={handleCopyPrompt}
                    >
                      <span>{copied ? '✅' : '📋'}</span>
                      <span>{copied ? (isVi ? 'Đã sao chép!' : 'Copied!') : (isVi ? 'Sao Chép Prompt' : 'Copy Prompt')}</span>
                    </button>

                    <button
                      type="button"
                      className="hero-action-launch"
                      onClick={() => navigate('/vibe')}
                    >
                      <span>🚀</span>
                      <span>{isVi ? 'Tạo Tại Vibe Hub ↗' : 'Open Vibe Hub ↗'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'sandbox' && (
                <div>
                  <div className="hero-sandbox-preview">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.5px' }}>
                        ● HTML5 CANVAS ENGINE
                      </span>
                      <span style={{ fontSize: '11px', color: '#6ee7b7' }}>60 FPS • Isolated Iframe</span>
                    </div>

                    <div className="hero-sandbox-display">
                      <div className="hero-neon-box" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ color: '#00ffcc', fontWeight: 700, fontSize: '13px' }}>
                          Neon Cyberpunk Studio
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '11.5px', marginTop: '2px' }}>
                          {isVi ? 'Chạy trực tiếp trong trình duyệt' : 'Running directly in browser'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="hero-action-copy"
                      style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                      onClick={() => scrollToId('explore')}
                    >
                      <span>🔍</span>
                      <span>{isVi ? 'Khám Phá 50+ Live Demo Ở Dưới ↓' : 'Explore 50+ Demos Below ↓'}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'arisu' && (
                <div>
                  <div className="hero-arisu-view">
                    <div className="hero-arisu-avatar">
                      <span>🤖</span>
                    </div>
                    <p className="hero-arisu-bubble">
                      {isVi
                        ? 'Chào bạn! Mình là Arisu, cố vấn AI của GitXplore. Bấm vào câu hỏi dưới để mình hướng dẫn bạn nhé!'
                        : "Hi! I am Arisu, your GitXplore AI guide. Click any question below and let's get started!"}
                    </p>
                  </div>

                  <div className="hero-arisu-quick-prompts">
                    <button
                      type="button"
                      className="hero-arisu-chip"
                      onClick={() => handleAskArisu(isVi ? 'Làm sao để tạo website bằng AI khi không biết code?' : 'How can I build a web app using AI with zero coding experience?')}
                    >
                      💬 {isVi ? '1. "Làm sao tự tạo web bằng AI khi không biết code?"' : '1. "How to build apps with AI without coding?"'}
                    </button>
                    <button
                      type="button"
                      className="hero-arisu-chip"
                      onClick={() => handleAskArisu(isVi ? 'Gợi ý các dự án mã nguồn mở hay nhất cho người mới bắt đầu' : 'Recommend the best open-source projects for beginners')}
                    >
                      💬 {isVi ? '2. "Gợi ý dự án mã nguồn mở hay nhất cho người mới"' : '2. "Recommend best repos for beginners"'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copy Toast Indicator */}
      {copied && (
        <div className="hero-toast">
          <span>🎉</span>
          <span>{isVi ? 'Đã sao chép Prompt vào bộ nhớ tạm!' : 'Prompt copied to clipboard!'}</span>
        </div>
      )}
    </section>
  );
}
