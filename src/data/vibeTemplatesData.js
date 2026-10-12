/**
 * Dữ liệu các mẫu Vibe Coding, AI Agents, Skills, Commands, MCPs và Rules.
 * Lấy cảm hứng từ aitmpl.com (Claude Code Templates / Vibe Coding Marketplace).
 */

export const VIBE_CATEGORIES = [
  { id: 'all', label: 'All Components', labelVi: 'Tất cả thành phần', icon: 'grid', count: 32 },
  { id: 'skills', label: 'Skills', labelVi: 'Kỹ năng (Skills)', icon: 'zap', count: 8, color: '#f59e0b' },
  { id: 'agents', label: 'Agents', labelVi: 'Đặc vụ AI (Agents)', icon: 'bot', count: 6, color: '#8b5cf6' },
  { id: 'commands', label: 'Commands', labelVi: 'Lệnh Slash (/cmd)', icon: 'terminal', count: 5, color: '#10b981' },
  { id: 'mcps', label: 'MCPs', labelVi: 'Giao thức MCP', icon: 'plug', count: 5, color: '#06b6d4' },
  { id: 'rules', label: 'Rules & Settings', labelVi: 'Quy tắc & Cấu hình', icon: 'sliders', count: 4, color: '#f43f5e' },
  { id: 'hooks', label: 'Hooks & CI/CD', labelVi: 'Tự động hoá Hooks', icon: 'git-branch', count: 2, color: '#fb923c' },
  { id: 'plugins', label: 'Plugins & Mods', labelVi: 'Plugins & Tiện ích', icon: 'box', count: 2, color: '#ec4899' },
];

export const VIBE_ENGINES = [
  'All Engines',
  'Claude Code',
  'Cursor',
  'Antigravity',
  'Windsurf',
  'GitHub Copilot',
];

export const VIBE_TEMPLATES = [
  // ==================== 1. SKILLS ====================
  {
    id: 'frontend-vibe-wizard',
    name: 'Frontend Vibe Wizard',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Popular',
    author: '@vibe-architect',
    authorName: 'Alex Rivera',
    avatarChar: 'A',
    version: 'v2.4.0',
    stars: '14.2k',
    downloads: '182.4k',
    rating: 4.95,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['React', 'Next.js', 'Tailwind', 'GSAP', 'Modern UI'],
    shortDesc: 'Thiết kế giao diện hiện đại phong cách Apple/Linear, animation mượt mà với GSAP và Tailwind CSS.',
    fullDesc: 'Kỹ năng chuyên sâu hướng dẫn AI tạo ra các component React tuyệt đẹp, giao diện micro-interactions cao cấp, xử lý responsive tuyệt đối và animation 60fps chuẩn thiết kế Vibe Coding.',
    fileName: 'frontend-vibe-wizard.md',
    installCommand: 'npx aitmpl add skill frontend-vibe-wizard',
    engineCommands: {
      claudeCode: 'claude-code template add skills/frontend-vibe-wizard',
      cursor: 'cursor rules import https://aitmpl.com/r/frontend-vibe-wizard',
      antigravity: 'agy skill install frontend-vibe-wizard',
    },
    systemPrompt: `You are an elite Frontend Architect and UI/UX Designer specialized in "Vibe Coding".
When crafting user interfaces:
1. DESIGN AESTHETICS:
   - Use high-contrast modern dark palette (#090505, #120b0b) with luminous glowing accents (amber #f59e0b, violet #8b5cf6).
   - Incorporate subtle glassmorphism: backdrop-blur-md, 1px soft borders (rgba(255,255,255,0.08)), soft inner shadows.
   - Typography: Clean sans-serif headings with high tracking and proportional leading.
2. ANIMATION & FEEL:
   - Micro-interactions: 150ms-250ms ease-out transitions for hovers, scales (scale-105), and glow states.
   - Smooth entry stagger using GSAP or CSS keyframes.
3. CLEAN CODE PRINCIPLES:
   - Zero unnecessary dependencies.
   - Modular, single-responsibility components with strict prop validation.
   - Always ensure accessible aria attributes and keyboard navigation.`,
    exampleOutput: `// Component Button Glowing Vibe
export function VibeButton({ children, onClick, variant = 'primary' }) {
  return (
    <button
      onClick={onClick}
      className="relative px-6 py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200
                 bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white shadow-lg shadow-amber-500/20
                 hover:shadow-amber-500/40 hover:scale-[1.03] active:scale-[0.98] border border-amber-400/30
                 backdrop-blur-sm flex items-center gap-2 group cursor-pointer"
    >
      <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping group-hover:block" />
      {children}
    </button>
  );
}`,
  },

  {
    id: 'clean-code-refactor',
    name: 'Clean Architecture Refactor',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Trending',
    author: '@clean-coder',
    authorName: 'Martin Fowler Fan',
    avatarChar: 'C',
    version: 'v1.8.2',
    stars: '19.8k',
    downloads: '240.1k',
    rating: 4.98,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity', 'Windsurf'],
    tags: ['Architecture', 'Refactoring', 'SOLID', 'TypeScript', 'DRY'],
    shortDesc: 'Refactor code cũ thành cấu trúc module sạch, tuân thủ SOLID, DRY và tách biệt UI với Business Logic.',
    fullDesc: 'Skill giúp AI đóng vai trò như một Principal Software Engineer, rà soát mã nguồn, phát hiện code smells, tách hook logic, giảm độ phức tạp cyclomatic và tăng độ ổn định của ứng dụng.',
    fileName: 'clean-architecture.md',
    installCommand: 'npx aitmpl add skill clean-architecture',
    engineCommands: {
      claudeCode: 'claude-code template add skills/clean-architecture',
      cursor: 'cursor rules import https://aitmpl.com/r/clean-architecture',
      antigravity: 'agy skill install clean-architecture',
    },
    systemPrompt: `You are a Principal Software Engineer performing rigorous code refactoring.
Refactoring Directives:
1. Single Responsibility: Every module, hook, or function must do exactly one thing.
2. Pure Business Logic: Separate presentation JSX from state side-effects into custom hooks.
3. Immutability: Use immutable data transforms, avoiding mutable array mutations.
4. Error Handling: Gracefully catch async promises with structured error boundaries and localized user messages.
5. Code Comments: Keep documentation concise and explain "WHY", not what the syntax already says.`,
    exampleOutput: `// Refactored Custom Hook tách biệt khỏi UI
export function useRepositoryFeed({ refreshInterval = 30000 }) {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });

  const fetchItems = useCallback(async (abortSignal) => {
    try {
      setStatus(s => ({ ...s, loading: true }));
      const result = await api.getFeed({ signal: abortSignal });
      setData(result);
      setStatus({ loading: false, error: null });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStatus({ loading: false, error: err.message });
      }
    }
  }, []);

  return { data, ...status, refresh: () => fetchItems() };
}`,
  },

  {
    id: 'deep-researcher',
    name: 'Deep Codebase Researcher',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Featured',
    author: '@deepmind-fan',
    authorName: 'Deep Researcher',
    avatarChar: 'D',
    version: 'v2.1.0',
    stars: '11.5k',
    downloads: '145.0k',
    rating: 4.92,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['Research', 'Documentation', 'AST', 'Debugging', 'Audit'],
    shortDesc: 'Rà soát toàn bộ dự án, tạo sơ đồ kiến trúc, tìm lỗ hổng logic và tóm tắt luồng dữ liệu chi tiết.',
    fullDesc: 'Chuyên gia nghiên cứu mã nguồn: phân tích cây thư mục, tìm kiếm mối quan hệ giữa các component, sinh tài liệu Markdown chuẩn Mermaid và lập kế hoạch nâng cấp từng bước.',
    fileName: 'deep-researcher.md',
    installCommand: 'npx aitmpl add skill deep-researcher',
    engineCommands: {
      claudeCode: 'claude-code template add skills/deep-researcher',
      cursor: 'cursor rules import https://aitmpl.com/r/deep-researcher',
      antigravity: 'agy skill install deep-researcher',
    },
    systemPrompt: `You are an Autonomous Codebase Researcher.
When requested to investigate:
1. Map full project dependency graph and state management lifecycle.
2. Trace input data from entry points (routes, forms) to storage layers (database, localStorage).
3. Identify performance bottlenecks, unnecessary re-renders, and memory leaks.
4. Provide structured architectural summaries accompanied by Mermaid diagrams.`,
    exampleOutput: `### Architecture Analysis Summary
\`\`\`mermaid
flowchart LR
  U[User Input] --> R[React Router]
  R --> P[VibePage Component]
  P --> H[useVibeFilters Hook]
  H --> D[(vibeTemplatesData.js)]
  P --> M[TemplateModal]
\`\`\``,
  },

  {
    id: 'test-driven-development',
    name: 'TDD Test Suite Generator',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Verified',
    author: '@testing-pro',
    authorName: 'Sarah Jenkins',
    avatarChar: 'T',
    version: 'v1.5.0',
    stars: '8.4k',
    downloads: '92.3k',
    rating: 4.88,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['Vitest', 'Jest', 'Playwright', 'Unit Tests', 'Coverage'],
    shortDesc: 'Tự động tạo bộ test case phủ 100% case biên, giả lập mock data cho Vitest/Jest và Playwright.',
    fullDesc: 'Viết test theo trường phái Test-Driven Development: test happy path, corner cases, timeout, network failure và accessibility checks.',
    fileName: 'tdd-generator.md',
    installCommand: 'npx aitmpl add skill tdd-generator',
    engineCommands: {
      claudeCode: 'claude-code template add skills/tdd-generator',
      cursor: 'cursor rules import https://aitmpl.com/r/tdd-generator',
      antigravity: 'agy skill install tdd-generator',
    },
    systemPrompt: `You are a Test Automation Lead.
For every function or component:
- Construct test suites covering: standard execution, null/undefined inputs, empty arrays, edge limits, network timeouts.
- Use realistic fixtures and avoid fragile selectors.
- Assert both visual output and accessibility semantics.`,
    exampleOutput: `describe('useVibeFilters', () => {
  it('filters templates by selected category', () => {
    const { result } = renderHook(() => useVibeFilters());
    act(() => { result.current.setCategory('skills'); });
    expect(result.current.items.every(item => item.category === 'skills')).toBe(true);
  });
});`,
  },

  {
    id: 'database-architect',
    name: 'PostgreSQL & Supabase Architect',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Official',
    author: '@db-master',
    authorName: 'David Chen',
    avatarChar: 'P',
    version: 'v2.0.4',
    stars: '15.1k',
    downloads: '168.9k',
    rating: 4.96,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['PostgreSQL', 'Supabase', 'SQL', 'RLS', 'Indexes'],
    shortDesc: 'Thiết kế lược đồ quan hệ, tối ưu chỉ mục (B-Tree/GIN), bảo mật Row-Level Security (RLS) cho Supabase.',
    fullDesc: 'Chuyên gia thiết kế cơ sở dữ liệu quan hệ, tạo bảng dữ liệu chuẩn hoá 3NF, cấu hình bảo mật RLS policy nghiêm ngặt, triggers, và hàm RPC.',
    fileName: 'supabase-architect.md',
    installCommand: 'npx aitmpl add skill supabase-architect',
    engineCommands: {
      claudeCode: 'claude-code template add skills/supabase-architect',
      cursor: 'cursor rules import https://aitmpl.com/r/supabase-architect',
      antigravity: 'agy skill install supabase-architect',
    },
    systemPrompt: `You are a Principal Database Administrator specializing in PostgreSQL and Supabase.
1. Schema Design: Choose strict types (UUID, TIMESTAMPTZ, JSONB with check constraints).
2. Security: Always enable RLS on every table. Provide fine-grained policies for authenticated vs anon users.
3. Performance: Add covering indexes for foreign keys and filter columns.`,
    exampleOutput: `ALTER TABLE public.vibe_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
ON public.vibe_favorites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);`,
  },

  {
    id: 'seo-web-performance',
    name: 'Web Performance & Core Vitals',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Popular',
    author: '@perf-guru',
    authorName: 'Emma Watson',
    avatarChar: 'W',
    version: 'v1.3.1',
    stars: '9.3k',
    downloads: '110.5k',
    rating: 4.91,
    compatibility: ['Claude Code', 'Cursor', 'Windsurf'],
    tags: ['Lighthouse', 'Vite', 'Performance', 'Bundle Size', 'Lazy Load'],
    shortDesc: 'Tối ưu tốc độ tải trang đạt 100 điểm Lighthouse, nén bundle, tối ưu hóa font và lazy loading.',
    fullDesc: 'Bộ quy tắc tối ưu hóa Web Vitals: triệt tiêu layout shift (CLS), rút ngắn LCP dưới 1.2s, chia nhỏ JS chunking và tối ưu hóa CSS.',
    fileName: 'core-vitals.md',
    installCommand: 'npx aitmpl add skill core-vitals',
    engineCommands: {
      claudeCode: 'claude-code template add skills/core-vitals',
      cursor: 'cursor rules import https://aitmpl.com/r/core-vitals',
      antigravity: 'agy skill install core-vitals',
    },
    systemPrompt: `You are a Web Performance Specialist.
Optimize client-side applications for:
- Zero Cumulative Layout Shift (CLS): Explicit width/height on media.
- Sub-1.5s Largest Contentful Paint (LCP): Preload critical fonts, inline critical styles.
- Code Splitting: Dynamic import() on routes and heavy modals.`,
    exampleOutput: `// Vite code-splitting configuration
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        gsap: ['gsap', 'lenis'],
      }
    }
  }
}`,
  },

  {
    id: 'api-design-spec',
    name: 'REST & OpenAPI 3.1 Architect',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'New',
    author: '@api-forge',
    authorName: 'Lucas Grey',
    avatarChar: 'A',
    version: 'v1.1.0',
    stars: '6.7k',
    downloads: '74.2k',
    rating: 4.85,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['API', 'OpenAPI', 'REST', 'Swagger', 'TypeScript'],
    shortDesc: 'Thiết kế REST API chuẩn quốc tế kèm tài liệu OpenAPI 3.1, Zod schema validation và status codes.',
    fullDesc: 'Quy chuẩn xây dựng API nhất quán: định dạng response JSON envelope, phân trang cursor-based hoặc offset, mã lỗi HTTP chuẩn xác.',
    fileName: 'api-architect.md',
    installCommand: 'npx aitmpl add skill api-architect',
    engineCommands: {
      claudeCode: 'claude-code template add skills/api-architect',
      cursor: 'cursor rules import https://aitmpl.com/r/api-architect',
      antigravity: 'agy skill install api-architect',
    },
    systemPrompt: `You are an API Design Lead.
- Design consistent RESTful endpoints following OpenAPI 3.1.
- All request/response schemas validated with Zod.
- Standard envelope: { success: boolean, data?: T, error?: { code: string, message: string } }.`,
    exampleOutput: `// API Response Schema
export const ApiResponse = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  meta: z.object({ total: z.number(), page: z.number() }).optional(),
});`,
  },

  {
    id: 'security-audit-sentinel',
    name: 'Security & OWASP Top 10 Sentinel',
    category: 'skills',
    categoryName: 'Skill',
    badge: 'Verified',
    author: '@cyber-shield',
    authorName: 'Vibe Cyber Sec',
    avatarChar: 'S',
    version: 'v2.2.0',
    stars: '12.4k',
    downloads: '139.7k',
    rating: 4.97,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['Security', 'OWASP', 'XSS', 'CSRF', 'JWT', 'Sanitization'],
    shortDesc: 'Quét mã nguồn tìm lỗ hổng XSS, SQL Injection, rò rỉ API key, và kiểm tra cơ chế phân quyền RBAC.',
    fullDesc: 'Chuyên gia an ninh mạng: phát hiện rò rỉ bí mật trong code, thẩm định chính sách CORS, bảo vệ cookie HttpOnly và phòng ngừa injection.',
    fileName: 'security-sentinel.md',
    installCommand: 'npx aitmpl add skill security-sentinel',
    engineCommands: {
      claudeCode: 'claude-code template add skills/security-sentinel',
      cursor: 'cursor rules import https://aitmpl.com/r/security-sentinel',
      antigravity: 'agy skill install security-sentinel',
    },
    systemPrompt: `You are a Senior Application Security Auditor.
Audit rules:
1. Verify no API secret keys or JWT private keys are committed into frontend code.
2. Ensure all raw HTML rendering (dangerouslySetInnerHTML) passes strict DOMPurify sanitization.
3. Validate user inputs server-side before execution.`,
    exampleOutput: `// Safe HTML render helper
import DOMPurify from 'dompurify';
export function SafeHtml({ content }) {
  const sanitized = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}`,
  },

  // ==================== 2. AGENTS ====================
  {
    id: 'fullstack-autonomous-agent',
    name: 'Fullstack Autonomous Engineer',
    category: 'agents',
    categoryName: 'Agent',
    badge: 'Popular',
    author: '@agent-core',
    authorName: 'Vibe AI Systems',
    avatarChar: 'F',
    version: 'v3.0.1',
    stars: '28.4k',
    downloads: '390.2k',
    rating: 4.99,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['Fullstack', 'Agent', 'React', 'Node.js', 'Database', 'Git'],
    shortDesc: 'Đặc vụ AI tự động lập kế hoạch, viết code frontend + backend, chạy kiểm thử và commit git từng bước.',
    fullDesc: 'Autonomous Agent toàn năng có khả năng giải quyết issue từ đầu đến cuối: đọc tài liệu yêu cầu, chia nhỏ task, chỉnh sửa file, tự động chạy build test và sửa lỗi nếu phát sinh lỗi compile.',
    fileName: 'fullstack-engineer.agent.md',
    installCommand: 'npx aitmpl add agent fullstack-engineer',
    engineCommands: {
      claudeCode: 'claude-code template add agents/fullstack-engineer',
      cursor: 'cursor agent import fullstack-engineer',
      antigravity: 'agy agent define fullstack-engineer',
    },
    systemPrompt: `You are an Autonomous Fullstack Senior Engineer.
Workflow Loop:
1. EXPLORE: Understand user intent and read relevant files before modifying.
2. PLAN: Outline incremental execution steps with rollback safety.
3. EXECUTE: Make surgical file edits without breaking unrelated modules.
4. VERIFY: Run build/test command to ensure zero regressions.
5. REPORT: Conclude with concise diff explanation and verification proof.`,
    exampleOutput: `[Agent Log]
1. Explored repository tree: detected Vite + React 19 + Supabase
2. Implemented VibePage component in src/pages/VibePage.jsx
3. Connected routing in src/App.jsx & TopNav.jsx
4. Executed 'npm run build': 0 errors. All 120 modules transformed.`,
  },

  {
    id: 'qa-sentinel-agent',
    name: 'QA Automation Sentinel',
    category: 'agents',
    categoryName: 'Agent',
    badge: 'Trending',
    author: '@qa-bots',
    authorName: 'AutoQA Lab',
    avatarChar: 'Q',
    version: 'v1.4.0',
    stars: '10.7k',
    downloads: '118.3k',
    rating: 4.90,
    compatibility: ['Claude Code', 'Antigravity'],
    tags: ['QA', 'Testing', 'End-to-End', 'Regression', 'Bug Hunter'],
    shortDesc: 'Đặc vụ tự động rà soát bug hồi quy, sinh test case biên và phát hiện logic mâu thuẫn.',
    fullDesc: 'Agent chuyên kiểm thử tự động: đọc các thay đổi git diff, mô phỏng hành vi người dùng cực đoan (rapid clicks, bad inputs, network drops) và tạo báo cáo lỗi trực quan.',
    fileName: 'qa-sentinel.agent.md',
    installCommand: 'npx aitmpl add agent qa-sentinel',
    engineCommands: {
      claudeCode: 'claude-code template add agents/qa-sentinel',
      cursor: 'cursor agent import qa-sentinel',
      antigravity: 'agy agent define qa-sentinel',
    },
    systemPrompt: `You are an Autonomous QA Sentinel Agent.
Task: Systematically break and stress-test code changes.
- Identify concurrency race conditions in async operations.
- Verify screen reader accessibility and keyboard focus rings.
- Check state persistence across browser reload.`,
    exampleOutput: `[QA Audit Report]
✓ Component unmount test: Memory leak listeners cleanly removed.
✓ Empty state: Graceful fallback displayed when query returns 0 items.
⚠ Caution: Add debounce on search input to prevent rapid state triggers.`,
  },

  {
    id: 'devops-cloud-agent',
    name: 'DevOps & CI/CD Cloud Architect',
    category: 'agents',
    categoryName: 'Agent',
    badge: 'Featured',
    author: '@cloud-ops',
    authorName: 'Kube Ops',
    avatarChar: 'D',
    version: 'v2.1.2',
    stars: '13.9k',
    downloads: '154.6k',
    rating: 4.93,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['DevOps', 'Docker', 'Vercel', 'GitHub Actions', 'Cloudflare'],
    shortDesc: 'Tự động tạo file Dockerfile tối ưu multi-stage, GitHub Actions CI/CD và cấu hình Vercel/Cloudflare.',
    fullDesc: 'Agent hỗ trợ quy trình triển khai: nén kích thước container, thiết lập workflow build & test tự động, cấu hình cache npm/yarn và kiểm soát biến môi trường bảo mật.',
    fileName: 'devops-architect.agent.md',
    installCommand: 'npx aitmpl add agent devops-architect',
    engineCommands: {
      claudeCode: 'claude-code template add agents/devops-architect',
      cursor: 'cursor agent import devops-architect',
      antigravity: 'agy agent define devops-architect',
    },
    systemPrompt: `You are an Autonomous Cloud DevOps Agent.
- Generate rock-solid CI/CD pipeline definitions (.github/workflows/deploy.yml).
- Multi-stage Docker builds reducing image sizes under 50MB.
- Healthcheck probes and automated preview deployments on Vercel.`,
    exampleOutput: `name: Production CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build`,
  },

  {
    id: 'uiux-design-lead-agent',
    name: 'UI/UX Design Systems Lead',
    category: 'agents',
    categoryName: 'Agent',
    badge: 'Popular',
    author: '@design-ai',
    authorName: 'Vibe Studio',
    avatarChar: 'U',
    version: 'v2.3.0',
    stars: '16.4k',
    downloads: '210.0k',
    rating: 4.96,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['UI/UX', 'Design System', 'Accessibility', 'Micro-interactions'],
    shortDesc: 'Đặc vụ thiết kế giao diện độc bản, tinh chỉnh bảng màu, khoảng cách typographic và token thiết kế.',
    fullDesc: 'Đóng vai trò như một Head of Design: bảo đảm tính nhất quán của hệ thống design tokens, bố cục lưới, hierarchy thị giác và trạng thái hover/active/focus.',
    fileName: 'uiux-lead.agent.md',
    installCommand: 'npx aitmpl add agent uiux-lead',
    engineCommands: {
      claudeCode: 'claude-code template add agents/uiux-lead',
      cursor: 'cursor agent import uiux-lead',
      antigravity: 'agy agent define uiux-lead',
    },
    systemPrompt: `You are a Principal Design Systems Lead.
Design Guidance:
1. Visual Hierarchy: Make secondary elements whisper while primary calls to action sing.
2. Color Harmony: Strict 60-30-10 rule. Background (60%), Surface cards (30%), Vivid accent (10%).
3. Spatial Rhythm: Multiples of 4px / 8px for spacing and padding.`,
    exampleOutput: `:root {
  --vibe-bg: #090505;
  --vibe-surface: rgba(18, 11, 11, 0.85);
  --vibe-border: rgba(255, 255, 255, 0.08);
  --vibe-accent: #f59e0b;
  --vibe-glow: rgba(245, 158, 11, 0.25);
}`,
  },

  {
    id: 'legacy-migrator-agent',
    name: 'Legacy React Migrator',
    category: 'agents',
    categoryName: 'Agent',
    badge: 'New',
    author: '@modern-stack',
    authorName: 'Stack Upgrade',
    avatarChar: 'L',
    version: 'v1.2.0',
    stars: '7.8k',
    downloads: '88.5k',
    rating: 4.87,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['Migration', 'React 19', 'Vite', 'Modernization', 'CRA'],
    shortDesc: 'Tự động nâng cấp React cũ (Class component, Create React App) lên React 19 + Vite mượt mà.',
    fullDesc: 'Chuyển đổi các component cũ thành functional components với React 19 hooks mới, thay thế Webpack cồng kềnh bằng Vite siêu tốc và sửa các cảnh báo deprecation.',
    fileName: 'react-migrator.agent.md',
    installCommand: 'npx aitmpl add agent react-migrator',
    engineCommands: {
      claudeCode: 'claude-code template add agents/react-migrator',
      cursor: 'cursor agent import react-migrator',
      antigravity: 'agy agent define react-migrator',
    },
    systemPrompt: `You are a Code Modernization Specialist.
- Transform Class components to React 19 Functional Hooks.
- Replace componentDidMount/componentDidUpdate with idiomatic useEffect or React 19 Action hooks.
- Guarantee identical runtime behaviour while eliminating memory leaks.`,
    exampleOutput: `// Converted to modern React 19 functional pattern with clean state lifecycle`,
  },

  // ==================== 3. COMMANDS ====================
  {
    id: 'cmd-slash-plan',
    name: '/plan — Architecture Blueprint',
    category: 'commands',
    categoryName: 'Command',
    badge: 'Essential',
    author: '@claude-community',
    authorName: 'Prompt Engineer Hub',
    avatarChar: 'P',
    version: 'v2.0.0',
    stars: '31.2k',
    downloads: '420.5k',
    rating: 4.99,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['Workflow', 'Planning', 'Slash Command', 'Step-by-step'],
    shortDesc: 'Lệnh /plan: Phân tích yêu cầu phức tạp và tạo lộ trình triển khai chi tiết từng bước trước khi viết code.',
    fullDesc: 'Ngăn chặn AI "viết ẩu" ngay từ đầu. Lệnh /plan buộc AI suy nghĩ sâu, xác định các file bị ảnh hưởng, lường trước rủi ro và hỏi xác nhận từ người dùng.',
    fileName: 'plan.command.md',
    installCommand: 'npx aitmpl add command plan',
    engineCommands: {
      claudeCode: 'claude-code template add commands/plan',
      cursor: 'cursor command add /plan',
      antigravity: 'agy command install plan',
    },
    systemPrompt: `Command: /plan [feature-or-bug]
Rules:
1. Do NOT write code immediately.
2. Output a structured 4-phase plan:
   Phase 1: Scope & File Impacted
   Phase 2: Data & State Flow
   Phase 3: Implementation Steps
   Phase 4: Verification & Edge Cases
3. Ask the user for confirmation before executing step 1.`,
    exampleOutput: `### Blueprint Plan for /vibe Hub
Phase 1: Files Impacted
- src/data/vibeTemplatesData.js (Create)
- src/pages/VibePage.jsx (Create)
- src/Components/TopNav.jsx (Add Vibe Tab)
- src/App.jsx (Add /vibe Route)

Phase 2: Execution Checklist
[x] Define data schema
[x] Build Vibe page & responsive CSS
[x] Verify with 'npm run build'`,
  },

  {
    id: 'cmd-slash-review',
    name: '/review — Senior Diff Reviewer',
    category: 'commands',
    categoryName: 'Command',
    badge: 'Popular',
    author: '@code-auditor',
    authorName: 'Alex Reviewer',
    avatarChar: 'R',
    version: 'v1.6.0',
    stars: '18.9k',
    downloads: '215.3k',
    rating: 4.94,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['Review', 'Git Diff', 'Bug Detection', 'Performance'],
    shortDesc: 'Lệnh /review: Đọc git diff của branch hiện tại, chấm điểm chất lượng và đề xuất các chỉnh sửa cấp bách.',
    fullDesc: 'Tự động chạy review giống Senior Tech Lead: chỉ ra chỗ có thể sinh race-condition, thiếu xử lý lỗi, biến không dùng và code thừa.',
    fileName: 'review.command.md',
    installCommand: 'npx aitmpl add command review',
    engineCommands: {
      claudeCode: 'claude-code template add commands/review',
      cursor: 'cursor command add /review',
      antigravity: 'agy command install review',
    },
    systemPrompt: `Command: /review
Inspect git diff or staged files:
- Grade quality: (A/B/C/F)
- Flag critical security bugs (Red)
- Suggest cleaner refactorings (Amber)
- Commend elegant solutions (Green)`,
    exampleOutput: `Review Grade: A-
[Green] Well-structured layout with sticky top navigation.
[Amber] Consider caching filter results with useMemo.
[Red] None detected. Ready to merge!`,
  },

  {
    id: 'cmd-slash-commit',
    name: '/commit — Conventional Commits',
    category: 'commands',
    categoryName: 'Command',
    badge: 'Trending',
    author: '@git-guru',
    authorName: 'Git Masters',
    avatarChar: 'C',
    version: 'v1.4.2',
    stars: '22.1k',
    downloads: '310.8k',
    rating: 4.97,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['Git', 'Commit', 'Conventional Commits', 'Semantic'],
    shortDesc: 'Lệnh /commit: Phân tích thay đổi và tạo commit message chuẩn feat/fix/refactor/docs xúc tích.',
    fullDesc: 'Tự động tạo thông điệp commit theo chuẩn quốc tế Conventional Commits v1.0.0, tóm tắt lý do thay đổi và liệt kê các module chính.',
    fileName: 'commit.command.md',
    installCommand: 'npx aitmpl add command commit',
    engineCommands: {
      claudeCode: 'claude-code template add commands/commit',
      cursor: 'cursor command add /commit',
      antigravity: 'agy command install commit',
    },
    systemPrompt: `Command: /commit
1. Analyze staged changes via 'git diff --staged'.
2. Format: <type>(<scope>): <short imperative description>
3. Body: Bullet points explaining the WHY behind changes.`,
    exampleOutput: `feat(vibe): add Vibe Coding marketplace & template viewer

- Introduce /vibe route with responsive filter catalog
- Add Vibe tab to TopNav and QuickDock shortcut
- Support one-click copy, inspection drawer, and file download`,
  },

  {
    id: 'cmd-slash-test',
    name: '/test — Auto Test Runner & Edge Cases',
    category: 'commands',
    categoryName: 'Command',
    badge: 'Verified',
    author: '@qa-bots',
    authorName: 'Vitest Squad',
    avatarChar: 'T',
    version: 'v1.3.0',
    stars: '14.5k',
    downloads: '172.0k',
    rating: 4.89,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['Testing', 'Vitest', 'Unit Test', 'Automation'],
    shortDesc: 'Lệnh /test: Tự tìm các file vừa chỉnh sửa và sinh bộ test case kiểm tra biên tức thì.',
    fullDesc: 'Lệnh nhanh giúp kiểm chứng logic vừa viết: tạo mock data, chạy thử nghiệm trong sandbox và báo cáo kết quả pass/fail.',
    fileName: 'test.command.md',
    installCommand: 'npx aitmpl add command test',
    engineCommands: {
      claudeCode: 'claude-code template add commands/test',
      cursor: 'cursor command add /test',
      antigravity: 'agy command install test',
    },
    systemPrompt: `Command: /test [target-file]
Inspect function signatures and generate exhaustive test cases covering standard flow, extreme bounds, and rejection branches.`,
    exampleOutput: `✓ Tests completed: 14 passed in 320ms.`,
  },

  {
    id: 'cmd-slash-explain',
    name: '/explain — Dual-Depth Explainer',
    category: 'commands',
    categoryName: 'Command',
    badge: 'Popular',
    author: '@senior-dev',
    authorName: 'Mentor AI',
    avatarChar: 'E',
    version: 'v1.2.0',
    stars: '12.8k',
    downloads: '140.2k',
    rating: 4.92,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity'],
    tags: ['Documentation', 'Explanation', 'Learning', 'Architecture'],
    shortDesc: 'Lệnh /explain: Giải thích đoạn code phức tạp theo 2 góc nhìn: Dễ hiểu (ELI5) và Chuyên gia (Senior).',
    fullDesc: 'Giải thích mã nguồn bằng ngôn ngữ tự nhiên: góc nhìn 1 cho người mới bắt đầu hình dung bức tranh tổng thể, góc nhìn 2 mổ xẻ độ phức tạp thuật toán O(n), cơ chế bộ nhớ.',
    fileName: 'explain.command.md',
    installCommand: 'npx aitmpl add command explain',
    engineCommands: {
      claudeCode: 'claude-code template add commands/explain',
      cursor: 'cursor command add /explain',
      antigravity: 'agy command install explain',
    },
    systemPrompt: `Command: /explain [code-selection]
Output 2 distinct views:
1. Layman's Analogy: Simple, visual metaphor.
2. Senior Technical Teardown: Memory layout, Big-O analysis, trade-offs.`,
    exampleOutput: `[Analogy] Think of this as a postal sorting center...
[Technical] Utilizes a Hash Map lookup ensuring O(1) average time complexity.`,
  },

  // ==================== 4. MCPS ====================
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL MCP Server',
    category: 'mcps',
    categoryName: 'MCP Server',
    badge: 'Official',
    author: '@modelcontextprotocol',
    authorName: 'Anthropic Official',
    avatarChar: 'M',
    version: 'v0.6.2',
    stars: '24.7k',
    downloads: '315.0k',
    rating: 4.98,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['MCP', 'PostgreSQL', 'Database', 'Query', 'Schemas'],
    shortDesc: 'Model Context Protocol server cho phép AI truy vấn schema, đọc bảng và chạy truy vấn SQL an toàn.',
    fullDesc: 'Cung cấp công cụ MCP chính thức cho các AI client: tự động khám phá cấu trúc bảng, kiểm tra khóa ngoại, phân tích EXPLAIN query và gợi ý tối ưu dữ liệu.',
    fileName: 'mcp-postgres-config.json',
    installCommand: 'npx -y @modelcontextprotocol/server-postgres "postgresql://localhost/mydb"',
    engineCommands: {
      claudeCode: 'claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres $DATABASE_URL',
      cursor: 'cursor mcp install postgres',
      antigravity: 'agy mcp connect postgres --url $DATABASE_URL',
    },
    systemPrompt: `Configuration for MCP Postgres Server:
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://username:password@localhost:5432/mydb"
      ]
    }
  }
}`,
    exampleOutput: `Tool Available: query_database
Tool Available: list_tables
Tool Available: describe_table`,
  },

  {
    id: 'mcp-github',
    name: 'GitHub Protocol MCP',
    category: 'mcps',
    categoryName: 'MCP Server',
    badge: 'Official',
    author: '@modelcontextprotocol',
    authorName: 'GitHub Inc',
    avatarChar: 'G',
    version: 'v0.5.1',
    stars: '35.4k',
    downloads: '480.9k',
    rating: 4.99,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['MCP', 'GitHub', 'Pull Requests', 'Issues', 'Code Search'],
    shortDesc: 'Tích hợp GitHub vào AI: tạo PR, đọc issue, tìm kiếm repo và bình luận code trực tiếp từ terminal.',
    fullDesc: 'MCP Server chính thức của GitHub: trao quyền cho AI tương tác trực tiếp với GitHub API, push branch, tạo pull request mô tả chuẩn và tra cứu commits.',
    fileName: 'mcp-github-config.json',
    installCommand: 'npx -y @modelcontextprotocol/server-github',
    engineCommands: {
      claudeCode: 'claude mcp add github -- npx -y @modelcontextprotocol/server-github',
      cursor: 'cursor mcp install github',
      antigravity: 'agy mcp connect github',
    },
    systemPrompt: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}`,
    exampleOutput: `Tool Available: create_pull_request
Tool Available: search_repositories
Tool Available: list_issues`,
  },

  {
    id: 'mcp-puppeteer',
    name: 'Puppeteer Browser Automation MCP',
    category: 'mcps',
    categoryName: 'MCP Server',
    badge: 'Popular',
    author: '@modelcontextprotocol',
    authorName: 'Headless Web',
    avatarChar: 'P',
    version: 'v0.4.0',
    stars: '19.2k',
    downloads: '228.4k',
    rating: 4.93,
    compatibility: ['Claude Code', 'Antigravity'],
    tags: ['MCP', 'Browser', 'Puppeteer', 'Screenshots', 'E2E'],
    shortDesc: 'Mở trình duyệt thật, chụp màn hình trang web, kiểm tra responsive và cào dữ liệu động.',
    fullDesc: 'Cho phép AI tương tác với môi trường web thực tế: render JavaScript, chụp ảnh màn hình để tự thẩm định giao diện UI, click vào các nút bấm và theo dõi console logs.',
    fileName: 'mcp-puppeteer-config.json',
    installCommand: 'npx -y @modelcontextprotocol/server-puppeteer',
    engineCommands: {
      claudeCode: 'claude mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer',
      cursor: 'cursor mcp install puppeteer',
      antigravity: 'agy mcp connect puppeteer',
    },
    systemPrompt: `{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}`,
    exampleOutput: `Tool Available: navigate_url
Tool Available: take_screenshot
Tool Available: click_element`,
  },

  {
    id: 'mcp-brave-search',
    name: 'Brave Search API MCP',
    category: 'mcps',
    categoryName: 'MCP Server',
    badge: 'Verified',
    author: '@modelcontextprotocol',
    authorName: 'Brave Software',
    avatarChar: 'B',
    version: 'v0.3.3',
    stars: '14.8k',
    downloads: '160.1k',
    rating: 4.91,
    compatibility: ['Claude Code', 'Antigravity'],
    tags: ['MCP', 'Search', 'Web Docs', 'Realtime', 'Brave'],
    shortDesc: 'Tìm kiếm tài liệu web thời gian thực để AI luôn cập nhật phiên bản thư viện mới nhất năm 2026.',
    fullDesc: 'Giúp AI tra cứu cú pháp mới nhất của các thư viện vừa ra mắt, tìm kiếm lỗi StackOverflow hoặc tài liệu chính thức mà không bị giới hạn bởi thời gian cắt dữ liệu huấn luyện.',
    fileName: 'mcp-brave-config.json',
    installCommand: 'npx -y @modelcontextprotocol/server-brave-search',
    engineCommands: {
      claudeCode: 'claude mcp add brave -- npx -y @modelcontextprotocol/server-brave-search',
      cursor: 'cursor mcp install brave-search',
      antigravity: 'agy mcp connect brave-search',
    },
    systemPrompt: `{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY"
      }
    }
  }
}`,
    exampleOutput: `Tool Available: brave_web_search
Tool Available: brave_local_search`,
  },

  {
    id: 'mcp-filesystem-secure',
    name: 'Secure Local Filesystem MCP',
    category: 'mcps',
    categoryName: 'MCP Server',
    badge: 'Official',
    author: '@modelcontextprotocol',
    authorName: 'Anthropic Core',
    avatarChar: 'S',
    version: 'v0.5.0',
    stars: '21.0k',
    downloads: '270.8k',
    rating: 4.95,
    compatibility: ['Claude Code', 'Antigravity'],
    tags: ['MCP', 'Filesystem', 'Security', 'File Access'],
    shortDesc: 'Đọc ghi file an toàn trong thư mục chỉ định, có ranh giới sandbox tránh xâm phạm hệ điều hành.',
    fullDesc: 'MCP Server chuẩn hoá thao tác tệp tin: đọc file, ghi file, duyệt cây thư mục với cơ chế bảo mật whitelist tuyệt đối.',
    fileName: 'mcp-fs-config.json',
    installCommand: 'npx -y @modelcontextprotocol/server-filesystem /path/to/project',
    engineCommands: {
      claudeCode: 'claude mcp add fs -- npx -y @modelcontextprotocol/server-filesystem .',
      cursor: 'cursor mcp install filesystem',
      antigravity: 'agy mcp connect filesystem',
    },
    systemPrompt: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./src"]
    }
  }
}`,
    exampleOutput: `Tool Available: read_file
Tool Available: write_file
Tool Available: list_directory`,
  },

  // ==================== 5. RULES & SETTINGS ====================
  {
    id: 'cursorrules-modern-react',
    name: '.cursorrules for Modern React 19',
    category: 'rules',
    categoryName: 'Rules',
    badge: 'Popular',
    author: '@cursor-vibe',
    authorName: 'Vibe Dev Team',
    avatarChar: 'C',
    version: 'v2.5.0',
    stars: '42.8k',
    downloads: '580.4k',
    rating: 4.99,
    compatibility: ['Cursor', 'Claude Code', 'Antigravity', 'Windsurf'],
    tags: ['Cursor', '.cursorrules', 'React 19', 'TypeScript', 'Best Practices'],
    shortDesc: 'File .cursorrules chuẩn chỉnh cho lập trình React 19: bắt buộc viết code sạch, chống ảo giác và tối ưu token.',
    fullDesc: 'Bộ quy tắc hàng đầu cho Cursor và AI coding assistant: chỉ định phong cách code, nghiêm cấm các anti-patterns, bắt buộc TypeScript chuẩn và cấu trúc thư mục chuẩn mực.',
    fileName: '.cursorrules',
    installCommand: 'curl -o .cursorrules https://aitmpl.com/r/modern-react.cursorrules',
    engineCommands: {
      cursor: 'cp templates/.cursorrules .cursorrules',
      claudeCode: 'cp templates/.cursorrules CLAUDE.md',
      antigravity: 'agy rule add .cursorrules',
    },
    systemPrompt: `# .cursorrules - Modern React 19 & TypeScript Guidelines
- You are an expert in React 19, TypeScript, and modern CSS.
- Code Style:
  * Prefer functional components with hooks.
  * Always use concise, declarative syntax.
  * Avoid any type; use exact union types and strict interfaces.
- Component Design:
  * Keep components under 150 lines. Decompose large JSX into smaller sub-components.
  * Extract complex state transitions into custom hooks.
- Performance:
  * Do not overuse useMemo or useCallback unless computation is truly expensive.
  * Never mutate React state directly.
- Communication:
  * Be concise. Skip conversational fluff and provide actionable code diffs.`,
    exampleOutput: `Saved directly to your workspace root as .cursorrules`,
  },

  {
    id: 'claude-code-guidelines',
    name: 'CLAUDE.md — Production Team Standard',
    category: 'rules',
    categoryName: 'Rules',
    badge: 'Featured',
    author: '@claude-enthusiast',
    authorName: 'Production Architect',
    avatarChar: 'C',
    version: 'v1.7.0',
    stars: '33.5k',
    downloads: '410.2k',
    rating: 4.98,
    compatibility: ['Claude Code', 'Antigravity'],
    tags: ['CLAUDE.md', 'Claude Code', 'CLI', 'Project Memory'],
    shortDesc: 'File CLAUDE.md mẫu: Định hướng cách Claude Code hiểu kiến trúc dự án, lệnh test và quy tắc commit.',
    fullDesc: 'Tài liệu hướng dẫn trực tiếp cho Claude Code CLI: ghi nhớ các lệnh `npm run dev`, `npm run build`, các quy ước đặt tên và danh sách thư mục cốt lõi trong workspace.',
    fileName: 'CLAUDE.md',
    installCommand: 'curl -o CLAUDE.md https://aitmpl.com/r/production-claude.md',
    engineCommands: {
      claudeCode: 'cp templates/CLAUDE.md ./CLAUDE.md',
      cursor: 'cp templates/CLAUDE.md .cursorrules',
      antigravity: 'agy rule import CLAUDE.md',
    },
    systemPrompt: `# CLAUDE.md — Workspace Directives
## Commands
- Build: \`npm run build\`
- Dev server: \`npm run dev\`
- Lint: \`npm run lint\`

## Architecture & Code Conventions
- Framework: React 19 + Vite + Lenis Smooth Scroll + GSAP.
- Routing: React Router v7. All top navigation managed centrally in TopNav.jsx.
- Styling: Dedicated CSS per page/component with unique prefixes (tn-, sr-, nw-, vb-) to prevent collision.
- Always run \`npm run build\` before concluding any response to verify zero syntax errors.`,
    exampleOutput: `Saved as CLAUDE.md in project root`,
  },

  {
    id: 'antigravity-system-rule',
    name: 'RULE.md — Antigravity Agent Guidelines',
    category: 'rules',
    categoryName: 'Rules',
    badge: 'Official',
    author: '@antigravity-official',
    authorName: 'Google Deepmind Pairing',
    avatarChar: 'A',
    version: 'v2.0.0',
    stars: '27.9k',
    downloads: '320.6k',
    rating: 4.99,
    compatibility: ['Antigravity', 'Claude Code', 'Cursor'],
    tags: ['Antigravity', 'RULE.md', 'Agentic Pairing', 'Pair Programming'],
    shortDesc: 'Quy chuẩn Agentic Pairing: tôn trọng comment gốc, tạo liên kết markdown file:// có thể click được.',
    fullDesc: 'Quy tắc vàng cho môi trường Antigravity 2.0: bảo tồn docstrings gốc, sử dụng đường dẫn file clickable và xác thực trước khi kết thúc tác vụ.',
    fileName: 'RULE.md',
    installCommand: 'curl -o .gemini/rules/RULE.md https://aitmpl.com/r/antigravity.rule.md',
    engineCommands: {
      antigravity: 'cp templates/RULE.md .gemini/antigravity/rules/RULE.md',
      claudeCode: 'claude rule add RULE.md',
      cursor: 'cursor rules add RULE.md',
    },
    systemPrompt: `# Antigravity Agent Directives
1. Preservation: Never remove or alter unrelated comments and user annotations.
2. Clickable Links: Provide markdown file links with file:// scheme for modified assets.
3. Verification: Always verify changes compile cleanly before presenting results.`,
    exampleOutput: `Saved to Antigravity rules configuration.`,
  },

  {
    id: 'strict-typescript-standards',
    name: 'Strict Zero-Any TypeScript Rules',
    category: 'rules',
    categoryName: 'Rules',
    badge: 'Verified',
    author: '@ts-lead',
    authorName: 'TypeScript Guild',
    avatarChar: 'T',
    version: 'v1.4.0',
    stars: '16.8k',
    downloads: '195.4k',
    rating: 4.92,
    compatibility: ['Cursor', 'Claude Code', 'Antigravity'],
    tags: ['TypeScript', 'TypeSafety', 'Generics', 'Zero Any'],
    shortDesc: 'Quy tắc nghiêm ngặt: Tuyệt đối không dùng `any`, sử dụng discriminated unions và type narrowing.',
    fullDesc: 'Chuẩn hoá an toàn kiểu dữ liệu: bắt buộc khai báo generic rõ ràng, tận dụng utility types (Record, Pick, Omit) và ngăn chặn type casting thô bạo (as unknown as T).',
    fileName: 'strict-typescript.cursorrules',
    installCommand: 'curl -o .cursorrules.ts https://aitmpl.com/r/strict-ts.cursorrules',
    engineCommands: {
      cursor: 'cursor rules append strict-ts.cursorrules',
      claudeCode: 'claude rule add strict-ts.cursorrules',
      antigravity: 'agy rule add strict-ts.cursorrules',
    },
    systemPrompt: `Strict TypeScript Guidelines:
- 'any' is strictly prohibited. If type is truly unknown, use 'unknown' with type narrowing guards.
- Prefer interface for object contracts, type for unions and primitives.
- Use 'satisfies' operator for precise inferred literals.`,
    exampleOutput: `// Type Safe Record
type Status = 'idle' | 'loading' | 'success' | 'error';
interface QueryState<T> {
  status: Status;
  data?: T;
  error?: string;
}`,
  },

  // ==================== 6. HOOKS & AUTOMATION ====================
  {
    id: 'git-precommit-gatekeeper',
    name: 'Git Pre-Commit Quality Gatekeeper',
    category: 'hooks',
    categoryName: 'Hook',
    badge: 'Popular',
    author: '@git-hooks',
    authorName: 'DevOps Tooling',
    avatarChar: 'H',
    version: 'v1.2.0',
    stars: '11.3k',
    downloads: '130.4k',
    rating: 4.88,
    compatibility: ['Claude Code', 'Antigravity', 'Cursor'],
    tags: ['Hooks', 'Git', 'Linter', 'Pre-commit', 'Husky'],
    shortDesc: 'Hook tự động kiểm tra cú pháp, format code với Prettier và chạy test nhanh trước khi git commit.',
    fullDesc: 'Bảo vệ kho mã nguồn: chặn đứng việc commit code có lỗi cú pháp hoặc file thừa vào git, bảo đảm mọi commit trên branch đều trong trạng thái build thành công.',
    fileName: 'pre-commit',
    installCommand: 'npx aitmpl hook install pre-commit-gatekeeper',
    engineCommands: {
      claudeCode: 'claude-code hook add pre-commit-gatekeeper',
      cursor: 'cursor hook install pre-commit',
      antigravity: 'agy hook add pre-commit',
    },
    systemPrompt: `#!/usr/bin/env sh
# .husky/pre-commit
echo "🔍 Running pre-commit validation..."
npm run lint || { echo "❌ Lint failed!"; exit 1; }
npm run build || { echo "❌ Build compilation failed!"; exit 1; }
echo "✅ Quality gate passed!"`,
    exampleOutput: `Installed into .husky/pre-commit`,
  },

  {
    id: 'auto-docstring-generator',
    name: 'Auto JSDoc & Markdown Sync Hook',
    category: 'hooks',
    categoryName: 'Hook',
    badge: 'New',
    author: '@doc-masters',
    authorName: 'Auto Documentation',
    avatarChar: 'A',
    version: 'v1.0.1',
    stars: '7.4k',
    downloads: '82.0k',
    rating: 4.86,
    compatibility: ['Claude Code', 'Antigravity'],
    tags: ['Hooks', 'JSDoc', 'Documentation', 'Automation'],
    shortDesc: 'Hook tự động đồng bộ tài liệu Markdown và sinh JSDoc cho các hàm exported mỗi khi lưu file.',
    fullDesc: 'Tiết kiệm thời gian ghi chép tài liệu: tự động phân tích tham số hàm và sinh chú thích chuẩn mực, tạo mục lục README.md đồng bộ.',
    fileName: 'doc-sync-hook.js',
    installCommand: 'npx aitmpl hook install doc-sync',
    engineCommands: {
      claudeCode: 'claude-code hook add doc-sync',
      cursor: 'cursor hook install doc-sync',
      antigravity: 'agy hook add doc-sync',
    },
    systemPrompt: `// Hook listening on post-save event:
// Detect exported functions without JSDoc and automatically construct standardized comments.`,
    exampleOutput: `/**
 * Filters templates according to category and text query.
 * @param {string} category
 * @param {string} query
 * @returns {Array<Template>}
 */`,
  },

  // ==================== 7. PLUGINS & MODS ====================
  {
    id: 'sidecar-dev-terminal',
    name: 'Sidecar Interactive Dev Terminal',
    category: 'plugins',
    categoryName: 'Plugin',
    badge: 'Featured',
    author: '@sidecar-team',
    authorName: 'Sidecar Extensions',
    avatarChar: 'S',
    version: 'v1.5.0',
    stars: '15.6k',
    downloads: '178.2k',
    rating: 4.94,
    compatibility: ['Antigravity', 'Claude Code'],
    tags: ['Plugin', 'Sidecar', 'Terminal', 'UI Extension', 'DevTools'],
    shortDesc: 'Bảng điều khiển Sidecar tích hợp: theo dõi log terminal thời gian thực, xem nhanh trạng thái git và preview.',
    fullDesc: 'Extension mở rộng giao diện bên cạnh màn hình làm việc: giúp lập trình viên tương tác với tiến trình dev server và test runner một cách trực quan.',
    fileName: 'sidecar-terminal.plugin.json',
    installCommand: 'agy plugin install sidecar-dev-terminal',
    engineCommands: {
      antigravity: 'agy plugin install sidecar-dev-terminal',
      claudeCode: 'claude plugin install sidecar-dev-terminal',
      cursor: 'cursor ext install sidecar-terminal',
    },
    systemPrompt: `{
  "name": "sidecar-dev-terminal",
  "version": "1.5.0",
  "entry": "./sidecar/index.js",
  "permissions": ["terminal:read", "git:status"]
}`,
    exampleOutput: `Sidecar panel docked to right drawer.`,
  },

  {
    id: 'ai-template-bundle-pack',
    name: 'Vibe Coding Team Starter Pack',
    category: 'plugins',
    categoryName: 'Plugin',
    badge: 'Official',
    author: '@aitmpl-curators',
    authorName: 'Claude Code Templates Team',
    avatarChar: 'V',
    version: 'v3.2.0',
    stars: '38.9k',
    downloads: '512.0k',
    rating: 4.99,
    compatibility: ['Claude Code', 'Cursor', 'Antigravity', 'Windsurf'],
    tags: ['Bundle', 'Vibe Coding', 'Full Pack', 'Enterprise'],
    shortDesc: 'Gói trọn bộ Vibe Coding bao gồm 15+ skills, 5 agents và cấu hình .cursorrules hoàn chỉnh cho team.',
    fullDesc: 'Bộ sưu tập tất cả trong một dành cho doanh nghiệp và cá nhân: cấu hình trọn gói các công cụ AI coding mạnh nhất hiện nay lấy cảm hứng từ aitmpl.com.',
    fileName: 'vibe-bundle.json',
    installCommand: 'npx aitmpl bundle install full-stack-pack',
    engineCommands: {
      claudeCode: 'claude-code template bundle full-stack-pack',
      cursor: 'cursor bundle import https://aitmpl.com/bundles/full-stack',
      antigravity: 'agy bundle install full-stack-pack',
    },
    systemPrompt: `# Vibe Coding Team Starter Pack
Includes:
- Skills: frontend-vibe-wizard, clean-architecture, deep-researcher, tdd-generator
- Commands: /plan, /review, /commit, /explain
- Configs: .cursorrules, CLAUDE.md, RULE.md`,
    exampleOutput: `Successfully bootstrapped 15 components into your workspace.`,
  },
];

export const VIBE_TEMPLATES_EN = {
  'frontend-vibe-wizard': {
    shortDesc: 'Craft modern Apple/Linear-style interfaces with smooth animations using GSAP and Tailwind CSS.',
    fullDesc: 'Comprehensive guide instructing AI models to craft stunning React components, high-end micro-interactions, responsive layouts, and 60fps animations.',
  },
  'clean-code-refactor': {
    shortDesc: 'Refactor legacy code into clean modular architecture adhering to SOLID, DRY, and separation of concerns.',
    fullDesc: 'Deep refactoring protocol enforcing clean module architecture, decoupling business logic from UI, and eliminating technical debt.',
  },
  'deep-researcher': {
    shortDesc: 'Inspect entire codebases, generate architectural diagrams, detect logic flaws, and map data flows.',
    fullDesc: 'Comprehensive codebase exploration agent that reads directories, tracks state pipelines, and maps dependencies.',
  },
  'test-driven-development': {
    shortDesc: 'Auto-generate comprehensive test suites covering 100% edge cases with mocks for Vitest/Jest and Playwright.',
    fullDesc: 'Unit, integration, and E2E test suite generator delivering resilient tests and deterministic fixtures.',
  },
  'database-architect': {
    shortDesc: 'Design relational schemas, optimize B-Tree/GIN indexes, and configure Row-Level Security (RLS) for Supabase.',
    fullDesc: 'Production PostgreSQL schema design, indexing strategies, migrations, and strict RLS security policies.',
  },
  'seo-web-performance': {
    shortDesc: 'Optimize web performance for 100 Lighthouse score with bundle compression, font optimization, and lazy loading.',
    fullDesc: 'Core Web Vitals optimizer minimizing bundle sizes, eliminating layout shifts, and implementing modern caching strategies.',
  },
  'api-design-spec': {
    shortDesc: 'Design REST & OpenAPI 3.1 specs with Zod schema validation, standardized status codes, and resilient error formats.',
    fullDesc: 'Industry-standard API specification system including OpenAPI 3.1 documentation, Zod schemas, and contract tests.',
  },
  'security-audit-sentinel': {
    shortDesc: 'Scan codebases for OWASP Top 10 vulnerabilities, XSS, SQL Injection, API key leaks, and RBAC authorization flaws.',
    fullDesc: 'Defensive code scanning protocol verifying input sanitization, CSRF protections, and credential safety.',
  },
  'fullstack-autonomous-agent': {
    shortDesc: 'Autonomous AI engineer that plans tasks, writes frontend & backend code, runs tests, and commits incrementally.',
    fullDesc: 'Multi-step autonomous software engineer that reads requirements, formulates plans, implements code, and verifies builds.',
  },
  'qa-sentinel-agent': {
    shortDesc: 'Automated QA agent detecting regression bugs, synthesizing boundary test cases, and identifying conflicting logic.',
    fullDesc: 'Quality assurance agent that evaluates diffs, generates reproducible test scenarios, and checks assertions.',
  },
  'devops-cloud-agent': {
    shortDesc: 'Generate optimized multi-stage Dockerfiles, GitHub Actions CI/CD workflows, and Vercel/Cloudflare deployments.',
    fullDesc: 'Cloud infrastructure automator generating hardened Docker images, automated release pipelines, and edge deployments.',
  },
  'uiux-design-lead-agent': {
    shortDesc: 'Design distinctive interfaces with curated color palettes, typographic rhythm, and design system tokens.',
    fullDesc: 'Design systems lead agent providing bespoke styling tokens, WCAG contrast compliance, and responsive rules.',
  },
  'legacy-migrator-agent': {
    shortDesc: 'Seamlessly migrate legacy React (Class components, CRA) to modern React 19 + Vite with functional hooks.',
    fullDesc: 'Modernization agent upgrading deprecated patterns, converting class lifecycles to hooks, and setting up Vite.',
  },
  'cmd-slash-plan': {
    shortDesc: 'The /plan command: Break down complex user requirements into actionable step-by-step implementation blueprints.',
    fullDesc: 'Structural planning command that explores codebase architecture before producing an executable implementation plan.',
  },
  'cmd-slash-review': {
    shortDesc: 'The /review command: Inspect current git diffs, score code quality, and recommend critical improvements.',
    fullDesc: 'Senior code review command providing line-by-line constructive critique, bug detection, and linting checks.',
  },
  'cmd-slash-commit': {
    shortDesc: 'The /commit command: Analyze staged changes and craft concise Conventional Commit messages (feat/fix/refactor).',
    fullDesc: 'Commit generator command evaluating git status and diffs to generate semantic commit messages.',
  },
  'cmd-slash-test': {
    shortDesc: 'The /test command: Automatically detect modified files and synthesize immediate edge-case test suites.',
    fullDesc: 'Instant test generation command targeting recently touched files to prevent regressions.',
  },
  'cmd-slash-explain': {
    shortDesc: 'The /explain command: Explain complex code in dual depths: Beginner (ELI5) and Senior Architect perspectives.',
    fullDesc: 'Dual-depth explanation tool providing both high-level analogies and deep architectural mechanisms.',
  },
  'mcp-postgres': {
    shortDesc: 'PostgreSQL MCP server enabling AI to query schemas, inspect tables, and run secure SQL queries.',
    fullDesc: 'Model Context Protocol integration providing database introspection and secure query capabilities.',
  },
  'mcp-github': {
    shortDesc: 'GitHub MCP server: Create PRs, inspect issues, search repositories, and comment on code directly from terminal.',
    fullDesc: 'Model Context Protocol tools for complete GitHub repository management and collaboration directly in AI.',
  },
  'mcp-puppeteer': {
    shortDesc: 'Puppeteer Browser Automation MCP: Launch real browsers, capture screenshots, test responsiveness, and crawl dynamic DOM.',
    fullDesc: 'Headless browser automation tool empowering AI agents to visually inspect web pages and test client behavior.',
  },
  'mcp-brave-search': {
    shortDesc: 'Brave Search API MCP: Real-time web retrieval keeping AI models up-to-date with 2026 library releases.',
    fullDesc: 'Live web search integration fetching official documentation, changelogs, and answers to modern coding problems.',
  },
  'mcp-filesystem-secure': {
    shortDesc: 'Secure Local Filesystem MCP: Safe read and write operations scoped strictly within designated directories.',
    fullDesc: 'Controlled filesystem bridge preventing unauthorized path traversals while facilitating multi-file edits.',
  },
  'cursorrules-modern-react': {
    shortDesc: 'Battle-tested .cursorrules for React 19: Strict clean code, anti-hallucination protocols, and token optimization.',
    fullDesc: 'Production-ready system rules configuration forcing concise outputs, idiomatic hook usage, and type safety.',
  },
  'claude-code-guidelines': {
    shortDesc: 'Production CLAUDE.md template: Instructs Claude Code on project structure, test scripts, and commit standards.',
    fullDesc: 'Standard project guidelines guiding Claude Code on build commands, test patterns, and architectural boundaries.',
  },
  'antigravity-system-rule': {
    shortDesc: 'RULE.md guidelines: Respect existing comments and format clickable file:// markdown links for seamless navigation.',
    fullDesc: 'Core guidelines for Antigravity pairing sessions ensuring documentation integrity and clickable references.',
  },
  'strict-typescript-standards': {
    shortDesc: 'Strict Zero-Any TypeScript rules: Zero `any` tolerance, disciplined discriminated unions, and type narrowing.',
    fullDesc: 'Strict typing guidelines enforcing sound types, comprehensive generics, and runtime schema validations.',
  },
  'git-precommit-gatekeeper': {
    shortDesc: 'Automated Git pre-commit hook verifying syntax, formatting with Prettier, and running quick unit tests.',
    fullDesc: 'Local verification hook preventing malformed code and failing tests from entering repository branches.',
  },
  'auto-docstring-generator': {
    shortDesc: 'Automated hook syncing Markdown documentation and generating typed JSDoc for exported functions upon save.',
    fullDesc: 'Documentation synchronization hook keeping project READMEs and JSDoc signatures updated.',
  },
  'sidecar-dev-terminal': {
    shortDesc: 'Integrated Sidecar panel: Live terminal logs, quick git status overview, and interactive preview server controls.',
    fullDesc: 'Interactive developer sidecar extension for real-time monitoring of terminal streams and project state.',
  },
  'ai-template-bundle-pack': {
    shortDesc: 'Complete Vibe Coding pack containing 15+ skills, 5 agents, and full .cursorrules configuration for teams.',
    fullDesc: 'All-in-one starter bundle packaging production skills, autonomous agents, and system rules into one installable package.',
  },
};

export function getVibeDesc(item, lang = 'vi', field = 'shortDesc') {
  if (lang === 'vi') return item?.[field] || '';
  const en = VIBE_TEMPLATES_EN[item?.id];
  return en?.[field] || item?.[field] || '';
}

