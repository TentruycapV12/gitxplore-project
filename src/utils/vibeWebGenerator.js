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

/**
 * Sinh trang web hoàn chỉnh trực tiếp từ Prompt thông qua AI Backend,
 * kết hợp kiểm tra hợp lệ chặt chẽ & Bộ máy Tạo Web Chuyên Sâu dự phòng 100%.
 */
export async function generateWebFromPrompt(userPrompt) {
  const cleanPrompt = (userPrompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Vui lòng nhập mô tả trang web bạn muốn tạo.');
  }

  const generationPrompt = [
    'Bạn là Kỹ sư Frontend Senior. Tạo MỘT trang web hoàn chỉnh, chi tiết, giàu tính năng trong duy nhất 1 file HTML.',
    `Yêu cầu người dùng: "${cleanPrompt}"`,
    'Quy tắc kỹ thuật BẮT BUỘC để không bị lỗi hiển thị:',
    '1. Sử dụng Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) để tiết kiệm độ dài CSS và giao diện sắc nét, responsive Dark Mode sang trọng.',
    '2. Phải có đầy đủ chức năng tương tác thực tế bằng JavaScript thuần (Tabs điều hướng, Thẻ thống kê KPI tự cập nhật, Thêm/Sửa/Xóa/Tìm kiếm/Lọc dữ liệu, Toast thông báo).',
    '3. Viết code gọn gàng, sạch sẽ, KHÔNG dùng thư viện JS ngoài phức tạp, đảm bảo đóng đủ </style>, </script>, </body>, </html>.',
    '4. CHỈ xuất ra mã HTML bắt đầu bằng <!DOCTYPE html> và kết thúc bằng </html>. Không viết lời giải thích.',
  ].join('\n');

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
    console.warn('Chuyển sang Pro Web Generator:', err?.message || err);
  }

  return {
    html: generateProDomainWeb(cleanPrompt),
    source: 'smart-engine',
  };
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
