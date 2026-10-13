import { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { playTing, playSuccess } from '../utils/soundEffects';
import { showToast } from './ToastNotice';
import { PLAYGROUND_TEMPLATES } from '../data/playgroundTemplates';
import './VibeWizard.css';

const APP_TYPES = [
  {
    id: 'store',
    icon: '🛍️',
    titleVi: 'Trang Bán Hàng & Menu',
    titleEn: 'Store & Menu Landing',
    descVi: 'Quán cà phê, tiệm bánh, thời trang có giỏ hàng và đặt món',
    descEn: 'Cafe, bakery, fashion shop with shopping cart & ordering',
    defaultName: 'Tiệm Cà Phê Cyber Chill',
  },
  {
    id: 'game',
    icon: '🎮',
    titleVi: 'Game 2D Nhẹ Vui Nhộn',
    titleEn: 'Fun 2D Mini Game',
    descVi: 'Rắn săn mồi Neon, Flappy Bird, Xếp gạch có tính điểm',
    descEn: 'Neon Snake, Flappy Bird, Tetris with score system',
    defaultName: 'Rắn Săn Mồi Ánh Sáng Neon',
  },
  {
    id: 'portfolio',
    icon: '💼',
    titleVi: 'Trang Cá Nhân / CV Số',
    titleEn: 'Portfolio & Bio Link',
    descVi: 'Hồ sơ nghề nghiệp, giới thiệu năng lực, link mạng xã hội',
    descEn: 'Personal bio, skill showcase, social links & contact',
    defaultName: 'Portfolio Lập Trình Viên Sáng Tạo',
  },
  {
    id: 'utility',
    icon: '⚡',
    titleVi: 'Tiện Ích & Năng Suất',
    titleEn: 'Productivity Utility',
    descVi: 'Đồng hồ Pomodoro, Quản lý việc cần làm (To-Do), Máy tính',
    descEn: 'Pomodoro timer, To-Do manager, smart calculator',
    defaultName: 'Trợ Thủ Quản Lý Mục Tiêu Kính Mờ',
  },
  {
    id: 'bot',
    icon: '🤖',
    titleVi: 'AI Chatbot & Trợ Lý',
    titleEn: 'AI Chatbot Assistant',
    descVi: 'Khung chat trả lời tự động, tư vấn sản phẩm thân thiện',
    descEn: 'Interactive chatbot interface with smart auto-replies',
    defaultName: 'Trợ Lý Tư Vấn Tự Động 24/7',
  },
];

const FEATURE_OPTIONS = [
  { id: 'darkmode', labelVi: '🌙 Chế độ Sáng / Tối (Dark & Light Mode)', labelEn: '🌙 Dark & Light Mode toggle' },
  { id: 'responsive', labelVi: '📱 Tương thích mượt mà Điện thoại & Tablet', labelEn: '📱 Mobile & Tablet Responsive' },
  { id: 'zalo', labelVi: '📲 Nút liên hệ đặt hàng qua Zalo / Hotline', labelEn: '📲 Direct WhatsApp / Hotline action button' },
  { id: 'animation', labelVi: '✨ Hiệu ứng chuyển động & hạt phát sáng', labelEn: '✨ Smooth animations & glowing particles' },
  { id: 'storage', labelVi: '💾 Tự động lưu trên máy (không mất khi tải lại)', labelEn: '💾 Auto-save data to LocalStorage' },
  { id: 'sound', labelVi: '🔔 Âm thanh báo hiệu vui tai khi tương tác', labelEn: '🔔 Pleasant sound feedback on interactions' },
];

export default function VibeWizard() {
  const { lang } = useLanguage();
  const { openPlayground } = useUI();
  const isVi = lang === 'vi';

  const [selectedType, setSelectedType] = useState('store');
  const [customName, setCustomName] = useState('Tiệm Cà Phê Cyber Chill');
  const [selectedFeatures, setSelectedFeatures] = useState(['darkmode', 'responsive', 'animation', 'storage']);
  const [copied, setCopied] = useState(false);

  const handleSelectType = (item) => {
    setSelectedType(item.id);
    setCustomName(item.defaultName);
  };

  const toggleFeature = (fId) => {
    setSelectedFeatures((prev) =>
      prev.includes(fId) ? prev.filter((id) => id !== fId) : [...prev, fId]
    );
  };

  const generatedPrompt = useMemo(() => {
    const typeObj = APP_TYPES.find((t) => t.id === selectedType) || APP_TYPES[0];
    const featLabels = selectedFeatures
      .map((fId) => {
        const feat = FEATURE_OPTIONS.find((f) => f.id === fId);
        return isVi ? feat?.labelVi : feat?.labelEn;
      })
      .filter(Boolean)
      .join(', ');

    if (isVi) {
      return `Hãy tạo cho tôi một ứng dụng web hoàn chỉnh có tên là "${customName || typeObj.titleVi}" thuộc thể loại ${typeObj.titleVi}.

Yêu cầu kỹ thuật & Giao diện:
1. Giao diện hiện đại, tinh tế phong cách Glassmorphism với viền mảnh phát sáng.
2. Các tính năng chính cần có:
   - ${featLabels || 'Giao diện trực quan, thân thiện'}
3. Toàn bộ mã nguồn viết sạch trong một file duy nhất (HTML5, Tailwind CSS, JavaScript hiện đại) để tôi có thể mở trực tiếp trên trình duyệt hoặc chạy trong Sandbox.
4. Có dữ liệu mẫu phong phú và các tương tác bấm nút mượt mà, không giật lag.`;
    }

    return `Create a complete web application named "${customName || typeObj.titleEn}" in the category of ${typeObj.titleEn}.

Requirements:
1. Modern, ultra-clean Glassmorphism aesthetics with subtle glowing borders.
2. Key features included:
   - ${featLabels || 'Intuitive and smooth user interface'}
3. Production-ready, standalone code (HTML5, Tailwind CSS, modern JavaScript) that runs immediately in browser or sandbox.
4. Rich sample mock data and 60fps micro-interactions.`;
  }, [selectedType, customName, selectedFeatures, isVi]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      playTing();
      showToast(
        isVi ? '📋 Đã sao chép câu lệnh Vibe Prompt thành công!' : '📋 Vibe Prompt copied to clipboard!',
        '⚡',
        'success'
      );
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleDownloadZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const typeObj = APP_TYPES.find((t) => t.id === selectedType) || APP_TYPES[0];
      const templateKey = selectedType === 'store' ? 'cafe' : selectedType === 'game' ? 'snake' : 'todo';
      const tmpl = PLAYGROUND_TEMPLATES.find((t) => t.id === templateKey) || PLAYGROUND_TEMPLATES[0];

      const slug = (customName || typeObj.defaultName)
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-');

      // 1. index.html
      zip.file('index.html', tmpl.code || `<!DOCTYPE html><html><head><title>${customName}</title></head><body><h1>${customName}</h1></body></html>`);

      // 2. .cursorrules
      const cursorRulesContent = `# Cursor Rules for ${customName} (${typeObj.titleVi})
You are an expert AI software engineer building a high-performance web application.

## Project Vision:
- Name: ${customName || typeObj.defaultName}
- Category: ${typeObj.titleVi} (${typeObj.titleEn})

## Architecture & Code Guidelines:
1. Tech Stack: Modern HTML5, Tailwind CSS / Vanilla CSS, Modern ES6+ JavaScript.
2. Design Style: High-tech Glassmorphism with obsidian dark background (#090505), golden amber (#f59e0b) and ruby red (#ef4444) accents.
3. Keep code modular, accessible, 60fps responsive for both Mobile and Desktop.
4. Auto-persist state to localStorage where appropriate.
`;
      zip.file('.cursorrules', cursorRulesContent);

      // 3. README.md
      const readmeContent = `# ${customName || typeObj.defaultName}

Ứng dụng được tạo bởi **GitXplore Vibe Wizard (Vibe Coding)**.

## 🚀 Cách chạy thử:
1. Mở file \`index.html\` trực tiếp trên bất kỳ trình duyệt nào (Chrome, Safari, Edge, Firefox).
2. Không cần cài đặt Node.js hay môi trường phát triển phức tạp!

## 🪄 Cách phát triển tiếp bằng AI (Cursor / ChatGPT / Claude):
- Mở thư mục này trong **Cursor IDE** hoặc **VS Code**.
- File \`.cursorrules\` đã được cấu hình sẵn để AI hiểu rõ luật và phong cách của dự án.
- Sử dụng prompt sau để ra lệnh cho AI mở rộng tính năng:

> "${generatedPrompt}"

---
Tạo bởi GitXplore — Khám phá Mã Nguồn Mở & Tự Tạo Ứng Dụng Với AI.
`;
      zip.file('README.md', readmeContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug || 'gitxplore-project'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      playSuccess();
      showToast(
        isVi ? '📦 Đã tải trọn bộ mã nguồn (.zip) thành công!' : '📦 Project .zip downloaded successfully!',
        '🚀',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(isVi ? 'Không thể tạo file zip, vui lòng thử lại.' : 'Could not generate zip file.', '⚠️', 'error');
    }
  };

  const handleDownloadCursorRules = () => {
    try {
      const typeObj = APP_TYPES.find((t) => t.id === selectedType) || APP_TYPES[0];
      const cursorRulesContent = `# Cursor Rules for ${customName || typeObj.defaultName}
You are an expert AI software engineer.

## Goal:
Build and enhance: "${customName || typeObj.defaultName}"

## Vibe Coding Prompt:
${generatedPrompt}

## Rules:
- Clean standalone code
- Responsive design
- Beautiful dark theme glassmorphism
`;
      const blob = new Blob([cursorRulesContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '.cursorrules';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      playTing();
      showToast(
        isVi ? '📄 Đã tải file .cursorrules về máy!' : '📄 .cursorrules downloaded!',
        '✨',
        'success'
      );
    } catch {
      // fallback
    }
  };

  return (
    <div className="vwz-wrapper">
      <div className="vwz-header">
        <div className="vwz-badge">
          <span>🪄</span>
          <span>{isVi ? 'TRÌNH TẠO Ý TƯỞNG VIBE 3 BƯỚC' : '3-STEP INTERACTIVE VIBE WIZARD'}</span>
        </div>
        <h3 className="vwz-title">
          {isVi
            ? 'Ai cũng có thể tạo phần mềm: Chọn ý tưởng và nhận Prompt trong 10 giây'
            : 'Anyone can build software: Pick an idea and get your Prompt in 10s'}
        </h3>
        <p className="vwz-desc">
          {isVi
            ? 'Không cần nhớ từ ngữ lập trình phức tạp. Hãy chọn món bạn thích, tích chọn tính năng và để AI lo toàn bộ phần còn lại!'
            : 'No technical jargon required. Choose your app type, toggle features, and let AI build it for you!'}
        </p>
      </div>

      <div className="vwz-steps-grid">
        {/* BƯỚC 1: CHỌN LOẠI APP */}
        <div className="vwz-step-card">
          <div className="vwz-step-num">
            <span>1</span>
            <h4>{isVi ? 'Chọn Loại Ứng Dụng' : 'Pick App Category'}</h4>
          </div>
          <div className="vwz-types-list">
            {APP_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`vwz-type-btn ${selectedType === item.id ? 'is-active' : ''}`}
                onClick={() => handleSelectType(item)}
              >
                <span className="vwz-type-icon">{item.icon}</span>
                <div className="vwz-type-info">
                  <div className="vwz-type-name">{isVi ? item.titleVi : item.titleEn}</div>
                  <div className="vwz-type-sub">{isVi ? item.descVi : item.descEn}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BƯỚC 2: TÙY BIẾN TÍNH NĂNG */}
        <div className="vwz-step-card">
          <div className="vwz-step-num">
            <span>2</span>
            <h4>{isVi ? 'Đặt Tên & Chọn Tính Năng' : 'Name & Features'}</h4>
          </div>

          <div className="vwz-input-group">
            <label>{isVi ? 'Tên sản phẩm của bạn:' : 'Your Project Name:'}</label>
            <input
              type="text"
              className="vwz-text-input"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={isVi ? 'Ví dụ: Tiệm Trà Sữa Sakura...' : 'e.g. Sakura Milk Tea Hub...'}
            />
          </div>

          <div className="vwz-features-box">
            <label className="vwz-features-label">
              {isVi ? 'Tích chọn các tính năng mong muốn:' : 'Check desired features:'}
            </label>
            <div className="vwz-checkbox-grid">
              {FEATURE_OPTIONS.map((feat) => {
                const checked = selectedFeatures.includes(feat.id);
                return (
                  <label
                    key={feat.id}
                    className={`vwz-checkbox-pill ${checked ? 'is-checked' : ''}`}
                    onClick={() => toggleFeature(feat.id)}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                    />
                    <span>{isVi ? feat.labelVi : feat.labelEn}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BƯỚC 3: NHẬN PROMPT & HÀNH ĐỘNG */}
      <div className="vwz-result-card">
        <div className="vwz-result-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#fef08a' }}>
                {isVi ? 'Bước 3: Câu Lệnh AI (Vibe Prompt) Của Bạn Đã Sẵn Sàng!' : 'Step 3: Your Ready-to-Run Vibe Prompt is Ready!'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {isVi ? 'Tải mã nguồn về máy, copy vào ChatGPT / Cursor hoặc chạy thử trực tiếp trong Sandbox' : 'Download project code, copy to ChatGPT / Cursor, or test live in Sandbox'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="vwz-copy-btn"
              onClick={handleDownloadZip}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: '#10b981',
                color: '#ffffff',
              }}
              title={isVi ? 'Tải trọn bộ mã nguồn chạy ngay dạng .zip' : 'Download complete runnable project as .zip'}
            >
              <span>📦</span>
              <span>{isVi ? 'Tải Code (.zip)' : 'Download .zip'}</span>
            </button>

            <button
              type="button"
              className="vwz-copy-btn"
              onClick={handleDownloadCursorRules}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                borderColor: 'rgba(56, 189, 248, 0.45)',
                color: '#7dd3fc',
              }}
              title={isVi ? 'Tải file cấu hình .cursorrules cho Cursor IDE' : 'Download .cursorrules for Cursor IDE'}
            >
              <span>📄</span>
              <span>{isVi ? 'Tải .cursorrules' : '.cursorrules'}</span>
            </button>

            <button
              type="button"
              className="vwz-copy-btn"
              onClick={handleCopy}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? (isVi ? 'Đã Sao Chép!' : 'Copied!') : (isVi ? 'Sao Chép Prompt' : 'Copy Prompt')}</span>
            </button>
          </div>
        </div>

        <pre className="vwz-prompt-preview">
          <code>{generatedPrompt}</code>
        </pre>

        <div className="vwz-action-dock">
          <button
            type="button"
            className="vwz-dock-btn is-sandbox"
            onClick={() => openPlayground(selectedType === 'store' ? 'cafe' : selectedType === 'game' ? 'snake' : 'todo')}
          >
            <span>⚡</span>
            <span>{isVi ? 'Chạy Thử Ngay Trong Sandbox Trực Tiếp' : 'Test Live in Sandbox Simulator'}</span>
          </button>

          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="vwz-dock-btn is-external"
            onClick={handleCopy}
          >
            <span>🤖</span>
            <span>{isVi ? 'Mở ChatGPT Để Dán Code ↗' : 'Open ChatGPT & Paste ↗'}</span>
          </a>

          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="vwz-dock-btn is-external"
            onClick={handleCopy}
          >
            <span>✨</span>
            <span>{isVi ? 'Mở Claude AI ↗' : 'Open Claude AI ↗'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
