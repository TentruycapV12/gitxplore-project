import { useState, useEffect, useRef } from 'react';
import { PLAYGROUND_TEMPLATES } from '../data/playgroundTemplates';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  clearGeminiApiKey,
  fetchSupabaseGeminiKey,
  saveSupabaseGeminiKey,
} from '../utils/vibeWebGenerator';
import {
  usePlaygroundStore,
  playgroundActions,
} from '../utils/vibePlaygroundStore';
import './VibePlaygroundModal.css';

const QUICK_CUSTOM_PROMPTS = [
  { label: '🎮 Giới thiệu Game AAA', prompt: 'Tạo 1 trang web giới thiệu về các game AAA nổi bật hiện nay' },
  { label: '🏋️ Quản lý phòng Gym', prompt: 'Tạo hệ thống quản lý phòng Gym hội viên và gói tập' },
  { label: '🎓 Quản lý sinh viên', prompt: 'Tạo 1 trang web quản lí sinh viên đầy đủ chức năng thêm, sửa, xóa và tìm kiếm' },
  { label: '🛍️ Shop bán hàng', prompt: 'Tạo trang web cửa hàng bán giày sneaker hiện đại có giỏ hàng' },
  { label: '💰 Quản lý chi tiêu', prompt: 'Tạo ứng dụng web quản lý thu chi và ngân sách cá nhân' },
];

export default function VibePlaygroundModal({ initialTemplateId, onClose }) {
  const {
    studioMode,
    activeTemplate,
    code,
    customPrompt,
    templatePrompt,
    device,
    previewOnly,
    isGenerating,
    genStatus,
    savedWebs,
    activeSavedId,
  } = usePlaygroundStore();

  const [copied, setCopied] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getGeminiApiKey());
  const [hasGeminiKey, setHasGeminiKey] = useState(() => Boolean(getGeminiApiKey()));
  const [keySource, setKeySource] = useState(() => (getGeminiApiKey() ? 'local' : ''));
  const [savingSupa, setSavingSupa] = useState(false);
  const iframeRef = useRef(null);
  const customInputRef = useRef(null);

  // Đồng bộ vòng đời mount/unmount với Global Store (để AI vẫn chạy ngầm khi đóng popup hoặc chuyển trang)
  useEffect(() => {
    playgroundActions.setModalMounted(true, initialTemplateId);
    return () => {
      playgroundActions.setModalMounted(false);
    };
  }, [initialTemplateId]);

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

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
        playgroundActions.setGenStatus('🟢 Đã gắn Gemini 2.5 Flash! Hãy gõ ý tưởng trang web và bấm Tạo & Chạy Ngay.');
        setTimeout(() => customInputRef.current?.focus(), 60);
      }
    } else {
      playgroundActions.setGenStatus('Đã xóa Gemini API Key.');
    }
  };

  const handleSaveKeyToSupabase = async () => {
    const cleaned = geminiKeyInput.trim();
    if (!cleaned) {
      playgroundActions.setGenStatus('⚠ Vui lòng dán Gemini API Key trước khi lưu lên Supabase.');
      return;
    }
    setSavingSupa(true);
    saveGeminiApiKey(cleaned);
    const res = await saveSupabaseGeminiKey(cleaned);
    setSavingSupa(false);

    if (res.error) {
      setHasGeminiKey(true);
      setKeySource('local');
      playgroundActions.setGenStatus(`⚠ Lưu trình duyệt OK, nhưng Supabase lỗi: ${res.error}`);
      return;
    }

    setHasGeminiKey(true);
    setKeySource('supabase');
    setShowKeyPanel(false);
    if (customPrompt.trim()) {
      runCustomWebGeneration(customPrompt);
    } else {
      playgroundActions.setGenStatus('🟢 Đã lưu Gemini API Key lên Supabase (app_settings)! Toàn web đã sẵn sàng.');
      setTimeout(() => customInputRef.current?.focus(), 60);
    }
  };

  const handleClearKey = () => {
    clearGeminiApiKey();
    setGeminiKeyInput('');
    setHasGeminiKey(false);
    setKeySource('');
    playgroundActions.setGenStatus('Đã xóa Gemini API Key khỏi trình duyệt.');
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
    a.download = studioMode === 'templates' ? `${activeTemplate.id}_vibe_app.html` : 'custom_vibe_app.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const runCustomWebGeneration = async (promptToRun) => {
    const res = await playgroundActions.startCustomWebGeneration(promptToRun);
    if (res?.error && /chưa có gemini api key/i.test(res.error)) {
      setShowKeyPanel(true);
    }
  };

  const handleDeleteSaved = (e, id) => {
    e.stopPropagation();
    playgroundActions.deleteSavedWeb(id);
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
                onClick={() => playgroundActions.switchToCustomMode()}
              >
                ✨ Tự Tạo Web (Prompt Riêng)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studioMode === 'saved'}
                className={`vp-mode-tab ${studioMode === 'saved' ? 'is-active' : ''}`}
                onClick={() => playgroundActions.switchToSavedMode()}
              >
                💾 Đã Lưu ({savedWebs.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studioMode === 'templates'}
                className={`vp-mode-tab ${studioMode === 'templates' ? 'is-active' : ''}`}
                onClick={() => playgroundActions.switchToTemplatesMode()}
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
            <button
              type="button"
              className="vp-btn vp-btn--secondary"
              onClick={() => playgroundActions.saveManualSnapshot()}
              title="Lưu phiên bản code hiện tại vào mục Đã Lưu"
            >
              💾 Lưu lại
            </button>
            <button type="button" className="vp-btn vp-btn--secondary" onClick={handleCopy}>
              {copied ? '✓ Đã sao chép' : '⧉ Sao chép code'}
            </button>
            <button type="button" className="vp-btn vp-btn--secondary" onClick={handleDownload}>
              📥 Xuất file HTML
            </button>
            <button type="button" className="vp-close-btn" onClick={onClose} title="Đóng Sandbox (AI vẫn chạy ngầm nếu đang tạo)">
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

        {/* ===== KHU VỰC TRÊN: TẠO TỪ PROMPT / ĐÃ LƯU / TEMPLATES MẪU ===== */}
        {studioMode === 'custom' ? (
          <div className="vp-custom-builder-top">
            <div className="vp-prompt-bar vp-prompt-bar--custom">
              <span className="vp-prompt-prefix">✨ Tạo Web Riêng:</span>
              <input
                ref={customInputRef}
                type="text"
                className="vp-prompt-input"
                value={customPrompt}
                onChange={(e) => playgroundActions.setCustomPrompt(e.target.value)}
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
        ) : studioMode === 'saved' ? (
          <div className="vp-saved-bar">
            <span className="vp-templates-label">💾 WEB ĐÃ LƯU:</span>
            {savedWebs.length === 0 ? (
              <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                Chưa có trang web nào được lưu. Khi AI tạo web xong, hệ thống sẽ tự động lưu lại tại đây để bạn bấm xem lại bất kỳ lúc nào!
              </span>
            ) : (
              <>
                <div className="vp-saved-list">
                  {savedWebs.map((item) => {
                    const timeStr = item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => playgroundActions.selectSavedWeb(item)}
                        onKeyDown={(e) => e.key === 'Enter' && playgroundActions.selectSavedWeb(item)}
                        className={`vp-saved-chip ${activeSavedId === item.id ? 'is-active' : ''}`}
                        title={item.prompt || item.title}
                      >
                        <span className="vp-saved-title">{item.title}</span>
                        {timeStr && <span className="vp-saved-time">{timeStr}</span>}
                        <button
                          type="button"
                          className="vp-saved-del"
                          onClick={(e) => handleDeleteSaved(e, item.id)}
                          title="Xóa bản lưu này"
                          aria-label={`Xóa ${item.title}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="vp-saved-clear"
                  onClick={() => playgroundActions.clearAllSavedWebs()}
                  title="Xóa tất cả trang web đã lưu"
                >
                  🗑 Xóa hết
                </button>
              </>
            )}
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
                  onClick={() => playgroundActions.selectTemplate(tmpl)}
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
                onChange={(e) => playgroundActions.setTemplatePrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && playgroundActions.runTemplatePrompt()}
                placeholder="Gõ prompt chỉnh sửa nhanh (VD: đổi màu tím, thêm tuyết rơi) hoặc mô tả tạo web mới..."
              />
              <button
                type="button"
                className="vp-btn vp-btn--primary"
                onClick={() => playgroundActions.runTemplatePrompt()}
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
                onChange={(e) => playgroundActions.setCode(e.target.value)}
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
                  onClick={() => playgroundActions.setPreviewOnly((v) => !v)}
                  title={previewOnly ? 'Hiện lại khung mã nguồn bên trái' : 'Mở rộng Live Preview 100% không bị chia khung'}
                >
                  {previewOnly ? '⟨/⟩ Hiện Code' : '⛶ Rộng 100%'}
                </button>
                <button
                  type="button"
                  className={`vp-device-btn ${device === 'desktop' ? 'is-active' : ''}`}
                  onClick={() => playgroundActions.setDevice('desktop')}
                >
                  🖥️ Máy tính
                </button>
                <button
                  type="button"
                  className={`vp-device-btn ${device === 'tablet' ? 'is-active' : ''}`}
                  onClick={() => playgroundActions.setDevice('tablet')}
                >
                  📱 Tablet
                </button>
                <button
                  type="button"
                  className={`vp-device-btn ${device === 'mobile' ? 'is-active' : ''}`}
                  onClick={() => playgroundActions.setDevice('mobile')}
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
                  <div className="vp-loading-sub">
                    Bạn có thể đóng cửa sổ hoặc sang trang khác — AI vẫn tiếp tục tạo ngầm và tự động lưu khi xong!
                  </div>
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
