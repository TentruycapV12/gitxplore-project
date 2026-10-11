import { useState, useEffect, useRef } from 'react';
import { PLAYGROUND_TEMPLATES } from '../data/playgroundTemplates';
import './VibePlaygroundModal.css';

export default function VibePlaygroundModal({ initialTemplateId, onClose }) {
  const initial = PLAYGROUND_TEMPLATES.find((t) => t.id === initialTemplateId) || PLAYGROUND_TEMPLATES[0];
  const [activeTemplate, setActiveTemplate] = useState(initial);
  const [code, setCode] = useState(initial.code);
  const [userPrompt, setUserPrompt] = useState(initial.prompt);
  const [device, setDevice] = useState('desktop');
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectTemplate = (tmpl) => {
    setActiveTemplate(tmpl);
    setCode(tmpl.code);
    setUserPrompt(tmpl.prompt);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTemplate.id}_vibe_app.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyPrompt = () => {
    if (!userPrompt.trim()) return;
    setIsApplying(true);
    setTimeout(() => {
      let updated = code;
      const p = userPrompt.toLowerCase();

      // Thông minh: Phân tích nhanh ý định người dùng và tiêm mã tương ứng
      if (p.includes('đỏ') || p.includes('red')) {
        updated = updated.replace(/#00ffcc|#f59e0b|#6366f1/g, '#ef4444');
      } else if (p.includes('xanh') || p.includes('cyan') || p.includes('blue')) {
        updated = updated.replace(/#f59e0b|#ff007f/g, '#00ffcc');
      } else if (p.includes('tím') || p.includes('purple')) {
        updated = updated.replace(/#f59e0b|#00ffcc/g, '#c084fc');
      } else if (p.includes('tuyết') || p.includes('snow')) {
        updated = updated.replace('</body>', '<div style="position:fixed;top:10px;right:10px;font-size:24px;">❄️❄️</div></body>');
      } else {
        // Tinh chỉnh tiêu đề hoặc giao diện chung
        updated = updated.replace(/(<h1>|<title>)(.*?)(<\/h1>|<\/title>)/gi, `$1$2 (Vibe AI Mod)$3`);
      }

      setCode(updated);
      setIsApplying(false);
    }, 400);
  };

  return (
    <div className="vibe-play-overlay" onClick={onClose}>
      <div className="vibe-play-box" onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className="vp-header">
          <div className="vp-header-left">
            <div className="vp-logo-icon">⚡</div>
            <div>
              <h2 className="vp-title">VIBE CODING PLAYGROUND</h2>
              <span className="vp-badge">● Live 120 FPS Sandbox</span>
            </div>
          </div>

          <div className="vp-header-right">
            <button type="button" className="vp-btn vp-btn--secondary" onClick={handleCopy}>
              {copied ? '✓ Đã sao chép' : '⧉ Sao chép code'}
            </button>
            <button type="button" className="vp-btn vp-btn--secondary" onClick={handleDownload}>
              📥 Xuất file HTML
            </button>
            <button type="button" className="vp-close-btn" onClick={onClose} title="Đóng Sandbox">
              ✕
            </button>
          </div>
        </div>

        {/* ===== TEMPLATES BAR ===== */}
        <div className="vp-templates-bar">
          <span className="vp-templates-label">TEMPLATES MẪU:</span>
          {PLAYGROUND_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              className={`vp-template-chip ${activeTemplate.id === tmpl.id ? 'is-active' : ''}`}
              onClick={() => selectTemplate(tmpl)}
            >
              {tmpl.title}
            </button>
          ))}
        </div>

        {/* ===== PROMPT BAR ===== */}
        <div className="vp-prompt-bar">
          <input
            type="text"
            className="vp-prompt-input"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Gõ prompt Vibe của bạn (VD: đổi màu sang tím neon, thêm hiệu ứng tuyết rơi)..."
          />
          <button
            type="button"
            className="vp-btn vp-btn--primary"
            onClick={handleApplyPrompt}
            disabled={isApplying}
          >
            {isApplying ? '⚡ Đang nạp AI...' : '⚡ Chạy Prompt Vibe'}
          </button>
        </div>

        {/* ===== STUDIO BODY (SPLIT VIEW) ===== */}
        <div className="vp-studio-body">
          {/* Left: Code Editor */}
          <div className="vp-code-pane">
            <div className="vp-pane-header">
              <span className="vp-pane-title">MÃ NGUỒN (HTML • CSS • JS)</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Có thể chỉnh sửa trực tiếp</span>
            </div>
            <textarea
              className="vp-editor-area"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
            />
          </div>

          {/* Right: Live Preview */}
          <div className="vp-preview-pane">
            <div className="vp-pane-header">
              <span className="vp-pane-title">KẾT QUẢ CHẠY THỰC TẾ (LIVE PREVIEW)</span>
              <div className="vp-preview-controls">
                <button
                  type="button"
                  className={`vp-device-btn ${device === 'desktop' ? 'is-active' : ''}`}
                  onClick={() => setDevice('desktop')}
                >
                  🖥️ Máy tính
                </button>
                <button
                  type="button"
                  className={`vp-device-btn ${device === 'tablet' ? 'is-active' : ''}`}
                  onClick={() => setDevice('tablet')}
                >
                  📱 Tablet
                </button>
                <button
                  type="button"
                  className={`vp-device-btn ${device === 'mobile' ? 'is-active' : ''}`}
                  onClick={() => setDevice('mobile')}
                >
                  📱 Điện thoại
                </button>
              </div>
            </div>

            <div className="vp-preview-frame-wrap">
              <iframe
                ref={iframeRef}
                srcDoc={code}
                title="Vibe Sandbox Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                className={`vp-preview-frame ${device === 'tablet' ? 'is-tablet' : (device === 'mobile' ? 'is-mobile' : '')}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
