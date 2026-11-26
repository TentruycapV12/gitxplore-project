import { useSyncExternalStore } from 'react';
import { PLAYGROUND_TEMPLATES } from '../data/playgroundTemplates';
import {
  generateWebFromPrompt,
  isWebCreationPrompt,
  applyTemplateTweak,
} from './vibeWebGenerator';
import { showToast } from '../Components/ToastNotice';

const SAVED_WEBS_STORAGE = 'gx_saved_vibe_webs';

export const CUSTOM_STARTER_HTML = `<!DOCTYPE html>
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

function readSavedWebs() {
  try {
    const raw = localStorage.getItem(SAVED_WEBS_STORAGE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedWebs(list) {
  try {
    localStorage.setItem(SAVED_WEBS_STORAGE, JSON.stringify(list.slice(0, 25)));
  } catch {
    // ignore storage quota errors
  }
}

function extractWebTitle(html, fallbackPrompt) {
  const m = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = m ? m[1].trim() : '';
  if (rawTitle && !/gemini 2\.5 flash live builder/i.test(rawTitle)) {
    return rawTitle.length > 42 ? `${rawTitle.slice(0, 42)}...` : rawTitle;
  }
  const cleanPrompt = String(fallbackPrompt || 'Trang web AI').trim();
  return cleanPrompt.length > 42 ? `${cleanPrompt.slice(0, 42)}...` : cleanPrompt;
}

const defaultTemplate = PLAYGROUND_TEMPLATES[0];

let state = {
  studioMode: 'custom', // 'custom' | 'saved' | 'templates'
  activeTemplate: defaultTemplate,
  code: CUSTOM_STARTER_HTML,
  customPrompt: '',
  templatePrompt: defaultTemplate.prompt,
  device: 'desktop',
  previewOnly: false,
  isGenerating: false,
  genStatus: '',
  savedWebs: readSavedWebs(),
  activeSavedId: null,
  isModalMounted: false,
  hasUnreadResult: false,
};

const listeners = new Set();

function emit(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export function usePlaygroundStore() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}

function persistSavedWeb(html, promptText, modelName) {
  const newItem = {
    id: `${Date.now()}`,
    title: extractWebTitle(html, promptText),
    prompt: promptText || '',
    html,
    model: modelName || 'Gemini AI',
    createdAt: new Date().toISOString(),
  };
  const next = [newItem, ...state.savedWebs].slice(0, 25);
  writeSavedWebs(next);
  emit({ savedWebs: next, activeSavedId: newItem.id });
  return newItem;
}

export const playgroundActions = {
  setModalMounted(mounted, initialTemplateId) {
    if (mounted) {
      if (initialTemplateId) {
        const tmpl = PLAYGROUND_TEMPLATES.find((t) => t.id === initialTemplateId) || defaultTemplate;
        emit({
          isModalMounted: true,
          hasUnreadResult: false,
          studioMode: 'templates',
          activeTemplate: tmpl,
          code: tmpl.code,
          templatePrompt: tmpl.prompt,
          genStatus: '',
        });
      } else {
        emit({ isModalMounted: true, hasUnreadResult: false });
      }
    } else {
      emit({ isModalMounted: false });
    }
  },

  setCode(code) {
    emit({ code });
  },

  setCustomPrompt(customPrompt) {
    emit({ customPrompt });
  },

  setTemplatePrompt(templatePrompt) {
    emit({ templatePrompt });
  },

  setDevice(device) {
    emit({ device });
  },

  setPreviewOnly(valOrFn) {
    const next = typeof valOrFn === 'function' ? valOrFn(state.previewOnly) : valOrFn;
    emit({ previewOnly: next });
  },

  setGenStatus(genStatus) {
    emit({ genStatus });
  },

  switchToCustomMode() {
    emit({ studioMode: 'custom', genStatus: state.isGenerating ? state.genStatus : '' });
  },

  switchToTemplatesMode() {
    emit({
      studioMode: 'templates',
      code: state.activeTemplate.code,
      templatePrompt: state.activeTemplate.prompt,
      genStatus: '',
    });
  },

  switchToSavedMode() {
    const { savedWebs, activeSavedId } = state;
    if (savedWebs.length > 0 && (!activeSavedId || !savedWebs.some((s) => s.id === activeSavedId))) {
      const first = savedWebs[0];
      emit({
        studioMode: 'saved',
        activeSavedId: first.id,
        code: first.html,
        customPrompt: first.prompt || state.customPrompt,
        genStatus: '',
      });
    } else {
      emit({ studioMode: 'saved', genStatus: '' });
    }
  },

  selectTemplate(tmpl) {
    emit({
      studioMode: 'templates',
      activeTemplate: tmpl,
      code: tmpl.code,
      templatePrompt: tmpl.prompt,
      genStatus: '',
    });
  },

  selectSavedWeb(item) {
    emit({
      studioMode: 'saved',
      activeSavedId: item.id,
      code: item.html,
      customPrompt: item.prompt || state.customPrompt,
      genStatus: `✓ Đang mở lại: "${item.title}"`,
    });
  },

  deleteSavedWeb(id) {
    const next = state.savedWebs.filter((item) => item.id !== id);
    writeSavedWebs(next);
    if (state.activeSavedId === id) {
      if (next.length > 0) {
        emit({ savedWebs: next, activeSavedId: next[0].id, code: next[0].html });
      } else {
        emit({ savedWebs: next, activeSavedId: null, code: CUSTOM_STARTER_HTML });
      }
    } else {
      emit({ savedWebs: next });
    }
  },

  clearAllSavedWebs() {
    writeSavedWebs([]);
    emit({
      savedWebs: [],
      activeSavedId: null,
      genStatus: 'Đã xóa toàn bộ danh sách web đã lưu.',
    });
  },

  saveManualSnapshot() {
    if (!state.code || state.code === CUSTOM_STARTER_HTML) return;
    const saved = persistSavedWeb(
      state.code,
      state.customPrompt || state.activeTemplate?.title || 'Bản lưu thủ công',
      'Manual Edit'
    );
    emit({ genStatus: `💾 Đã lưu "${saved.title}" vào mục Đã Lưu!` });
  },

  async startCustomWebGeneration(promptToRun) {
    const targetPrompt = (typeof promptToRun === 'string' ? promptToRun : state.customPrompt).trim();
    if (!targetPrompt || state.isGenerating) return { skipped: true };

    emit({
      studioMode: 'custom',
      customPrompt: targetPrompt,
      isGenerating: true,
      hasUnreadResult: false,
      genStatus: '⚡ Đang gọi AI API để tự động thiết kế & viết mã nguồn (vẫn chạy ngầm nếu bạn chuyển trang)...',
    });

    try {
      const result = await generateWebFromPrompt(targetPrompt);
      if (result.html) {
        const saved = persistSavedWeb(result.html, targetPrompt, result.modelUsed || 'Gemini 2.5 Flash');
        const where = result.keyOrigin === 'supabase' ? ' (Key từ Supabase)' : '';
        const statusMsg =
          result.source === 'gemini-direct'
            ? `✨ ${result.modelUsed || 'Gemini 2.5 Flash'}${where} đã tạo xong & tự động lưu!`
            : result.source === 'supabase-edge'
              ? `✨ Supabase AI (${result.modelUsed || 'Gemini 2.5 Flash'}) đã tạo xong & tự động lưu!`
              : '✓ AI đã tạo xong & tự động lưu vào mục Đã Lưu!';

        emit({
          code: result.html,
          isGenerating: false,
          hasUnreadResult: !state.isModalMounted,
          genStatus: statusMsg,
        });

        if (!state.isModalMounted) {
          showToast(`AI đã tạo xong trang "${saved.title}"! Bấm Sandbox để xem ngay.`, '✨', 'success');
        }
        return { ok: true };
      }

      emit({
        isGenerating: false,
        genStatus: `⚠ ${result.error || 'Chưa nhận được mã web từ AI.'}`,
      });
      if (!state.isModalMounted) {
        showToast(`Lỗi tạo web AI: ${result.error || 'Vui lòng kiểm tra Key.'}`, '⚠️', 'warning');
      }
      return { error: result.error };
    } catch (err) {
      const msg = err?.message || 'Lỗi kết nối AI API, vui lòng thử lại.';
      emit({
        isGenerating: false,
        genStatus: `⚠ ${msg}`,
      });
      return { error: msg };
    }
  },

  async runTemplatePrompt() {
    const trimmed = state.templatePrompt.trim();
    if (!trimmed || state.isGenerating) return;

    if (isWebCreationPrompt(trimmed)) {
      await playgroundActions.startCustomWebGeneration(trimmed);
      return;
    }

    emit({ isGenerating: true });
    setTimeout(() => {
      const updated = applyTemplateTweak(state.code, trimmed);
      emit({
        code: updated,
        isGenerating: false,
        genStatus: '✓ Đã cập nhật giao diện theo yêu cầu!',
      });
    }, 250);
  },
};
