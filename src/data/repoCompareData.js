/**
 * Dữ liệu so sánh đối đầu Repo Battle giữa các dự án mã nguồn mở.
 * Chứa các cặp so sánh kinh điển có phân tích sâu + thuật toán tự động sinh số liệu so sánh cho bất kỳ cặp dự án nào.
 */

export const POPULAR_PAIRS = [
  {
    id: 'react_vs_vue',
    nameA: 'React',
    nameB: 'Vue.js',
    title: 'React 19 vs Vue 3: Cuộc chiến UI Framework phổ biến nhất thế giới',
    summary: 'React thiên về tư duy Functional, hệ sinh thái đồ sộ và việc làm dồi dào. Vue thiên về cú pháp trực quan, dễ học cho người mới và hệ sinh thái all-in-one mượt mà.',
    scoreA: { stars: '228k', forks: '46k', beginnerScore: 7.5, vibeScore: 9.8, perfScore: 9.2, license: 'MIT' },
    scoreB: { stars: '208k', forks: '34k', beginnerScore: 9.4, vibeScore: 8.8, perfScore: 9.4, license: 'MIT' },
    strengthsA: [
      'Hệ sinh thái thư viện khổng lồ nhất (Next.js, Remix, React Native)',
      'Được hỗ trợ tối đa bởi các AI coding tool (Cursor, Claude, Copilot)',
      'Số lượng công việc và dự án thực tế áp đảo thị trường'
    ],
    strengthsB: [
      'Cực kỳ thân thiện cho người mới bắt đầu (học xong HTML/CSS/JS là làm được)',
      'Tài liệu chính thức bằng tiếng Việt và đa ngôn ngữ xuất sắc',
      'Tích hợp sẵn Router, State Management (Pinia) chuẩn chỉ không cần chọn lựa'
    ],
    verdict: 'Nếu bạn là người mới học lập trình hoặc muốn làm dự án cá nhân nhanh: Hãy chọn Vue 3. Nếu bạn muốn theo đuổi Vibe Coding chuyên nghiệp và cơ hội việc làm lớn: Hãy chọn React 19!'
  },
  {
    id: 'supabase_vs_pocketbase',
    nameA: 'Supabase',
    nameB: 'PocketBase',
    title: 'Supabase vs PocketBase: Backend-as-a-Service mã nguồn mở',
    summary: 'Supabase là giải pháp thay thế Firebase quy mô doanh nghiệp dựa trên PostgreSQL. PocketBase là backend siêu nhẹ gói gọn trong 1 file thực thi duy nhất viết bằng Go.',
    scoreA: { stars: '75k', forks: '5.8k', beginnerScore: 8.5, vibeScore: 9.5, perfScore: 9.0, license: 'Apache 2.0' },
    scoreB: { stars: '42k', forks: '2.1k', beginnerScore: 9.6, vibeScore: 8.5, perfScore: 9.8, license: 'MIT' },
    strengthsA: [
      'Sức mạnh toàn năng của PostgreSQL: Row Level Security, pgvector cho AI',
      'Edge Functions, Realtime WebSocket và Auth tích hợp sẵn',
      'Được Vercel và các công ty AI lựa chọn làm backend mặc định'
    ],
    strengthsB: [
      'Cực kỳ đơn giản: Toàn bộ backend chỉ là 1 file duy nhất ~15MB',
      'Không cần cài đặt phức tạp, chạy được trên VPS 3$/tháng cực mượt',
      'Bảng điều khiển Admin UI tích hợp sẵn rất đẹp mắt và dễ dùng'
    ],
    verdict: 'Nếu bạn làm dự án vừa và nhỏ, làm prototype cho khách hàng: PocketBase là lựa chọn số 1 về tốc độ. Nếu bạn cần AI Vector Search và mở rộng quy mô lớn: Supabase là vua!'
  },
  {
    id: 'nextjs_vs_vite',
    nameA: 'Next.js',
    nameB: 'Vite',
    title: 'Next.js vs Vite: Cuộc chiến Tooling & Server Rendering',
    summary: 'Next.js là fullstack framework tối ưu SEO và Server Components. Vite là công cụ build frontend siêu tốc định hình lại trải nghiệm lập trình hiện đại.',
    scoreA: { stars: '128k', forks: '26k', beginnerScore: 7.0, vibeScore: 9.7, perfScore: 8.8, license: 'MIT' },
    scoreB: { stars: '72k', forks: '6.5k', beginnerScore: 9.5, vibeScore: 9.2, perfScore: 9.9, license: 'MIT' },
    strengthsA: [
      'Hỗ trợ SSR, SSG, Server Actions tối ưu SEO hoàn hảo',
      'Hệ thống định tuyến App Router mạnh mẽ, deploy Vercel 1-click',
      'Tiêu chuẩn vàng cho các ứng dụng web thương mại và SaaS'
    ],
    strengthsB: [
      'Tốc độ khởi động máy chủ ảo gần như tức thì (< 300ms)',
      'Nhẹ nhàng, dễ hiểu, không bị ràng buộc bởi kiến trúc server phức tạp',
      'Hỗ trợ mọi framework: React, Vue, Svelte, Solid...'
    ],
    verdict: 'Người mới hoặc làm app Single Page (SPA) nên dùng Vite để có trải nghiệm nhẹ nhàng nhất. Khi nào cần làm web có SEO, thương mại điện tử: Chuyển sang Next.js!'
  },
  {
    id: 'ollama_vs_vllm',
    nameA: 'Ollama',
    nameB: 'vLLM',
    title: 'Ollama vs vLLM: Chạy Mô Hình Ngôn Ngữ Lớn (LLM) Cục Bộ',
    summary: 'Ollama giúp người bình thường chạy Llama 3 / Mistral trên laptop chỉ với 1 câu lệnh. vLLM là động cơ phục vụ AI hiệu năng cao dùng cho cụm máy chủ GPU.',
    scoreA: { stars: '115k', forks: '9.2k', beginnerScore: 9.8, vibeScore: 9.4, perfScore: 8.5, license: 'MIT' },
    scoreB: { stars: '32k', forks: '4.8k', beginnerScore: 6.5, vibeScore: 8.2, perfScore: 9.9, license: 'Apache 2.0' },
    strengthsA: [
      'Giao diện dòng lệnh 1-chạm: ollama run llama3 là xong',
      'Hỗ trợ macOS, Windows, Linux với CPU và GPU dân dụng cực tốt',
      'Dễ dàng kết nối với các công cụ Vibe Coding và Cursor AI'
    ],
    strengthsB: [
      'Thuật toán PagedAttention đạt thông lượng (throughput) gấp 24 lần',
      'Chuẩn công nghiệp cho các server GPU NVIDIA chạy hàng ngàn yêu cầu',
      'Hỗ trợ phân tán trên nhiều GPU đa luồng'
    ],
    verdict: 'Dùng cho máy cá nhân, học tập, nghiên cứu prompt: Chọn ngay Ollama. Triển khai AI vào doanh nghiệp cho hàng ngàn người dùng: Chọn vLLM!'
  }
];

/** Sinh dữ liệu so sánh tự động cho 2 dự án bất kỳ */
export function generateComparison(projA, projB) {
  if (!projA || !projB) return null;

  // Kiểm tra xem có cặp kinh điển không
  const match = POPULAR_PAIRS.find(
    (p) =>
      (p.nameA.toLowerCase() === projA.name.toLowerCase() && p.nameB.toLowerCase() === projB.name.toLowerCase()) ||
      (p.nameB.toLowerCase() === projA.name.toLowerCase() && p.nameA.toLowerCase() === projB.name.toLowerCase())
  );
  if (match) return match;

  const parseK = (str = '0') => {
    const s = String(str).toLowerCase().trim();
    if (s.endsWith('k')) return parseFloat(s) * 1000;
    return parseFloat(s) || 0;
  };

  const starsA = parseK(projA.stars);
  const starsB = parseK(projB.stars);
  const forksA = parseK(projForks(projA));
  const forksB = parseK(projForks(projB));

  return {
    id: `${projA.id}_vs_${projB.id}`,
    nameA: projA.name,
    nameB: projB.name,
    title: `${projA.name} vs ${projB.name}: So Sánh Công Nghệ Đối Đầu`,
    summary: `So sánh trực tiếp giữa hai giải pháp mã nguồn mở hàng đầu trong lĩnh vực ${projA.categoryName || 'công nghệ'}.`,
    scoreA: {
      stars: projA.stars || '10k',
      forks: projA.forks || '1k',
      beginnerScore: starsA > 50000 ? 8.2 : 7.5,
      vibeScore: 9.0,
      perfScore: 8.8,
      license: 'MIT'
    },
    scoreB: {
      stars: projB.stars || '10k',
      forks: projB.forks || '1k',
      beginnerScore: starsB > 50000 ? 8.4 : 7.8,
      vibeScore: 8.9,
      perfScore: 9.1,
      license: 'Apache 2.0'
    },
    strengthsA: [
      `Được phát triển với ngôn ngữ ${projA.language || 'đa nền tảng'}, tối ưu hóa hiệu năng`,
      `Cộng đồng GitHub mạnh mẽ với hơn ${projA.stars || 'nhiều'} lượt yêu thích`,
      `Mô tả: ${projA.description || 'Giải pháp mã nguồn mở tiêu chuẩn.'}`
    ],
    strengthsB: [
      `Sử dụng nền tảng ${projB.language || 'công nghệ hiện đại'}, tính linh hoạt cao`,
      `Được tin dùng bởi nhiều kỹ sư với hơn ${projB.stars || 'hàng ngàn'} stars`,
      `Mô tả: ${projB.description || 'Giải pháp mã nguồn mở thay thế mạnh mẽ.'}`
    ],
    verdict: `Cả hai đều là những dự án mã nguồn mở xuất sắc. Nếu bạn ưu tiên sự phổ biến và tài liệu rộng rãi, hãy cân nhắc ${starsA >= starsB ? projA.name : projB.name}. Nếu bạn muốn khám phá phương pháp tiếp cận mới mẻ, hãy thử nghiệm ${starsA < starsB ? projA.name : projB.name}!`
  };
}

function projForks(p) {
  return p?.forks || '1k';
}
