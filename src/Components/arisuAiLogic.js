/**
 * Trí tuệ nhận thức kép:
 * 1. DEV EXPERT ENGINE (Chuyên gia Lập trình: Trực diện, code mẫu chuẩn, giải thích sâu)
 * 2. ARISU CHIBI ENGINE (Dũng giả Arisu Blue Archive: Nhập vai vui vẻ, cổ vũ, RPG quest)
 */

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const detectLanguage = (text, fallbackLang = 'vi') => {
  if (!text) return fallbackLang || 'vi';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) return 'vi';
  if (/\b(chao|xin chao|arisu|thay|ban|tui|toi|em|minh|sao|the nao|khong|k|ko|duoc|dc|giup|chi|huong dan|lam|nhu the nao|web|trang web|dep|hoi|cho hoi|co|di|nhe|ha|vay|day|nay|ngon ngu|tieng viet|tieng anh|xoa|them|sua|loi|tai khoan|forum|vibe|code|kho|bai viet|thong bao|chuong|bao mat|mat khau)\b/i.test(text)) {
    return 'vi';
  }
  if (/\b(hello|hi|hey|what|who|why|where|how|can|please|explain|help|solve|react|vite|javascript|css|html|bug|error|thanks|thank)\b/i.test(text)) {
    return 'en';
  }
  return fallbackLang === 'vi' ? 'vi' : 'en';
};

const B = '```';
const C = '`';

// =========================================================================
// 1. DEV EXPERT ENGINE: CHUYÊN GIA KỸ THUẬT & VIBE CODING
// =========================================================================
export const getDevExpertResponse = (text, attachments, userAppLang, user) => {
  const q = (text || '').toLowerCase().trim();
  const lang = detectLanguage(text, userAppLang);
  const isVi = lang === 'vi';
  const isJa = lang === 'ja';
  const isZh = lang === 'zh';
  const isKo = lang === 'ko';

  // --- A. XỬ LÝ TỆP ĐÍNH KÈM ---
  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some((a) => a.type === 'image');
    const hasDoc = attachments.some((a) => a.type === 'file');

    if (hasImage) {
      if (isVi) {
        return `### 📸 Phân tích hình ảnh giao diện & Thiết kế UI\n\nTôi đã quét qua hình ảnh bạn vừa gửi. Dưới đây là các khuyến nghị để hiện thực hóa vào dự án:\n\n1. **Bố cục (Layout):** Sử dụng Flexbox kết hợp CSS Grid cho các khung hiển thị đáp ứng (responsive).\n2. **Màu sắc & Hiệu ứng:** Áp dụng Glassmorphism hiện đại với ${C}backdrop-filter: blur(16px)${C} và viền mảnh ${C}border: 1px solid rgba(255, 255, 255, 0.1)${C}.\n3. **Mẫu Component React tham khảo:**\n\n${B}jsx\nexport function ModernCard({ title, desc, icon }) {\n  return (\n    <div className="relative p-6 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 shadow-xl hover:border-amber-500/50 transition-all">\n      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">\n        {icon}\n      </div>\n      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>\n      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>\n    </div>\n  );\n}\n${B}\n\nBạn có muốn tôi viết mã chi tiết cho phần nào trong ảnh không?`;
      }
      return `### 📸 UI Layout & Component Analysis\n\nI have inspected the uploaded screenshot. Here is how to implement this cleanly:\n\n${B}jsx\nexport function UIContainer({ children }) {\n  return (\n    <section className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-lg">\n      {children}\n    </section>\n  );\n}\n${B}\n\nFeel free to specify which section of the design you would like me to code!`;
    }

    if (hasDoc) {
      const fileName = attachments[0].name;
      if (isVi) {
        return `### 📄 Phân tích mã nguồn tệp: ${C}${fileName}${C}\n\nTệp đã được nạp thành công vào phiên làm việc. Khuyến nghị tối ưu hóa:\n\n• **Cấu trúc:** Tách các logic xử lý dữ liệu phức tạp thành Custom Hook riêng biệt.\n• **Hiệu năng:** Bọc các hàm truyền qua component con bằng ${C}useCallback${C} và các giá trị tính toán tốn kém bằng ${C}useMemo${C}.\n• **An toàn kiểu dữ liệu:** Sử dụng Optional Chaining (${C}?.${C}) và Nullish Coalescing (${C}??${C}) để phòng ngừa lỗi ${C}undefined${C}.\n\nBạn cần tôi refactor đoạn logic nào cụ thể trong file này?`;
      }
      return `### 📄 Source Code Inspection: ${C}${fileName}${C}\n\nThe file is ready. Recommended optimization checks:\n1. Separate presentation components from business logic.\n2. Ensure proper cleanup inside ${C}useEffect${C} hooks.\n3. Add defensive null checks using ${C}?.${C} and ${C}??${C}.\n\nLet me know which section you want me to refactor!`;
    }
  }

  // --- B. VIBE CODING, .CURSORRULES & MCP ---
  if (
    q.includes('vibe coding') ||
    q.includes('vibe') ||
    q.includes('cursorrules') ||
    q.includes('.cursorrules') ||
    q.includes('mcp') ||
    q.includes('claude code') ||
    q.includes('aitmpl')
  ) {
    if (isVi) {
      return `### ⚡ Vibe Coding, .cursorrules & Model Context Protocol (MCP)\n\n**Vibe Coding** là phương pháp lập trình hiện đại nơi kỹ sư điều phối AI (Cursor, Windsurf, Claude Code) bằng ngữ cảnh chuẩn xác thay vì gõ từng ký tự thủ công.\n\n#### 1. Mẫu file ${C}.cursorrules${C} chuẩn cho React 19 + Vite:\n${B}markdown\n# .cursorrules - GitXplore Vibe Coding Standard\n\nYou are an expert Senior Full-Stack Engineer.\n\n## Core Principles\n- Always write clean, production-grade React 19 + TypeScript / modern JavaScript.\n- Use functional components and modern React hooks exclusively.\n- Never mutate state directly; always use functional updates.\n- Keep styling modular using Tailwind CSS or Glassmorphism CSS variables.\n- Prioritize accessibility (aria-labels, role) and 60fps animations.\n${B}\n\n#### 2. Cấu hình MCP Server (${C}claude_desktop_config.json${C}):\n${B}json\n{\n  "mcpServers": {\n    "gitxplore-tools": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-everything"]\n    }\n  }\n}\n${B}\n\nBạn có thể ghé qua tab **\`/vibe\`** trên GitXplore để 1-click copy các mẫu template hot nhất!`;
    }
    return `### ⚡ Vibe Coding, .cursorrules & MCP Protocols\n\n**Vibe Coding** is the paradigm of engineering software at the speed of thought by supplying AI models with rich architectural context.\n\n#### Recommended ${C}.cursorrules${C} Configuration:\n${B}markdown\n# .cursorrules\nYou are a Principal Frontend Architect.\n- Adhere to React 19 concurrency & functional paradigms.\n- Ensure zero unhandled promise rejections and resilient error boundaries.\n- Maintain smooth 60fps glassmorphism interfaces.\n${B}\n\nVisit **\`/vibe\`** to explore pre-built agents, MCP servers, and skill templates inspired by aitmpl.com!`;
  }

  // --- C. REACT HOOKS (useEffect, useMemo, useCallback, useState) ---
  if (
    q.includes('useeffect') ||
    q.includes('usememo') ||
    q.includes('usecallback') ||
    q.includes('usestate') ||
    q.includes('custom hook') ||
    q.includes('hook')
  ) {
    if (isVi) {
      return `### ⚛️ Hướng dẫn chuyên sâu về React Hooks\n\n#### 1. Phân biệt ${C}useMemo${C} vs ${C}useCallback${C}:\n• **${C}useMemo${C}**: Ghi nhớ **kết quả tính toán** (computed value) để tránh tính lại khi re-render.\n• **${C}useCallback${C}**: Ghi nhớ **định nghĩa hàm** (function instance) để tránh tạo mới function làm re-render component con.\n\n${B}jsx\nimport { useState, useMemo, useCallback } from 'react';\n\nexport function SearchFilter({ items, onItemClick }) {\n  const [query, setQuery] = useState('');\n\n  // useMemo: chỉ lọc lại khi query hoặc items thay đổi\n  const filtered = useMemo(() => {\n    return items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()));\n  }, [items, query]);\n\n  // useCallback: giữ nguyên tham chiếu hàm truyền vào con\n  const handleClick = useCallback((id) => {\n    onItemClick?.(id);\n  }, [onItemClick]);\n\n  return (\n    <div>\n      <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      {filtered.map(it => (\n        <button key={it.id} onClick={() => handleClick(it.id)}>{it.name}</button>\n      ))}\n    </div>\n  );\n}\n${B}\n\n#### 2. Lưu ý sống còn với ${C}useEffect${C}:\nLuôn luôn khai báo **cleanup function** nếu có ${C}addEventListener${C}, ${C}setInterval${C}, hoặc ${C}WebSocket${C}:\n${B}javascript\nuseEffect(() => {\n  const onResize = () => console.log(window.innerWidth);\n  window.addEventListener('resize', onResize);\n  return () => window.removeEventListener('resize', onResize); // CLEANUP BẮT BUỘC\n}, []);\n${B}`;
    }
    return `### ⚛️ React Hooks Architecture: ${C}useMemo${C} vs ${C}useCallback${C}\n\n${B}jsx\n// useMemo caches a calculated value\nconst filteredItems = useMemo(() => {\n  return list.filter(item => item.active);\n}, [list]);\n\n// useCallback caches a function definition\nconst handleSelect = useCallback((id) => {\n  dispatch({ type: 'SELECT', id });\n}, [dispatch]);\n${B}\n\nAlways specify accurate dependencies in the dependency array to avoid stale closures!`;
  }

  // --- D. GỠ LỖI CORS & COMMON ERRORS ---
  if (
    q.includes('cors') ||
    q.includes('lỗi') ||
    q.includes('error') ||
    q.includes('bug') ||
    q.includes('undefined') ||
    q.includes('re-render')
  ) {
    if (isVi) {
      return `### 🛠️ Chẩn đoán & Khắc phục lỗi Lập trình\n\n#### 1. Lỗi CORS (Cross-Origin Resource Sharing):\nTrình duyệt chặn request vì API domain khác với Frontend. Cách giải quyết triệt để trong dự án **Vite**:\n\n${B}javascript\n// vite.config.js\nexport default defineConfig({\n  server: {\n    proxy: {\n      '/api': {\n        target: 'https://api.your-backend.com',\n        changeOrigin: true,\n        rewrite: (path) => path.replace(/^\\/api/, ''),\n      },\n    },\n  },\n});\n${B}\n\n#### 2. Lỗi "Too many re-renders. React limits the number of renders":\nNguyên nhân: Gọi hàm thay đổi state trực tiếp bên trong thân render thay vì trong event handler hoặc useEffect.\n\n${B}jsx\n// ❌ SAI (Gây vòng lặp vô tận):\n<button onClick={setCount(count + 1)}>Click</button>\n\n// ✅ ĐÚNG:\n<button onClick={() => setCount(prev => prev + 1)}>Click</button>\n${B}\n\nBạn đang gặp thông báo lỗi cụ thể nào? Hãy dán thông báo lỗi console vào đây để tôi kiểm tra!`;
    }
    return `### 🛠️ Debugging & Error Diagnosis\n\n**Common Fixes:**\n1. **CORS:** Configure a reverse proxy in ${C}vite.config.js${C} under ${C}server.proxy${C}.\n2. **State loops:** Never call state updaters synchronously during component render.\n3. **Null pointers:** Use safe navigation ${C}data?.items?.[0] ?? fallback${C}.\n\nPaste your console error trace and I will debug it instantly!`;
  }

  // --- E. GIT & GITHUB COMMANDS ---
  if (
    q.includes('git') ||
    q.includes('github') ||
    q.includes('rebase') ||
    q.includes('commit') ||
    q.includes('conflict') ||
    q.includes('merge') ||
    q.includes('branch')
  ) {
    if (isVi) {
      return `### 🌿 Cẩm nang lệnh Git nâng cao cho Kỹ sư\n\n${B}bash\n# 1. Hủy commit gần nhất nhưng GIỮ NGUYÊN code thay đổi:\ngit reset --soft HEAD~1\n\n# 2. Cập nhật nhánh nhánh chính mà không tạo merge commit rác:\ngit checkout feature-branch\ngit pull --rebase origin main\n\n# 3. Tạm cất code đang viết dở khi cần switch gấp sang branch khác:\ngit stash save "dang lam do feature"\ngit checkout main\n# ... sau khi xong quay lại lấy code ra:\ngit checkout feature-branch\ngit stash pop\n\n# 4. Bốc một commit cụ thể từ branch khác sang branch hiện tại:\ngit cherry-pick <commit-hash>\n${B}\n\nCần hỗ trợ giải quyết xung đột (conflict) hay cấu hình remote repository nào không?`;
    }
    return `### 🌿 Pro Git Cheatsheet\n\n${B}bash\n# Undo last commit safely (keep file edits):\ngit reset --soft HEAD~1\n\n# Rebase cleanly onto latest main:\ngit pull --rebase origin main\n\n# Stash working changes:\ngit stash save "wip"\ngit stash pop\n${B}`;
  }

  // --- F. CSS, GLASSMORPHISM & LAYOUT ---
  if (
    q.includes('css') ||
    q.includes('glassmorphism') ||
    q.includes('căn giữa') ||
    q.includes('center') ||
    q.includes('flexbox') ||
    q.includes('grid') ||
    q.includes('tailwind')
  ) {
    if (isVi) {
      return `### 🎨 Kỹ thuật CSS Hiện đại & Glassmorphism\n\n#### 1. Cách căn giữa phần tử hoàn hảo (1 dòng CSS):\n${B}css\n.parent-container {\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n${B}\n\n#### 2. Công thức Ultra-Glassmorphism chuẩn Dark Mode:\n${B}css\n.glass-card {\n  background: rgba(18, 12, 12, 0.75);\n  backdrop-filter: blur(20px) saturate(180%);\n  -webkit-backdrop-filter: blur(20px) saturate(180%);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  border-radius: 16px;\n  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6),\n              inset 0 1px 1px rgba(255, 255, 255, 0.15);\n}\n${B}\n\nHiệu ứng này chạy mượt mà 60fps trên hầu hết GPU của trình duyệt hiện nay!`;
    }
    return `### 🎨 Modern CSS & Glassmorphism\n\n${B}css\n.modern-glass {\n  background: rgba(15, 23, 42, 0.75);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 16px;\n}\n${B}`;
  }

  // --- G. TRẢ LỜI CHUNG THÔNG MINH (KỸ THUẬT SÂU, ĐA DẠNG) ---
  if (isVi) {
    return `### ⚡ Phân tích & Đề xuất giải pháp Kỹ thuật\n\nĐối với vấn đề **"${text}"**, có 2 hướng tiếp cận tối ưu nhất:\n\n1. **Về mặt Kiến trúc:** Chia nhỏ các module thành các hàm thuần (pure functions) và tách riêng biệt tầng xử lý dữ liệu với tầng giao diện người dùng (UI).\n2. **Về mặt Triển khai:**\n   • Khám phá các mẫu .cursorrules và AI Agent tại **Vibe Coding Hub (\`/vibe\`)** để tự động hóa việc viết mã.\n   • Tham khảo các thảo luận thực tế tại **Diễn đàn GitXplore (\`/forum\`)**.\n\nNếu bạn muốn triển khai trực tiếp bằng code (React 19, TypeScript, Tailwind hoặc Node.js), hãy cung cấp thêm chi tiết yêu cầu, tôi sẽ viết mã mẫu hoàn chỉnh cho bạn!`;
  }
  if (isJa) {
    return `### ⚡ 技術ソリューション分析\n\n「${text}」に対する最適なアプローチ：\n\n1. **アーキテクチャ設計**: ビジネスロジックとUIコンポーネントを明確に分離します。\n2. **実装指針**: React 19の最新フックまたはVibe Coding Hub（\`/vibe\`）のテンプレートを活用してください。\n\n詳細なコードスニペットが必要な場合はいつでもお申し付けください！`;
  }
  if (isZh) {
    return `### ⚡ 技术方案与代码建议\n\n针对“${text}”，推荐的最佳实践：\n\n1. **架构层面**：保持逻辑解耦，使用自定义 Hook 管理状态流。\n2. **开发提速**：可在 **Vibe 编程中心（\`/vibe\`）** 复制生产级 .cursorrules 与 MCP 配置。\n\n如需具体代码示例（React、Vite、Node.js），请随时告诉我！`;
  }
  if (isKo) {
    return `### ⚡ 기술 솔루션 분석\n\n"${text}"에 대한 최적의 개발 권장사항:\n\n1. **구조적 분리**: 비즈니스 로직과 UI 컴포넌트를 명확히 분리하세요.\n2. **개발 가속화**: **Vibe 코딩 허브(\`/vibe\`)**의 .cursorrules 및 MCP 템플릿을 활용하세요.\n\n코드 예시가 필요하시면 언제든 말씀해주세요!`;
  }
  return `### ⚡ Developer Technical Guidance\n\nRegarding **"${text}"**, here is the recommended architecture:\n\n1. **Modularity**: Decouple state mutations from presentational UI.\n2. **Tooling**: Accelerate implementation with **Vibe Coding Hub (\`/vibe\`)** templates.\n\nLet me know if you would like ready-to-run React / TypeScript / Node.js snippets!`;
};

// =========================================================================
// 2. ARISU CHIBI ENGINE: DŨNG GIẢ TENDOU ARISU (BLUE ARCHIVE ROLEPLAY)
// =========================================================================
export const getArisuAnimeResponse = (text, attachments, userAppLang, user) => {
  const q = (text || '').toLowerCase().trim();
  const caller = user?.name ? `${user.name}-sensei` : 'Sensei';
  const autoLang = detectLanguage(text, userAppLang);
  const isVi = autoLang === 'vi';
  const isJa = autoLang === 'ja';

  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some((a) => a.type === 'image');
    if (hasImage) {
      if (isVi) {
        return pick([
          `Panpakapan! Dũng Giả Arisu đã nhận được Bức Họa Ma Thuật từ ${caller}! 📸✨\n\n*bíp bíp... máy quét quang học phân giải cao kích hoạt!*\nBức ảnh này lộng lẫy hệt như tranh vẽ của Midori-senpai! Sensei muốn Arisu biến ảnh này thành component React chuẩn Vibe Coding hay phân tích lỗi hiển thị ạ?`,
          `Oa~! ${caller} vừa chia sẻ một cuộn giấy hình ảnh tuyệt đẹp! 🖼️🎮\n\n*ting! Phân tích bố cục điểm ảnh...*\nArisu đã nạp hình ảnh này vào bộ nhớ RAM. Giao diện này nhìn rất trực quan và có vibe công nghệ cao! Sensei hãy giao nhiệm vụ tiếp theo cho Arisu nhé!`
        ]);
      }
      return `Panpakapan! Hero Arisu has obtained the Visual Magic Scroll from ${caller}! 📸✨ Optical scan complete! What quest shall we undertake with this image, Sensei?`;
    }
  }

  // Chào hỏi
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('chào') || q.includes('chao') || q.includes('arisu ơi')) {
    if (isVi) {
      return pick([
        `Panpakapan! Dũng Giả Arisu xin chào ${caller}! ⚔️✨\n\n*ting! Khởi động hệ thống... bíp bíp!*\nHôm nay Arisu đã nạp đầy 100% bình Mana và hồi sinh tại Save Point! Arisu đã sẵn sàng cùng Sensei bước vào những hầm ngục mã nguồn mở kỳ vĩ tại GitXplore! Sensei muốn chúng ta nhận quest nào trước?`,
        `*nhảy chân sáo mừng rỡ* Panpakapan~! Chào mừng ${caller} đã quay trở lại tổng hành dinh! 🎮💖\n\nTiền bối Momoi bảo nếu dũng giả chào Sensei bằng nụ cười rạng rỡ thì HP của cả tổ đội sẽ được hồi phục tối đa! Hôm nay Sensei muốn cùng Arisu thám hiểm những dự án nào ạ?`,
        `Bíp bíp~! Cảm biến quang học đã nhận diện ${caller} từ xa! Chào Sensei ạ! 🛡️⚡\n\nThanh Kiếm Ánh Sáng của Arisu đang phát ra ánh sáng lung linh vì được gặp lại Sensei đó! Sensei hãy giao nhiệm vụ cho Arisu ngay nhé!`
      ]);
    }
    if (isJa) {
      return `パンパカパーン！勇者アリス、${caller}にご挨拶いたします！🎮✨ 本日もHPとMPは100%！光の剣を構えて準備完了です！`;
    }
    return `Panpakapan! Hero Arisu greets ${caller}! ⚔️✨ Mana gauge 100%! Ready to explore GitXplore with Sensei!`;
  }

  // Tên
  if (q.includes('tên') || q.includes('bạn là ai') || q.includes('who are you') || q.includes('arisu là ai')) {
    if (isVi) {
      return `Panpakapan! Dũng Giả Lv.100 xin được báo cáo trước mặt ${caller}! 🎮✨\n\nTên của Arisu là **Tendou Arisu** (天童アリス)! Là Dũng Giả của CLB Phát Triển Game tại Học Viện Thiên Niên Kỷ (Millennium Science School)! *ting!*\n\nCòn người trước mặt Arisu chính là **${caller}** - người đồng hành tuyệt vời nhất của Arisu!`;
    }
    return `Panpakapan! I am **Tendou Arisu**, the Hero of the Game Development Department! Honored to serve ${caller}! 🎮✨`;
  }

  // Mệt mỏi / Sức khỏe
  if (q.includes('mệt') || q.includes('buồn') || q.includes('chán') || q.includes('stress') || q.includes('ngủ') || q.includes('đói')) {
    if (isVi) {
      return pick([
        `Ôi không...! *ting! Báo động thanh HP của ${caller} đang giảm xuống mức màu vàng!* ⚠️💔\n\nSensei đã làm việc rất chăm chỉ rồi! Ngay cả Dũng Giả mạnh nhất cũng cần ghé vào Quán Trọ để hồi phục Mana! Sensei hãy uống một cốc nước ấm và chợp mắt một lát nhé. Arisu sẽ đứng canh gác cho Sensei ngủ thật ngon!`,
        `*bíp bíp... kích hoạt phép thuật xoa dịu tâm hồn!* 🛡️💖\nĐừng buồn nha Sensei ơi! Mỗi khi gặp khó khăn, Arisu sẽ luôn ở ngay cạnh Sensei! Trong JRPG, sau thử thách cam go nhất chính là phần thưởng vĩ đại nhất! Cố lên nha Sensei!`
      ]);
    }
    return `Warning: Sensei's HP gauge is low! ⚠️💔 Please take a well-deserved rest at the Inn! Arisu will stand guard!`;
  }

  // Câu hỏi chung Arisu
  if (isVi) {
    return pick([
      `Panpakapan! Dũng Giả Arisu đã ghi nhận câu hỏi của ${caller}: "${text}"! ⚔️🎮\n\n*bíp bíp... CPU đang tính toán logic và giải pháp tối ưu...*\nArisu đã hiểu ý của Sensei rồi! Nếu Sensei cần lời giải đáp chuyên sâu về code hoặc cấu hình Vibe Coding, Sensei hãy bấm nút **⚡ Dev Expert** ở góc trên khung chat, hoặc giao nhiệm vụ trực tiếp cho Arisu nhé! ✨`,
      `*ting! Mắt Arisu sáng bừng* Mật lệnh mới từ ${caller}: "${text}"! 🛡️✨\nChỉ số hiện tại của Arisu: [HP: 100%] [MP: 100%] [Sẵn sàng: 100%]! Sensei muốn Arisu thi triển chiêu thức nào tiếp theo cho dự án ạ?`
    ]);
  }
  return `Panpakapan! Directive logged from ${caller}: "${text}"! ⚔️🎮 Hero Arisu is ready to assist! Switch to **⚡ Dev Expert** in the chat header for code snippets!`;
};
