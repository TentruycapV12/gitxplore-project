import { useState, useEffect, useRef } from 'react';
import { PLAYGROUND_TEMPLATES } from '../data/playgroundTemplates';
import {
  generateWebFromPrompt,
  isWebCreationPrompt,
  applyTemplateTweak,
  getGeminiApiKey,
  saveGeminiApiKey,
  clearGeminiApiKey,
  fetchSupabaseGeminiKey,
  saveSupabaseGeminiKey,
} from '../utils/vibeWebGenerator';
import './VibePlaygroundModal.css';

const QUICK_CUSTOM_PROMPTS = [
  { label: '🎮 Giới thiệu Game AAA', prompt: 'Tạo 1 trang web giới thiệu về các game AAA nổi bật hiện nay' },
  { label: '🏋️ Quản lý phòng Gym', prompt: 'Tạo hệ thống quản lý phòng Gym hội viên và gói tập' },
  { label: '🎓 Quản lý sinh viên', prompt: 'Tạo 1 trang web quản lí sinh viên đầy đủ chức năng thêm, sửa, xóa và tìm kiếm' },
  { label: '🛍️ Shop bán hàng', prompt: 'Tạo trang web cửa hàng bán giày sneaker hiện đại có giỏ hàng' },
  { label: '💰 Quản lý chi tiêu', prompt: 'Tạo ứng dụng web quản lý thu chi và ngân sách cá nhân' },
];

const CUSTOM_STARTER_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gemini 2.5 Flash Live Builder</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    body {
      min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 36px 24px; text-align: center;
      background: radial-gradient(circle at top center, rgba(245,158,11,0.14), #09090f 65%); color: #f8fafc;
    }
    .pill {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px;
      background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.35);
      color: #6ee7b7; font-size: 12px; font-weight: 700; margin-bottom: 16px;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; color: #ffffff; max-width: 560px; }
    p { font-size: 14.5px; color: #94a3b8; line-height: 1.65; max-width: 520px; }
    strong { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="pill">⚡ Sẵn sàng tạo web trực tiếp từ Prompt</div>
  <h1>Nhập ý tưởng ở thanh phía trên để xem trang web chạy thật ngay tại đây</h1>
  <p>Ví dụ: <strong>"Tạo 1 trang web giới thiệu về các game AAA hiện nay"</strong> hoặc chọn nhanh các gợi ý có sẵn. Toàn bộ giao diện hoàn chỉnh sẽ hiển thị trực tiếp trên màn hình này.</p>
</body>
</html>`;

export default function VibePlaygroundModal({ initialTemplateId, onClose }) {
  const hasExplicitTemplate = Boolean(initialTemplateId);
  const initialTmpl = PLAYGROUND_TEMPLATES.find((t) => t.id === initialTemplateId) || PLAYGROUND_TEMPLATES[0];

  const [studioMode, setStudioMode] = useState(hasExplicitTemplate ? 'templates' : 'custom'); // 'custom' | 'templates'
  const [activeTemplate, setActiveTemplate] = useState(initialTmpl);
  const [code, setCode] = useState(hasExplicitTemplate ? initialTmpl.code : CUSTOM_STARTER_HTML);
  const [customPrompt, setCustomPrompt] = useState('');
  const [templatePrompt, setTemplatePrompt] = useState(initialTmpl.prompt);
  const [device, setDevice] = useState('desktop');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getGeminiApiKey());
  const [hasGeminiKey, setHasGeminiKey] = useState(() => Boolean(getGeminiApiKey()));
  const [keySource, setKeySource] = useState(() => (getGeminiApiKey() ? 'local' : ''));
  const [savingSupa, setSavingSupa] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const iframeRef = useRef(null);
  const customInputRef = useRef(null);

  useEffect(() => {
    if (getGeminiApiKey()) return;
    fetchSupabaseGeminiKey().then((remoteKey) => {
      if (remoteKey) {
        setHasGeminiKey(true);
        setKeySource('supabase');
        setGeminiKeyInput(remoteKey);
      }
    });
  }, []);

  const handleSaveKey = () => {
    const cleaned = geminiKeyInput.trim();
    saveGeminiApiKey(cleaned);
    setHasGeminiKey(Boolean(cleaned));
    setKeySource(cleaned ? 'local' : '');
    setShowKeyPanel(false);
    if (cleaned) {
      if (customPrompt.trim()) {
        runCustomWebGeneration(customPrompt);
      } else {
        setGenStatus('🟢 Đã gắn Gemini 2.5 Flash! Hãy gõ ý tưởng trang web và bấm Tạo & Chạy Ngay.');
        setTimeout(() => customInputRef.current?.focus(), 60);
      }
    } else {
      setGenStatus('Đã xóa Gemini API Key.');
    }
  };

  const handleSaveKeyToSupabase = async () => {
    const cleaned = geminiKeyInput.trim();
    if (!cleaned) {
      setGenStatus('⚠ Vui lòng dán Gemini API Key trước khi lưu lên Supabase.');
      return;
    }
    setSavingSupa(true);
    saveGeminiApiKey(cleaned);
    const res = await saveSupabaseGeminiKey(cleaned);
    setSavingSupa(false);

    if (res.error) {
      setHasGeminiKey(true);
      setKeySource('local');
      setGenStatus(`⚠ Lưu trình duyệt OK, nhưng Supabase lỗi: ${res.error}`);
      return;
    }

    setHasGeminiKey(true);
    setKeySource('supabase');
    setShowKeyPanel(false);
    if (customPrompt.trim()) {
      runCustomWebGeneration(customPrompt);
    } else {
      setGenStatus('🟢 Đã lưu Gemini API Key lên Supabase (app_settings)! Toàn web đã sẵn sàng.');
      setTimeout(() => customInputRef.current?.focus(), 60);
    }
  };

  const handleClearKey = () => {
    clearGeminiApiKey();
    setGeminiKeyInput('');
    setHasGeminiKey(false);
    setKeySource('');
    setGenStatus('Đã xóa Gemini API Key khỏi trình duyệt.');
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const switchToCustomMode = () => {
    setStudioMode('custom');
    setGenStatus('');
  };

  const switchToTemplatesMode = () => {
    setStudioMode('templates');
    setCode(activeTemplate.code);
    setTemplatePrompt(activeTemplate.prompt);
    setGenStatus('');
  };

  const selectTemplate = (tmpl) => {
    setStudioMode('templates');
    setActiveTemplate(tmpl);
    setCode(tmpl.code);
    setTemplatePrompt(tmpl.prompt);
    setGenStatus('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard error
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = studioMode === 'custom' ? 'custom_vibe_app.html' : `${activeTemplate.id}_vibe_app.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const runCustomWebGeneration = async (promptToRun) => {
    const targetPrompt = (typeof promptToRun === 'string' ? promptToRun : customPrompt).trim();
    if (!targetPrompt || isGenerating) return;

    setStudioMode('custom');
    setCustomPrompt(targetPrompt);
    setIsGenerating(true);
    setGenStatus('⚡ Đang gọi AI API để tự động thiết kế & viết mã nguồn...');

    try {
      const result = await generateWebFromPrompt(targetPrompt);
      if (result.html) {
        setCode(result.html);
        if (result.source === 'gemini-direct') {
          const where = result.keyOrigin === 'supabase' ? ' (Key từ Supabase)' : '';
          setGenStatus(`✨ ${result.modelUsed || 'Gemini 2.5 Flash'}${where} đã tự tạo & chạy web thành công!`);
        } else if (result.source === 'supabase-edge') {
          setGenStatus(`✨ Supabase AI (${result.modelUsed || 'Gemini 2.5 Flash'}) đã tạo xong!`);
        } else {
          setGenStatus('✓ AI đã tự động tạo & chạy trang web thành công!');
        }
      } else {
        setGenStatus(`⚠ ${result.error || 'Chưa nhận được mã web từ AI.'}`);
        if (/chưa có gemini api key/i.test(result.error || '')) {
          setShowKeyPanel(true);
        }
      }
    } catch (err) {
      setGenStatus(`⚠ ${err?.message || 'Lỗi kết nối AI API, vui lòng thử lại.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplatePromptRun = async () => {
    const trimmed = templatePrompt.trim();
    if (!trimmed || isGenerating) return;

    // Nếu người dùng gõ yêu cầu tạo web mới ngay trong ô Template, tự động chuyển sang tạo web hoàn chỉnh
    if (isWebCreationPrompt(trimmed)) {
      await runCustomWebGeneration(trimmed);
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const updated = applyTemplateTweak(code, trimmed);
      setCode(updated);
      setGenStatus('✓ Đã cập nhật giao diện theo yêu cầu!');
      setIsGenerating(false);
    }, 250);
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

            {/* Bộ chuyển đổi chế độ ở ngay trên đầu */}
            <div className="vp-mode-tabs" role="tablist" aria-label="Chế độ Sandbox">
              <button
                type="button"
                role="tab"
                aria-selected={studioMode === 'custom'}
                className={`vp-mode-tab ${studioMode === 'custom' ? 'is-active' : ''}`}
                onClick={switchToCustomMode}
              >
                ✨ Tự Tạo Web (Prompt Riêng)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studioMode === 'templates'}
                className={`vp-mode-tab ${studioMode === 'templates' ? 'is-active' : ''}`}
                onClick={switchToTemplatesMode}
              >
                🧩 Templates Mẫu ({PLAYGROUND_TEMPLATES.length})
              </button>
            </div>
          </div>

          <div className="vp-header-right">
            <button
              type="button"
              className={`vp-btn ${hasGeminiKey ? 'vp-btn--key-ready' : 'vp-btn--secondary'}`}
              onClick={() => setShowKeyPanel((v) => !v)}
              title="Gắn Google Gemini API Key cá nhân hoặc lưu trên Supabase để AI tự tạo web"
            >
              {hasGeminiKey
                ? `🟢 Gemini Ready${keySource === 'supabase' ? ' (Supabase)' : ''}`
                : '🔑 Gắn Gemini Key'}
            </button>
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

        {/* ===== PANEL GẮN GEMINI API KEY (TRÌNH DUYỆT HOẶC SUPABASE) ===== */}
        {showKeyPanel && (
          <div className="vp-key-panel">
            <div className="vp-key-row">
              <span className="vp-key-label">🔑 Gemini API Key:</span>
              <input
                type="password"
                className="vp-key-input"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                placeholder="Dán API Key AIza... để AI tự thiết kế trang web qua Gemini 2.5 Flash"
              />
              <button type="button" className="vp-btn vp-btn--primary" onClick={handleSaveKey}>
                💾 Lưu Trình Duyệt
              </button>
              <button
                type="button"
                className="vp-btn vp-btn--secondary"
                onClick={handleSaveKeyToSupabase}
                disabled={savingSupa}
                title="Lưu Key vào bảng app_settings trên Supabase để cả web dùng chung"
                style={{ borderColor: 'rgba(56, 189, 248, 0.45)', color: '#7dd3fc' }}
              >
                {savingSupa ? '⏳ Đang lưu...' : '☁️ Lưu Lên Supabase'}
              </button>
              {hasGeminiKey && (
                <button type="button" className="vp-btn vp-btn--secondary" onClick={handleClearKey}>
                  🗑 Xóa Key
                </button>
              )}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="vp-key-link"
              >
                Lấy Key miễn phí ↗
              </a>
            </div>
          </div>
        )}

        {/* ===== KHU VỰC TRÊN: CHẠY TRỰC TIẾP RIÊNG TỪ PROMPT HOẶC CHỌN TEMPLATE ===== */}
        {studioMode === 'custom' ? (
          <div className="vp-custom-builder-top">
            <div className="vp-prompt-bar vp-prompt-bar--custom">
              <span className="vp-prompt-prefix">✨ Tạo Web Riêng:</span>
              <input
                ref={customInputRef}
                type="text"
                className="vp-prompt-input"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runCustomWebGeneration()}
                placeholder="Gõ mô tả trang web bạn muốn tạo (VD: Tạo 1 trang web quản lí sinh viên, Shop bán giày...)"
              />
              <button
                type="button"
                className="vp-btn vp-btn--primary"
                onClick={() => runCustomWebGeneration()}
                disabled={isGenerating || !customPrompt.trim()}
              >
                {isGenerating ? '⚡ Đang tạo web...' : '✨ Tạo & Chạy Ngay'}
              </button>
            </div>

            <div className="vp-quick-ideas-bar">
              <span className="vp-templates-label">GỢI Ý NHANH:</span>
              {QUICK_CUSTOM_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="vp-idea-chip"
                  onClick={() => runCustomWebGeneration(item.prompt)}
                  disabled={isGenerating}
                >
                  {item.label}
                </button>
              ))}
              {genStatus && (
                <span
                  className="vp-gen-status"
                  style={genStatus.startsWith('⚠') ? { color: '#fbbf24' } : undefined}
                >
                  {genStatus}
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
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

            {/* ===== PROMPT BAR (CHỈNH SỬA TEMPLATE HOẶC TẠO MỚI) ===== */}
            <div className="vp-prompt-bar">
              <input
                type="text"
                className="vp-prompt-input"
                value={templatePrompt}
                onChange={(e) => setTemplatePrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTemplatePromptRun()}
                placeholder="Gõ prompt chỉnh sửa nhanh (VD: đổi màu tím, thêm tuyết rơi) hoặc mô tả tạo web mới..."
              />
              <button
                type="button"
                className="vp-btn vp-btn--primary"
                onClick={handleTemplatePromptRun}
                disabled={isGenerating}
              >
                {isGenerating ? '⚡ Đang xử lý...' : '⚡ Chạy Prompt Vibe'}
              </button>
            </div>
          </>
        )}

        {/* ===== STUDIO BODY (SPLIT VIEW OR FULL PREVIEW) ===== */}
        <div className={`vp-studio-body ${previewOnly ? 'is-preview-only' : ''}`}>
          {/* Left: Code Editor */}
          {!previewOnly && (
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
          )}

          {/* Right: Live Preview */}
          <div className="vp-preview-pane">
            <div className="vp-pane-header">
              <span className="vp-pane-title">KẾT QUẢ CHẠY THỰC TẾ (LIVE PREVIEW)</span>
              <div className="vp-preview-controls">
                <button
                  type="button"
                  className={`vp-device-btn ${previewOnly ? 'is-active' : ''}`}
                  onClick={() => setPreviewOnly((v) => !v)}
                  title={previewOnly ? 'Hiện lại khung mã nguồn bên trái' : 'Mở rộng Live Preview 100% không bị chia khung'}
                >
                  {previewOnly ? '⟨/⟩ Hiện Code' : '⛶ Rộng 100%'}
                </button>
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
                <button
                  type="button"
                  className="vp-device-btn"
                  onClick={handleOpenNewTab}
                  title="Mở trang web đang chạy trong tab toàn màn hình mới"
                  style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                >
                  ↗ Mở Tab Mới
                </button>
              </div>
            </div>

            <div className="vp-preview-frame-wrap" style={{ position: 'relative' }}>
              {isGenerating && (
                <div className="vp-preview-loading">
                  <div className="vp-spinner" />
                  <div className="vp-loading-title">
                    {hasGeminiKey
                      ? '⚡ Gemini 2.5 Flash đang viết code & dựng giao diện...'
                      : '⚡ Đang khởi tạo trang web từ Prompt...'}
                  </div>
                  <div className="vp-loading-sub">Kết quả hoàn chỉnh sẽ tự động chạy ngay trong Live Preview</div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                srcDoc={code}
                title="Vibe Sandbox Preview"
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups"
                className={`vp-preview-frame ${device === 'tablet' ? 'is-tablet' : (device === 'mobile' ? 'is-mobile' : '')}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
