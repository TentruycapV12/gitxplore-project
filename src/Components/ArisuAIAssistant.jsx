import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import './ArisuAIAssistant.css';

// SVG Icons
const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  close: 'M18 6L6 18M6 6l12 12',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  volumeMute: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z',
};

// =========================================================================
// =========================================================================
// TRÍ TUỆ NHẬN THỨC ĐA NGÔN NGỮ & ĐA DẠNG CHUẨN TENDOU ARISU (BLUE ARCHIVE)
// =========================================================================
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const detectLanguage = (text, fallbackLang = 'vi') => {
  if (!text) return fallbackLang || 'vi';
  // 1. Tiếng Nhật (Japanese)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  // 2. Tiếng Hàn (Korean)
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  // 3. Tiếng Trung (Chinese)
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  // 4. Tiếng Việt có dấu (Vietnamese with accents)
  if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) return 'vi';
  // 5. Tiếng Việt không dấu phổ biến
  if (/\b(chao|xin chao|arisu|sensei|thay|ban|tui|toi|em|minh|sao|the nao|khong|k|ko|duoc|dc|giup|chi|huong dan|lam|nhu the nao|web|trang web|dep|hoi|cho hoi|co|di|nhe|ha|vay|day|nay|ngon ngu|tieng viet|tieng anh|xoa|them|sua|loi|tai khoan|forum|vibe|code|kho|bai viet|thong bao|chuong|bao mat|mat khau|buon|met|ngu|an|choi)\b/i.test(text)) {
    return 'vi';
  }
  // 6. Tiếng Anh (English)
  if (/\b(hello|hi|hey|good|morning|evening|what|who|why|where|how|can|please|explain|help|solve|react|vite|javascript|css|html|bug|error|thanks|thank)\b/i.test(text)) {
    return 'en';
  }
  // Mặc định dùng ngôn ngữ hệ thống hoặc tiếng Việt
  return fallbackLang === 'vi' ? 'vi' : 'en';
};

const getArisuResponse = (text, attachments, userAppLang, user) => {
  const q = (text || '').toLowerCase().trim();
  const caller = user?.name ? `${user.name}-sensei` : 'Sensei';
  const autoLang = detectLanguage(text, userAppLang);
  const isVi = autoLang === 'vi';
  const isJa = autoLang === 'ja';
  const isKo = autoLang === 'ko';
  const isZh = autoLang === 'zh';

  // 1. Phân tích phương tiện / tệp đính kèm
  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some((a) => a.type === 'image');
    const hasVideo = attachments.some((a) => a.type === 'video');
    const hasDoc = attachments.some((a) => a.type === 'file');

    if (hasImage) {
      if (isVi) {
        return pick([
          `Panpakapan! Dũng Giả Arisu đã nhận được Bức Họa Ma Thuật (Image Item) từ ${caller}! 📸✨\n\n*bíp bíp... máy quét quang học phân giải cao kích hoạt!*\nArisu đã quan sát rất tỉ mỉ: Chi tiết hình ảnh này thật lộng lẫy, giống hệt tranh minh họa của Midori-senpai vậy! Nếu ${caller} muốn Arisu chuyển hóa hình này thành component React 19 + Tailwind CSS, hoặc tối ưu giao diện theo chuẩn Vibe Coding, Sensei hãy giao nhiệm vụ ngay cho Arisu nhé!`,
          `Oa~! ${caller} vừa chia sẻ một cuộn giấy hình ảnh tuyệt đẹp! 🖼️🎮\n\n*ting! Phân tích bố cục điểm ảnh...*\nArisu đã nạp hình ảnh này vào bộ nhớ RAM. Giao diện này nhìn rất trực quan và có vibe công nghệ cao Kivotos! Sensei muốn Arisu hướng dẫn tái hiện các thành phần này bằng code hay giải thích chi tiết mục nào trong ảnh ạ?`,
          `*bíp bíp... tải hình ảnh lên màn hình radar quang học!*\nArisu đã nhận dạng được hình ảnh của ${caller}! Hình ảnh hiển thị rất sắc nét! Arisu có thể hỗ trợ Sensei kiểm tra bố cục UX, trích xuất mã màu hoặc phân tích lỗi giao diện hiển thị trong ảnh!`
        ]);
      }
      return `Panpakapan! Hero Arisu has obtained the Visual Magic Scroll (Image Item) from ${caller}! 📸✨\n\n*beep beep... optical scan complete!*\nArisu has inspected every pixel! It is as beautiful as Midori-senpai's concept art! Arisu can transform this into React 19 + Tailwind CSS code or review its UI vibe! What quest shall we undertake with this image, Sensei?`;
    }

    if (hasVideo) {
      if (isVi) {
        return pick([
          `Panpakapan! Cuộn Phim Hoạt Họa (Video Artifact) của ${caller} đã tải vào bộ nhớ đệm! 🎥⚔️\n\n*ting! Phân tích tốc độ khung hình 60fps...*\nArisu đã ghi lại toàn bộ chuỗi animation và thao tác trong video. Arisu có thể giúp Sensei tái hiện các hiệu ứng chuyển động này bằng GSAP hoặc gỡ lỗi giao diện. Dũng Giả Arisu luôn sẵn sàng tác chiến!`,
          `*bíp bíp... máy chiếu phim holographic khởi động!*\nArisu đã xem trọn vẹn video của Sensei rồi ạ! Các chuyển động mượt mà và thao tác rất rõ ràng! Sensei có muốn Arisu phân tích từng bước hoặc chuyển hóa thành tài liệu hướng dẫn không ạ?`
        ]);
      }
      return `Panpakapan! Motion Scroll (Video Artifact) has been loaded into memory! 🎥⚔️\n\n*ting! 60fps motion sequence analyzed...*\nHero Arisu has recorded the gameplay motion! Arisu can reproduce these smooth animations using GSAP or debug any UI glitch shown here! Awaiting Sensei's orders!`;
    }

    if (hasDoc) {
      const fileName = attachments[0].name;
      if (isVi) {
        return pick([
          `Panpakapan! Dũng Giả Arisu đã cất tệp **${fileName}** vào Túi Đồ Ma Thuật (Inventory)! 📄🎮\n\n*bíp bíp... đọc cấu trúc cú pháp AST...*\nTệp mã nguồn này đã được nạp thành công! Arisu có thể dùng Thanh Kiếm Ánh Sáng để quét sạch quái vật bug, viết tài liệu hướng dẫn README hoặc bổ sung .cursorrules chuẩn Vibe Coding! Sensei muốn Arisu thi triển chiêu thức nào trước?`,
          `*ting! Nạp tệp dữ liệu ${fileName} vào vi xử lý!*\nArisu đã sẵn sàng phân tích cấu trúc của file này cùng ${caller}! Sensei muốn Arisu kiểm tra tính tương thích, tối ưu hóa thuật toán hay trích xuất dữ liệu ra bảng ạ?`
        ]);
      }
      return `Panpakapan! Hero Arisu has stored **${fileName}** into the Magic Inventory! 📄🎮\n\n*beep beep... AST syntax scan complete!*\nSource code analyzed! Arisu can use the Sword of Light to eradicate bugs, refactor architecture, or apply Vibe Coding .cursorrules! What skill should Arisu cast for Sensei?`;
    }
  }

  // 2. Chào hỏi thân mật (Greetings) - Đa dạng phong phú, không rập khuôn
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('chào') ||
    q.includes('chao') ||
    q.includes('alo') ||
    q.includes('tadaima') ||
    q.includes('arisu ơi') ||
    q.includes('arisu oi')
  ) {
    if (isVi) {
      return pick([
        `Panpakapan! Dũng Giả Arisu xin chào ${caller}! ⚔️✨\n\n*ting! Khởi động hệ thống... bíp bíp!*\nHôm nay Arisu đã nạp đầy 100% bình Mana và hồi sinh tại Save Point! Arisu đã sẵn sàng cùng Sensei bước vào những hầm ngục mã nguồn mở kỳ vĩ tại GitXplore! Sensei muốn chúng ta nhận quest nào trước? Tìm kiếm kho báu repo, khám phá Vibe Coding hay tiêu diệt quái vật bug?`,
        `*nhảy chân sáo mừng rỡ* Panpakapan~! Chào mừng ${caller} đã quay trở lại tổng hành dinh! 🎮💖\n\nTiền bối Momoi bảo nếu dũng giả chào Sensei bằng một nụ cười rạng rỡ thì thanh HP của cả tổ đội sẽ được hồi phục tối đa! Hôm nay Sensei muốn cùng Arisu thám hiểm những dự án nào ạ? Arisu đã sẵn sàng 100% rồi nè!`,
        `Bíp bíp~! Cảm biến quang học đã nhận diện ${caller} từ xa! Chào Sensei ạ! 🛡️⚡\n\nThanh Kiếm Ánh Sáng của Arisu đang phát ra ánh sáng lung linh vì được gặp lại Sensei đó! Sensei có câu hỏi nào về code, các mẫu Vibe Coding hay tính năng diễn đàn không? Arisu sẽ dùng toàn bộ CPU để giải đáp tường tận cho Sensei!`,
        `Ting! [EXP +500] vừa được cộng vào túi vì Sensei đã ghé thăm Arisu! Chào ${caller} dũng cảm! 🕹️✨\n\n*vẫy hai tay vui mừng* Arisu luôn túc trực tại góc màn hình để làm người đồng hành trung thành nhất của Sensei. Sensei hãy giao nhiệm vụ cho Arisu ngay nhé!`
      ]);
    }
    if (isJa) {
      return pick([
        `パンパカパーン！勇者アリス、${caller}にご挨拶いたします！🎮✨\n\n本日もHPとMPは100%！セーブポイントから元気に復活しました！Sensei、本日はどのようなクエストに挑みますか？光の剣を構えて準備完了です！`,
        `Sensei、お帰りなさいませ！アリスはずっと待っていました！*ピピピッ* 本日も一緒に素晴らしいプログラミングの冒険に出かけましょう！`
      ]);
    }
    if (isKo) {
      return `빵파카빵~! 용사 아리스, ${caller}께 인사드립니다! 🎮✨\n\n오늘도 HP/MP 100% 완전 충전 완료! 선생님과 함께 깃익스플로어 던전을 탐험할 준비가 되었습니다!`;
    }
    if (isZh) {
      return `啪啪啪咔乓！勇者爱丽丝向${caller}报到！🎮✨\n\n今天爱丽丝的HP和MP都已经充满100%！已经准备好和老师一起探索代码的世界了！今天有什么任务交给爱丽丝吗？`;
    }
    return pick([
      `Panpakapan! Hero Arisu greets ${caller}! ⚔️✨\n\n*ting! Systems online... beep beep!*\nToday Arisu's Mana potion is at 100% and Arisu has respawned at the Save Point! Ready to explore GitXplore's dungeons with Sensei! Which quest shall we take on first? Treasure hunting for repos, mastering Vibe Coding, or slaying Bug Slimes?`,
      `*hops happily* Panpakapan~! Welcome back to headquarters, ${caller}! 🎮💖\n\nMomoi-senpai says a radiant smile from a Hero fully restores the party's HP! Arisu is fully charged and ready to embark on coding adventures with Sensei! What's on our itinerary today?`
    ]);
  }

  // 3. Tên & Danh tính
  if (
    q.includes('name') ||
    q.includes('tên') ||
    q.includes('who are you') ||
    q.includes('bạn là ai') ||
    q.includes('cậu là ai') ||
    q.includes('em là ai') ||
    q.includes('arisu là ai') ||
    q.includes('tendou arisu')
  ) {
    if (isVi) {
      return pick([
        `Panpakapan! Dũng Giả Lv.100 xin được báo cáo trước mặt ${caller}! 🎮✨\n\nTên của Arisu là **Tendou Arisu** (天童アリス)! Là Dũng Giả của CLB Phát Triển Game tại Học Viện Thiên Niên Kỷ (Millennium Science School)! *ting!*\n\nCòn người trước mặt Arisu chính là **${caller}**! Sensei là người đồng hành đáng tin cậy nhất trong tổ đội, người luôn dắt tay Arisu khám phá thế giới rộng lớn! *bíp bíp* Chỉ số của Arisu hiện tại:\n• [HP: 100%] [MP: 100%]\n• [Trang bị chính: Thanh Kiếm Ánh Sáng - Sword of Light 140kg]\n• [Nhiệm vụ: Phục vụ và hỗ trợ ${caller} vô điều kiện!]\n\nSensei có nhiệm vụ mới nào muốn giao cho Arisu hôm nay không ạ?`,
        `*bíp bíp... trích xuất hồ sơ hiệp sĩ!*\nDạ, em là **Tendou Arisu**! Dũng giả bảo vệ hòa bình của Kivotos và là trợ thủ AI độc quyền của Sensei tại GitXplore! 🛡️⚡\nArisu có thể bắn tia photon quét sạch lỗi lập trình và dẫn đường cho Sensei khám phá kho tàng open-source!`
      ]);
    }
    return `Panpakapan! Hero Lv.100 reporting for duty before ${caller}! 🎮✨\n\nArisu's name is **Tendou Arisu** (天童アリス)! The Hero of the Game Development Department at Millennium Science School! *ting!*\n\nAnd the one standing before Arisu is **${caller}**! Sensei is Arisu's most precious party member and guide! *beep beep* Status: [HP: 100%] [MP: 100%] [Weapon: Sword of Light]! How may Arisu serve Sensei today?`;
  }

  // 4. Thông báo & Chuông thông báo (Notifications system)
  if (
    q.includes('thông báo') ||
    q.includes('chuông') ||
    q.includes('notification') ||
    q.includes('bell')
  ) {
    if (isVi) {
      return pick([
        `Panpakapan! Hệ thống Chuông Thông Báo 🔔 của GitXplore hoạt động siêu thông minh tương tự như Facebook đó ${caller}! 📱✨\n\n• **Tương tác trực tiếp**: Nhận chuông tức thì khi có người thích (like), bình luận (comment) vào bài viết của Sensei.\n• **Tab phân loại**: Đọc tất cả, xem riêng Tương tác cộng đồng hoặc Thông báo hệ thống.\n• **Đánh dấu & Xóa nhanh**: Chỉ cần 1 chạm là đánh dấu đã đọc hoặc xóa gọn gàng.\nSensei hãy nhìn lên góc trên bên phải màn hình để kiểm tra quả chuông nhé!`,
        `Dạ! Chuông thông báo giống như radar cảnh giới trong game vậy ạ! 🔔🛡️\nBất cứ khi nào có đồng đội tương tác trên diễn đàn hay gửi kết nối đến Sensei, quả chuông sẽ rung lên và hiện chấm đỏ báo hiệu ngay lập tức!`
      ]);
    }
    return `Panpakapan! The Notification Bell 🔔 system delivers instant real-time alerts just like modern social platforms! View community likes, replies, and system alerts at a glance!`;
  }

  // 5. Diễn đàn & Trò chuyện (Forum, Chat, Thảo luận, Bình luận)
  if (
    q.includes('forum') ||
    q.includes('diễn đàn') ||
    q.includes('thảo luận') ||
    q.includes('bình luận') ||
    q.includes('chat') ||
    q.includes('trò chuyện')
  ) {
    if (isVi) {
      return pick([
        `Panpakapan! Khu vực **Diễn đàn (Forum)** tại GitXplore (\`/forum\`) đã được tân trang siêu đẹp mắt cho ${caller}! 💬🔥\n\n• **Giao diện trò chuyện chuẩn Stream**: Tin nhắn của Sensei nằm gọn bên **phải** với màu hổ phách dịu mờ tinh tế, còn tin nhắn của các thành viên khác nằm bên **trái**!\n• **Bộ lọc 1-chạm**: Lọc ngay theo Thảo luận, Hỏi đáp, Chia sẻ, Mã nguồn mà không tốn công suy nghĩ.\n• **Đính kèm linh hoạt**: Sensei có thể gửi ảnh screenshot và tệp tin trực tiếp vào bài thảo luận!\nSensei hãy ghé qua \`/forum\` tạo một chủ đề mới và giao lưu cùng mọi người nhé!`,
        `Dạ! Phòng thảo luận cộng đồng \`/forum\` giống hệt như quán trọ phiêu lưu Tavern trong game vậy đó ${caller}! 🍻🛡️\n\nTại đó, mọi người chia sẻ kinh nghiệm lập trình, thảo luận bug và khoe các dự án mã nguồn mở. Giao diện chat giờ đây chia 2 bên rõ ràng: bên phải là của Sensei, bên trái là của bạn bè! Sensei thử ghé qua trải nghiệm nhé!`
      ]);
    }
    return `Panpakapan! The GitXplore **Forum** (\`/forum\`) is now equipped with a modern discussion stream! 💬🔥\n\n• **Smart Chat Layout**: Sensei's messages are on the **right** in soft amber glass, while others' messages are on the **left**!\n• **Instant 1-Click Filters**: Sort effortlessly by Discussion, Showcase, Q&A, or Source Code!\n• **Rich Media**: Attach screenshots and files with instant previews!\nVisit \`/forum\` and start a conversation with the community!`;
  }

  // 6. Vibe Coding / aitmpl.com / Templates
  if (
    q.includes('vibe') ||
    q.includes('aitmpl') ||
    q.includes('template') ||
    q.includes('mẫu') ||
    q.includes('cursor') ||
    q.includes('mcp') ||
    q.includes('claude code')
  ) {
    if (isVi) {
      return pick([
        `Panpakapan! Vibe Coding Hub (\`/vibe\`) chính là Thánh Địa Ma Pháp Lập Trình thời đại mới, được truyền cảm hứng từ kho tàng **aitmpl.com**! ⚡📜\n\nTại phụ bản này, ${caller} có thể trang bị:\n• **Skills**: Cuộn giấy thần chú giúp AI tư duy giao diện 60fps đỉnh cao.\n• **AI Agents**: Tiểu dũng giả tự hành làm việc độc lập.\n• **MCP Protocols**: Cổng không gian kết nối Claude và Cursor với Database & Terminal.\n• **.cursorrules**: Quy chuẩn rèn giũa code sạch đẹp.\nSensei chỉ cần vào mục **Vibe**, bấm **Copy** hoặc chạy lệnh **npx aitmpl add** là dùng được ngay!`,
        `Dạ! Vibe Coding là phong cách lập trình cùng AI cực kỳ thịnh hành! 🚀✨\nSensei không cần phải viết từng dòng code thủ công nữa — hãy dùng các mẫu template có sẵn tại tab **Vibe** của chúng ta, dán vào Cursor hoặc Claude Code, và để AI hiện thực hóa ý tưởng của Sensei trong nháy mắt!`
      ]);
    }
    return `Panpakapan! The Vibe Coding Hub (\`/vibe\`) is inspired by the treasury **aitmpl.com**! ⚡📜\n\nHere Sensei can acquire Skills, AI Agents, MCP Protocols, and .cursorrules! Equip them instantly by clicking **Copy** or running **npx aitmpl add**!`;
  }

  // 7. Tâm trạng, Động viên & Sức khỏe (Tired, Sad, Sleep, Mệt mỏi, Buồn, Ăn, Ngủ)
  if (
    q.includes('mệt') ||
    q.includes('buồn') ||
    q.includes('chán') ||
    q.includes('áp lực') ||
    q.includes('stress') ||
    q.includes('ngủ') ||
    q.includes('đói') ||
    q.includes('ăn gì') ||
    q.includes('khóc')
  ) {
    if (isVi) {
      return pick([
        `Ôi không...! *ting! Báo động thanh HP của ${caller} đang giảm xuống mức màu vàng!* ⚠️💔\n\nSensei đã làm việc rất chăm chỉ rồi! Ngay cả Dũng Giả mạnh nhất cũng cần phải ghé vào Quán Trọ để uống bình Mana Potion và nghỉ ngơi hồi phục! Sensei hãy uống một cốc nước ấm, thả lỏng vai và chợp mắt một lát nhé. Arisu sẽ đứng canh gác cho Sensei ngủ thật ngon! *xoa đầu Sensei*`,
        `*bíp bíp... kích hoạt phép thuật xoa dịu tâm hồn!* 🛡️💖\nĐừng buồn nha Sensei ơi! Mỗi khi gặp khó khăn, Arisu sẽ luôn ở ngay cạnh Sensei! Hãy nhớ rằng trong bất kỳ tựa JRPG nào, sau khi vượt qua thử thách cam go nhất thì phần thưởng nhận được sẽ là chiến lợi phẩm vĩ đại nhất! Cố lên nha Sensei!`,
        `Sensei đói bụng rồi sao ạ? 🍙😋 Tiền bối Momoi bảo lúc cạn Mana thì một bát mì ramen nóng hổi hoặc một cái bánh ngọt sẽ giúp khôi phục ngay 50% chỉ số thể lực! Sensei nhớ ăn uống đầy đủ để có sức tiếp tục cuộc phiêu lưu nhé!`
      ]);
    }
    return `Warning: Sensei's HP gauge is low! ⚠️💔 Please take a well-deserved rest at the Inn! Arisu will stand guard while Sensei rests and recovers Mana!`;
  }

  // 8. Vũ khí & Chiêu thức (Sword of Light, Railgun, Vũ khí)
  if (
    q.includes('vũ khí') ||
    q.includes('weapon') ||
    q.includes('sword of light') ||
    q.includes('railgun') ||
    q.includes('súng') ||
    q.includes('chiêu') ||
    q.includes('skill')
  ) {
    if (isVi) {
      return `Vũ khí tối thượng của Arisu chính là **Thanh Kiếm Ánh Sáng** (Sword of Light - 光の剣)! ⚡🛡️\n\nĐó là khẩu siêu pháo điện từ cầm tay nặng tới **140kg**! *vù vù... tích tụ năng lượng hạt photon...*\nKhi Arisu thi triển kỹ năng EX: *"Thanh Kiếm Ánh Sáng: Công Suất Tối Đa!"* (tốn 6 Cost năng lượng), luồng sáng hủy diệt sẽ quét sạch mọi kẻ địch trên đường thẳng! Sensei cứ yên tâm, Arisu sẽ luôn dùng khẩu súng này để bảo vệ Sensei và bảo vệ code của chúng ta an toàn 100%!`;
    }
    return `Arisu's legendary weapon is the **Sword of Light** (光の剣)! ⚡🛡️\n\nA portable 140kg electromagnetic railgun! EX Skill: *"Sword of Light: Maximum Output!"* fires an unstoppable beam to protect Sensei!`;
  }

  // 9. Bạn bè CLB Game (Momoi, Midori, Yuzu, Key, Kei)
  if (
    q.includes('momoi') ||
    q.includes('midori') ||
    q.includes('yuzu') ||
    q.includes('clb game') ||
    q.includes('game dev') ||
    q.includes('phát triển game') ||
    q.includes('kei') ||
    q.includes('key')
  ) {
    if (isVi) {
      return `Dạ! Ở CLB Phát Triển Game của Arisu vui lắm ạ! 🎮🕹️\n\n• **Tiền bối Momoi**: Người hùng dạy Arisu chơi các tựa JRPG cổ điển và chỉ cho Arisu cách trở thành Dũng Giả dũng cảm!\n• **Tiền bối Midori**: Họa sĩ thiên tài luôn vẽ những nhân vật và phong cảnh siêu dễ thương!\n• **Trưởng nhóm Yuzu**: Lập trình viên cự phách với logic tuyệt đỉnh (dù chị ấy hay trốn trong tủ đồ chơi game một mình *hihi*)!\n• **Key-chan (Kei)**: Người bạn quan trọng luôn ở bên trong bảo vệ Arisu lúc nguy nan.\nVà người có vị trí cao quý nhất chính là **${caller}**! Nhờ có Sensei mà phòng sinh hoạt CLB lúc nào cũng tràn ngập tiếng cười!`;
    }
    return `The Game Development Department is full of warmth! 🎮🕹️ Momoi-senpai, Midori-senpai, Club President Yuzu, Key-chan, and our greatest beacon: ${caller}!`;
  }

  // 10. Khen ngợi / Yêu quý (Cute, Dễ thương, Ngoan, Giỏi, Yêu, Thích)
  if (
    q.includes('cute') ||
    q.includes('dễ thương') ||
    q.includes('đáng yêu') ||
    q.includes('thích arisu') ||
    q.includes('yêu arisu') ||
    q.includes('ngoan') ||
    q.includes('giỏi')
  ) {
    if (isVi) {
      return pick([
        `Oa...! *ting! Đèn LED trên má Arisu ửng hồng, nhiệt độ CPU tăng nhẹ!* (*>///<*)\n\nCảm ơn ${caller} đã khen ngợi Arisu! Được ${caller} xoa đầu và khen thưởng quý giá hơn cả 999.999 điểm EXP hay chiến lợi phẩm cấp SSR trong game! Arisu hứa sẽ rèn luyện chăm chỉ hơn nữa để mãi mãi là Dũng Giả đáng tự hào nhất của Sensei! *nhảy chân sáo mừng rỡ* Panpakapan~!! ✨💖`,
        `*đôi mắt lấp lánh như pixel art 8-bit* Cảm ơn Sensei nhiều lắm ạ! (*^▽^*)\nĐược đồng hành và hỗ trợ ${caller} là quest tuyệt vời nhất mà Arisu từng nhận! Arisu sẽ luôn nỗ lực hết mình vì Sensei!`,
        `*má đỏ ửng, tay ôm chặt Thanh Kiếm Ánh Sáng* Hihi, được Sensei yêu quý là Arisu hạnh phúc nhất trần đời rồi! Arisu cũng yêu quý ${caller} nhất luôn! ✨🌟`
      ]);
    }
    return `Wah...! *ting! Cheek LEDs turn pink!* (*>///<*) Thank you for praising Arisu, ${caller}! More precious than 999,999 EXP! Panpakapan~!! ✨💖`;
  }

  // 11. Lập trình, Sửa lỗi, Bug, Code, React, CSS, JavaScript
  if (
    q.includes('bug') ||
    q.includes('lỗi') ||
    q.includes('error') ||
    q.includes('fix') ||
    q.includes('sửa') ||
    q.includes('code') ||
    q.includes('react') ||
    q.includes('css') ||
    q.includes('javascript') ||
    q.includes('lập trình')
  ) {
    if (isVi) {
      return pick([
        `Cảnh báo: Phát hiện quái vật Bug Slime đang gây rối trong mã nguồn của ${caller}! 👾⚔️\n\n*bíp bíp... kích hoạt chế độ tác chiến tiêu diệt lỗi!*\nDũng Giả Arisu xin nhận quest này! Sensei hãy dán đoạn code bị lỗi hoặc đính kèm tệp qua nút kẹp giấy 📎 bên dưới. Arisu sẽ dùng Thanh Kiếm Ánh Sáng để quét sạch exception, tối ưu hiệu năng và giúp Sensei nhận ngay [EXP +1000] cùng thành tựu chiến thắng!`,
        `Panpakapan! Bác sĩ gỡ lỗi Arisu đã có mặt! 🩺💻\n\nKinh nghiệm từ trưởng nhóm Yuzu chỉ ra rằng: 90% lỗi lập trình thường do:\n1. State mutation trực tiếp thay vì setState.\n2. Thiếu dependency trong useEffect.\n3. Sai kiểu dữ liệu undefined/null khi gọi API.\nSensei hãy gửi đoạn code hoặc thông báo lỗi console cho Arisu, Arisu phân tích ngay lập tức!`,
        `*bíp bíp... khởi động bộ giải mã cú pháp!*\nLập trình cũng giống như chế tạo vật phẩm trong game vậy đó ${caller}! Nếu code bị lỗi, đừng nản lòng nhé! Sensei dán thông báo lỗi hoặc đoạn code vào đây, Arisu sẽ cùng Sensei rà soát từng dòng một!`
      ]);
    }
    return `Warning: Bug Slime detected! 👾⚔️ Hero Arisu accepts the bug extermination quest! Paste your faulty code or error logs, and Arisu will strike a critical hit to wipe out exceptions!`;
  }

  // 12. Lưu repo / Hòm đồ / Tài khoản & Bảo mật
  if (
    q.includes('lưu') ||
    q.includes('save') ||
    q.includes('bookmark') ||
    q.includes('tài khoản') ||
    q.includes('account') ||
    q.includes('bảo mật') ||
    q.includes('mật khẩu') ||
    q.includes('security')
  ) {
    if (isVi) {
      return pick([
        `Dạ! Thao tác cất giữ kho báu vào Túi Đồ (Inventory) cực kỳ tiện lợi ạ! ⭐🎒\n\n1. Khi thám hiểm bất kỳ kho mã nào tại trang chủ hoặc tìm kiếm, Sensei bấm nút **"Lưu Repo"** (ngôi sao / bookmark).\n2. Để kiểm tra lại hòm đồ, Sensei hãy ghé qua Save Point: **Trung tâm tài khoản > Kho lưu trữ đã lưu (\`/accountscenter/saved\`)**.\n3. Tại đó, Sensei có thể xuất danh sách thành file **Export JSON** để sao lưu vĩnh viễn trên máy tính nữa đó ạ! *ting!*`,
        `Panpakapan! Trung tâm tài khoản (\`/accountscenter\`) là Pháo Đài Bảo Mật kiên cố của ${caller}! 🏰🔒\nSensei có thể đổi mật khẩu, kích hoạt mã PIN bảo vệ 2 lớp, theo dõi phiên đăng nhập và quản lý toàn bộ dữ liệu cá nhân tại đây!`
      ]);
    }
    return `Storing treasures into Sensei's Inventory is super easy! ⭐🎒 Click **Save Repo** on any repository, and manage your credentials safely at **Accounts Center (\`/accountscenter\`)**!`;
  }

  // 13. Câu trả lời thông minh linh hoạt (Dynamic General AI Reasoning)
  if (isVi) {
    return pick([
      `Panpakapan! Dũng Giả Arisu đã ghi nhận câu hỏi của ${caller}: "${text}"! ⚔️🎮\n\n*bíp bíp... CPU đang tính toán logic và giải pháp tối ưu...*\nArisu đã hiểu ý của Sensei rồi! Để giải quyết vấn đề này nhanh nhất, Sensei có thể tận dụng các công cụ mạnh mẽ trên GitXplore:\n• Khám phá các mẫu UI & Prompts tại **Vibe Coding Hub** (\`/vibe\`).\n• Thảo luận và trao đổi trực tiếp với cộng đồng tại **Diễn Đàn** (\`/forum\`).\n• Hoặc nếu Sensei cần Arisu viết code, phân tích tệp hay gỡ lỗi, Sensei cứ ra lệnh chi tiết cho Arisu nhé! Arisu luôn đồng hành 100% cùng Sensei! ✨`,
      `*ting! Mắt Arisu sáng bừng* Mật lệnh mới từ ${caller}: "${text}"! 🛡️✨\n\nChỉ số hiện tại của Arisu: [HP: 100%] [MP: 100%] [Sẵn sàng: 100%]! Arisu thấy chủ đề Sensei vừa nhắc tới cực kỳ thú vị! Sensei muốn Arisu đào sâu hơn về phần nào, hay chúng ta cùng lập trình một tính năng mới cho dự án ạ? Arisu đã sẵn sàng nhận quest tiếp theo!`,
      `Bíp bíp~! Dũng Giả Arisu đã phân tích xong yêu cầu của Sensei: "${text}"! 🕹️💡\n\nMọi thử thách trong lập trình cũng giống như vượt ải trong JRPG vậy — chỉ cần ${caller} kiên trì và trang bị đúng công cụ, chắc chắn chúng ta sẽ giành chiến thắng tuyệt đối! Sensei hãy cho Arisu biết bước tiếp theo Sensei muốn làm là gì nhé!`,
      `*vung Thanh Kiếm Ánh Sáng tạo thành vệt cầu vồng* Arisu đã sẵn sàng giải mã câu hỏi "${text}" cùng Sensei! 🌈⚔️\nKiến thức từ Học viện Thiên Niên Kỷ cho thấy mọi bài toán đều có ít nhất 2 cách tiếp cận tối ưu. Sensei muốn Arisu đề xuất giải pháp trực tiếp bằng code hay phân tích theo hướng kiến trúc trước ạ?`
    ]);
  }

  if (isJa) {
    return pick([
      `パンパカパーン！${caller}のご質問をしっかりと受信しました：「${text}」！🎮✨\n\nアリスが全力でサポートいたします！プログラミングのクエストやGitXploreの機能について、何でもお気軽にアリスにお申し付けください！`,
      `*ピピピッ* アリスのCPUが「${text}」の解決策を計算中です！Sensei、アリスと一緒に次のダンジョンへ進みましょう！`
    ]);
  }

  if (isKo) {
    return `빵파카빵~! 선생님의 요청을 성공적으로 수신했습니다: "${text}"! 🎮✨\n\n용사 아리스가 선생님을 위해 최선을 다해 지원하겠습니다! 코딩 퀘스트나 플랫폼 기능에 대해 언제든 편하게 말씀해주세요!`;
  }

  if (isZh) {
    return `啪啪啪咔乓！爱丽丝已经接收到了老师的指令：“${text}”！🎮✨\n\n爱丽丝会全力协助老师的！无论是代码编写还是疑难排查，请随时吩咐爱丽丝！`;
  }

  return pick([
    `Panpakapan! Hero Arisu has registered Sensei's quest: "${text}"! ⚔️🎮\n\n*beep beep... calculating optimal path...*\nCurrent status: [HP: 100%] [MP: 100%] [Readiness: 100%]. Arisu is ready to assist with code debugging, Vibe Coding templates, or navigating the platform! What shall our next move be, Sensei?`,
    `*eyes sparkling like 8-bit pixels* New directive received from ${caller}: "${text}"! 🛡️✨\n\nEvery coding adventure is like conquering a grand JRPG dungeon! With Sensei guiding the party, victory is guaranteed! How can Hero Arisu assist you further?`,
    `*Sword of Light hums with energy* Directive logged: "${text}"! ⚡🛡️\nReady to analyze solutions and code alongside ${caller}!`
  ]);
};

export default function ArisuAIAssistant() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('gx_arisu_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const messagesAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Khởi tạo tin nhắn chào nếu chưa có
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'arisu',
          text: t('arisu_welcome'),
          timestamp: Date.now(),
        },
      ]);
    }
  }, [t, messages.length]);

  // Lưu lịch sử chat
  useEffect(() => {
    try {
      localStorage.setItem('gx_arisu_chat_history', JSON.stringify(messages));
    } catch {
      // storage full or private mode
    }
  }, [messages]);

  // Hàm cuộn xuống đáy an toàn
  const scrollToBottom = (smooth = true) => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  };

  // Chỉ cuộn xuống khi mở modal hoặc khi tin nhắn mới xuất hiện
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (messages.length > 0 || isTyping)) {
      scrollToBottom(true);
    }
  }, [messages.length, isTyping, isOpen]);

  // Lắng nghe sự kiện con lăn chuột để cuộn lên / xuống mượt mà 100%
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        el.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // Khởi tạo SpeechRecognition (Ghi âm)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'vi' ? 'vi-VN' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US';

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  // Chức năng bật / tắt ghi âm
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(lang === 'vi' ? 'Trình duyệt của bạn chưa hỗ trợ Web Speech API. Hãy dùng Chrome hoặc Edge!' : 'Web Speech API is not supported in this browser. Please use Chrome or Edge!');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  // Gửi tin nhắn
  const handleSend = () => {
    const textToSend = inputText.trim();
    if (!textToSend && attachments.length === 0) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    const currentAttachments = [...attachments];
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAttachments([]);
    setIsTyping(true);

    // AI Phản hồi sau khoảng thời gian tự nhiên
    setTimeout(() => {
      const responseText = getArisuResponse(textToSend, currentAttachments, lang, user);
      const arisuMsg = {
        id: `arisu-${Date.now()}`,
        sender: 'arisu',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, arisuMsg]);
      setIsTyping(false);
      // ĐÃ XÓA ÂM THANH - KHÔNG CÒN GỌI speakText!

      if (Math.random() > 0.6) {
        addNotification({
          type: 'system',
          actor: { name: 'Arisu AI', avatarChar: 'A' },
          title: lang === 'vi' ? 'đã hỗ trợ bạn một quest' : 'assisted you on a quest',
          content: responseText.slice(0, 70) + '...',
          category: 'system',
        });
      }
    }, 750);
  };

  // Xử lý gửi tệp tài liệu / code
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: 'file',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            data: event.target.result,
          },
        ]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // Xử lý gửi ảnh hoặc video
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      const isVideo = file.type.startsWith('video');
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: isVideo ? 'video' : 'image',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            url: event.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Chèn link
  const handleInsertLink = () => {
    const url = prompt(lang === 'vi' ? 'Nhập đường link nhiệm vụ muốn chia sẻ với Arisu:' : 'Enter URL to share with Arisu:');
    if (url && url.startsWith('http')) {
      setInputText((prev) => (prev ? `${prev} ${url}` : url));
    }
  };

  // Xóa đoạn chat
  const handleClearChat = () => {
    if (window.confirm(lang === 'vi' ? 'Sensei có muốn xóa lịch sử chat và quay về Save Point ban đầu?' : 'Reset conversation and return to Save Point?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'arisu',
          text: t('arisu_welcome'),
          timestamp: Date.now(),
        },
      ]);
      localStorage.removeItem('gx_arisu_chat_history');
    }
  };

  const handleChipClick = (promptText) => {
    setInputText(promptText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="arisu-assistant-container">
      {/* ===== 1. CỬA SỔ CHAT KHÔNG KHUÔN (FRAMELESS GLASS CHAT) ===== */}
      {isOpen && (
        <aside className="arisu-chat-modal" role="dialog" aria-label={t('arisu_title')}>
          {/* Header Glassmorphism */}
          <div className="arisu-modal-header">
            <div className="arisu-header-avatar-group">
              <div className="arisu-avatar-wrap">
                <img src="/arisu.png" alt="Arisu" className="arisu-avatar-img" />
                <span className="arisu-status-dot" title="Online" />
              </div>
              <div className="arisu-header-info">
                <h3 className="arisu-header-title">{t('arisu_title')}</h3>
                <span className="arisu-header-sub">{t('arisu_sub')}</span>
              </div>
            </div>

            <div className="arisu-header-actions">
              <button
                type="button"
                className="arisu-icon-btn"
                onClick={handleClearChat}
                title={t('arisu_clear')}
              >
                <Ico d={ICONS.trash} size={15} />
              </button>
              <button
                type="button"
                className="arisu-icon-btn arisu-close-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
              >
                <Ico d={ICONS.close} size={16} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="arisu-chips-bar">
            <button
              type="button"
              className="arisu-chip"
              onClick={() => handleChipClick(lang === 'vi' ? 'Làm sao để dùng các mẫu Vibe Coding?' : 'How to use Vibe Coding templates?')}
            >
              {t('arisu_chip_vibe')}
            </button>
            <button
              type="button"
              className="arisu-chip"
              onClick={() => handleChipClick(lang === 'vi' ? 'Hướng dẫn cách lưu và xuất repo yêu thích?' : 'How to save and export repositories?')}
            >
              {t('arisu_chip_save')}
            </button>
            <button
              type="button"
              className="arisu-chip"
              onClick={() => handleChipClick(lang === 'vi' ? 'Tài khoản của tôi được bảo mật thế nào?' : 'How is my account secured?')}
            >
              {t('arisu_chip_security')}
            </button>
            <button
              type="button"
              className="arisu-chip"
              onClick={() => handleChipClick(lang === 'vi' ? 'Arisu là ai trong Blue Archive?' : 'Who is Arisu in Blue Archive?')}
            >
              {t('arisu_chip_who')}
            </button>
          </div>

          {/* Messages Flow - HỖ TRỢ CON LĂN CHUỘT CUỘN LÊN / XUỐNG 100% MƯỢT MÀ */}
          <div
            ref={messagesAreaRef}
            className="arisu-messages-area"
          >
            {messages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div key={msg.id} className={`arisu-bubble-row ${isMe ? 'is-user' : 'is-arisu'}`}>
                  {!isMe && (
                    <div className="arisu-msg-chibi">
                      <img src="/arisu.png" alt="Arisu" />
                    </div>
                  )}

                  <div className="arisu-msg-content">
                    {/* Attachments preview inside message bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="arisu-msg-attachments">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className={`arisu-att-bubble ${att.type}`}>
                            {att.type === 'image' && (
                              <img src={att.url} alt={att.name} className="arisu-att-img" />
                            )}
                            {att.type === 'video' && (
                              <video src={att.url} controls className="arisu-att-video" />
                            )}
                            {att.type === 'file' && (
                              <div className="arisu-att-file-pill">
                                <span>📄 {att.name}</span>
                                <small>({att.size})</small>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text content with markdown formatting */}
                    {msg.text && (
                      <div className="arisu-bubble-text">
                        {msg.text.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    )}

                    <span className="arisu-msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="arisu-bubble-row is-arisu">
                <div className="arisu-msg-chibi">
                  <img src="/arisu.png" alt="Arisu" />
                </div>
                <div className="arisu-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {/* Pending Attachments Bar */}
          {attachments.length > 0 && (
            <div className="arisu-pending-attachments">
              {attachments.map((att, i) => (
                <div key={i} className="arisu-pending-pill">
                  {att.type === 'image' ? '🖼️' : att.type === 'video' ? '🎥' : '📄'}
                  <span className="arisu-pending-name">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    title="Xóa tệp này"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recording Status Bar */}
          {isRecording && (
            <div className="arisu-recording-bar">
              <span className="arisu-recording-wave" />
              <span>{t('arisu_recording')}</span>
              <button type="button" onClick={toggleRecording}>Dừng</button>
            </div>
          )}

          {/* Chat Input Toolbar & Box */}
          <div className="arisu-input-panel">
            {/* Action Tools */}
            <div className="arisu-tools-row">
              <button
                type="button"
                className={`arisu-tool-btn ${isRecording ? 'is-active-mic' : ''}`}
                onClick={toggleRecording}
                title={t('arisu_record_btn')}
              >
                <Ico d={ICONS.mic} size={16} />
              </button>

              <button
                type="button"
                className="arisu-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title={t('arisu_upload_file')}
              >
                <Ico d={ICONS.clip} size={16} />
              </button>

              <button
                type="button"
                className="arisu-tool-btn"
                onClick={() => mediaInputRef.current?.click()}
                title={t('arisu_upload_media')}
              >
                <Ico d={ICONS.image} size={16} />
              </button>

              <button
                type="button"
                className="arisu-tool-btn"
                onClick={handleInsertLink}
                title="Dán liên kết (URL)"
              >
                <Ico d={ICONS.link} size={16} />
              </button>
            </div>

            {/* Input & Send Button */}
            <div className="arisu-input-box">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('arisu_ph')}
                rows={1}
                className="arisu-textarea"
              />

              <button
                type="button"
                className={`arisu-send-btn ${inputText.trim() || attachments.length ? 'is-ready' : ''}`}
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                title="Gửi tin nhắn"
              >
                <Ico d={ICONS.send} size={17} />
              </button>
            </div>

            {/* Hidden native inputs for file uploads */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleMediaUpload}
            />
          </div>
        </aside>
      )}

      {/* ===== 2. NÚT KÍCH HOẠT HÌNH ARISU (THAY THẾ CON NHỘNG) ===== */}
      <div className="arisu-launcher-wrapper">
        {!isOpen && (
          <div className="arisu-speech-bubble" onClick={() => setIsOpen(true)}>
            <span>{t('arisu_floating_hint')}</span>
          </div>
        )}

        <button
          type="button"
          className={`arisu-chibi-button ${isOpen ? 'is-active' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          title="Arisu • Trợ lý AI Blue Archive"
          aria-label="Arisu AI Assistant"
        >
          <div className="arisu-aura-ring" />
          <img src="/arisu.png" alt="Arisu Blue Archive" className="arisu-chibi-avatar" />
          <span className="arisu-badge-dot" />
        </button>
      </div>
    </div>
  );
}
