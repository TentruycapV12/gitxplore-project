import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './WelcomeOnboardingModal.css';

export default function WelcomeOnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const { t, lang, setLang, languages } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleFinish = () => {
    if (dontShowAgain && user?.identifier) {
      localStorage.setItem(`gx_onboard_done_${user.identifier}`, 'true');
    }
    localStorage.setItem('gx_onboard_done_global', 'true');
    onClose();
  };

  const goTo = (path) => {
    handleFinish();
    navigate(path);
  };

  return (
    <div className="ob-modal-overlay" role="dialog" aria-modal="true" aria-label="Hướng dẫn chào mừng">
      <div className="ob-modal-card">
        {/* Header with Step Indicator */}
        <div className="ob-modal-header">
          <div className="ob-brand-badge">
            <span className="ob-brand-icon">N</span>
            <span className="ob-brand-title">NOTOSAN • GITXPLORE</span>
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

            <div className="ob-highlights-grid">
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
    </div>
  );
}
