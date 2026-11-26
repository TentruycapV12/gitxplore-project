import { supabase } from '../supabaseClient.js';

/**
 * Kiểm tra xem chuỗi HTML trích xuất từ AI có đầy đủ cấu trúc và không bị cắt cụt giữa chừng hay lỗi cú pháp JS không.
 */
function isValidCompleteHtml(html) {
  if (!html || typeof html !== 'string' || html.length < 300) return false;

  const lower = html.toLowerCase();
  const hasHtmlClose = lower.includes('</html>');
  const hasBodyOpen = /<body[\s>]/i.test(html);
  const hasBodyClose = lower.includes('</body>');

  if (!hasHtmlClose || !hasBodyOpen || !hasBodyClose) return false;

  // Đảm bảo mọi thẻ <style> đều được đóng kín (tránh lỗi nuốt toàn bộ body thành trắng trang)
  const styleOpens = (lower.match(/<style[\s>]/g) || []).length;
  const styleCloses = (lower.match(/<\/style>/g) || []).length;
  if (styleOpens !== styleCloses) return false;

  // Đảm bảo mọi thẻ <script> đều được đóng kín
  const scriptOpens = (lower.match(/<script[\s>]/g) || []).length;
  const scriptCloses = (lower.match(/<\/script>/g) || []).length;
  if (scriptOpens !== scriptCloses) return false;

  // Kiểm tra nội dung bên trong <body> không được rỗng
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return false;
  const visibleMarkup = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  if (visibleMarkup.length < 120) return false;

  // Kiểm tra cú pháp JavaScript bên trong các thẻ inline <script> thông thường
  const inlineScriptRegex = /<script(?![^>]*\bsrc=)(?![^>]*type\s*=\s*["']module["'])[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = inlineScriptRegex.exec(html)) !== null) {
    const jsCode = scriptMatch[1].trim();
    if (jsCode) {
      try {
        new Function(jsCode);
      } catch {
        return false;
      }
    }
  }

  return true;
}

/**
 * Trích xuất mã HTML sạch từ phản hồi của AI
 */
function extractHtmlFromReply(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const fenceMatch = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  const doctypeIdx = candidate.search(/<!doctype\s+html/i);
  const htmlIdx = candidate.search(/<html[\s>]/i);
  const startIdx = doctypeIdx !== -1 ? doctypeIdx : htmlIdx;

  if (startIdx !== -1) {
    candidate = candidate.slice(startIdx);
  }

  const endHtmlIdx = candidate.toLowerCase().lastIndexOf('</html>');
  if (endHtmlIdx !== -1) {
    candidate = candidate.slice(0, endHtmlIdx + 7);
  }

  return isValidCompleteHtml(candidate) ? candidate : null;
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
    'gym', 'nhà hàng', 'khách sạn', 'phòng khám', 'cửa hàng', 'sinh viên', 'chi tiêu'
  ];
  return createKeywords.some((kw) => p.includes(kw));
}

const GEMINI_KEY_STORAGE = 'gx_gemini_api_key';

export function getGeminiApiKey() {
  try {
    const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem(GEMINI_KEY_STORAGE) : '';
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
    return (localKey || envKey || '').trim();
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      const cleaned = (key || '').trim();
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
 * Gọi trực tiếp Google Gemini REST API từ trình duyệt với output limit 8192 token
 * để sinh trọn vẹn ứng dụng web chi tiết theo đúng bất kỳ prompt nào.
 */
async function generateWithDirectGemini(generationPrompt, apiKey) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: generationPrompt }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.7,
            },
          }),
        }
      );
      clearTimeout(timer);

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message || `HTTP ${res.status}`;
        if (res.status === 400 || res.status === 403 || /api key/i.test(msg)) {
          return { authError: 'API Key Gemini không hợp lệ hoặc chưa được kích hoạt. Vui lòng kiểm tra lại Key!' };
        }
        lastError = msg;
        continue;
      }

      const rawText = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
      const extracted = extractHtmlFromReply(rawText);
      if (extracted) {
        return { html: extracted, source: 'gemini-direct', modelUsed: model };
      }
      lastError = 'Phản hồi chưa đầy đủ HTML';
    } catch (err) {
      lastError = err?.message || 'Lỗi kết nối Gemini API';
    }
  }

  return { error: lastError || 'Không thể kết nối Gemini API' };
}

/**
 * Kiểm tra xem prompt có thiên về Trang Giới Thiệu / Showcase / Game / Landing Page
 * hay là Trang Quản Lý / Dashboard / Shop / Tài Chính.
 */
function isShowcaseTopic(prompt) {
  const p = (prompt || '').toLowerCase();
  const isExplicitManagement =
    p.includes('quản lý') || p.includes('quản lí') || p.includes('dashboard') ||
    p.includes('admin') || p.includes('gym') || p.includes('sinh viên') ||
    p.includes('chi tiêu') || p.includes('thu chi') || p.includes('khách sạn') ||
    p.includes('nhà hàng') || p.includes('pos');
  if (isExplicitManagement) return false;

  const showcaseKeywords = [
    'giới thiệu', 'game', 'trò chơi', 'aaa', 'esport', 'review', 'tin tức',
    'blog', 'landing', 'portfolio', 'du lịch', 'phim', 'âm nhạc', 'showcase', 'sự kiện', 'công nghệ'
  ];
  return showcaseKeywords.some((kw) => p.includes(kw));
}

/**
 * Sinh trang web hoàn chỉnh trực tiếp từ Prompt:
 * Ưu tiên #1: Gemini API Key trực tiếp (8192 tokens, thiết kế tự do 100%)
 * Ưu tiên #2: Supabase Edge Function ('chat-ai')
 * Ưu tiên #3: Pro Showcase / Pro Domain Engine nội bộ (tự phân biệt Web Giới Thiệu vs Web Quản Lý)
 */
export async function generateWebFromPrompt(userPrompt) {
  const cleanPrompt = (userPrompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Vui lòng nhập mô tả trang web bạn muốn tạo.');
  }

  const generationPrompt = [
    'Bạn là Kỹ sư Frontend & UI/UX Designer xuất sắc. Hãy tạo MỘT trang web hoàn chỉnh, cực kỳ chi tiết, thẩm mỹ cao và chạy mượt 100% trong duy nhất 1 file HTML.',
    `Yêu cầu của người dùng: "${cleanPrompt}"`,
    'Hướng dẫn thiết kế BẮT BUỘC:',
    '1. PHÂN BIỆT ĐÚNG THỂ LOẠI TRANG WEB: Nếu người dùng yêu cầu "giới thiệu", "game", "tin tức", "blog", "landing page", "portfolio", hãy thiết kế trang web Showcase/Landing Page ấn tượng với Hero Banner, thanh tìm kiếm/lọc thể loại, lưới Card đẹp mắt có ảnh/icon minh họa, nút Xem chi tiết (mở Modal chi tiết) và Yêu thích. Chỉ thiết kế bảng quản lý CRUD khi người dùng yêu cầu "quản lý", "dashboard", "bán hàng", "thu chi"...',
    '2. Sử dụng Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) để giao diện hiện đại, sắc nét, responsive trên mọi thiết bị.',
    '3. Tạo dữ liệu mẫu tiếng Việt phong phú, chân thực (ví dụ nếu nói về game thì có các tựa game nổi tiếng thật như Black Myth: Wukong, Elden Ring, Cyberpunk 2077, Baldur\'s Gate 3, Valorant, GTA...), tương tác JS đầy đủ (tìm kiếm, lọc, modal chi tiết, thông báo toast).',
    '4. Đảm bảo đóng đầy đủ thẻ </style>, </script>, </body>, </html> và KHÔNG dùng thư viện JS ngoài gây lỗi.',
    '5. CHỈ xuất ra mã HTML thuần bắt đầu bằng <!DOCTYPE html> và kết thúc bằng </html>. Không viết thêm bất kỳ lời giải thích nào bên ngoài.',
  ].join('\n');

  // 1. Thử gọi trực tiếp Gemini API nếu người dùng đã gắn Key
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const geminiResult = await generateWithDirectGemini(generationPrompt, geminiKey);
    if (geminiResult.html) {
      return geminiResult;
    }
    if (geminiResult.authError) {
      return {
        html: generateSmartLocalWeb(cleanPrompt),
        source: 'smart-engine',
        warning: geminiResult.authError,
      };
    }
  }

  // 2. Thử gọi qua Supabase Edge Function nếu chưa gắn Key riêng
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 15000)
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
        return { html: extracted, source: 'ai' };
      }
    }
  } catch (err) {
    console.warn('Chuyển sang Smart Local Engine:', err?.message || err);
  }

  // 3. Fallback thông minh: phân tách rõ Web Giới Thiệu Showcase vs Web Quản Lý
  return {
    html: generateSmartLocalWeb(cleanPrompt),
    source: 'smart-engine',
  };
}

export function generateSmartLocalWeb(prompt) {
  if (isShowcaseTopic(prompt)) {
    return buildShowcaseWebApp(prompt);
  }
  return generateProDomainWeb(prompt);
}

/**
 * Chỉnh sửa nhanh mã nguồn template hiện tại
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Bộ cấu hình thông minh cho từng lĩnh vực thực tế (Gym, Sinh viên, Shop, Tài chính, Nhà hàng, Khách sạn, Phòng khám, Nhân sự, Tùy biến)
 */
function resolveDomainBlueprint(prompt) {
  const p = prompt.toLowerCase();

  // 1. PHÒNG GYM / FITNESS / YOGA
  if (p.includes('gym') || p.includes('fitness') || p.includes('yoga') || p.includes('thể hình') || p.includes('pt')) {
    return {
      icon: '🏋️',
      title: 'GymMaster Pro — Quản Lý Phòng Tập & Hội Viên',
      accent: '#f59e0b',
      itemLabel: 'Hội Viên',
      idPrefix: 'GYM',
      fields: {
        codeLabel: 'Mã HV',
        nameLabel: 'Họ Tên Hội Viên',
        catLabel: 'Gói Tập',
        categories: ['Gói VIP + PT 1:1', 'Gói 12 Tháng', 'Gói 3 Tháng', 'Gói 1 Tháng', 'Gói Yoga & Pilates'],
        metricLabel: 'Doanh Thu / Giá (VNĐ)',
        metricType: 'currency',
        statuses: ['Đang hoạt động', 'Sắp hết hạn', 'Đã hết hạn'],
      },
      extraTab: {
        title: '📅 Lịch Lớp & PT',
        cards: [
          { name: 'HIIT Đốt Mỡ Toàn Thân', sub: 'HLV Minh Tuấn • 18:00 - 19:00', badge: '14/20 chỗ' },
          { name: 'Yoga Phục Hồi Cột Sống', sub: 'HLV Lan Anh • 19:15 - 20:15', badge: '18/20 chỗ' },
          { name: 'Powerlifting & Squat Nâng Cao', sub: 'HLV Quốc Bảo • 17:30 - 18:45', badge: '8/12 chỗ' },
          { name: 'Boxing & Cardio Kickfit', sub: 'HLV Hoàng Hải • 20:00 - 21:00', badge: '11/15 chỗ' },
        ],
      },
      initialItems: [
        { code: 'GYM001', name: 'Nguyễn Hoàng Long', cat: 'Gói VIP + PT 1:1', metric: 6500000, status: 'Đang hoạt động', note: '0901234567 • Hết hạn 12/2026' },
        { code: 'GYM002', name: 'Trần Minh Thư', cat: 'Gói Yoga & Pilates', metric: 1800000, status: 'Đang hoạt động', note: '0912345678 • Hết hạn 08/2026' },
        { code: 'GYM003', name: 'Lê Quốc Khánh', cat: 'Gói 3 Tháng', metric: 1450000, status: 'Sắp hết hạn', note: '0987654321 • Còn 5 ngày' },
        { code: 'GYM004', name: 'Phạm Gia Huy', cat: 'Gói 12 Tháng', metric: 4200000, status: 'Đang hoạt động', note: '0933445566 • Đã check-in hôm nay' },
        { code: 'GYM005', name: 'Võ Ngọc Hân', cat: 'Gói 1 Tháng', metric: 550000, status: 'Đã hết hạn', note: '0977889900 • Cần gia hạn' },
      ],
    };
  }

  // 2. SINH VIÊN / HỌC SINH / ĐÀO TẠO
  if (p.includes('sinh viên') || p.includes('học sinh') || p.includes('student') || p.includes('lớp') || p.includes('điểm') || p.includes('trường')) {
    return {
      icon: '🎓',
      title: 'EduManage Pro — Hệ Thống Quản Lý Sinh Viên',
      accent: '#38bdf8',
      itemLabel: 'Sinh Viên',
      idPrefix: 'SV',
      fields: {
        codeLabel: 'Mã SV',
        nameLabel: 'Họ Và Tên',
        catLabel: 'Ngành Học',
        categories: ['Công nghệ thông tin', 'Kỹ thuật phần mềm', 'Trí tuệ nhân tạo', 'An toàn thông tin', 'Thiết kế đồ họa'],
        metricLabel: 'Điểm GPA (0 - 4.0)',
        metricType: 'gpa',
        statuses: ['Đang học', 'Đã tốt nghiệp', 'Cảnh báo học vụ'],
      },
      extraTab: {
        title: '📚 Lịch Thi & Tín Chỉ',
        cards: [
          { name: 'Lập Trình ReactJS & Vite', sub: 'Phòng A302 • Thứ 2 (07:30 - 10:30)', badge: '3 Tín chỉ' },
          { name: 'Cấu Trúc Dữ Liệu & Giải Thuật', sub: 'Phòng B105 • Thứ 4 (13:00 - 16:00)', badge: '4 Tín chỉ' },
          { name: 'Trí Tuệ Nhân Tạo Ứng Dụng', sub: 'Lab AI-01 • Thứ 6 (08:00 - 11:00)', badge: '3 Tín chỉ' },
          { name: 'Cơ Sở Dữ Liệu Phân Tán', sub: 'Phòng C201 • Thứ 7 (09:00 - 11:30)', badge: '3 Tín chỉ' },
        ],
      },
      initialItems: [
        { code: 'SV001', name: 'Trần Minh Quân', cat: 'Công nghệ thông tin', metric: 3.75, status: 'Đang học', note: 'K2024 • Học bổng loại Giỏi' },
        { code: 'SV002', name: 'Lê Ngọc Linh', cat: 'Trí tuệ nhân tạo', metric: 3.92, status: 'Đang học', note: 'K2024 • Thủ khoa khối ngành' },
        { code: 'SV003', name: 'Phạm Hoàng Nam', cat: 'Kỹ thuật phần mềm', metric: 3.25, status: 'Đã tốt nghiệp', note: 'K2022 • Đã nhận bằng' },
        { code: 'SV004', name: 'Nguyễn Thảo Vy', cat: 'An toàn thông tin', metric: 2.15, status: 'Cảnh báo học vụ', note: 'K2025 • Nợ 1 học phần' },
        { code: 'SV005', name: 'Đặng Tuấn Kiệt', cat: 'Thiết kế đồ họa', metric: 3.55, status: 'Đang học', note: 'K2024 • Tích lũy 98 tín chỉ' },
      ],
    };
  }

  // 3. CỬA HÀNG / BÁN HÀNG / E-COMMERCE
  if (p.includes('bán') || p.includes('shop') || p.includes('cửa hàng') || p.includes('store') || p.includes('giày') || p.includes('áo') || p.includes('sản phẩm') || p.includes('mua')) {
    return {
      icon: '🛍️',
      title: 'VibeCommerce Pro — Quản Lý Cửa Hàng & Đơn Hàng',
      accent: '#10b981',
      itemLabel: 'Sản Phẩm',
      idPrefix: 'SP',
      isShop: true,
      fields: {
        codeLabel: 'Mã SKU',
        nameLabel: 'Tên Sản Phẩm',
        catLabel: 'Danh Mục',
        categories: ['Giày Sneaker', 'Áo Khoác & Hoodie', 'Phụ Kiện Tech', 'Đồng Hồ & Kính', 'Balo & Túi Xách'],
        metricLabel: 'Giá Bán (VNĐ)',
        metricType: 'currency',
        statuses: ['Còn hàng', 'Sắp hết', 'Ngừng bán'],
      },
      extraTab: {
        title: '🧾 Đơn Hàng Gần Đây',
        cards: [
          { name: 'Đơn #DH8821 — Nguyễn An', sub: '2x Sneaker Air Pulse • Chuyển khoản VietQR', badge: 'Đã giao' },
          { name: 'Đơn #DH8822 — Minh Tâm', sub: '1x Balo Tech Minimalist • COD', badge: 'Đang giao' },
          { name: 'Đơn #DH8823 — Bảo Ngọc', sub: '1x Smartwatch Chronos • Ví điện tử', badge: 'Chờ đóng gói' },
          { name: 'Đơn #DH8824 — Quốc Huy', sub: '3x Áo Hoodie Oversize • Đã thanh toán', badge: 'Hoàn tất' },
        ],
      },
      initialItems: [
        { code: 'SP001', name: 'Sneaker Air Pulse Carbon', cat: 'Giày Sneaker', metric: 1450000, status: 'Còn hàng', note: 'Tồn kho: 42 đôi • Bán chạy #1' },
        { code: 'SP002', name: 'Áo Khoác Bomber Cyber', cat: 'Áo Khoác & Hoodie', metric: 690000, status: 'Còn hàng', note: 'Tồn kho: 28 chiếc' },
        { code: 'SP003', name: 'Tai Nghe Studio ANC Pro', cat: 'Phụ Kiện Tech', metric: 2190000, status: 'Sắp hết', note: 'Tồn kho: 4 chiếc' },
        { code: 'SP004', name: 'Balo Chống Nước Minimalist', cat: 'Balo & Túi Xách', metric: 790000, status: 'Còn hàng', note: 'Tồn kho: 19 chiếc' },
        { code: 'SP005', name: 'Đồng Hồ Chronos Titanium', cat: 'Đồng Hồ & Kính', metric: 3250000, status: 'Còn hàng', note: 'Tồn kho: 11 chiếc' },
      ],
    };
  }

  // 4. NHÀ HÀNG / QUÁN CÀ PHÊ / TRÀ SỮA / POS
  if (p.includes('nhà hàng') || p.includes('cà phê') || p.includes('cafe') || p.includes('trà sữa') || p.includes('quán ăn') || p.includes('pos') || p.includes('menu')) {
    return {
      icon: '☕',
      title: 'F&B POS Pro — Quản Lý Quán & Thực Đơn',
      accent: '#f59e0b',
      itemLabel: 'Món Ăn / Đồ Uống',
      idPrefix: 'MN',
      isShop: true,
      fields: {
        codeLabel: 'Mã Món',
        nameLabel: 'Tên Món',
        catLabel: 'Nhóm Thực Đơn',
        categories: ['Cà Phê Đặc Sản', 'Trà Trái Cây', 'Món Chính', 'Tráng Miệng', 'Combo Nhóm'],
        metricLabel: 'Đơn Giá (VNĐ)',
        metricType: 'currency',
        statuses: ['Đang phục vụ', 'Món bán chạy', 'Tạm hết'],
      },
      extraTab: {
        title: '🪑 Sơ Đồ Bàn Đang Phục Vụ',
        cards: [
          { name: 'Bàn 01 — Khu Sân Vườn', sub: '4 khách • Tổng bill: 385.000đ', badge: 'Đang dùng' },
          { name: 'Bàn 02 — Tầng 2 Máy Lạnh', sub: '2 khách • Tổng bill: 165.000đ', badge: 'Đang dùng' },
          { name: 'Bàn 03 — Quầy Bar', sub: 'Trống • Đã dọn dẹp sạch sẽ', badge: 'Sẵn sàng' },
          { name: 'Bàn VIP 01 — Phòng Riêng', sub: '8 khách • Đặt trước 19:30', badge: 'Đã đặt' },
        ],
      },
      initialItems: [
        { code: 'MN001', name: 'Cold Brew Cam Sả Đặc Biệt', cat: 'Cà Phê Đặc Sản', metric: 55000, status: 'Món bán chạy', note: 'Đã bán 148 ly tuần này' },
        { code: 'MN002', name: 'Trà Đào Cam Sả Thanh Mát', cat: 'Trà Trái Cây', metric: 49000, status: 'Đang phục vụ', note: 'Size L +30% topping' },
        { code: 'MN003', name: 'Bít Tết Sốt Tiêu Đen Úc', cat: 'Món Chính', metric: 245000, status: 'Món bán chạy', note: 'Kèm khoai tây nghiền' },
        { code: 'MN004', name: 'Bánh Tiramisu Cacao Ý', cat: 'Tráng Miệng', metric: 65000, status: 'Đang phục vụ', note: 'Làm mới mỗi sáng' },
      ],
    };
  }

  // 5. KHÁCH SẠN / PHÒNG TRỌ / HOMESTAY
  if (p.includes('khách sạn') || p.includes('phòng trọ') || p.includes('homestay') || p.includes('hotel') || p.includes('thuê phòng')) {
    return {
      icon: '🏨',
      title: 'StayManage Pro — Quản Lý Phòng & Đặt Chỗ',
      accent: '#8b5cf6',
      itemLabel: 'Phòng',
      idPrefix: 'P',
      fields: {
        codeLabel: 'Số Phòng',
        nameLabel: 'Tên Phòng / Khách Thuê',
        catLabel: 'Hạng Phòng',
        categories: ['Suite Hướng Biển', 'Deluxe Đôi', 'Standard Đơn', 'Studio Ban Công'],
        metricLabel: 'Giá Thuê (VNĐ)',
        metricType: 'currency',
        statuses: ['Đang có khách', 'Phòng trống', 'Đang bảo trì'],
      },
      extraTab: {
        title: '🛎️ Lịch Check-in / Check-out Hôm Nay',
        cards: [
          { name: 'Check-in 14:00 — Phòng 302', sub: 'Đoàn khách Gia đình Minh Khang (2 đêm)', badge: 'Đã cọc 50%' },
          { name: 'Check-out 12:00 — Phòng 201', sub: 'Thanh toán phụ thu minibar: 120.000đ', badge: 'Chờ dọn' },
          { name: 'Yêu cầu dọn phòng — Phòng 405', sub: 'Thay ga giường & bổ sung nước suối', badge: 'Đang xử lý' },
        ],
      },
      initialItems: [
        { code: 'P101', name: 'Suite Ocean — Khách Trần Anh', cat: 'Suite Hướng Biển', metric: 2400000, status: 'Đang có khách', note: 'Check-out ngày 28/11' },
        { code: 'P102', name: 'Deluxe Garden View', cat: 'Deluxe Đôi', metric: 1350000, status: 'Phòng trống', note: 'Sẵn sàng đón khách ngay' },
        { code: 'P201', name: 'Studio Sunset — Khách Lê My', cat: 'Studio Ban Công', metric: 1650000, status: 'Đang có khách', note: 'Đã thanh toán toàn bộ' },
        { code: 'P205', name: 'Standard City Room', cat: 'Standard Đơn', metric: 850000, status: 'Đang bảo trì', note: 'Bảo dưỡng điều hòa' },
      ],
    };
  }

  // 6. TÀI CHÍNH / CHI TIÊU
  if (p.includes('chi tiêu') || p.includes('tài chính') || p.includes('ngân sách') || p.includes('thu chi') || p.includes('tiền')) {
    return {
      icon: '💰',
      title: 'FinTrack Pro — Quản Lý Tài Chính & Thu Chi',
      accent: '#10b981',
      itemLabel: 'Giao Dịch',
      idPrefix: 'GD',
      fields: {
        codeLabel: 'Mã GD',
        nameLabel: 'Nội Dung Giao Dịch',
        catLabel: 'Hạng Mục',
        categories: ['Thu nhập / Lương', 'Ăn uống & Sinh hoạt', 'Nhà cửa & Hóa đơn', 'Đầu tư & Tiết kiệm', 'Giải trí & Du lịch'],
        metricLabel: 'Số Tiền (VNĐ)',
        metricType: 'currency',
        statuses: ['Thu nhập (+)', 'Chi tiêu (-)', 'Đầu tư'],
      },
      extraTab: {
        title: '🎯 Mục Tiêu Tiết Kiệm',
        cards: [
          { name: 'Quỹ Dự Phòng Khẩn Cấp (6 Tháng)', sub: 'Đã đạt 45.000.000đ / 60.000.000đ', badge: '75%' },
          { name: 'Nâng Cấp Thiết Bị Làm Việc', sub: 'Đã đạt 18.500.000đ / 25.000.000đ', badge: '74%' },
          { name: 'Quỹ Du Lịch Cuối Năm', sub: 'Đã đạt 8.000.000đ / 12.000.000đ', badge: '66%' },
        ],
      },
      initialItems: [
        { code: 'GD001', name: 'Lương Tháng & Thưởng Dự Án', cat: 'Thu nhập / Lương', metric: 22500000, status: 'Thu nhập (+)', note: 'Tự động ghi nhận qua ngân hàng' },
        { code: 'GD002', name: 'Thuê Căn Hộ & Điện Nước', cat: 'Nhà cửa & Hóa đơn', metric: 5800000, status: 'Chi tiêu (-)', note: 'Thanh toán định kỳ đầu tháng' },
        { code: 'GD003', name: 'Chứng Chỉ Quỹ ETF Định Kỳ', cat: 'Đầu tư & Tiết kiệm', metric: 4000000, status: 'Đầu tư', note: 'Tích sản dài hạn' },
        { code: 'GD004', name: 'Siêu Thị & Thực Phẩm Tuần', cat: 'Ăn uống & Sinh hoạt', metric: 1350000, status: 'Chi tiêu (-)', note: 'Đã kiểm soát trong ngân sách' },
      ],
    };
  }

  // 7. UNIVERSAL PRO ENGINE CHO MỌI CHỦ ĐỀ BẤT KỲ
  const cleanTitle = prompt
    .replace(/^(tạo|làm|xây dựng|thiết kế|viết)\s+(1|một)?\s*(trang\s*web|website|web|ứng\s*dụng|app)?\s*/i, '')
    .trim() || prompt;

  return {
    icon: '🚀',
    title: `${cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)} — Pro Dashboard`,
    accent: '#f59e0b',
    itemLabel: 'Bản Ghi',
    idPrefix: 'ID',
    fields: {
      codeLabel: 'Mã Số',
      nameLabel: 'Tên / Tiêu Đề',
      catLabel: 'Phân Loại',
      categories: ['Nhóm Ưu Tiên Cao', 'Vận Hành Chính', 'Khách Hàng & Đối Tác', 'Kế Hoạch Mới'],
      metricLabel: 'Giá Trị / Điểm',
      metricType: 'currency',
      statuses: ['Đang hoạt động', 'Chờ xử lý', 'Hoàn tất'],
    },
    extraTab: {
      title: '📈 Báo Cáo & Quy Trình Nhanh',
      cards: [
        { name: 'Quy trình tự động hóa dữ liệu', sub: 'Đồng bộ thay đổi tức thì trên trình duyệt', badge: 'Đang bật' },
        { name: 'Thống kê hiệu suất theo thời gian thực', sub: 'Cập nhật KPI tự động khi thêm/xóa dữ liệu', badge: '100% Live' },
        { name: 'Xuất file báo cáo CSV Excel', sub: 'Hỗ trợ tải bảng dữ liệu về máy bất kỳ lúc nào', badge: 'Sẵn sàng' },
      ],
    },
    initialItems: [
      { code: 'ID001', name: `Hạng mục trọng tâm #1 (${cleanTitle})`, cat: 'Nhóm Ưu Tiên Cao', metric: 2500000, status: 'Đang hoạt động', note: 'Dữ liệu mẫu khởi tạo tự động' },
      { code: 'ID002', name: `Kế hoạch triển khai #2`, cat: 'Vận Hành Chính', metric: 1850000, status: 'Hoàn tất', note: 'Đã nghiệm thu chất lượng' },
      { code: 'ID003', name: `Hồ sơ mở rộng #3`, cat: 'Khách Hàng & Đối Tác', metric: 950000, status: 'Chờ xử lý', note: 'Sẵn sàng chỉnh sửa hoặc xóa' },
    ],
  };
}

/**
 * Xây dựng Ứng dụng Web Multi-Tab Chuyên Nghiệp, Đầy Đủ Chức Năng (Dashboard + Biểu đồ + CRUD + Giỏ hàng/Lịch + Xuất CSV + LocalStorage)
 */
export function generateProDomainWeb(prompt) {
  const bp = resolveDomainBlueprint(prompt);
  const safePrompt = escapeHtml(prompt);
  const safeTitle = escapeHtml(bp.title);
  const storageKey = 'vibe_app_' + encodeURIComponent(bp.idPrefix + '_' + prompt.slice(0, 20));

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: ${bp.accent};
      --bg: #08080f;
      --surface: #11111b;
      --surface-2: #181826;
      --line: rgba(255, 255, 255, 0.09);
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    body.light {
      --bg: #f1f5f9;
      --surface: #ffffff;
      --surface-2: #f8fafc;
      --line: rgba(15, 23, 42, 0.1);
      --text: #0f172a;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; transition: background .2s, color .2s; }
    button { user-select: none; font-family: inherit; }

    /* App Layout */
    .app-shell { max-width: 1180px; margin: 0 auto; padding: 20px; }
    .topbar {
      display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
      padding: 16px 20px; background: var(--surface); border: 1px solid var(--line);
      border-radius: 16px; margin-bottom: 18px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center;
      font-size: 21px; background: rgba(245, 158, 11, 0.14); border: 1px solid var(--accent);
    }
    .brand h1 { font-size: 18px; font-weight: 800; line-height: 1.25; }
    .brand p { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .top-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .btn {
      height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line);
      background: var(--surface-2); color: var(--text); font-size: 12.5px; font-weight: 700;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: .15s;
    }
    .btn:hover { border-color: var(--accent); }
    .btn-primary { background: var(--accent); color: #09090f; border-color: var(--accent); }
    .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }

    /* Navigation Tabs */
    .nav-tabs { display: flex; gap: 8px; margin-bottom: 18px; overflow-x: auto; padding-bottom: 2px; }
    .nav-tab {
      padding: 9px 16px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface);
      color: var(--muted); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: .15s;
    }
    .nav-tab.active { background: var(--accent); color: #09090f; border-color: var(--accent); }

    /* KPI Stats */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
    @media (max-width: 780px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card {
      background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px;
    }
    .kpi-label { font-size: 11.5px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-val { font-size: 23px; font-weight: 800; margin-top: 6px; }
    .kpi-sub { font-size: 11px; color: #34d399; margin-top: 4px; font-weight: 600; }

    /* Panels */
    .panel {
      background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 18px; margin-bottom: 18px;
    }
    .panel-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .panel-title { font-size: 15px; font-weight: 800; }

    /* Form Grid */
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; align-items: end; }
    .field label { display: block; font-size: 11.5px; color: var(--muted); font-weight: 700; margin-bottom: 5px; }
    .field input, .field select {
      width: 100%; height: 38px; padding: 0 12px; border-radius: 9px;
      border: 1px solid var(--line); background: var(--surface-2); color: var(--text); font-size: 13px;
    }
    .field input:focus, .field select:focus { outline: none; border-color: var(--accent); }

    /* Search & Filter Toolbar */
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
    .search-input {
      flex: 1; min-width: 200px; height: 38px; padding: 0 14px; border-radius: 10px;
      border: 1px solid var(--line); background: var(--surface-2); color: var(--text); font-size: 13px;
    }
    .select-input {
      height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line);
      background: var(--surface-2); color: var(--text); font-size: 13px;
    }

    /* Data Table */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { padding: 11px 12px; color: var(--muted); font-size: 11.5px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
    td { padding: 11px 12px; border-bottom: 1px solid var(--line); vertical-align: middle; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .pill { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; display: inline-block; white-space: nowrap; }
    .pill-ok { background: rgba(16,185,129,0.16); color: #34d399; border: 1px solid rgba(16,185,129,0.35); }
    .pill-warn { background: rgba(245,158,11,0.16); color: #fbbf24; border: 1px solid rgba(245,158,11,0.35); }
    .pill-bad { background: rgba(239,68,68,0.16); color: #f87171; border: 1px solid rgba(239,68,68,0.35); }
    .act-btn {
      padding: 5px 9px; border-radius: 7px; border: 1px solid var(--line); background: var(--surface-2);
      color: var(--text); font-size: 11.5px; font-weight: 600; cursor: pointer; margin-right: 4px;
    }
    .act-btn:hover { border-color: var(--accent); }
    .act-btn.del:hover { border-color: #ef4444; color: #f87171; }

    /* Analytics Bar Chart */
    .chart-list { display: flex; flex-direction: column; gap: 12px; }
    .chart-row { display: flex; flex-direction: column; gap: 5px; }
    .chart-meta { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; }
    .chart-track { height: 10px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
    .chart-fill { height: 100%; border-radius: 999px; background: var(--accent); transition: width .35s ease; }

    /* Extra Cards Grid */
    .extra-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .extra-card {
      background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 14px;
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
    }

    /* Toast */
    .toast {
      position: fixed; bottom: 18px; right: 18px; padding: 10px 16px; border-radius: 10px;
      background: #10b981; color: #052e16; font-weight: 800; font-size: 12.5px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4); opacity: 0; pointer-events: none; transition: .2s; z-index: 999;
    }
    .toast.show { opacity: 1; transform: translateY(-4px); }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="app-shell">
    <!-- Top Header -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-icon">${bp.icon}</div>
        <div>
          <h1>${safeTitle}</h1>
          <p>Prompt: "${safePrompt}"</p>
        </div>
      </div>
      <div class="top-actions">
        <button type="button" class="btn" onclick="window.toggleTheme()">🌓 Sáng/Tối</button>
        <button type="button" class="btn" onclick="window.exportCsv()">📥 Xuất CSV</button>
        <button type="button" class="btn" onclick="window.resetData()">↺ Dữ Liệu Mẫu</button>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
      <button type="button" class="nav-tab active" data-tab="manage" onclick="window.switchTab('manage')">📋 Quản Lý ${escapeHtml(bp.itemLabel)}</button>
      <button type="button" class="nav-tab" data-tab="analytics" onclick="window.switchTab('analytics')">📊 Thống Kê & Biểu Đồ</button>
      <button type="button" class="nav-tab" data-tab="extra" onclick="window.switchTab('extra')">${escapeHtml(bp.extraTab.title)}</button>
    </nav>

    <!-- Live KPI Bar -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Tổng ${escapeHtml(bp.itemLabel)}</div>
        <div class="kpi-val" id="kpi-total">0</div>
        <div class="kpi-sub">Cập nhật thời gian thực</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Trạng Thái Tích Cực</div>
        <div class="kpi-val" id="kpi-active" style="color:#34d399;">0</div>
        <div class="kpi-sub">Đang vận hành tốt</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${bp.fields.metricType === 'gpa' ? 'GPA Trung Bình' : 'Tổng Giá Trị'}</div>
        <div class="kpi-val" id="kpi-metric" style="color:var(--accent);">0</div>
        <div class="kpi-sub">Tự động tính toán</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cần Chú Ý / Chờ</div>
        <div class="kpi-val" id="kpi-warn" style="color:#f87171;">0</div>
        <div class="kpi-sub">Theo dõi xử lý</div>
      </div>
    </section>

    <!-- TAB 1: QUẢN LÝ CRUD -->
    <main id="tab-manage">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title" id="form-heading">➕ Thêm ${escapeHtml(bp.itemLabel)} Mới</h2>
          <button type="button" id="cancel-edit-btn" class="btn hidden" onclick="window.cancelEdit()">Hủy sửa</button>
        </div>
        <form id="main-form" class="form-grid" onsubmit="return window.saveRecord(event)">
          <div class="field">
            <label>${escapeHtml(bp.fields.codeLabel)}</label>
            <input id="f-code" placeholder="VD: ${bp.idPrefix}009" required />
          </div>
          <div class="field">
            <label>${escapeHtml(bp.fields.nameLabel)}</label>
            <input id="f-name" placeholder="Nhập tên chi tiết..." required />
          </div>
          <div class="field">
            <label>${escapeHtml(bp.fields.catLabel)}</label>
            <select id="f-cat">
              ${bp.fields.categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>${escapeHtml(bp.fields.metricLabel)}</label>
            <input id="f-metric" type="number" step="any" min="0" placeholder="${bp.fields.metricType === 'gpa' ? '3.5' : '500000'}" required />
          </div>
          <div class="field">
            <label>Trạng Thái</label>
            <select id="f-status">
              ${bp.fields.statuses.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Ghi Chú</label>
            <input id="f-note" placeholder="SĐT / ghi chú nhanh..." />
          </div>
          <button type="button" id="save-btn" class="btn btn-primary" onclick="window.saveRecord(event)">✓ Lưu ${escapeHtml(bp.itemLabel)}</button>
        </form>
      </div>

      <div class="panel">
        <div class="toolbar">
          <input id="q-search" class="search-input" placeholder="🔍 Tìm kiếm theo mã, tên hoặc ghi chú..." oninput="window.renderAll()" />
          <select id="q-cat" class="select-input" onchange="window.renderAll()">
            <option value="all">Tất cả phân loại</option>
            ${bp.fields.categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
          <select id="q-status" class="select-input" onchange="window.renderAll()">
            <option value="all">Tất cả trạng thái</option>
            ${bp.fields.statuses.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(bp.fields.codeLabel)}</th>
                <th>${escapeHtml(bp.fields.nameLabel)}</th>
                <th>${escapeHtml(bp.fields.catLabel)}</th>
                <th>${escapeHtml(bp.fields.metricLabel)}</th>
                <th>Trạng Thái</th>
                <th>Ghi Chú</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="table-body"></tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- TAB 2: THỐNG KÊ & BIỂU ĐỒ -->
    <section id="tab-analytics" class="panel hidden">
      <div class="panel-head">
        <h2 class="panel-title">📊 Phân Bổ Theo ${escapeHtml(bp.fields.catLabel)}</h2>
      </div>
      <div class="chart-list" id="chart-container"></div>
    </section>

    <!-- TAB 3: NGHIỆP VỤ MỞ RỘNG -->
    <section id="tab-extra" class="panel hidden">
      <div class="panel-head">
        <h2 class="panel-title">${escapeHtml(bp.extraTab.title)}</h2>
      </div>
      <div class="extra-grid">
        ${bp.extraTab.cards.map((card) => `
          <div class="extra-card">
            <div>
              <strong style="font-size:14px;">${escapeHtml(card.name)}</strong>
              <p style="font-size:12px;color:var(--muted);margin-top:4px;">${escapeHtml(card.sub)}</p>
            </div>
            <span class="pill pill-ok">${escapeHtml(card.badge)}</span>
          </div>
        `).join('')}
      </div>
    </section>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    const STORAGE_KEY = ${JSON.stringify(storageKey)};
    const METRIC_TYPE = ${JSON.stringify(bp.fields.metricType)};
    const STATUSES = ${JSON.stringify(bp.fields.statuses)};
    const CATEGORIES = ${JSON.stringify(bp.fields.categories)};
    const DEFAULT_ITEMS = ${JSON.stringify(bp.initialItems)};

    let items = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      items = saved ? JSON.parse(saved) : [...DEFAULT_ITEMS];
      if (!Array.isArray(items) || !items.length) items = [...DEFAULT_ITEMS];
    } catch {
      items = [...DEFAULT_ITEMS];
    }

    let editIdx = -1;

    function persist() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
    }

    function notify(msg, isErr) {
      const t = document.getElementById('toast');
      t.style.background = isErr ? '#ef4444' : '#10b981';
      t.style.color = isErr ? '#fff' : '#052e16';
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
    }

    function formatMetric(val) {
      const num = Number(val) || 0;
      if (METRIC_TYPE === 'gpa') return num.toFixed(2);
      return num.toLocaleString('vi-VN') + 'đ';
    }

    function getPillClass(st) {
      if (st === STATUSES[0]) return 'pill-ok';
      if (st === STATUSES[1]) return 'pill-warn';
      return 'pill-bad';
    }

    window.switchTab = (tabId) => {
      document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });
      ['manage', 'analytics', 'extra'].forEach(id => {
        document.getElementById('tab-' + id).classList.toggle('hidden', id !== tabId);
      });
    };

    window.toggleTheme = () => {
      document.body.classList.toggle('light');
    };

    window.renderAll = () => {
      const q = document.getElementById('q-search').value.toLowerCase().trim();
      const cat = document.getElementById('q-cat').value;
      const st = document.getElementById('q-status').value;

      const filtered = items.filter(it =>
        (cat === 'all' || it.cat === cat) &&
        (st === 'all' || it.status === st) &&
        (it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q) || (it.note || '').toLowerCase().includes(q))
      );

      // Update KPIs
      document.getElementById('kpi-total').textContent = items.length;
      document.getElementById('kpi-active').textContent = items.filter(i => i.status === STATUSES[0]).length;
      document.getElementById('kpi-warn').textContent = items.filter(i => i.status !== STATUSES[0]).length;

      if (METRIC_TYPE === 'gpa') {
        const avg = items.length ? items.reduce((s, i) => s + Number(i.metric || 0), 0) / items.length : 0;
        document.getElementById('kpi-metric').textContent = avg.toFixed(2);
      } else {
        const total = items.reduce((s, i) => s + Number(i.metric || 0), 0);
        document.getElementById('kpi-metric').textContent = total.toLocaleString('vi-VN') + 'đ';
      }

      // Render Table
      const tbody = document.getElementById('table-body');
      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--muted);">Không tìm thấy dữ liệu phù hợp.</td></tr>';
      } else {
        tbody.innerHTML = filtered.map(it => {
          const idx = items.indexOf(it);
          return '<tr>' +
            '<td><strong>' + it.code + '</strong></td>' +
            '<td><strong>' + it.name + '</strong></td>' +
            '<td>' + it.cat + '</td>' +
            '<td style="font-weight:700;color:var(--accent);">' + formatMetric(it.metric) + '</td>' +
            '<td><span class="pill ' + getPillClass(it.status) + '">' + it.status + '</span></td>' +
            '<td style="color:var(--muted);font-size:12px;">' + (it.note || '—') + '</td>' +
            '<td>' +
              '<button type="button" class="act-btn" onclick="window.startEdit(' + idx + ')">Sửa</button>' +
              '<button type="button" class="act-btn del" onclick="window.removeRow(' + idx + ')">Xóa</button>' +
            '</td>' +
          '</tr>';
        }).join('');
      }

      // Render Analytics Bars
      const totalCount = items.length || 1;
      document.getElementById('chart-container').innerHTML = CATEGORIES.map(c => {
        const count = items.filter(i => i.cat === c).length;
        const pct = Math.round((count / totalCount) * 100);
        return '<div class="chart-row">' +
          '<div class="chart-meta"><span>' + c + '</span><span>' + count + ' mục (' + pct + '%)</span></div>' +
          '<div class="chart-track"><div class="chart-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
      }).join('');
    };

    window.saveRecord = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const code = document.getElementById('f-code').value.trim().toUpperCase();
      const name = document.getElementById('f-name').value.trim();
      const metricRaw = document.getElementById('f-metric').value;

      if (!code || !name || metricRaw === '') {
        notify('⚠ Vui lòng nhập đầy đủ Mã, Tên và Giá trị!', true);
        return false;
      }

      let metricVal = parseFloat(metricRaw) || 0;
      if (METRIC_TYPE === 'gpa') metricVal = Math.min(4, Math.max(0, metricVal));

      const rec = {
        code,
        name,
        cat: document.getElementById('f-cat').value,
        metric: metricVal,
        status: document.getElementById('f-status').value,
        note: document.getElementById('f-note').value.trim() || 'Cập nhật vừa xong'
      };

      if (editIdx >= 0) {
        items[editIdx] = rec;
        notify('✓ Đã cập nhật ' + rec.name);
        window.cancelEdit();
      } else {
        items.unshift(rec);
        notify('✓ Đã thêm mới ' + rec.name);
        document.getElementById('main-form').reset();
      }

      persist();
      window.renderAll();
      return false;
    };

    window.startEdit = (idx) => {
      const it = items[idx];
      editIdx = idx;
      document.getElementById('f-code').value = it.code;
      document.getElementById('f-name').value = it.name;
      document.getElementById('f-cat').value = it.cat;
      document.getElementById('f-metric').value = it.metric;
      document.getElementById('f-status').value = it.status;
      document.getElementById('f-note').value = it.note || '';
      document.getElementById('form-heading').textContent = '✏️ Đang Sửa: ' + it.code;
      document.getElementById('save-btn').textContent = '✓ Cập Nhật';
      document.getElementById('cancel-edit-btn').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelEdit = () => {
      editIdx = -1;
      document.getElementById('main-form').reset();
      document.getElementById('form-heading').textContent = '➕ Thêm ${escapeHtml(bp.itemLabel)} Mới';
      document.getElementById('save-btn').textContent = '✓ Lưu ${escapeHtml(bp.itemLabel)}';
      document.getElementById('cancel-edit-btn').classList.add('hidden');
    };

    window.removeRow = (idx) => {
      const removed = items.splice(idx, 1)[0];
      if (editIdx === idx) window.cancelEdit();
      persist();
      window.renderAll();
      notify('🗑 Đã xóa ' + (removed?.name || 'dữ liệu'));
    };

    window.resetData = () => {
      items = [...DEFAULT_ITEMS];
      window.cancelEdit();
      persist();
      window.renderAll();
      notify('↺ Đã khôi phục dữ liệu mẫu');
    };

    window.exportCsv = () => {
      const header = ['Ma', 'Ten', 'PhanLoai', 'GiaTri', 'TrangThai', 'GhiChu'].join(',');
      const rows = items.map(i => [i.code, i.name, i.cat, i.metric, i.status, i.note].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(','));
      const blob = new Blob(['\\uFEFF' + [header, ...rows].join('\\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '${bp.idPrefix}_data_export.csv';
      a.click();
      notify('📥 Đã xuất file CSV thành công!');
    };

    window.renderAll();
  </script>
</body>
</html>`;
}

/**
 * Xây dựng Trang Web Giới Thiệu / Showcase / Gaming Hub hiện đại (Hero + Bộ lọc + Lưới Card + Modal Chi tiết + Yêu thích)
 */
export function buildShowcaseWebApp(prompt) {
  const p = prompt.toLowerCase();
  const isGame = p.includes('game') || p.includes('trò chơi') || p.includes('aaa') || p.includes('esport');

  const cleanTopic = escapeHtml(
    prompt
      .replace(/^(tạo|làm|xây dựng|thiết kế|viết)\s+(1|một)?\s*(trang\s*web|website|web|ứng\s*dụng|app)?\s*(giới\s*thiệu\s*(về)?)?\s*/i, '')
      .trim() || prompt
  );

  const heroTitle = isGame
    ? 'Khám Phá Thế Giới Game AAA Đỉnh Cao Hiện Nay'
    : `Khám Phá & Giới Thiệu: ${cleanTopic}`;

  const heroDesc = isGame
    ? 'Tuyển tập những bom tấn thế giới mở, nhập vai hành động và eSports đình đám nhất được cộng đồng game thủ đánh giá cao.'
    : `Chuyên trang giới thiệu chi tiết, đánh giá chuyên sâu và trải nghiệm trực quan về ${cleanTopic}.`;

  const items = isGame
    ? [
        {
          id: 1,
          icon: '🐒',
          badge: 'BOM TẤN 2024-2026',
          title: 'Black Myth: Wukong',
          cat: 'Hành Động RPG',
          rating: '9.6',
          platforms: 'PC • PS5',
          gradient: 'linear-gradient(135deg, #b45309, #7c2d12)',
          short: 'Tựa game nhập vai hành động lấy cảm hứng từ Tây Du Ký với đồ họa Unreal Engine 5 choáng ngợp.',
          detail: 'Hóa thân thành Thiên Mệnh Nhân bước vào hành trình khám phá những bí ẩn thần thoại phương Đông. Hệ thống chiến đấu biến hóa 72 phép thần thông, boss thiết kế công phu và âm nhạc sử thi mãn nhãn.',
          specs: ['Nhà phát triển: Game Science', 'Đồ họa: Unreal Engine 5', 'Thể loại: Action RPG', 'Dung lượng: ~130 GB'],
        },
        {
          id: 2,
          icon: '⚔️',
          badge: 'GAME OF THE YEAR',
          title: 'Elden Ring: Shadow of the Erdtree',
          cat: 'Thế Giới Mở',
          rating: '9.8',
          platforms: 'PC • PS5 • Xbox',
          gradient: 'linear-gradient(135deg, #ca8a04, #3f2e05)',
          short: 'Siêu phẩm Soulslike thế giới mở rộng lớn nhất từ FromSoftware và George R.R. Martin.',
          detail: 'Đặt chân đến Vùng Đất Bóng Tối với hàng trăm vũ khí, phép thuật mới và những trận đấu trùm thử thách kỹ năng cực độ. Tự do khám phá không giới hạn.',
          specs: ['Nhà phát triển: FromSoftware', 'Đánh giá: 96/100 Metacritic', 'Chế độ: Đơn & Co-op Online', 'Thế giới mở: Cực lớn'],
        },
        {
          id: 3,
          icon: '🦾',
          badge: 'NEXT-GEN GRAPHICS',
          title: 'Cyberpunk 2077: Phantom Liberty',
          cat: 'Hành Động RPG',
          rating: '9.4',
          platforms: 'PC • PS5 • Xbox',
          gradient: 'linear-gradient(135deg, #be185d, #3b0764)',
          short: 'Phiêu lưu trong thành phố Night City rực rỡ ánh đèn neon với cốt truyện điệp viên nghẹt thở.',
          detail: 'Hỗ trợ Ray Tracing toàn phần tạo nên một thành phố tương lai sống động bậc nhất lịch sử ngành game. Tùy biến nhân vật Cyberware đa dạng.',
          specs: ['Nhà phát triển: CD Projekt Red', 'Công nghệ: Path Tracing DLSS 3.5', 'Bản đồ: Night City & Dogtown', 'Cốt truyện: Nhiều kết thúc'],
        },
        {
          id: 4,
          icon: '🐉',
          badge: 'SIÊU PHẨM NHẬP VAI',
          title: "Baldur's Gate 3",
          cat: 'Chiến Thuật & Cốt Truyện',
          rating: '9.9',
          platforms: 'PC • PS5 • Mac',
          gradient: 'linear-gradient(135deg, #991b1b, #1e1b4b)',
          short: 'Kiệt tác nhập vai theo lượt với hơn 17.000 biến thể kết thúc tùy thuộc vào từng lựa chọn của bạn.',
          detail: 'Xây dựng tổ đội anh hùng theo luật Dungeons & Dragons 5e. Mọi quyết định hội thoại hay chiến thuật đều làm thay đổi hoàn toàn thế giới xung quanh.',
          specs: ['Nhà phát triển: Larian Studios', 'Thời lượng: 100+ giờ chơi', 'Co-op: Tối đa 4 người', 'Giải thưởng: 5x GOTY'],
        },
        {
          id: 5,
          icon: '🎯',
          badge: 'ESPORTS TOP 1',
          title: 'Valorant',
          cat: 'Esports / FPS',
          rating: '9.1',
          platforms: 'PC • Console',
          gradient: 'linear-gradient(135deg, #dc2626, #18181b)',
          short: 'Game bắn súng chiến thuật 5v5 kết hợp kỹ năng đặc vụ siêu mượt ở tốc độ 128-tick.',
          detail: 'Yêu cầu phản xạ chuẩn xác cùng khả năng phối hợp chiến thuật đồng đội đỉnh cao. Hệ thống giải đấu VCT toàn cầu sôi động quanh năm.',
          specs: ['Nhà phát triển: Riot Games', 'Thể loại: Tactical Shooter 5v5', 'Chống gian lận: Vanguard', 'Miễn phí: Free-to-Play'],
        },
        {
          id: 6,
          icon: '🌌',
          badge: 'ĐỒ HỌA ANIME',
          title: 'Genshin Impact',
          cat: 'Thế Giới Mở',
          rating: '9.2',
          platforms: 'PC • Mobile • PS5',
          gradient: 'linear-gradient(135deg, #0284c7, #312e81)',
          short: 'Thế giới Teyvat rộng lớn với 7 quốc gia nguyên tố, cập nhật cốt truyện liên tục đa nền tảng.',
          detail: 'Kết hợp phản ứng nguyên tố độc đáo giữa 4 nhân vật trong đội hình. Hỗ trợ chơi chéo (Cross-play) mượt mà giữa điện thoại và máy tính.',
          specs: ['Nhà phát triển: HoYoverse', 'Nền tảng: Đa nền tảng', 'Cập nhật: Chu kỳ 6 tuần', 'Âm nhạc: Dàn nhạc giao hưởng'],
        },
      ]
    : [
        {
          id: 1,
          icon: '🌟',
          badge: 'NỔI BẬT #1',
          title: `Xu Hướng Hàng Đầu: ${cleanTopic}`,
          cat: 'Tiêu Điểm',
          rating: '9.7',
          platforms: 'Phổ Biến Nhất',
          gradient: 'linear-gradient(135deg, #f59e0b, #78350f)',
          short: `Tổng hợp những điểm sáng nổi bật nhất hiện nay xoay quanh chủ đề ${cleanTopic}.`,
          detail: `Đây là chuyên mục nổi bật cung cấp góc nhìn toàn diện, trực quan và cập nhật nhất về ${cleanTopic} dành cho người mới lẫn chuyên gia.`,
          specs: ['Trạng thái: Đang thịnh hành', 'Độ tin cậy: Xác thực', 'Cập nhật: Mới nhất 2026', 'Đánh giá cộng đồng: 9.7/10'],
        },
        {
          id: 2,
          icon: '🚀',
          badge: 'ĐỔI MỚI SÁNG TẠO',
          title: `Công Nghệ & Trải Nghiệm Mới`,
          cat: 'Xu Hướng Mới',
          rating: '9.5',
          platforms: 'Đột Phá',
          gradient: 'linear-gradient(135deg, #0ea5e9, #1e3a8a)',
          short: 'Những bước tiến vượt bậc giúp nâng cao chất lượng và hiệu suất trải nghiệm thực tế.',
          detail: 'Khám phá cách các xu hướng mới đang thay đổi thói quen người dùng và mở ra nhiều cơ hội sáng tạo hấp dẫn.',
          specs: ['Tốc độ tiếp cận: Nhanh', 'Tính ứng dụng: Thực tiễn cao', 'Hỗ trợ: Đa thiết bị', 'Đánh giá: 9.5/10'],
        },
        {
          id: 3,
          icon: '💎',
          badge: 'TUYỂN CHỌN',
          title: 'Bộ Sưu Tập Chất Lượng Cao',
          cat: 'Đánh Giá Cao',
          rating: '9.6',
          platforms: 'Khuyên Dùng',
          gradient: 'linear-gradient(135deg, #8b5cf6, #3b0764)',
          short: 'Được tuyển chọn kỹ lưỡng dựa trên phản hồi tích cực của hàng nghìn người dùng.',
          detail: 'Mỗi lựa chọn trong danh sách đều trải qua quá trình đánh giá thực tế về chất lượng, độ bền vững và giá trị mang lại.',
          specs: ['Tiêu chuẩn: Cao cấp', 'Phản hồi: 98% Tích cực', 'Trải nghiệm: Mượt mà', 'Phân loại: Tuyển chọn'],
        },
        {
          id: 4,
          icon: '🔥',
          badge: 'CỘNG ĐỒNG YÊU THÍCH',
          title: 'Góc Nhìn Cộng Đồng & Thảo Luận',
          cat: 'Tiêu Điểm',
          rating: '9.3',
          platforms: 'Tương Tác',
          gradient: 'linear-gradient(135deg, #10b981, #064e3b)',
          short: 'Nơi chia sẻ kinh nghiệm thực tế, mẹo hay và bảng xếp hạng từ người dùng thật.',
          detail: 'Kết nối cùng những người có chung đam mê để trao đổi, học hỏi và cập nhật thông tin nóng hổi mỗi ngày.',
          specs: ['Thành viên: Năng động', 'Nội dung: Miễn phí', 'Chia sẻ: Mở rộng', 'Mức độ hài lòng: 9.3/10'],
        },
      ];

  const categories = ['Tất cả', ...Array.from(new Set(items.map((i) => i.cat)))];

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heroTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    body { background: #07070d; color: #f8fafc; min-height: 100vh; }
    button { user-select: none; font-family: inherit; }

    /* Navbar */
    .nav {
      position: sticky; top: 0; z-index: 40;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 14px 28px; background: rgba(7, 7, 13, 0.85); backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .logo { font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #ffffff; }
    .logo span { color: #f59e0b; }
    .fav-pill {
      background: rgba(245,158,11,0.14); border: 1px solid rgba(245,158,11,0.4);
      color: #fde68a; padding: 7px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 700; cursor: pointer;
    }

    /* Hero Banner */
    .hero {
      position: relative; padding: 48px 28px 36px; text-align: center;
      background: radial-gradient(circle at top center, rgba(245, 158, 11, 0.16), rgba(139, 92, 246, 0.08) 45%, transparent 75%);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .hero-badge {
      display: inline-block; padding: 5px 14px; border-radius: 999px; font-size: 11.5px; font-weight: 800;
      letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 14px;
      background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #fbbf24;
    }
    .hero h1 { font-size: clamp(26px, 4vw, 40px); font-weight: 800; line-height: 1.2; max-width: 780px; margin: 0 auto 12px; }
    .hero p { font-size: 15px; color: #94a3b8; max-width: 640px; margin: 0 auto 24px; line-height: 1.6; }

    /* Search & Filter Bar */
    .filter-bar {
      max-width: 1100px; margin: 26px auto 0; padding: 0 24px;
      display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
    }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .tab-btn {
      padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04); color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer; transition: .15s;
    }
    .tab-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .tab-btn.active { background: #f59e0b; color: #1a1006; border-color: #f59e0b; font-weight: 800; }
    .search-input {
      height: 40px; min-width: 240px; padding: 0 16px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); color: #fff; font-size: 13px;
    }
    .search-input:focus { outline: none; border-color: #f59e0b; }

    /* Showcase Grid */
    .grid {
      max-width: 1100px; margin: 22px auto 48px; padding: 0 24px;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
    }
    .card {
      background: #11111b; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;
      overflow: hidden; display: flex; flex-direction: column; transition: transform .2s, border-color .2s;
    }
    .card:hover { transform: translateY(-4px); border-color: rgba(245, 158, 11, 0.5); }
    .card-cover {
      height: 150px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;
      position: relative;
    }
    .cover-top { display: flex; justify-content: space-between; align-items: center; }
    .cover-badge {
      background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 6px;
      font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px; color: #fde68a;
    }
    .cover-icon { font-size: 46px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.45)); align-self: center; margin-bottom: 6px; }
    .card-body { padding: 18px; flex: 1; display: flex; flex-direction: column; }
    .card-meta { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: 600; }
    .rating { color: #fbbf24; font-weight: 800; }
    .card-title { font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
    .card-desc { font-size: 13.5px; color: #94a3b8; line-height: 1.55; margin-bottom: 16px; flex: 1; }
    .card-actions { display: flex; gap: 8px; }
    .btn-detail {
      flex: 1; height: 38px; border-radius: 10px; border: none; background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #1a1006; font-weight: 800; font-size: 13px; cursor: pointer;
    }
    .btn-fav {
      width: 42px; height: 38px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.04); color: #cbd5e1; font-size: 16px; cursor: pointer;
    }
    .btn-fav.is-fav { background: rgba(239,68,68,0.18); border-color: #ef4444; color: #f87171; }

    /* Detail Modal */
    .modal-bg {
      position: fixed; inset: 0; background: rgba(0,0,0,0.78); backdrop-filter: blur(8px);
      display: none; place-items: center; padding: 20px; z-index: 100;
    }
    .modal-bg.open { display: grid; }
    .modal-box {
      width: 100%; max-width: 560px; background: #12121e; border: 1px solid rgba(245,158,11,0.4);
      border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.8);
    }
    .modal-head { padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; }
    .modal-close { background: rgba(0,0,0,0.4); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; }
    .modal-content { padding: 22px 24px; }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
    .spec-item { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 10px 12px; border-radius: 10px; font-size: 12.5px; color: #e2e8f0; }

    footer { text-align: center; padding: 24px; color: #64748b; font-size: 12.5px; border-top: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="logo">${isGame ? '🎮' : '✨'} <span>${isGame ? 'GameHub' : 'Showcase'}</span> Explorer</div>
    <button type="button" class="fav-pill" onclick="window.toggleFavFilter()">♥ Đã thích (<span id="fav-count">0</span>)</button>
  </nav>

  <header class="hero">
    <span class="hero-badge">${isGame ? '🔥 Bảng Xếp Hạng Game Đỉnh Cao' : '✨ Chuyên Trang Giới Thiệu'}</span>
    <h1>${escapeHtml(heroTitle)}</h1>
    <p>${escapeHtml(heroDesc)}</p>
  </header>

  <section class="filter-bar">
    <div class="tabs" id="cat-tabs">
      ${categories.map((c, idx) => `<button type="button" class="tab-btn ${idx === 0 ? 'active' : ''}" onclick="window.setCat('${escapeHtml(c)}', this)">${escapeHtml(c)}</button>`).join('')}
    </div>
    <input id="search-box" class="search-input" placeholder="🔍 Tìm kiếm nhanh..." oninput="window.renderCards()" />
  </section>

  <main class="grid" id="cards-grid"></main>

  <div class="modal-bg" id="detail-modal" onclick="window.closeDetail()">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div class="modal-head" id="m-cover">
        <div>
          <span class="cover-badge" id="m-badge"></span>
          <h2 id="m-title" style="margin-top:8px;font-size:22px;font-weight:800;"></h2>
        </div>
        <button type="button" class="modal-close" onclick="window.closeDetail()">✕</button>
      </div>
      <div class="modal-content">
        <p id="m-detail" style="font-size:14px;color:#cbd5e1;line-height:1.65;"></p>
        <div class="spec-grid" id="m-specs"></div>
      </div>
    </div>
  </div>

  <footer>Được tạo tự động theo yêu cầu: "${escapeHtml(prompt)}"</footer>

  <script>
    const ITEMS = ${JSON.stringify(items)};
    let activeCat = 'Tất cả';
    let favOnly = false;
    let favIds = [];

    window.setCat = (cat, btn) => {
      activeCat = cat;
      favOnly = false;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      window.renderCards();
    };

    window.toggleFavFilter = () => {
      favOnly = !favOnly;
      window.renderCards();
    };

    window.toggleFav = (id) => {
      if (favIds.includes(id)) favIds = favIds.filter(x => x !== id);
      else favIds.push(id);
      document.getElementById('fav-count').textContent = favIds.length;
      window.renderCards();
    };

    window.openDetail = (id) => {
      const it = ITEMS.find(x => x.id === id);
      if (!it) return;
      document.getElementById('m-cover').style.background = it.gradient;
      document.getElementById('m-badge').textContent = it.badge;
      document.getElementById('m-title').textContent = it.icon + ' ' + it.title;
      document.getElementById('m-detail').textContent = it.detail;
      document.getElementById('m-specs').innerHTML = it.specs.map(s => '<div class="spec-item">• ' + s + '</div>').join('');
      document.getElementById('detail-modal').classList.add('open');
    };

    window.closeDetail = () => {
      document.getElementById('detail-modal').classList.remove('open');
    };

    window.renderCards = () => {
      const q = document.getElementById('search-box').value.toLowerCase().trim();
      const filtered = ITEMS.filter(it =>
        (activeCat === 'Tất cả' || it.cat === activeCat) &&
        (!favOnly || favIds.includes(it.id)) &&
        (it.title.toLowerCase().includes(q) || it.short.toLowerCase().includes(q) || it.cat.toLowerCase().includes(q))
      );

      const grid = document.getElementById('cards-grid');
      if (!filtered.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;">Không tìm thấy mục nào phù hợp.</div>';
        return;
      }

      grid.innerHTML = filtered.map(it => {
        const isFav = favIds.includes(it.id);
        return '<article class="card">' +
          '<div class="card-cover" style="background:' + it.gradient + '">' +
            '<div class="cover-top"><span class="cover-badge">' + it.badge + '</span><span class="cover-badge">★ ' + it.rating + '</span></div>' +
            '<div class="cover-icon">' + it.icon + '</div>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="card-meta"><span>' + it.cat + '</span><span class="rating">' + it.platforms + '</span></div>' +
            '<h3 class="card-title">' + it.title + '</h3>' +
            '<p class="card-desc">' + it.short + '</p>' +
            '<div class="card-actions">' +
              '<button type="button" class="btn-detail" onclick="window.openDetail(' + it.id + ')">Xem Chi Tiết</button>' +
              '<button type="button" class="btn-fav ' + (isFav ? 'is-fav' : '') + '" onclick="window.toggleFav(' + it.id + ')">' + (isFav ? '♥' : '♡') + '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');
    };

    window.renderCards();
  </script>
</body>
</html>`;
}

