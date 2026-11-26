import { supabase } from '../supabaseClient';

/**
 * Trích xuất mã HTML sạch từ phản hồi của AI (loại bỏ markdown code fence nếu có)
 */
function extractHtmlFromReply(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // Tìm block ```html ... ``` hoặc ``` ... ```
  const fenceMatch = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  // Nếu có văn bản thừa trước <!DOCTYPE hoặc <html, cắt bỏ
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

  // Kiểm tra tính hợp lệ tối thiểu của trang web HTML
  const hasHtmlStructure = /<(?:!doctype\s+html|html|body|style|div)/i.test(candidate);
  if (!hasHtmlStructure || candidate.length < 180) {
    return null;
  }

  return candidate;
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
    'bán hàng', 'shop', 'portfolio', 'cv', 'dashboard', 'game', 'blog', 'landing'
  ];
  return createKeywords.some((kw) => p.includes(kw));
}

/**
 * Sinh trang web hoàn chỉnh trực tiếp từ Prompt thông qua AI Backend,
 * có Smart Local Engine dự phòng để luôn tạo ra ứng dụng chạy thật 100%.
 */
export async function generateWebFromPrompt(userPrompt) {
  const cleanPrompt = (userPrompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Vui lòng nhập mô tả trang web bạn muốn tạo.');
  }

  const generationPrompt = [
    'Bạn là Kỹ sư Frontend xuất sắc. Hãy tạo một trang web HOÀN CHỈNH, đẹp mắt, hiện đại và có chức năng tương tác thực tế bằng JavaScript trong DUY NHẤT một file HTML (gồm HTML + CSS trong thẻ <style> + JS trong thẻ <script>).',
    `Yêu cầu của người dùng: "${cleanPrompt}"`,
    'Quy định bắt buộc:',
    '1. Giao diện chuyên nghiệp, typography sắc nét (Google Fonts Plus Jakarta Sans hoặc Inter), bố cục responsive gọn gàng, có dữ liệu mẫu thực tế bằng tiếng Việt.',
    '2. Phải có tính năng tương tác chạy thật (thêm/sửa/xóa/lọc/tìm kiếm/tính toán tùy theo chủ đề).',
    '3. CHỈ trả về mã nguồn HTML thuần túy bắt đầu bằng <!DOCTYPE html> và kết thúc bằng </html>. Tuyệt đối không giải thích thêm.',
  ].join('\n');

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), 14000)
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
    console.warn('Chuyển sang Smart Local Generator cho Prompt Vibe:', err?.message || err);
  }

  return {
    html: generateSmartFallbackWeb(cleanPrompt),
    source: 'smart-engine',
  };
}

/**
 * Chỉnh sửa nhanh mã nguồn template hiện tại (đổi màu, hiệu ứng...)
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

/**
 * Trình sinh ứng dụng web thông minh theo chủ đề (hoạt động 100% offline/client)
 */
export function generateSmartFallbackWeb(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes('sinh viên') || p.includes('học sinh') || p.includes('student') || p.includes('lớp') || p.includes('điểm')) {
    return buildStudentManagerApp(prompt);
  }
  if (p.includes('bán') || p.includes('shop') || p.includes('cửa hàng') || p.includes('store') || p.includes('giày') || p.includes('áo') || p.includes('sản phẩm') || p.includes('mua')) {
    return buildEcommerceApp(prompt);
  }
  if (p.includes('chi tiêu') || p.includes('tài chính') || p.includes('tiền') || p.includes('ngân sách') || p.includes('budget')) {
    return buildExpenseTrackerApp(prompt);
  }
  if (p.includes('portfolio') || p.includes('cv') || p.includes('hồ sơ') || p.includes('giới thiệu')) {
    return buildPortfolioApp(prompt);
  }

  return buildCustomWorkspaceApp(prompt);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStudentManagerApp(prompt) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hệ Thống Quản Lý Sinh Viên</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    body { background: #09090f; color: #f1f5f9; min-height: 100vh; padding: 24px; }
    .container { max-width: 1060px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .title-group h1 { font-size: 24px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 10px; }
    .title-group p { color: #94a3b8; font-size: 13px; margin-top: 4px; }
    .badge-prompt { background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    @media (max-width: 680px) { .stats { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 14px; }
    .stat-label { font-size: 11.5px; color: #94a3b8; font-weight: 600; }
    .stat-value { font-size: 22px; font-weight: 800; color: #fff; margin-top: 4px; }
    .stat-value.amber { color: #fbbf24; }
    .stat-value.green { color: #34d399; }
    .panel { background: #11111b; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 16px; }
    .panel-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
    .panel h3 { font-size: 14.5px; font-weight: 700; color: #f8fafc; margin: 0; }
    .toast-msg { font-size: 12px; font-weight: 700; color: #34d399; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; align-items: end; }
    .field label { display: block; font-size: 11.5px; color: #94a3b8; margin-bottom: 5px; font-weight: 600; }
    .field input, .field select { width: 100%; height: 38px; padding: 0 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.4); color: #fff; font-size: 13px; }
    .field input:focus, .field select:focus { outline: none; border-color: #f59e0b; }
    .btn { height: 38px; padding: 0 16px; border-radius: 9px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: .15s; user-select: none; }
    .btn-primary { background: linear-gradient(135deg, #f59e0b, #d97706); color: #1a1006; }
    .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .search-box { flex: 1; min-width: 220px; height: 38px; padding: 0 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35); color: #fff; font-size: 13px; }
    .filter-select { height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.35); color: #fff; font-size: 13px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px; }
    th { padding: 12px; color: #94a3b8; font-weight: 700; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); }
    td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .status { padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; display: inline-block; }
    .status.active { background: rgba(16, 185, 129, 0.16); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }
    .status.graduated { background: rgba(56, 189, 248, 0.16); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
    .status.warning { background: rgba(245, 158, 11, 0.16); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); }
    .action-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 5px 10px; border-radius: 7px; font-size: 12px; cursor: pointer; margin-right: 4px; }
    .action-btn.del:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #fca5a5; }
    .action-btn.edit:hover { background: rgba(245, 158, 11, 0.2); border-color: #f59e0b; color: #fde68a; }
    .empty { text-align: center; padding: 32px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-group">
        <h1>🎓 Hệ Thống Quản Lý Sinh Viên</h1>
        <p>Tạo tự động từ yêu cầu: "${escapeHtml(prompt)}"</p>
      </div>
      <span class="badge-prompt">⚡ Live Interactive App</span>
    </div>

    <div class="stats">
      <div class="stat-card"><div class="stat-label">Tổng số sinh viên</div><div class="stat-value" id="st-total">0</div></div>
      <div class="stat-card"><div class="stat-label">Đang theo học</div><div class="stat-value green" id="st-active">0</div></div>
      <div class="stat-card"><div class="stat-label">GPA Trung bình</div><div class="stat-value amber" id="st-gpa">0.00</div></div>
      <div class="stat-card"><div class="stat-label">Sinh viên Giỏi (GPA ≥ 3.2)</div><div class="stat-value" id="st-honor">0</div></div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3 id="form-title">➕ Thêm Sinh Viên Mới</h3>
        <span class="toast-msg" id="toast-msg"></span>
      </div>
      <form id="student-form" class="form-grid" onsubmit="return window.handleSaveStudent(event)">
        <div class="field"><label>Mã SV</label><input id="sv-id" placeholder="VD: SV005" required /></div>
        <div class="field"><label>Họ và Tên</label><input id="sv-name" placeholder="VD: Nguyễn Văn An" required /></div>
        <div class="field"><label>Ngành học</label>
          <select id="sv-major">
            <option value="Công nghệ thông tin">Công nghệ thông tin</option>
            <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
            <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
            <option value="An toàn thông tin">An toàn thông tin</option>
            <option value="Thiết kế đồ họa">Thiết kế đồ họa</option>
          </select>
        </div>
        <div class="field"><label>Điểm GPA (0 - 4.0)</label><input id="sv-gpa" type="number" step="any" min="0" max="4" placeholder="3.50" required /></div>
        <div class="field"><label>Trạng thái</label>
          <select id="sv-status">
            <option value="Đang học">Đang học</option>
            <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
            <option value="Cảnh báo học vụ">Cảnh báo học vụ</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" id="submit-btn" onclick="window.handleSaveStudent(event)">Lưu Sinh Viên</button>
      </form>
    </div>

    <div class="panel">
      <div class="toolbar">
        <input id="search-input" class="search-box" placeholder="🔍 Tìm theo tên hoặc mã sinh viên..." />
        <select id="major-filter" class="filter-select">
          <option value="all">Tất cả ngành học</option>
          <option value="Công nghệ thông tin">Công nghệ thông tin</option>
          <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
          <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
          <option value="An toàn thông tin">An toàn thông tin</option>
          <option value="Thiết kế đồ họa">Thiết kế đồ họa</option>
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã SV</th>
              <th>Họ và Tên</th>
              <th>Ngành học</th>
              <th>GPA</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="student-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const INITIAL_STUDENTS = [
      { id: 'SV001', name: 'Trần Minh Quân', major: 'Công nghệ thông tin', gpa: 3.72, status: 'Đang học' },
      { id: 'SV002', name: 'Lê Ngọc Linh', major: 'Trí tuệ nhân tạo', gpa: 3.88, status: 'Đang học' },
      { id: 'SV003', name: 'Phạm Hoàng Nam', major: 'Kỹ thuật phần mềm', gpa: 3.15, status: 'Đã tốt nghiệp' },
      { id: 'SV004', name: 'Nguyễn Thảo Vy', major: 'An toàn thông tin', gpa: 2.35, status: 'Cảnh báo học vụ' }
    ];

    let students = [...INITIAL_STUDENTS];
    let editingIdx = -1;

    const tbody = document.getElementById('student-tbody');
    const form = document.getElementById('student-form');
    const searchInput = document.getElementById('search-input');
    const majorFilter = document.getElementById('major-filter');

    function getStatusClass(st) {
      if (st === 'Đang học') return 'active';
      if (st === 'Đã tốt nghiệp') return 'graduated';
      return 'warning';
    }

    function render() {
      const q = searchInput.value.toLowerCase().trim();
      const major = majorFilter.value;
      const filtered = students.filter(s =>
        (major === 'all' || s.major === major) &&
        (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
      );

      document.getElementById('st-total').textContent = students.length;
      document.getElementById('st-active').textContent = students.filter(s => s.status === 'Đang học').length;
      const avg = students.length ? (students.reduce((acc, s) => acc + Number(s.gpa), 0) / students.length).toFixed(2) : '0.00';
      document.getElementById('st-gpa').textContent = avg;
      document.getElementById('st-honor').textContent = students.filter(s => Number(s.gpa) >= 3.2).length;

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Không tìm thấy sinh viên phù hợp.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map((sv) => {
        const realIdx = students.indexOf(sv);
        return '<tr>' +
          '<td><strong>' + sv.id + '</strong></td>' +
          '<td>' + sv.name + '</td>' +
          '<td>' + sv.major + '</td>' +
          '<td><strong>' + Number(sv.gpa).toFixed(2) + '</strong></td>' +
          '<td><span class="status ' + getStatusClass(sv.status) + '">' + sv.status + '</span></td>' +
          '<td>' +
            '<button class="action-btn edit" onclick="editStudent(' + realIdx + ')">Sửa</button>' +
            '<button class="action-btn del" onclick="deleteStudent(' + realIdx + ')">Xóa</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    window.editStudent = (idx) => {
      const s = students[idx];
      document.getElementById('sv-id').value = s.id;
      document.getElementById('sv-name').value = s.name;
      document.getElementById('sv-major').value = s.major;
      document.getElementById('sv-gpa').value = s.gpa;
      document.getElementById('sv-status').value = s.status;
      editingIdx = idx;
      document.getElementById('form-title').textContent = '✏️ Cập Nhật Sinh Viên (' + s.id + ')';
      document.getElementById('submit-btn').textContent = 'Cập Nhật';
    };

    window.deleteStudent = (idx) => {
      students.splice(idx, 1);
      render();
    };

    function showToast(msg, isError) {
      const el = document.getElementById('toast-msg');
      if (!el) return;
      el.style.color = isError ? '#f87171' : '#34d399';
      el.textContent = msg;
      setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 2600);
    }

    window.handleSaveStudent = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const idVal = document.getElementById('sv-id').value.trim().toUpperCase();
      const nameVal = document.getElementById('sv-name').value.trim();
      const gpaRaw = document.getElementById('sv-gpa').value;

      if (!idVal || !nameVal || gpaRaw === '') {
        showToast('⚠ Vui lòng nhập đầy đủ Mã SV, Họ tên và Điểm GPA!', true);
        return false;
      }

      const gpaNum = Math.min(4, Math.max(0, parseFloat(gpaRaw) || 0));
      const item = {
        id: idVal,
        name: nameVal,
        major: document.getElementById('sv-major').value,
        gpa: gpaNum,
        status: document.getElementById('sv-status').value
      };

      if (editingIdx >= 0) {
        students[editingIdx] = item;
        editingIdx = -1;
        document.getElementById('form-title').textContent = '➕ Thêm Sinh Viên Mới';
        document.getElementById('submit-btn').textContent = 'Lưu Sinh Viên';
        showToast('✓ Đã cập nhật sinh viên ' + item.name + '!', false);
      } else {
        students.unshift(item);
        showToast('✓ Đã thêm sinh viên ' + item.name + ' (' + item.id + ')!', false);
      }
      form.reset();
      render();
      return false;
    };

    searchInput.addEventListener('input', render);
    majorFilter.addEventListener('change', render);
    render();
  </script>
</body>
</html>`;
}

function buildEcommerceApp(prompt) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vibe Store — Cửa Hàng Trực Tuyến</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #0a0a10; color: #f8fafc; min-height: 100vh; padding: 24px; }
    .wrap { max-width: 1040px; margin: 0 auto; }
    .nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; color: #fbbf24; }
    .cart-pill { background: linear-gradient(135deg, #f59e0b, #d97706); color: #1a1006; border: none; padding: 9px 18px; border-radius: 999px; font-weight: 800; cursor: pointer; font-size: 13px; }
    .hero { margin-bottom: 24px; }
    .hero h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
    .hero p { color: #94a3b8; font-size: 13.5px; }
    .controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 200px; height: 40px; padding: 0 14px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .card { background: #12121c; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; transition: .2s; }
    .card:hover { border-color: rgba(245, 158, 11, 0.5); transform: translateY(-2px); }
    .emoji { font-size: 42px; text-align: center; padding: 18px 0; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 12px; }
    .pname { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .pcat { font-size: 11.5px; color: #94a3b8; margin-bottom: 12px; }
    .pfoot { display: flex; justify-content: space-between; align-items: center; }
    .price { font-size: 15px; font-weight: 800; color: #fbbf24; }
    .add-btn { background: rgba(245, 158, 11, 0.16); border: 1px solid rgba(245, 158, 11, 0.4); color: #fde68a; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
    .add-btn:hover { background: #f59e0b; color: #1a1006; }
    .cart-panel { margin-top: 24px; background: #141422; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 16px; padding: 18px; }
    .cart-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13.5px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <div class="brand">🛍️ VIBE STORE</div>
      <button class="cart-pill" onclick="toggleCart()">🛒 Giỏ hàng (<span id="cart-count">0</span>)</button>
    </div>
    <div class="hero">
      <h1>Cửa Hàng Trực Tuyến Hiện Đại</h1>
      <p>Khởi tạo theo yêu cầu: "${escapeHtml(prompt)}"</p>
    </div>
    <div class="controls">
      <input id="q" class="search" placeholder="🔍 Tìm kiếm sản phẩm..." oninput="renderProducts()" />
    </div>
    <div class="grid" id="product-grid"></div>
    <div class="cart-panel" id="cart-box" style="display:none;">
      <h3 style="margin-bottom:10px;">🧾 Giỏ Hàng Của Bạn</h3>
      <div id="cart-items"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-weight:800;">
        <span>Tổng thanh toán:</span>
        <span id="cart-total" style="color:#fbbf24;font-size:18px;">0đ</span>
      </div>
    </div>
  </div>
  <script>
    const PRODUCTS = [
      { id: 1, icon: '👟', name: 'Sneaker Air Pulse', cat: 'Giày thể thao', price: 1450000 },
      { id: 2, icon: '🎧', name: 'Tai Nghe Studio ANC', cat: 'Phụ kiện âm thanh', price: 2190000 },
      { id: 3, icon: '⌚', name: 'Smartwatch Chronos', cat: 'Đồng hồ thông minh', price: 3250000 },
      { id: 4, icon: '🎒', name: 'Balo Tech Minimalist', cat: 'Phụ kiện công nghệ', price: 790000 }
    ];
    let cart = [];
    function fmt(n) { return n.toLocaleString('vi-VN') + 'đ'; }
    function renderProducts() {
      const q = document.getElementById('q').value.toLowerCase();
      const list = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
      document.getElementById('product-grid').innerHTML = list.map(p =>
        '<div class="card"><div><div class="emoji">' + p.icon + '</div><div class="pname">' + p.name + '</div><div class="pcat">' + p.cat + '</div></div>' +
        '<div class="pfoot"><span class="price">' + fmt(p.price) + '</span><button class="add-btn" onclick="addToCart(' + p.id + ')">+ Thêm</button></div></div>'
      ).join('');
    }
    window.addToCart = (id) => {
      const prod = PRODUCTS.find(p => p.id === id);
      const ex = cart.find(c => c.id === id);
      if (ex) ex.qty++; else cart.push({ ...prod, qty: 1 });
      renderCart();
      document.getElementById('cart-box').style.display = 'block';
    };
    window.removeItem = (id) => { cart = cart.filter(c => c.id !== id); renderCart(); };
    window.toggleCart = () => {
      const el = document.getElementById('cart-box');
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    };
    function renderCart() {
      document.getElementById('cart-count').textContent = cart.reduce((s, i) => s + i.qty, 0);
      document.getElementById('cart-total').textContent = fmt(cart.reduce((s, i) => s + i.price * i.qty, 0));
      document.getElementById('cart-items').innerHTML = cart.length ? cart.map(i =>
        '<div class="cart-row"><span>' + i.icon + ' ' + i.name + ' × ' + i.qty + '</span><span>' + fmt(i.price * i.qty) + ' <button onclick="removeItem(' + i.id + ')" style="margin-left:8px;background:none;border:none;color:#ef4444;cursor:pointer;">✕</button></span></div>'
      ).join('') : '<p style="color:#64748b;font-size:13px;">Chưa có sản phẩm nào trong giỏ.</p>';
    }
    renderProducts();
  </script>
</body>
</html>`;
}

function buildExpenseTrackerApp(prompt) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quản Lý Chi Tiêu Cá Nhân</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #09090f; color: #f8fafc; min-height: 100vh; padding: 24px; }
    .box { max-width: 820px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .sub { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .c { background: #12121c; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; }
    .c small { color: #94a3b8; font-size: 12px; }
    .c div { font-size: 20px; font-weight: 800; margin-top: 6px; }
    .form { display: grid; grid-template-columns: 2fr 1.2fr 1fr auto; gap: 10px; background: #12121c; padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px; }
    input, select { height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.4); color: #fff; }
    button { height: 40px; padding: 0 16px; border-radius: 8px; border: none; background: #f59e0b; color: #1a1006; font-weight: 800; cursor: pointer; }
    .list { background: #12121c; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); padding: 12px 16px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13.5px; }
    @media (max-width: 640px) { .cards, .form { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="box">
    <h1>💰 Quản Lý Thu Chi Thông Minh</h1>
    <p class="sub">Yêu cầu: "${escapeHtml(prompt)}"</p>
    <div class="cards">
      <div class="c"><small>Số dư hiện tại</small><div id="bal" style="color:#fbbf24;">0đ</div></div>
      <div class="c"><small>Tổng thu nhập</small><div id="inc" style="color:#34d399;">0đ</div></div>
      <div class="c"><small>Tổng chi tiêu</small><div id="exp" style="color:#f87171;">0đ</div></div>
    </div>
    <form class="form" id="tx-form">
      <input id="tx-desc" placeholder="Mô tả giao dịch (VD: Ăn trưa)" required />
      <input id="tx-amt" type="number" placeholder="Số tiền (VNĐ)" required />
      <select id="tx-type"><option value="exp">Chi tiêu</option><option value="inc">Thu nhập</option></select>
      <button type="submit">+ Ghi</button>
    </form>
    <div class="list" id="tx-list"></div>
  </div>
  <script>
    let txs = [
      { desc: 'Lương tháng', amt: 15000000, type: 'inc' },
      { desc: 'Tiền nhà & Điện nước', amt: 4500000, type: 'exp' },
      { desc: 'Cà phê làm việc', amt: 55000, type: 'exp' }
    ];
    const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';
    function render() {
      const inc = txs.filter(t => t.type === 'inc').reduce((s, t) => s + t.amt, 0);
      const exp = txs.filter(t => t.type === 'exp').reduce((s, t) => s + t.amt, 0);
      document.getElementById('inc').textContent = fmt(inc);
      document.getElementById('exp').textContent = fmt(exp);
      document.getElementById('bal').textContent = fmt(inc - exp);
      document.getElementById('tx-list').innerHTML = txs.map((t, i) =>
        '<div class="item"><span>' + t.desc + '</span><span style="font-weight:700;color:' + (t.type === 'inc' ? '#34d399' : '#f87171') + '">' + (t.type === 'inc' ? '+' : '-') + fmt(t.amt) + ' <button onclick="delTx(' + i + ')" style="margin-left:8px;height:24px;padding:0 8px;background:rgba(255,255,255,0.08);color:#ccc;">✕</button></span></div>'
      ).join('');
    }
    window.delTx = (i) => { txs.splice(i, 1); render(); };
    document.getElementById('tx-form').addEventListener('submit', (e) => {
      e.preventDefault();
      txs.unshift({ desc: document.getElementById('tx-desc').value, amt: Number(document.getElementById('tx-amt').value), type: document.getElementById('tx-type').value });
      e.target.reset();
      render();
    });
    render();
  </script>
</body>
</html>`;
}

function buildPortfolioApp(prompt) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Developer Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: radial-gradient(circle at top right, #1e1b4b, #09090f 60%); color: #f8fafc; min-height: 100vh; padding: 36px 24px; }
    .container { max-width: 900px; margin: 0 auto; }
    .pill { display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #fbbf24; font-size: 12px; font-weight: 700; margin-bottom: 14px; }
    h1 { font-size: 38px; font-weight: 800; line-height: 1.2; margin-bottom: 12px; }
    .lead { color: #cbd5e1; font-size: 15px; max-width: 620px; line-height: 1.6; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; }
    .card h3 { font-size: 16px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; }
    .card p { font-size: 13px; color: #94a3b8; line-height: 1.5; }
    .btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #1a1006; border: none; padding: 12px 22px; border-radius: 10px; font-weight: 800; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <span class="pill">👋 Xin chào! Tôi là Lập Trình Viên Full-Stack</span>
    <h1>Xây dựng sản phẩm số mượt mà & sáng tạo</h1>
    <p class="lead">Trang hồ sơ cá nhân được khởi tạo tự động theo yêu cầu: "${escapeHtml(prompt)}".</p>
    <div class="grid">
      <div class="card"><h3>⚛️ Frontend Architecture</h3><p>React 19, TypeScript, Tailwind CSS, tối ưu hiệu năng 60fps.</p></div>
      <div class="card"><h3>⚙️ Backend & Cloud</h3><p>Node.js, Supabase, PostgreSQL và triển khai CI/CD tự động.</p></div>
      <div class="card"><h3>🤖 AI & Vibe Coding</h3><p>Tích hợp LLM, Agent Workflows và tự động hóa quy trình.</p></div>
    </div>
    <button class="btn" onclick="alert('Cảm ơn bạn đã liên hệ! Email: hello@developer.dev')">📩 Liên Hệ Hợp Tác</button>
  </div>
</body>
</html>`;
}

function buildCustomWorkspaceApp(prompt) {
  const cleanTitle = escapeHtml(
    prompt
      .replace(/^(tạo|làm|xây dựng|thiết kế|viết)\s+(1|một)?\s*(trang\s*web|website|web|ứng\s*dụng|app)?\s*/i, '')
      .trim() || prompt
  );

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cleanTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #09090f; color: #f8fafc; min-height: 100vh; padding: 28px; transition: background .25s, color .25s; }
    body.light { background: #f8fafc; color: #0f172a; }
    .container { max-width: 920px; margin: 0 auto; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(148,163,184,0.2); }
    .badge { padding: 4px 10px; border-radius: 999px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #f59e0b; font-size: 11.5px; font-weight: 700; }
    .theme-btn { background: rgba(148,163,184,0.14); border: 1px solid rgba(148,163,184,0.25); color: inherit; padding: 8px 14px; border-radius: 999px; cursor: pointer; font-weight: 700; font-size: 12.5px; }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; text-transform: capitalize; }
    .desc { color: #94a3b8; font-size: 13.5px; margin-bottom: 22px; }
    .panel { background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.16); border-radius: 16px; padding: 20px; margin-bottom: 18px; }
    .input-row { display: flex; gap: 10px; }
    input { flex: 1; height: 42px; padding: 0 14px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.25); background: rgba(0,0,0,0.25); color: inherit; font-size: 13.5px; }
    body.light input { background: #fff; }
    .add-btn { height: 42px; padding: 0 20px; border-radius: 10px; border: none; background: linear-gradient(135deg, #f59e0b, #d97706); color: #1a1006; font-weight: 800; cursor: pointer; }
    .items { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 12px; background: rgba(148,163,184,0.08); border: 1px solid rgba(148,163,184,0.12); }
    .del { background: rgba(239,68,68,0.18); color: #f87171; border: none; padding: 5px 10px; border-radius: 7px; cursor: pointer; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="topbar">
      <span class="badge">✨ Khởi tạo tự động từ Vibe Prompt</span>
      <button class="theme-btn" onclick="document.body.classList.toggle('light')">🌓 Đổi giao diện Sáng/Tối</button>
    </div>
    <h1>${cleanTitle}</h1>
    <p class="desc">Ứng dụng tương tác được xây dựng trực tiếp từ mô tả: "${escapeHtml(prompt)}"</p>
    <div class="panel">
      <form class="input-row" id="item-form">
        <input id="item-input" placeholder="Nhập dữ liệu hoặc mục mới để thêm vào danh sách..." required />
        <button type="submit" class="add-btn">+ Thêm mới</button>
      </form>
      <div class="items" id="item-list"></div>
    </div>
  </div>
  <script>
    let items = [
      { title: 'Mục dữ liệu mẫu số 1 — Đã sẵn sàng hoạt động', time: 'Vừa xong' },
      { title: 'Mục dữ liệu mẫu số 2 — Hỗ trợ thêm và xóa trực tiếp', time: 'Hôm nay' }
    ];
    function render() {
      document.getElementById('item-list').innerHTML = items.map((it, idx) =>
        '<div class="row"><div><strong>' + it.title + '</strong><div style="font-size:11.5px;opacity:0.65;margin-top:2px;">' + it.time + '</div></div>' +
        '<button class="del" onclick="removeItem(' + idx + ')">Xóa</button></div>'
      ).join('');
    }
    window.removeItem = (i) => { items.splice(i, 1); render(); };
    document.getElementById('item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('item-input').value.trim();
      if (!val) return;
      items.unshift({ title: val, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });
      document.getElementById('item-input').value = '';
      render();
    });
    render();
  </script>
</body>
</html>`;
}
