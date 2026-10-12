import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { playTing, playSuccess } from '../utils/soundEffects';
import ConfettiEffect from './ConfettiEffect';
import { showToast } from './ToastNotice';
import './GitXploreAcademy.css';

const ACADEMY_STORAGE_KEY = 'gx_academy_completed_lessons';

const ACADEMY_CHAPTERS = [
  {
    id: 'ch1',
    number: '01',
    badge: '3 PHÚT',
    badgeColor: '#10b981',
    titleVi: 'Chặng 1: Nhập Môn Mã Nguồn Mở',
    titleEn: 'Chapter 1: Open Source Essentials',
    descVi: 'Khám phá tại sao phần mềm miễn phí lại mạnh mẽ và an toàn hơn ứng dụng có phí',
    descEn: 'Discover why free open-source software outperforms paid tools',
    lessons: [
      {
        id: 'l1',
        titleVi: 'Mã Nguồn Mở là gì? Tại sao người ta chia sẻ miễn phí?',
        titleEn: 'What is Open Source? Why is it shared 100% free?',
        durationVi: '2 phút đọc',
        durationEn: '2 mins read',
        summaryVi: 'Hãy tưởng tượng hàng triệu đầu bếp giỏi nhất hành tinh cùng nhau chia sẻ công thức nấu ăn ngon nhất hoàn toàn miễn phí. Bất kỳ ai cũng có thể vào xem, lấy về nấu và cải tiến cho riêng mình mà không phải trả tiền bản quyền! Đó chính là Mã Nguồn Mở (Open Source).',
        summaryEn: 'Imagine the world’s greatest chefs publishing their best recipes 100% free for everyone to cook, tweak, and enjoy without royalty fees. That is Open Source!',
        keyPointsVi: [
          'Miễn phí 100% vĩnh viễn: Không sợ bị đòi tiền thuê bao hàng tháng.',
          'Bảo mật và an toàn: Hàng ngàn chuyên gia cùng soi code nên không có mã độc ẩn giấu.',
          'Mọi công nghệ lớn (Android, Chrome, Linux) đều chạy trên mã nguồn mở.',
        ],
        keyPointsEn: [
          '100% permanently free: Zero monthly subscription traps.',
          'Secure & audited: Thousands of global engineers inspect the code.',
          'Powering modern tech: Android, Chrome, and Linux run on open source.',
        ],
        actionType: 'ask_arisu',
        actionLabelVi: '💬 Nhờ Arisu kể 3 app mã nguồn mở nổi tiếng nhất',
        actionLabelEn: '💬 Ask Arisu: "Name 3 top open-source apps"',
        actionQuery: 'Kể cho mình 3 phần mềm mã nguồn mở nổi tiếng và hữu ích nhất thế giới cho người mới bắt đầu',
      },
      {
        id: 'l2',
        titleVi: 'Cách tìm ứng dụng thay thế app đắt đỏ và dùng thử ngay',
        titleEn: 'How to replace expensive software with free apps',
        durationVi: '1 phút đọc',
        durationEn: '1 min read',
        summaryVi: 'Trên GitXplore, các dự án có gắn nhãn màu xanh "● DÙNG THỬ NGAY" nghĩa là bạn không cần cài đặt gì vào máy. Chỉ cần 1 cú click là có thể mở ngay bản web chạy thật để trải nghiệm.',
        summaryEn: 'On GitXplore, projects featuring the green "● LIVE DEMO" badge run instantly in your browser with zero installation needed.',
        keyPointsVi: [
          'Blender thay thế các phần mềm đồ họa 3D giá hàng nghìn USD.',
          'GIMP & Krita thay thế Photoshop bản quyền đắt đỏ.',
          'Ollama cho phép chạy AI thông minh riêng tư trên máy không tốn phí.',
        ],
        keyPointsEn: [
          'Blender replaces expensive $1,000+ 3D modeling tools.',
          'GIMP & Krita replace costly Adobe Photoshop subscriptions.',
          'Ollama lets you run private offline AI without monthly fees.',
        ],
        actionType: 'scroll_explore',
        actionLabelVi: '🚀 Xem danh sách ứng dụng có bản dùng thử ngay ↓',
        actionLabelEn: '🚀 View apps with instant live demos ↓',
      },
    ],
  },
  {
    id: 'ch2',
    number: '02',
    badge: '5 PHÚT',
    badgeColor: '#f59e0b',
    titleVi: 'Chặng 2: Chỉ Đạo AI & Vibe Coding',
    titleEn: 'Chapter 2: Vibe Coding Mastery',
    descVi: 'Tư duy làm "Sếp công nghệ" — chỉ cần nói ý tưởng, AI sẽ viết toàn bộ code',
    descEn: 'Think like a Tech Leader — you describe the vision, AI writes the code',
    lessons: [
      {
        id: 'l3',
        titleVi: 'Tư duy Vibe Coding: Ra lệnh cho AI như một người sếp',
        titleEn: 'Vibe Coding Mindset: Prompting AI like a Boss',
        durationVi: '2 phút đọc',
        durationEn: '2 mins read',
        summaryVi: 'Bạn không cần ghi nhớ cú pháp code. Bạn chỉ cần giữ ý tưởng và ra lệnh cho AI giống như một vị sếp giao việc cho cấp dưới: 1. Mục tiêu là gì? 2. Giao diện trông thế nào? 3. Khi bấm vào nút thì chuyện gì xảy ra?',
        summaryEn: 'You do not memorize syntax. You maintain the creative vibe and direct AI like a manager: 1. What is the goal? 2. How does the UI look? 3. What happens when a button is clicked?',
        keyPointsVi: [
          'Luôn nói rõ đối tượng sử dụng và phong cách giao diện (ví dụ: Glassmorphism, Dark mode).',
          'Chia nhỏ từng bước: Làm giao diện trước, sau đó mới gắn thêm tính năng.',
          'Dùng các file quy tắc chuẩn (.cursorrules) để AI không bao giờ bị lạc đề.',
        ],
        keyPointsEn: [
          'Clearly define user persona and visual aesthetic (e.g. Glassmorphism, Dark mode).',
          'Iterate in small steps: Generate the visual layout first, then add actions.',
          'Equip standardized rules (.cursorrules) so the AI never hallucinates.',
        ],
        actionType: 'open_vibe',
        actionLabelVi: '⚡ Ghé thăm trung tâm Vibe Coding của GitXplore ↗',
        actionLabelEn: '⚡ Visit GitXplore Vibe Coding Hub ↗',
      },
      {
        id: 'l4',
        titleVi: 'Bộ 3 công cụ AI miễn phí tốt nhất để bắt đầu',
        titleEn: 'Top 3 Free AI Tools to kickstart your journey',
        durationVi: '3 phút đọc',
        durationEn: '3 mins read',
        summaryVi: 'Để bắt đầu làm app bằng AI, bạn chỉ cần một trong 3 công cụ này: ChatGPT (chat nhanh ý tưởng), Claude (viết code giao diện đẹp nhất), hoặc Cursor IDE (trình soạn thảo thông minh nhất hiện nay).',
        summaryEn: 'To build apps with AI, start with either: ChatGPT (rapid ideation), Claude (gorgeous UI code), or Cursor IDE (the ultimate AI code editor).',
        keyPointsVi: [
          'Cursor IDE: Tải miễn phí tại cursor.com, cho phép bạn chat trực tiếp trong file code.',
          'Claude / ChatGPT: Mở trên trình duyệt, dán Prompt mẫu từ GitXplore vào là có code ngay.',
          'Vibe Sandbox trên GitXplore: Chạy thử và sửa code trực tiếp mà không cần cài đặt phần mềm nào.',
        ],
        keyPointsEn: [
          'Cursor IDE: Free download at cursor.com, lets you code by conversational chat.',
          'Claude / ChatGPT: Open in browser, paste prompts from GitXplore for instant code.',
          'GitXplore Sandbox: Live test and edit code in 1-click without installing software.',
        ],
        actionType: 'open_sandbox',
        actionLabelVi: '🧪 Mở trình giả lập Vibe Sandbox dùng thử 1-chạm ⚡',
        actionLabelEn: '🧪 Open live Vibe Sandbox simulator ⚡',
      },
    ],
  },
  {
    id: 'ch3',
    number: '03',
    badge: '7 PHÚT',
    badgeColor: '#38bdf8',
    titleVi: 'Chặng 3: Xuất Xưởng Ứng Dụng Đầu Tay',
    titleEn: 'Chapter 3: Ship Your First App',
    descVi: 'Tự tay tạo ra một trang web mang tên mình và chia sẻ link cho bạn bè xem',
    descEn: 'Build your own custom web app and share the live link with friends',
    lessons: [
      {
        id: 'l5',
        titleVi: 'Dùng Vibe Wizard trên GitXplore tạo Prompt hoàn chỉnh',
        titleEn: 'Use GitXplore Vibe Wizard to generate complete prompts',
        durationVi: '3 phút thực hành',
        durationEn: '3 mins practice',
        summaryVi: 'Trình tạo ý tưởng 3 bước (Vibe Wizard) của GitXplore được thiết kế để bạn chỉ cần: 1. Chọn loại app (web bán hàng, game 2D, to-do list), 2. Tích chọn tính năng mong muốn, 3. Bấm nút là có ngay câu lệnh AI hoàn hảo!',
        summaryEn: 'GitXplore’s 3-Step Vibe Wizard enables you to: 1. Pick an app type, 2. Check desired features, 3. Generate a production-ready AI prompt in seconds!',
        keyPointsVi: [
          'Tự động tích hợp phong cách kính mờ Glassmorphism cao cấp.',
          'Tự động cấu hình tính năng Dark Mode và tối ưu trên điện thoại.',
          'Xuất ra câu lệnh tiếng Việt chuẩn chỉnh, chỉ việc copy và dán.',
        ],
        keyPointsEn: [
          'Automatically embeds luxury Glassmorphism UI aesthetics.',
          'Includes mobile responsiveness and dark mode toggles.',
          'Generates complete, self-contained single-file apps.',
        ],
        actionType: 'open_wizard',
        actionLabelVi: '🪄 Mở Trình Tạo Ý Tưởng 3 Bước (Vibe Wizard) ngay ⚡',
        actionLabelEn: '🪄 Launch 3-Step Vibe Wizard now ⚡',
      },
      {
        id: 'l6',
        titleVi: 'Đưa website lên Internet miễn phí để gửi cho bạn bè xem',
        titleEn: 'Deploy your web app online for free to share with friends',
        durationVi: '4 phút thực hành',
        durationEn: '4 mins practice',
        summaryVi: 'Sau khi AI tạo xong code HTML/React, bạn có thể đưa lên mạng trong vòng 60 giây bằng các dịch vụ lưu trữ miễn phí như Vercel, Netlify hoặc GitHub Pages. Bạn sẽ nhận được một đường link (ví dụ: my-cool-app.vercel.app) để gửi cho bất kỳ ai!',
        summaryEn: 'Once your AI generates the code, publish it in 60 seconds using free cloud hosting like Vercel, Netlify, or GitHub Pages to get your own public link (e.g. my-app.vercel.app)!',
        keyPointsVi: [
          'Vercel & Netlify: Miễn phí vĩnh viễn cho dự án cá nhân, tốc độ tải siêu nhanh.',
          'Không cần mua tên miền hay thuê máy chủ tốn tiền.',
          'Tự hào chia sẻ thành phẩm đầu tay do chính bạn chỉ đạo AI làm ra!',
        ],
        keyPointsEn: [
          'Vercel & Netlify: 100% permanently free for personal projects with CDN speeds.',
          'Zero domain fees, zero hosting costs.',
          'Proudly share a real working web app that you directed AI to create!',
        ],
        actionType: 'ask_arisu_deploy',
        actionLabelVi: '🤖 Hỏi Arisu: "Cách đưa web lên Vercel miễn phí"',
        actionLabelEn: '🤖 Ask Arisu: "How to deploy web on Vercel for free"',
        actionQuery: 'Hướng dẫn mình cách đưa trang web vừa làm bằng AI lên mạng miễn phí bằng Vercel hoặc Netlify để gửi link cho bạn bè xem với',
      },
    ],
  },
];

export default function GitXploreAcademy() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { openPlayground } = useUI();
  const isVi = lang === 'vi';

  const [activeLesson, setActiveLesson] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem(ACADEMY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleComplete = (lessonId) => {
    setCompletedLessons((prev) => {
      const isAlreadyDone = prev.includes(lessonId);
      const updated = isAlreadyDone
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(updated));

      if (!isAlreadyDone) {
        if (updated.length === 6) {
          playSuccess();
          setShowConfetti(true);
          showToast(
            isVi
              ? '🏆 Chúc mừng bạn đã tốt nghiệp xuất sắc GitXplore Academy!'
              : '🏆 Congratulations on graduating GitXplore Academy!',
            '🎓',
            'success'
          );
        } else {
          playTing();
          showToast(
            isVi
              ? `✓ Đã hoàn thành nhiệm vụ! (${updated.length}/6)`
              : `✓ Quest completed! (${updated.length}/6)`,
            '✨',
            'info'
          );
        }
      }
      return updated;
    });
  };

  const progressPercent = Math.round((completedLessons.length / 6) * 100);

  const handleAction = (lesson) => {
    if (lesson.actionType === 'ask_arisu' || lesson.actionType === 'ask_arisu_deploy') {
      window.dispatchEvent(
        new CustomEvent('open-arisu-ai', {
          detail: { query: lesson.actionQuery },
        })
      );
    } else if (lesson.actionType === 'scroll_explore') {
      const el = document.getElementById('explore');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (lesson.actionType === 'open_vibe') {
      navigate('/vibe');
    } else if (lesson.actionType === 'open_sandbox') {
      openPlayground('cafe');
    } else if (lesson.actionType === 'open_wizard') {
      navigate('/vibe');
    }
  };

  return (
    <div className="gxa-container">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header & Progress */}
      <div className="gxa-header">
        <div className="gxa-badge-wrap">
          <span className="gxa-badge">
            <span>🎓</span>
            <span>{isVi ? 'GITXPLORE ACADEMY • HỌC VIỆN THỰC CHIẾN 15 PHÚT' : 'GITXPLORE ACADEMY • 15-MIN CRASH COURSE'}</span>
          </span>
        </div>

        <h3 className="gxa-title">
          {isVi
            ? 'Từ Số 0 Đến Tạo Ra Trang Web & Ứng Dụng Đầu Tay Bằng AI'
            : 'From Zero to Building Your First Web App with AI'}
        </h3>
        <p className="gxa-sub">
          {isVi
            ? 'Không cần biết viết code! Mỗi bài chỉ mất 2–3 phút đọc và thực hành ngay trên web. Hoàn thành 3 chặng để xuất xưởng sản phẩm đầu tay khoe bạn bè!'
            : 'Zero coding background needed! Bite-sized 2-minute actionable quests. Complete all 3 chapters to deploy your first live project!'}
        </p>

        {/* Progress Tracker Bar */}
        <div className="gxa-progress-card">
          <div className="gxa-progress-top">
            <div className="gxa-progress-info">
              <span>🚀 {isVi ? 'Tiến độ học tập:' : 'Your Progress:'}</span>
              <strong>{completedLessons.length}/6 {isVi ? 'bài hoàn thành' : 'lessons completed'} ({progressPercent}%)</strong>
            </div>
            {progressPercent === 100 && (
              <button
                type="button"
                className="gxa-badge-complete"
                onClick={() => {
                  playSuccess();
                  setShowConfetti(true);
                  showToast(
                    isVi ? '🏆 Vinh danh: Bạn đã nắm trọn bí kíp tạo app bằng AI!' : '🏆 Honors: You mastered AI app creation!',
                    '🎓',
                    'success'
                  );
                }}
                title={isVi ? 'Bấm để ăn mừng tốt nghiệp!' : 'Click to celebrate!'}
              >
                🏆 {isVi ? 'ĐÃ TỐT NGHIỆP XUẤT SẮC!' : 'GRADUATION UNLOCKED!'}
              </button>
            )}
          </div>
          <div className="gxa-progress-bar-bg">
            <div
              className="gxa-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="gxa-chapters-grid">
        {ACADEMY_CHAPTERS.map((chapter) => (
          <div key={chapter.id} className="gxa-chapter-card">
            <div className="gxa-chapter-header">
              <span className="gxa-chapter-num" style={{ borderColor: chapter.badgeColor, color: chapter.badgeColor }}>
                {chapter.number}
              </span>
              <div>
                <div className="gxa-chapter-tag" style={{ background: `${chapter.badgeColor}22`, color: chapter.badgeColor }}>
                  ⏱️ {chapter.badge}
                </div>
                <h4 className="gxa-chapter-title">{isVi ? chapter.titleVi : chapter.titleEn}</h4>
              </div>
            </div>
            <p className="gxa-chapter-desc">{isVi ? chapter.descVi : chapter.descEn}</p>

            {/* Lessons List */}
            <div className="gxa-lessons-list">
              {chapter.lessons.map((lesson) => {
                const isDone = completedLessons.includes(lesson.id);
                const isOpened = activeLesson?.id === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    className={`gxa-lesson-item ${isDone ? 'is-done' : ''} ${isOpened ? 'is-open' : ''}`}
                  >
                    <div className="gxa-lesson-main" onClick={() => setActiveLesson(isOpened ? null : lesson)}>
                      <button
                        type="button"
                        className={`gxa-check-btn ${isDone ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(lesson.id);
                        }}
                        title={isDone ? (isVi ? 'Bỏ đánh dấu' : 'Unmark') : (isVi ? 'Đánh dấu đã học' : 'Mark as done')}
                      >
                        {isDone ? '✓' : '○'}
                      </button>

                      <div className="gxa-lesson-info">
                        <div className="gxa-lesson-title">
                          {isVi ? lesson.titleVi : lesson.titleEn}
                        </div>
                        <div className="gxa-lesson-time">
                          <span>⏱️ {isVi ? lesson.durationVi : lesson.durationEn}</span>
                          <span className="gxa-lesson-toggle">{isOpened ? '▲ Thu gọn' : '▼ Xem chi tiết'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Reader */}
                    {isOpened && (
                      <div className="gxa-lesson-detail">
                        <p className="gxa-summary">
                          {isVi ? lesson.summaryVi : lesson.summaryEn}
                        </p>

                        <div className="gxa-keypoints">
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#fef08a', marginBottom: '6px' }}>
                            💡 {isVi ? 'Điểm cốt lõi cần nhớ:' : 'Key Takeaways:'}
                          </div>
                          <ul>
                            {(isVi ? lesson.keyPointsVi : lesson.keyPointsEn).map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="gxa-detail-actions">
                          <button
                            type="button"
                            className="gxa-act-btn"
                            onClick={() => handleAction(lesson)}
                          >
                            {isVi ? lesson.actionLabelVi : lesson.actionLabelEn}
                          </button>

                          <button
                            type="button"
                            className={`gxa-mark-btn ${isDone ? 'done' : ''}`}
                            onClick={() => toggleComplete(lesson.id)}
                          >
                            {isDone ? (isVi ? '✓ Đã hoàn thành' : '✓ Completed') : (isVi ? '○ Đánh dấu xong bài' : '○ Mark complete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
