import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './WelcomeOnboardingModal.css';

export default function WelcomeOnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const { t, lang, setLang, languages } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [userMode, setUserMode] = useState('newbie'); // 'newbie' | 'dev'
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleFinish = () => {
    try {
      if (user?.identifier) {
        localStorage.setItem(`gx_onboard_done_${user.identifier}`, 'true');
      }
      localStorage.setItem('gx_onboard_done_global', 'true');
    } catch {}
    onClose();
    if (userMode === 'newbie') {
      setTimeout(() => {
        const el = document.getElementById('beginner-guide');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const goTo = (path) => {
    handleFinish();
    navigate(path);
  };

  return createPortal(
    <div className="ob-modal-overlay" role="dialog" aria-modal="true" aria-label="Hướng dẫn chào mừng" data-lenis-prevent="true">
      <div className="ob-modal-card" data-lenis-prevent="true">
        {/* Header with Step Indicator */}
        <div className="ob-modal-header">
          <div className="ob-brand-badge">
            <span className="ob-brand-icon">⚡</span>
            <span className="ob-brand-title">GITXPLORE • DEVELOPER PLATFORM</span>
          </div>

          <div className="ob-steps-indicator">
            <span className={`ob-step-dot ${step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}`} />
            <span className={`ob-step-dot ${step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}`} />
            <span className={`ob-step-dot ${step === 3 ? 'is-active' : ''}`} />
          </div>

          <button type="button" className="ob-close-btn" onClick={handleFinish} title="Đóng hướng dẫn">
            ✕
          </button>
        </div>

        {/* Content for Step 1: Welcome & Mission */}
        {step === 1 && (
          <div className="ob-step-content">
            <div className="ob-hero-visual">
              <span className="ob-visual-emoji">👋</span>
            </div>

            <h2 className="ob-title">
              {t('ob_step_1_title')}
            </h2>
            <p className="ob-desc">
              {t('ob_step_1_sub')}
            </p>

            {/* Quick Persona Selector */}
            <div style={{ display: 'flex', gap: '8px', margin: '0 0 16px', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => setUserMode('newbie')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  background: userMode === 'newbie' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: userMode === 'newbie' ? '#ffffff' : '#9ca3af',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🌱</span> {lang === 'vi' ? 'Người mới muốn tìm hiểu' : 'Beginner Explorer'}
              </button>
              <button
                type="button"
                onClick={() => setUserMode('dev')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  background: userMode === 'dev' ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : 'transparent',
                  color: userMode === 'dev' ? '#ffffff' : '#9ca3af',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡</span> {lang === 'vi' ? 'Lập trình viên / Pro' : 'Developer / Pro'}
              </button>
            </div>

            <div className="ob-highlights-grid">
              {userMode === 'newbie' ? (
                <>
                  <div className="ob-highlight-card">
                    <span className="ob-hl-icon">🎁</span>
                    <div>
                      <strong>{lang === 'vi' ? 'Kho báu phần mềm miễn phí' : 'Free Software Vault'}</strong>
                      <p>{lang === 'vi' ? 'Hàng triệu công cụ, phần mềm đỉnh cao thay thế Office/Photoshop không tốn một đồng.' : 'High-quality free tools and apps without subscriptions.'}</p>
                    </div>
                  </div>
                  <div className="ob-highlight-card">
                    <span className="ob-hl-icon">🤖</span>
                    <div>
                      <strong>{lang === 'vi' ? 'Trợ lý AI hướng dẫn 24/7' : '24/7 AI Companion'}</strong>
                      <p>{lang === 'vi' ? 'Không cần biết code, Trợ lý Arisu giải thích công nghệ bằng ngôn ngữ bình dân gần gũi.' : 'Ask Arisu anything in plain language with zero technical barrier.'}</p>
                    </div>
                  </div>
                  <div className="ob-highlight-card">
                    <span className="ob-hl-icon">🌱</span>
                    <div>
                      <strong>{lang === 'vi' ? 'Tự học từ con số 0' : 'Learn from Scratch'}</strong>
                      <p>{lang === 'vi' ? 'Khám phá Vibe Coding: Tự làm website bằng cách trò chuyện với AI!' : 'Discover Vibe Coding: Build products simply by prompting AI!'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="ob-highlight-card">
                    <span className="ob-hl-icon">⚡</span>
                    <div>
                      <strong>{t('ob_step_1_card1_t')}</strong>
                      <p>{t('ob_step_1_card1_d')}</p>
                    </div>
                  </div>
                  <div className="ob-highlight-card">
                    <span className="ob-hl-icon">🤖</span>
                    <div>
                      <strong>{t('ob_step_1_card2_t')}</strong>
                      <p>{t('ob_step_1_card2_d')}</p>
                    </div>
                  </div>
                  <div className="ob-highlight-card">
                    <span className="ob-hl-icon">🤝</span>
                    <div>
                      <strong>{t('ob_step_1_card3_t')}</strong>
                      <p>{t('ob_step_1_card3_d')}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Content for Step 2: Core Map Tour */}
        {step === 2 && (
          <div className="ob-step-content">
            <h2 className="ob-title">{t('ob_step_2_title')}</h2>
            <p className="ob-desc">
              {t('ob_step_2_sub')}
            </p>

            <div className="ob-tour-list">
              {userMode === 'newbie' && (
                <div className="ob-tour-item" onClick={() => goTo('/')}>
                  <span className="ob-tour-icon is-emerald">🌱</span>
                  <div className="ob-tour-text">
                    <strong>{lang === 'vi' ? 'Nhập môn trong 3 phút' : '3-Minute Crash Course'}</strong>
                    <p>{lang === 'vi' ? 'Tìm hiểu Mã nguồn mở & Vibe Coding ngay tại Trang chủ.' : 'Explore Open Source & Vibe Coding on Home.'}</p>
                  </div>
                  <span className="ob-tour-arrow">›</span>
                </div>
              )}
              <div className="ob-tour-item" onClick={() => goTo('/')}>
                <span className="ob-tour-icon is-amber">🏠</span>
                <div className="ob-tour-text">
                  <strong>{t('ui_home')} — {t('stat_repos')}</strong>
                  <p>3D Welcome Parallax, {t('all_repos')}, {t('search_placeholder')}.</p>
                </div>
                <span className="ob-tour-arrow">›</span>
              </div>

              <div className="ob-tour-item" onClick={() => goTo('/vibe')}>
                <span className="ob-tour-icon is-purple">⚡</span>
                <div className="ob-tour-text">
                  <strong>Vibe — {t('vfb_title_prefix')}{t('vfb_title_highlight')}</strong>
                  <p>aitmpl.com Skills, Autonomous Agents, Slash Commands, MCPs.</p>
                </div>
                <span className="ob-tour-arrow">›</span>
              </div>

              <div className="ob-tour-item" onClick={() => goTo('/news')}>
                <span className="ob-tour-icon is-blue">📰</span>
                <div className="ob-tour-text">
                  <strong>{t('news')} — 24/7</strong>
                  <p>GitHub Trending, Hacker News, Dev.to & Reddit RSS.</p>
                </div>
                <span className="ob-tour-arrow">›</span>
              </div>

              <div className="ob-tour-item" onClick={() => goTo('/community')}>
                <span className="ob-tour-icon is-emerald">💬</span>
                <div className="ob-tour-text">
                  <strong>{t('community')} & {t('ui_forum')}</strong>
                  <p>{t('ui_dock_comm_desc')}, {t('notif_tab_friends')}.</p>
                </div>
                <span className="ob-tour-arrow">›</span>
              </div>

              <div className="ob-tour-item" onClick={() => goTo('/accountscenter')}>
                <span className="ob-tour-icon is-red">🛡️</span>
                <div className="ob-tour-text">
                  <strong>{t('acc_title')} — {t('acc_settings')}</strong>
                  <p>{t('acc_sec_title')}, {t('acc_conn_title')}, {t('acc_perm_title')}.</p>
                </div>
                <span className="ob-tour-arrow">›</span>
              </div>
            </div>
          </div>
        )}

        {/* Content for Step 3: Quick Setup & Start */}
        {step === 3 && (
          <div className="ob-step-content">
            <div className="ob-hero-visual">
              <span className="ob-visual-emoji">🚀</span>
            </div>

            <h2 className="ob-title">{t('ob_step_3_title')}</h2>
            <p className="ob-desc">
              {t('ob_step_3_sub')}
            </p>

            <div className="ob-lang-grid">
              {languages.slice(0, 6).map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`ob-lang-btn ${lang === item.code ? 'is-active' : ''}`}
                  onClick={() => setLang(item.code)}
                >
                  <span className="ob-lang-flag">{item.flag}</span>
                  <span className="ob-lang-name">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="ob-tip-box">
              <span className="ob-tip-bulb">💡</span>
              <p>
                <strong>Tip:</strong> {t('ob_step_1_card3_t')} (🔔) — {t('ob_step_1_card3_d')}
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="ob-modal-footer">
          <label className="ob-checkbox-wrap">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>{t('ob_dont_show')}</span>
          </label>

          <div className="ob-footer-btns">
            {step > 1 && (
              <button
                type="button"
                className="ob-btn ob-btn-back"
                onClick={() => setStep((s) => s - 1)}
              >
                {t('ob_back')}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="ob-btn ob-btn-next"
                onClick={() => setStep((s) => s + 1)}
              >
                {t('ob_next')}
              </button>
            ) : (
              <button
                type="button"
                className="ob-btn ob-btn-finish"
                onClick={handleFinish}
              >
                {t('ob_start')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
