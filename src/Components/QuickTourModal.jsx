import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { playPop, playSuccess } from '../utils/soundEffects';
import { showToast } from './ToastNotice';
import './QuickTourModal.css';

const TOUR_STEPS = [
  {
    step: 1,
    icon: '🚀',
    badgeVi: 'BƯỚC 1 / 3: TRẢI NGHIỆM TRƯỚC HẾT',
    badgeEn: 'STEP 1 / 3: TRY REAL APPS FIRST',
    titleVi: 'Khám Phá App Với Nhãn "Live Demo"',
    titleEn: 'Discover Apps with "Live Demo"',
    descVi: 'Không cần biết lập trình, không cần cài đặt phần mềm phức tạp. Bạn có thể bấm dùng thử trực tiếp các ứng dụng hữu ích ngay trên trình duyệt!',
    descEn: 'Zero coding required, zero setup. Test-drive fully functional open-source web apps right in your browser!',
    tipVi: '💡 Mẹo: Tìm các thẻ dự án có nhãn màu xanh lá "Dùng thử ngay (Live Demo)".',
    tipEn: '💡 Tip: Look for project cards with the green "Live Demo" badge.',
    ctaVi: 'Xem thử dự án Live Demo ↓',
    ctaEn: 'Explore Live Demo projects ↓',
    action: 'scroll-demo',
  },
  {
    step: 2,
    icon: '🪄',
    badgeVi: 'BƯỚC 2 / 3: TỰ TAY SÁNG TẠO',
    badgeEn: 'STEP 2 / 3: CREATE WITH AI',
    titleVi: 'Vibe Coding & Lộ Trình 15 Phút',
    titleEn: 'Vibe Coding & 15-Minute Quest',
    descVi: 'Chỉ cần chọn loại app (Bán hàng, Mini game, Quản lý việc...) trong Vibe Wizard, nhận câu lệnh chuẩn và chạy thử ngay trong Sandbox ảo!',
    descEn: 'Pick an app idea (Store, Mini Game, To-Do) in Vibe Wizard, get a battle-tested prompt, and test live in the Simulator Sandbox!',
    tipVi: '💡 Mẹo: Hoàn thành 6 bài học ngắn tại GitXplore Academy để nhận bằng tốt nghiệp.',
    tipEn: '💡 Tip: Complete 6 bite-sized quests at GitXplore Academy to get your graduation badge.',
    ctaVi: 'Khám phá Vibe Hub ↗',
    ctaEn: 'Explore Vibe Hub ↗',
    action: 'goto-vibe',
  },
  {
    step: 3,
    icon: '🤖',
    badgeVi: 'BƯỚC 3 / 3: TRỢ GIÚP MỌI LÚC',
    badgeEn: 'STEP 3 / 3: ALWAYS HERE TO HELP',
    titleVi: 'Arisu — Trợ Lý AI Dành Cho Người Mới',
    titleEn: 'Arisu — Your Friendly Beginner AI',
    descVi: 'Thấy thuật ngữ khó hiểu? Cần gợi ý ý tưởng? Hãy bấm vào Arisu ở góc dưới màn hình. Arisu sẽ giải thích ngắn gọn, súc tích như một người bạn.',
    descEn: 'Confused by jargon? Need app ideas? Tap Arisu at the bottom right. She explains everything simply like a real friend.',
    tipVi: '💡 Mẹo: Bấm các câu hỏi gợi ý sẵn có để nhận câu trả lời ngay lập tức.',
    tipEn: '💡 Tip: Click any starter question chip for instant, zero-stress answers.',
    ctaVi: 'Hoàn tất & Khám phá ngay! 🚀',
    ctaEn: 'Finish & Start Exploring! 🚀',
    action: 'finish',
  },
];

export default function QuickTourModal({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isVi = lang === 'vi';

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentIndex];
  const isLast = currentIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    playPop();
    if (isLast) {
      handleFinish();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    playPop();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    playSuccess();
    showToast(isVi ? '🎉 Chúc mừng bạn đã hoàn tất Tour khám phá!' : '🎉 Tour completed! Welcome aboard!', '🚀', 'success');
    if (typeof window !== 'undefined') {
      localStorage.setItem('gx_quick_tour_seen', 'true');
    }
    onClose();
  };

  const handleAction = () => {
    if (currentStep.action === 'scroll-demo') {
      onClose();
      const el = document.getElementById('project-grid') || document.getElementById('beginner-guide');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (currentStep.action === 'goto-vibe') {
      onClose();
      navigate('/vibe');
    } else {
      handleFinish();
    }
  };

  return (
    <div className="qtm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qtm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="qtm-close-btn"
          onClick={onClose}
          aria-label="Đóng tour"
        >
          ✕
        </button>

        <div className="qtm-body">
          <div className="qtm-icon-wrap">
            <span className="qtm-icon">{currentStep.icon}</span>
          </div>

          <div className="qtm-badge">
            {isVi ? currentStep.badgeVi : currentStep.badgeEn}
          </div>

          <h3 className="qtm-title">
            {isVi ? currentStep.titleVi : currentStep.titleEn}
          </h3>

          <p className="qtm-desc">
            {isVi ? currentStep.descVi : currentStep.descEn}
          </p>

          <div className="qtm-tip">
            {isVi ? currentStep.tipVi : currentStep.tipEn}
          </div>

          {/* Stepper Dots */}
          <div className="qtm-dots">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.step}
                type="button"
                className={`qtm-dot ${idx === currentIndex ? 'is-active' : ''}`}
                onClick={() => {
                  playPop();
                  setCurrentIndex(idx);
                }}
                aria-label={`Bước ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Row */}
          <div className="qtm-actions">
            {currentStep.action !== 'finish' && (
              <button
                type="button"
                className="qtm-btn-feature"
                onClick={handleAction}
              >
                {isVi ? currentStep.ctaVi : currentStep.ctaEn}
              </button>
            )}

            <div className="qtm-nav-buttons">
              {currentIndex > 0 && (
                <button
                  type="button"
                  className="qtm-btn-secondary"
                  onClick={handlePrev}
                >
                  {isVi ? '◂ Quay lại' : '◂ Back'}
                </button>
              )}
              <button
                type="button"
                className="qtm-btn-primary"
                onClick={handleNext}
              >
                {isLast ? (isVi ? 'Hoàn tất & Khám phá 🚀' : 'Finish 🚀') : (isVi ? 'Tiếp theo ▸' : 'Next ▸')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
