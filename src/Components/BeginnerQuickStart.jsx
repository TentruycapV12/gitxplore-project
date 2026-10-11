import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './BeginnerQuickStart.css';

export default function BeginnerQuickStart() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const handleAskArisu = (question) => {
    window.dispatchEvent(
      new CustomEvent('open-arisu-ai', {
        detail: { query: question }
      })
    );
  };

  const handleExploreBeginner = () => {
    const el = document.getElementById('explore');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bqs-section" id="beginner-guide" aria-label="3 Phút Nhập Môn">
      <div className="bqs-glow-top" />
      <div className="bqs-inner">
        {/* Header */}
        <div className="bqs-header">
          <div className="bqs-badge">
            <span className="bqs-badge-icon">🌱</span>
            <span>{t('bqs_badge')}</span>
          </div>

          <h2 className="bqs-title">
            {t('bqs_title')}
          </h2>

          <p className="bqs-desc">
            {t('bqs_desc')}
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="bqs-cards-grid">
          {/* Card 1 */}
          <div className="bqs-card">
            <div className="bqs-card-icon-wrap is-gold">
              <span className="bqs-card-emoji">🎁</span>
            </div>
            <h3 className="bqs-card-title">{t('bqs_c1_title')}</h3>
            <p className="bqs-card-text">{t('bqs_c1_desc')}</p>
            <div className="bqs-card-meta">
              <span className="bqs-card-pill">100% Miễn phí</span>
              <span className="bqs-card-pill">Không bản quyền</span>
            </div>
            <button
              type="button"
              className="bqs-card-btn"
              onClick={() => handleAskArisu(lang === 'vi' ? 'Mã nguồn mở là gì? Giải thích siêu đơn giản cho người chưa biết code với!' : 'What is open source? Explain simply for beginners!')}
            >
              💬 Hỏi Arisu chi tiết ▸
            </button>
          </div>

          {/* Card 2 */}
          <div className="bqs-card">
            <div className="bqs-card-icon-wrap is-emerald">
              <span className="bqs-card-emoji">🚀</span>
            </div>
            <h3 className="bqs-card-title">{t('bqs_c2_title')}</h3>
            <p className="bqs-card-text">{t('bqs_c2_desc')}</p>
            <div className="bqs-card-meta">
              <span className="bqs-card-pill">App dùng ngay</span>
              <span className="bqs-card-pill">Tự học từ số 0</span>
            </div>
            <button
              type="button"
              className="bqs-card-btn"
              onClick={handleExploreBeginner}
            >
              🛠️ Xem dự án dễ hiểu ↓
            </button>
          </div>

          {/* Card 3 */}
          <div className="bqs-card">
            <div className="bqs-card-icon-wrap is-blue">
              <span className="bqs-card-emoji">💡</span>
            </div>
            <h3 className="bqs-card-title">{t('bqs_c3_title')}</h3>
            <p className="bqs-card-text">{t('bqs_c3_desc')}</p>
            <div className="bqs-card-meta">
              <span className="bqs-card-pill">Lập trình bằng AI</span>
              <span className="bqs-card-pill">Nói ý tưởng = Có App</span>
            </div>
            <button
              type="button"
              className="bqs-card-btn is-highlight"
              onClick={() => navigate('/vibe')}
            >
              ⚡ Khám phá Vibe Hub ↗
            </button>
          </div>
        </div>

        {/* Friendly Action Banner */}
        <div className="bqs-banner">
          <div className="bqs-banner-info">
            <span className="bqs-banner-avatar">🤖</span>
            <div>
              <strong>
                {lang === 'vi' ? 'Bạn vẫn còn nhiều băn khoăn?' : 'Have more questions?'}
              </strong>
              <p>
                {lang === 'vi'
                  ? 'Trợ lý AI Arisu luôn túc trực ở góc màn hình để hướng dẫn bạn từng bước một, không phán xét, không từ ngữ khó hiểu!'
                  : 'AI Assistant Arisu is ready to guide you step-by-step with zero technical elitism!'}
              </p>
            </div>
          </div>
          <div className="bqs-banner-actions">
            <button
              type="button"
              className="bqs-btn-primary"
              onClick={() => handleAskArisu(lang === 'vi' ? 'Tôi là người mới, hãy hướng dẫn tôi cách sử dụng trang web này từ đầu!' : 'I am new, guide me how to use this website!')}
            >
              {t('bqs_btn_arisu')}
            </button>
            <button
              type="button"
              className="bqs-btn-secondary"
              onClick={handleExploreBeginner}
            >
              {t('bqs_btn_explore')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
