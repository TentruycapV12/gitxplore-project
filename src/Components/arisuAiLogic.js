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

  // --- B0. GIẢI THÍCH CHO NGƯỜI MỚI (BEGINNER CRASH COURSE) ---
  if (
    q.includes('mã nguồn mở') ||
    q.includes('open source') ||
    q.includes('người mới') ||
    q.includes('chưa biết code') ||
    q.includes('không biết code') ||
    q.includes('web này là gì') ||
    q.includes('web này làm gì') ||
    q.includes('bắt đầu từ đâu') ||
    q.includes('hướng dẫn sử dụng') ||
    q.includes('tân thủ')
  ) {
    if (isVi) {
      return `### 🌱 Chào mừng bạn đến với GitXplore! (Hướng dẫn dễ hiểu cho người mới)\n\nĐừng lo lắng nếu bạn chưa từng viết một dòng code nào! Dưới đây là 3 điều cốt lõi bạn cần biết:\n\n#### 1. Mã Nguồn Mở (Open Source) là gì?\nHãy tưởng tượng một đầu bếp tạo ra món ăn ngon nhất thế giới. Thay vì giấu bí quyết kinh doanh, họ **chia sẻ toàn bộ công thức và nguyên liệu miễn phí 100% lên mạng cho mọi người tự nấu và cải tiến**. Đó chính là Mã Nguồn Mở!\nHầu hết công nghệ bạn dùng hàng ngày (Android, trình duyệt Chrome, WordPress, Wikipedia) đều được xây dựng từ mã nguồn mở.\n\n#### 2. Bạn chưa biết code thì trang web này giúp gì cho bạn?\n• **Tìm phần mềm miễn phí chất lượng cao**: Thay vì mua bản quyền Photoshop hay Office đắt đỏ hoặc tải app bẻ khóa dính virus, bạn có thể tìm thấy phần mềm thay thế miễn phí tuyệt đối (như Blender, GIMP, OBS Studio, Ollama).\n• **Khám phá Vibe Coding**: Kỷ nguyên mới nơi bạn chỉ cần nói ý tưởng bằng tiếng Việt thông thường, AI sẽ biến nó thành website thật!\n• **Tự học công nghệ từ số 0**: Tiếp cận các kho tài liệu và dự án hướng dẫn từng bước hoàn toàn miễn phí.\n\n#### 3. Bắt đầu ngay tại đây:\n1. Đọc mục **"Nhập môn trong 3 phút"** ngay trang chủ.\n2. Chọn bộ lọc **"🌱 Dành cho người mới"** trong danh sách dự án bên dưới.\n3. Ghé thăm **Diễn đàn (${C}/forum${C})** để hỏi bất kỳ điều gì bạn muốn — không ai chê cười bạn cả!\n\nTôi luôn ở đây để đồng hành cùng bạn!`;
    }
    return `### 🌱 Welcome to GitXplore! (Beginner Guide)\n\nZero coding experience? No problem! Here is what you need to know:\n\n#### 1. What is Open Source?\nImagine top chefs sharing world-class recipes 100% free online for anyone to cook, customize, and improve. That is Open Source!\n\n#### 2. What can you do here without coding?\n- Discover free high-quality software replacing expensive paid subscriptions.\n- Learn Vibe Coding: Build web apps simply by prompting AI in plain English!\n- Explore beginner-friendly tutorials and projects.\n\n#### 3. Where to start:\n1. Check the **"3-Minute Crash Course"** section on the homepage.\n2. Click **"🌱 Beginner Friendly"** in the repository filters.\n3. Ask me anytime if you get stuck!`;
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
// 2. ARISU COMPANION ENGINE: NGƯỜI BẠN ĐỒNG HÀNH THÂN THIỆN, DỄ HIỂU
// =========================================================================
export const getArisuCompanionResponse = (text, attachments, userAppLang, user) => {
  const q = (text || '').toLowerCase().trim();
  const userName = user?.name || user?.identifier?.split('@')[0] || '';
  const friendName = userName ? userName : 'bạn';
  const autoLang = detectLanguage(text, userAppLang);
  const isVi = autoLang === 'vi';
  const isJa = autoLang === 'ja';

  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some((a) => a.type === 'image');
    if (hasImage) {
      if (isVi) {
        return `Chào ${friendName}! Mình đã xem qua hình ảnh bạn vừa gửi rồi nhé. 📸✨\n\nGiao diện trông rất trực quan và hiện đại! Bạn muốn mình hỗ trợ bạn phân tích bố cục thành các component React, hay cần tư vấn cách hiện thực hóa giao diện này bằng Vibe Coding? Hãy nói cho mình biết nhé!`;
      }
      return `Hi ${userName || 'friend'}! I have reviewed your image. 📸✨ It looks clean and well-structured! Would you like me to break this down into React components or guide you on building it with Vibe Coding? Just let me know!`;
    }
  }

  // Chào hỏi
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('chào') || q.includes('chao') || q.includes('arisu ơi') || q.includes('alo')) {
    if (isVi) {
      return pick([
        `Chào ${friendName}! Rất vui được gặp bạn tại GitXplore! ✨ Mình là Arisu, người bạn đồng hành của bạn. Hôm nay bạn muốn tìm hiểu dự án mã nguồn mở nào, hay cần mình hỗ trợ về Vibe Coding?`,
        `Xin chào ${friendName}! Mình là Arisu đây. Dù bạn là người mới tìm hiểu công nghệ hay đang xây dựng dự án, mình luôn ở đây để giúp bạn giải đáp một cách đơn giản và dễ hiểu nhất. Bạn cần mình hỗ trợ gì hôm nay?`,
        `Chào bạn nhé! Arisu rất vui được đồng hành cùng bạn. Bạn có thắc mắc gì về lập trình, mã nguồn mở hay các công cụ AI, cứ thoải mái hỏi mình nhé!`
      ]);
    }
    if (isJa) {
      return `こんにちは！GitXploreのAIコンパニオン、アリスです。何かお手伝いできることはありますか？`;
    }
    return `Hi ${userName || 'there'}! I am Arisu, your friendly AI companion at GitXplore. How can I help you explore open-source projects or Vibe Coding today?`;
  }

  // Giới thiệu bản thân
  if (q.includes('tên') || q.includes('bạn là ai') || q.includes('who are you') || q.includes('arisu là ai') || q.includes('giới thiệu')) {
    if (isVi) {
      return `Mình là **Arisu**, người bạn đồng hành AI tại nền tảng GitXplore! 🌸\n\nNhiệm vụ của mình là giúp bạn tiếp cận công nghệ, mã nguồn mở và Vibe Coding một cách tự nhiên, dễ hiểu nhất:\n\n• **Dành cho người mới:** Giải thích mọi khái niệm kỹ thuật bằng ngôn ngữ đời thường, không dùng thuật ngữ khó hiểu.\n• **Dành cho người làm sản phẩm:** Hướng dẫn cách dùng AI để tự làm web, viết prompt chuẩn và khám phá các repo hữu ích.\n• **Đồng hành cùng bạn:** Luôn sẵn sàng lắng nghe và trả lời mọi câu hỏi của bạn bất cứ lúc nào!\n\nBạn cứ xem mình như một người bạn am hiểu công nghệ sẵn sàng chia sẻ nhé!`;
    }
    return `I am **Arisu**, your friendly AI companion at GitXplore! 🌸 My mission is to help you explore open-source repositories and Vibe Coding naturally, simply, and without technical jargon. Feel free to ask me anything!`;
  }

  // Động viên / Sức khỏe / Mệt mỏi
  if (q.includes('mệt') || q.includes('buồn') || q.includes('chán') || q.includes('stress') || q.includes('ngủ') || q.includes('đói')) {
    if (isVi) {
      return pick([
        `Bạn đã làm việc rất chăm chỉ rồi đó! Đừng quá áp lực nhé, hãy uống một cốc nước ấm, thả lỏng vai và cho mắt nghỉ ngơi 5 - 10 phút nha. Khi nào bạn nạp lại năng lượng, mình luôn ở đây để đồng hành tiếp cùng bạn! 🍵💖`,
        `Học công nghệ hay lập trình đôi lúc sẽ có lúc thấy mệt hoặc bối rối, điều đó hoàn toàn bình thường bạn nha! Hãy tạm gác lại một chút, hít thở sâu nhé. Mình luôn ở đây để hỗ trợ bạn bất cứ khi nào bạn sẵn sàng!`
      ]);
    }
    return `You have been working hard! Take a short break, drink some water, and relax your eyes. Whenever you are ready, I will be right here to support you! 🍵💖`;
  }

  // 1. NGƯỜI MỚI: TÔI KHÔNG BIẾT CODE, WEB NÀY GIÚP GÌ CHO TÔI?
  if (
    q.includes('không biết code, web này giúp gì') ||
    q.includes('không biết code thì dùng') ||
    q.includes('chưa biết code thì dùng') ||
    q.includes('giúp gì cho tôi') ||
    q.includes('web này giúp gì')
  ) {
    if (isVi) {
      return `Chào bạn! Rất nhiều người khi mới vào GitXplore cũng từng nghĩ như bạn. Nhưng bạn hoàn toàn **không cần biết code** để tận hưởng những giá trị tuyệt vời này nè:

### 🌟 3 Điều Tuyệt Vời GitXplore Dành Riêng Cho Bạn:
1. **Kho Ứng Dụng Miễn Phí Xịn Xò (FOSS):**
   Thay vì phải mua bản quyền phần mềm đắt đỏ hay tải các bản lậu dễ dính mã độc, bạn có thể tìm thấy hàng trăm phần mềm hàng đầu thế giới được cộng đồng chia sẻ 100% miễn phí (như công cụ vẽ, làm video, chạy AI, game giải trí).
2. **Trải Nghiệm "Làm App Không Cần Code" (Vibe Coding):**
   Bạn có một ý tưởng trong đầu? Chỉ cần miêu tả bằng tiếng Việt (ví dụ: *"Tạo cho tôi web bán hoa tươi có giỏ hàng"*), AI sẽ viết toàn bộ mã nguồn cho bạn. Bạn có thể thử ngay trên web mà không cần cài đặt gì!
3. **Cộng Đồng Học Tập Thân Thiện:**
   Mọi thắc mắc công nghệ đều có thể hỏi tại Diễn đàn hoặc hỏi trực tiếp mình. Không ai chê cười bạn là người mới đâu nhé!

👉 **Bước đầu tiên:** Bạn có thể bấm vào nút **"🌱 Dành cho người mới"** trên trang chủ để xem các ứng dụng có thể bấm dùng thử trực tiếp ngay nhé!`;
    }
    return `Welcome! You do **not need any coding background** to benefit from GitXplore:
1. **Free High-Quality Apps:** Discover 100% free open-source software replacing expensive subscriptions.
2. **Build Software with AI (Vibe Coding):** Describe your app idea in plain English, and AI builds it for you.
3. **Interactive Demos:** Most curated projects have live web demos you can test in one click!

Check out the **Beginner Mode** on the home page to start exploring!`;
  }

  // 2. GỢI Ý 3 ỨNG DỤNG THÚ VỊ DÙNG THỬ NGAY
  if (
    q.includes('gợi ý 3 ứng dụng') ||
    q.includes('3 ứng dụng thú vị') ||
    q.includes('ứng dụng thú vị') ||
    q.includes('dùng thử ngay') ||
    q.includes('3 apps')
  ) {
    if (isVi) {
      return `Dưới đây là **3 ứng dụng thú vị nhất** bạn có thể trải nghiệm ngay hôm nay mà không tốn một đồng nào nè:

### 🎮 1. Ollama — Chạy Trí Tuệ Nhân Tạo (AI) Riêng Tư Trên Máy
• **Công dụng:** Cho phép bạn trò chuyện với các mô hình AI thông minh như Llama 3, Gemma hoàn toàn miễn phí trên máy tính của bạn, không cần mạng Internet và bảo mật 100%.
• **Trải nghiệm ngay:** [ollama.com](https://ollama.com)

### 🎨 2. Stable Diffusion WebUI — Họa Sĩ AI Vẽ Tranh
• **Công dụng:** Biến mọi ý tưởng mô tả của bạn thành bức tranh nghệ thuật tuyệt đẹp chỉ trong vài giây ngay trên trình duyệt web.
• **Trải nghiệm ngay:** [stability.ai](https://stability.ai)

### 🕹️ 3. Godot Engine — Tự Làm Game 2D & 3D Vui Nhộn
• **Công dụng:** Bộ công cụ làm game mã nguồn mở siêu nhẹ, miễn phí vĩnh viễn. Rất nhiều bạn trẻ đã tự làm ra game Flappy Bird hay game nhập vai đầu tay nhờ công cụ này!
• **Trải nghiệm ngay:** [godotengine.org](https://godotengine.org)

Bạn thích thử ứng dụng nào nhất trong 3 app trên nè? Nói cho mình biết nha! ✨`;
    }
    return `Here are **3 fun apps with live demos** you can try right away:
1. **Ollama:** Run open-source LLMs (Llama 3, Gemma) privately on your computer ([ollama.com](https://ollama.com)).
2. **Stable Diffusion:** AI text-to-image generator directly in your browser ([stability.ai](https://stability.ai)).
3. **Godot Engine:** Lightweight, 100% free game development engine ([godotengine.org](https://godotengine.org)).`;
  }

  // 3. CHỈ TÔI CÁCH TỰ LÀM 1 WEBSITE BẰNG AI TRONG 5 PHÚT
  if (
    q.includes('tự làm 1 website') ||
    q.includes('tự làm website') ||
    q.includes('làm web trong 5 phút') ||
    q.includes('làm website bằng ai') ||
    q.includes('trong 5 phút')
  ) {
    if (isVi) {
      return `Dễ lắm bạn ơi! Thời nay ai cũng có thể tự tạo một trang web đẹp mắt chỉ trong **3 bước cực nhanh** này nè:

### 🚀 3 Bước Làm Website Bằng AI Trong 5 Phút:

1. **Bước 1 — Nghĩ ý tưởng bạn muốn làm:**
   Ví dụ: *"Một trang web quán cà phê Cyberpunk có danh sách đồ uống, giỏ hàng tính tiền và nút chuyển chế độ ban đêm Dark Mode."*
2. **Bước 2 — Lấy câu lệnh chuẩn (Vibe Prompt):**
   Vào mục **Vibe Coding** (\`/vibe\`) trên thanh menu của GitXplore, chọn mẫu **"Quán Cà Phê Cyber Chill"** hoặc dùng **Vibe Wizard** rồi bấm nút **"Sao chép Prompt"**.
3. **Bước 3 — Đưa cho AI tạo ra web:**
   • Bạn mở **ChatGPT**, **Claude** hoặc công cụ **Cursor AI**.
   • Dán câu lệnh vừa copy vào ô chat và nhấn Enter.
   • Bùm! AI sẽ viết toàn bộ mã nguồn HTML/React và bạn chỉ cần mở ra xem kết quả!
   • Hoặc bạn có thể bấm **"⚡ Thử trong Sandbox"** ngay trên GitXplore để xem web chạy trực tiếp luôn!

Bạn có muốn mình tạo ngay một đoạn câu lệnh gợi ý cho ý tưởng của bạn không nè?`;
    }
    return `You can build a website with AI in 3 simple steps:
1. **Step 1:** Formulate your idea in plain words (e.g. "A chill coffee shop site with a drink menu and cart").
2. **Step 2:** Grab a ready-to-use prompt from our **/vibe** hub (or use Vibe Wizard).
3. **Step 3:** Paste it into ChatGPT, Claude, or Cursor IDE, or hit **"Try in Sandbox"** on GitXplore to see it live!`;
  }

  // Câu hỏi chung Arisu
  if (isVi) {
    return pick([
      `Mình đã hiểu câu hỏi của bạn về "${text}" rồi nè! Đối với phần này, bạn có thể giải quyết nhanh chóng bằng cách tiếp cận từng bước đơn giản. Nếu bạn muốn xem mã nguồn chi tiết hoặc cấu hình chuyên sâu, bạn có thể bấm nút **⚡ Dev Expert** ở phía trên khung chat để mình chuyển sang chế độ kỹ thuật nhé!`,
      `Ý kiến hay đấy bạn! Với câu hỏi "${text}", bạn hãy thử xem qua các công cụ gợi ý tại GitXplore nhé. Mình luôn sẵn sàng đồng hành và giải thích chi tiết hơn nếu bạn cần!`
    ]);
  }
  return `Got it! Regarding "${text}", feel free to explore GitXplore tools or switch to **⚡ Dev Expert** above if you need ready-to-run code snippets!`;
};

// Giữ lại alias để tương thích ngược 100%
export const getArisuAnimeResponse = getArisuCompanionResponse;

