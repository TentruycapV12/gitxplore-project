import { supabase } from '../supabaseClient.js';

const GEMINI_KEY_STORAGE = 'gx_gemini_api_key';

function sanitizeApiKey(raw) {
  return String(raw || '').trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
}

/**
 * Kiểm tra chuỗi HTML trả về từ Gemini/AI có đầy đủ cấu trúc hiển thị không
 */
function isValidCompleteHtml(html) {
  if (!html || typeof html !== 'string' || html.length < 180) return false;

  const lower = html.toLowerCase();
  const hasHtmlClose = lower.includes('</html>');
  const hasBodyOpen = /<body[\s>]/i.test(html);
  const hasBodyClose = lower.includes('</body>');

  if (!hasHtmlClose || !hasBodyOpen || !hasBodyClose) return false;

  const styleOpens = (lower.match(/<style[\s>]/g) || []).length;
  const styleCloses = (lower.match(/<\/style>/g) || []).length;
  if (styleOpens !== styleCloses) return false;

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return false;
  const visibleMarkup = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  return visibleMarkup.length >= 40;
}

/**
 * Trích xuất mã HTML sạch từ phản hồi của AI
 */
function extractHtmlFromReply(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const closedFenceMatch = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let candidate = closedFenceMatch
    ? closedFenceMatch[1].trim()
    : raw.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();

  const doctypeIdx = candidate.search(/<!doctype\s+html/i);
  const htmlIdx = candidate.search(/<html[\s>]/i);
  const startIdx = doctypeIdx !== -1 ? doctypeIdx : htmlIdx;

  if (startIdx !== -1) {
    candidate = candidate.slice(startIdx);
  } else if (/^\s*<(?:div|main|section|header|nav|body)/i.test(candidate)) {
    // Nếu AI chỉ trả phần body HTML thuần, tự động bọc thành file HTML hoàn chỉnh với Tailwind CDN
    candidate = `<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-950 text-slate-100">\n${candidate}\n</body>\n</html>`;
  }

  const endHtmlIdx = candidate.toLowerCase().lastIndexOf('</html>');
  if (endHtmlIdx !== -1) {
    candidate = candidate.slice(0, endHtmlIdx + 7);
  } else if (/<body[\s>]/i.test(candidate)) {
    if (!/<\/body>/i.test(candidate)) candidate += '\n</body>';
    candidate += '\n</html>';
  }

  return isValidCompleteHtml(candidate) ? candidate : null;
}

export function getGeminiApiKey() {
  try {
    const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : '';
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
    return sanitizeApiKey(localKey || envKey || '');
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      const cleaned = sanitizeApiKey(key);
      if (cleaned) localStorage.setItem(GEMINI_KEY_STORAGE, cleaned);
      else localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearGeminiApiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    // ignore
  }
}

/**
 * Đọc Gemini API Key từ bảng public.app_settings trên Supabase (nếu Admin đã lưu sẵn)
 */
export async function fetchSupabaseGeminiKey() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .maybeSingle();

    if (!error && data?.value) {
      return sanitizeApiKey(data.value);
    }
  } catch {
    // ignore if table not created yet
  }
  return '';
}

/**
 * Lưu Gemini API Key lên bảng public.app_settings trên Supabase (dùng chung cho toàn web)
 */
export async function saveSupabaseGeminiKey(key) {
  const cleaned = sanitizeApiKey(key);
  if (!cleaned) {
    return { error: 'Vui lòng nhập Gemini API Key hợp lệ.' };
  }

  const { error } = await supabase
    .from('app_settings')
    .upsert([{ key: 'gemini_api_key', value: cleaned, updated_at: new Date().toISOString() }], { onConflict: 'key' });

  if (error) {
    return {
      error: error.message || 'Chưa tạo bảng app_settings trên Supabase (hãy chạy file supabase_ai_setup.sql).',
    };
  }
  return { ok: true };
}

/**
 * Tự động gọi ListModels để tìm tên model hợp lệ mà API Key hiện tại được phép dùng
 */
async function discoverGeminiModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    const json = await res.json();
    if (!res.ok || !Array.isArray(json?.models)) return [];

    return json.models
      .filter((m) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        /gemini/i.test(m.name) &&
        !/embedding|imagen|veo|tts|audio|robotics|computer-use|aqa/i.test(m.name)
      )
      .map((m) => m.name.replace(/^models\//, ''))
      .sort((a, b) => {
        const score = (n) => (n.includes('2.5-flash') ? 0 : n.includes('flash') ? 1 : n.includes('pro') ? 2 : 3);
        return score(a) - score(b);
      });
  } catch {
    return [];
  }
}

async function callSingleGeminiModel(model, generationPrompt, apiKey) {
  const useZeroThinking = model.startsWith('gemini-2.5');
  for (const includeThinkingCfg of useZeroThinking ? [true, false] : [false]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);

      const generationConfig = {
        maxOutputTokens: 8192,
        temperature: 0.75,
        ...(includeThinkingCfg ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: generationPrompt }] }],
            generationConfig,
          }),
        }
      );
      clearTimeout(timer);

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message || `HTTP ${res.status}`;
        if (includeThinkingCfg && /thinking/i.test(msg)) {
          continue;
        }
        if (res.status === 403 || /api key|api_key|key not valid|permission/i.test(msg)) {
          return { fatalAuth: 'API Key Gemini không hợp lệ hoặc chưa bật Generative Language API. Vui lòng kiểm tra lại Key!' };
        }
        return { error: `${model}: ${msg}` };
      }

      const candidate = json?.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const rawText = parts
        .filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text)
        .join('\n');

      const extracted = extractHtmlFromReply(rawText);
      if (extracted) {
        return { html: extracted, source: 'gemini-direct', modelUsed: model };
      }

      const finishReason = candidate?.finishReason ? ` (${candidate.finishReason})` : '';
      return { error: `${model}: Phản hồi chưa đúng HTML đầy đủ${finishReason}.` };
    } catch (err) {
      return {
        error: err?.name === 'AbortError'
          ? `${model}: Quá thời gian chờ (45s)`
          : `${model}: ${err?.message || 'Lỗi kết nối mạng'}`,
      };
    }
  }
  return { error: `${model}: Không nhận được phản hồi.` };
}

/**
 * Gọi trực tiếp Google Gemini API (ưu tiên gemini-2.5-flash, tự động dò ListModels nếu cần)
 */
async function generateWithDirectGemini(generationPrompt, rawKey) {
  const apiKey = sanitizeApiKey(rawKey);
  const preferredModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  const errors = [];

  for (const model of preferredModels) {
    const res = await callSingleGeminiModel(model, generationPrompt, apiKey);
    if (res.html) return res;
    if (res.fatalAuth) return { error: res.fatalAuth };
    if (res.error) errors.push(res.error);
  }

  // Nếu các tên model mặc định không khả dụng trên Key này, tự gọi ListModels để chọn đúng model có sẵn
  const discovered = await discoverGeminiModels(apiKey);
  for (const model of discovered) {
    if (preferredModels.includes(model)) continue;
    const res = await callSingleGeminiModel(model, generationPrompt, apiKey);
    if (res.html) return res;
    if (res.fatalAuth) return { error: res.fatalAuth };
    if (res.error) errors.push(res.error);
  }

  return { error: errors[0] || 'Không thể kết nối Google Gemini API.' };
}

/**
 * Kiểm tra xem prompt có phải là yêu cầu TẠO TRANG WEB MỚI hay không
 */
export function isWebCreationPrompt(prompt) {
  const p = (prompt || '').toLowerCase().trim();
  if (!p) return false;

  const tweakOnlyKeywords = ['đổi màu', 'màu đỏ', 'màu xanh', 'màu tím', 'thêm tuyết', 'tuyết rơi', 'đổi nền'];
  if (tweakOnlyKeywords.some((kw) => p.includes(kw)) && !p.includes('tạo') && !p.includes('trang web') && !p.includes('website')) {
    return false;
  }

  const createKeywords = [
    'tạo', 'làm', 'xây dựng', 'thiết kế', 'viết', 'build', 'create', 'make',
    'trang web', 'website', 'web ', 'app', 'ứng dụng', 'quản lý', 'quản lí',
    'bán hàng', 'shop', 'portfolio', 'cv', 'dashboard', 'game', 'blog', 'landing',
    'giới thiệu'
  ];
  return createKeywords.some((kw) => p.includes(kw));
}

/**
 * Sinh trang web hoàn chỉnh 100% bằng AI API thực tế (KHÔNG dùng template tạo sẵn giả lập):
 * 1. Gọi Supabase Edge Function 'vibe-web' (nếu đã deploy với Secret GEMINI_API_KEY)
 * 2. Hoặc gọi thẳng Google Gemini 2.5 Flash API bằng Key từ Trình duyệt / Supabase 'app_settings'
 * 3. Hoặc gọi Supabase Edge Function 'chat-ai' hiện có
 */
export async function generateWebFromPrompt(userPrompt) {
  const cleanPrompt = (userPrompt || '').trim();
  if (!cleanPrompt) {
    return { error: 'Vui lòng nhập mô tả trang web bạn muốn AI tạo.' };
  }

  const generationPrompt = [
    'Bạn là Kỹ sư Frontend & UI/UX Designer chuyên nghiệp. Hãy thiết kế và lập trình MỘT trang web hoàn chỉnh, thật chi tiết, giao diện đẹp mắt và tương tác thực tế 100% trong DUY NHẤT một file HTML.',
    `Yêu cầu của người dùng: "${cleanPrompt}"`,
    'Quy tắc bắt buộc:',
    '1. Thiết kế đúng thể loại người dùng yêu cầu (ví dụ: web giới thiệu / landing page / game showcase thì phải có Hero Banner đẹp, danh sách card bắt mắt, bộ lọc, modal xem chi tiết; web quản lý / dashboard thì có KPI, form CRUD, bảng, biểu đồ; shop thì có danh sách sản phẩm và giỏ hàng hoạt động thật).',
    '2. Sử dụng Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) để dựng giao diện hiện đại, sắc nét, responsive trên cả máy tính và điện thoại.',
    '3. Viết đầy đủ JavaScript thuần trong thẻ <script> để mọi nút bấm, tìm kiếm, bộ lọc, modal, thêm/sửa/xóa đều chạy thật 100%, kèm dữ liệu mẫu tiếng Việt chân thực và phong phú.',
    '4. Đảm bảo đóng đầy đủ thẻ </style>, </script>, </body>, </html>.',
    '5. CHỈ xuất ra mã nguồn HTML bắt đầu bằng <!DOCTYPE html> và kết thúc bằng </html>. Tuyệt đối KHÔNG viết thêm lời giải thích nào bên ngoài mã HTML.',
  ].join('\n');

  // 1. Kiểm tra Key ở local hoặc từ bảng app_settings trên Supabase
  let activeKey = getGeminiApiKey();
  let keyOrigin = activeKey ? 'local' : '';
  if (!activeKey) {
    const remoteKey = await fetchSupabaseGeminiKey();
    if (remoteKey) {
      activeKey = remoteKey;
      keyOrigin = 'supabase';
    }
  }

  // 2. Nếu có Gemini API Key -> Gọi thẳng Gemini 2.5 Flash (8192 token)
  if (activeKey) {
    const geminiResult = await generateWithDirectGemini(generationPrompt, activeKey);
    if (geminiResult.html) {
      return { ...geminiResult, keyOrigin };
    }
    return { error: geminiResult.error };
  }

  // 3. Nếu chưa có Key ở client/bảng -> Thử Supabase Edge Function 'vibe-web' (Secret server-side)
  try {
    const { data, error } = await supabase.functions.invoke('vibe-web', {
      body: { prompt: generationPrompt },
    });
    if (!error && data?.reply) {
      const extracted = extractHtmlFromReply(data.reply);
      if (extracted) {
        return { html: extracted, source: 'supabase-edge', modelUsed: data.model || 'gemini-2.5-flash' };
      }
    }
  } catch {
    // Edge function vibe-web not deployed yet, continue
  }

  // 4. Thử Edge Function 'chat-ai' hiện có của dự án
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 18000)
    );
    const invokePromise = supabase.functions.invoke('chat-ai', {
      body: {
        prompt: generationPrompt,
        mode: 'dev',
        appLang: 'vi',
      },
    });

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
    if (!error && data?.reply) {
      const extracted = extractHtmlFromReply(data.reply);
      if (extracted) {
        return { html: extracted, source: 'supabase-chat-ai' };
      }
      return {
        error: 'Edge Function chat-ai trả về code bị cắt cụt giữa chừng. Hãy gắn Gemini API Key (hoặc lưu vào Supabase) để chạy trực tiếp Gemini 2.5 Flash đầy đủ 8.192 tokens!',
      };
    }
  } catch {
    // ignore and report missing key clearly
  }

  return {
    error: 'Chưa có Gemini API Key (trên trình duyệt hoặc Supabase app_settings). Hãy bấm "🔑 Gắn Gemini Key" ở góc trên để AI tự tạo trang web thực tế!',
  };
}

/**
 * Chỉnh sửa nhanh mã nguồn template hiện tại (chỉ dùng cho tab Templates Mẫu)
 */
export function applyTemplateTweak(currentCode, prompt) {
  let updated = currentCode;
  const p = (prompt || '').toLowerCase();

  if (p.includes('đỏ') || p.includes('red')) {
    updated = updated.replace(/#00ffcc|#f59e0b|#6366f1|#c084fc/gi, '#ef4444');
  } else if (p.includes('xanh') || p.includes('cyan') || p.includes('blue')) {
    updated = updated.replace(/#f59e0b|#ff007f|#ef4444/gi, '#06b6d4');
  } else if (p.includes('tím') || p.includes('purple')) {
    updated = updated.replace(/#f59e0b|#00ffcc|#ef4444/gi, '#a855f7');
  } else if (p.includes('tuyết') || p.includes('snow')) {
    if (!updated.includes('vibe-snow-layer')) {
      const snowScript = `<div id="vibe-snow-layer" style="pointer-events:none;position:fixed;inset:0;z-index:9999;overflow:hidden;"></div><script>(function(){const w=document.getElementById('vibe-snow-layer');for(let i=0;i<28;i++){const s=document.createElement('span');s.textContent='❄';s.style.cssText='position:absolute;color:#fff;opacity:'+(0.4+Math.random()*0.6)+';font-size:'+(10+Math.random()*14)+'px;left:'+Math.random()*100+'%;top:-20px;animation:vsnow '+(4+Math.random()*5)+'s linear infinite;animation-delay:'+Math.random()*4+'s;';w.appendChild(s);}const st=document.createElement('style');st.textContent='@keyframes vsnow{to{transform:translateY(105vh) rotate(360deg);}}';document.head.appendChild(st);})();</script>`;
      updated = updated.replace('</body>', `${snowScript}</body>`);
    }
  } else if (p.includes('sáng') || p.includes('light')) {
    updated = updated.replace(/background:\s*#0[0-9a-f]{5}/gi, 'background: #f8fafc');
    updated = updated.replace(/color:\s*#f[0-9a-f]{5}/gi, 'color: #0f172a');
  }

  return updated;
}
