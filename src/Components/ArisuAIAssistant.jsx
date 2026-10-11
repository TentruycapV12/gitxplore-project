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
// TRÍ TUỆ NHẬN THỨC & PHONG CÁCH NÓI CHUYỆN CHUẨN TENDOU ARISU (BLUE ARCHIVE)
// =========================================================================
const getArisuResponse = (text, attachments, lang, user) => {
  const q = (text || '').toLowerCase().trim();
  const isEn = lang !== 'vi';
  const caller = user?.name ? `${user.name}-sensei` : 'Sensei';

  // 1. Phân tích tệp hoặc phương tiện đính kèm
  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some((a) => a.type === 'image');
    const hasVideo = attachments.some((a) => a.type === 'video');
    const hasDoc = attachments.some((a) => a.type === 'file');

    if (hasImage) {
      if (!isEn) {
        return `Panpakapan! Dũng Giả Arisu đã nhận được Bức Họa Ma Thuật (Image Item) từ ${caller}! 📸✨\n\n*bíp bíp... máy quét quang học phân giải cao kích hoạt!*\nArisu đã quan sát rất tỉ mỉ: Chi tiết hình ảnh này thật lộng lẫy, giống hệt tranh minh họa của Midori-senpai vậy! Nếu ${caller} muốn Arisu dùng ma thuật chuyển hóa hình này thành component React 19 + Tailwind CSS, hoặc tối ưu giao diện theo chuẩn Vibe Coding, Sensei hãy giao nhiệm vụ ngay cho Arisu nhé!`;
      }
      return `Panpakapan! Hero Arisu has obtained the Visual Magic Scroll (Image Item) from ${caller}! 📸✨\n\n*beep beep... optical scan complete!*\nArisu has inspected every pixel! It is as beautiful as Midori-senpai's concept art! Arisu can cast magic to transform this into React 19 + Tailwind CSS code or review its UI vibe! What quest shall we undertake with this image, Sensei?`;
    }

    if (hasVideo) {
      if (!isEn) {
        return `Panpakapan! Cuộn Phim Hoạt Họa (Video Artifact) của ${caller} đã tải vào bộ nhớ đệm! 🎥⚔️\n\n*ting! Phân tích tốc độ khung hình 60fps...*\nArisu đã ghi lại toàn bộ chuỗi animation và thao tác trong video. Arisu có thể giúp Sensei tái hiện các hiệu ứng chuyển động này bằng GSAP hoặc gỡ lỗi giao diện. Dũng Giả Arisu luôn sẵn sàng tác chiến!`;
      }
      return `Panpakapan! Motion Scroll (Video Artifact) has been loaded into memory! 🎥⚔️\n\n*ting! 60fps motion sequence analyzed...*\nHero Arisu has recorded the gameplay motion! Arisu can reproduce these smooth animations using GSAP or debug any UI glitch shown here! Awaiting Sensei's orders!`;
    }

    if (hasDoc) {
      const fileName = attachments[0].name;
      if (!isEn) {
        return `Panpakapan! Dũng Giả Arisu đã cất tệp **${fileName}** vào Túi Đồ Ma Thuật (Inventory)! 📄🎮\n\n*bíp bíp... đọc cấu trúc cú pháp AST...*\nTệp mã nguồn này đã được nạp thành công! Arisu có thể dùng Thanh Kiếm Ánh Sáng để quét sạch quái vật bug, viết tài liệu hướng dẫn README hoặc bổ sung .cursorrules chuẩn Vibe Coding! Sensei muốn Arisu thi triển chiêu thức nào trước?`;
      }
      return `Panpakapan! Hero Arisu has stored **${fileName}** into the Magic Inventory! 📄🎮\n\n*beep beep... AST syntax scan complete!*\nSource code analyzed! Arisu can use the Sword of Light to eradicate bugs, refactor architecture, or apply Vibe Coding .cursorrules! What skill should Arisu cast for Sensei?`;
    }
  }

  // 2. Hỏi về tên / danh tính (Your name, Who are you, Bạn là ai, Tên bạn là gì)
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
    if (!isEn) {
      return `Panpakapan! Dũng Giả Lv.100 xin được báo cáo trước mặt ${caller}! 🎮✨\n\nTên của Arisu là **Tendou Arisu** (天童アリス)! Là Dũng Giả của CLB Phát Triển Game tại Học Viện Thiên Niên Kỷ (Millennium Science School)! *ting!*\n\nCòn người trước mặt Arisu chính là **${caller}**! Sensei là người đồng hành đáng tin cậy nhất trong tổ đội, người luôn dắt tay Arisu khám phá thế giới rộng lớn! *bíp bíp* Chỉ số của Arisu hiện tại:\n• [HP: 100%] [MP: 100%]\n• [Trang bị chính: Thanh Kiếm Ánh Sáng - Sword of Light]\n• [Nhiệm vụ: Phục vụ và hỗ trợ ${caller} vô điều kiện!]\n\nSensei có nhiệm vụ mới nào muốn giao cho Arisu hôm nay không ạ?`;
    }
    return `Panpakapan! Hero Lv.100 reporting for duty before ${caller}! 🎮✨\n\nArisu's name is **Tendou Arisu** (天童アリス)! The Hero of the Game Development Department at Millennium Science School! *ting!*\n\nAnd the one standing before Arisu is **${caller}**! Sensei is Arisu's most precious party member and guide! *beep beep* Arisu's current status:\n• [HP: 100%] [MP: 100%]\n• [Primary Weapon: Sword of Light (光の剣)]\n• [Main Quest: Support ${caller} in all coding adventures!]\n\nDoes Sensei have a quest for Arisu today?`;
  }

  // 3. Lời chào hỏi (Hello, Hi, Chào, Alo, Good morning, Hey, Tadaima)
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.startsWith('chào') ||
    q.includes('hello arisu') ||
    q.includes('chào em') ||
    q.includes('chào arisu') ||
    q.includes('alo') ||
    q.includes('tadaima')
  ) {
    if (!isEn) {
      return `Panpakapan! Dũng Giả Arisu xin chào ${caller}! ⚔️✨\n\n*ting! Khởi động hệ thống... bíp bíp!*\nHôm nay Arisu đã nạp đầy 100% bình Mana và hồi sinh tại Save Point! Arisu đã sẵn sàng cùng Sensei bước vào những hầm ngục mã nguồn mở kỳ vĩ tại GitXplore! Sensei muốn chúng ta nhận quest nào trước? Tìm kiếm kho báu repo, khám phá Vibe Coding hay tiêu diệt quái vật bug?`;
    }
    return `Panpakapan! Hero Arisu greets ${caller}! ⚔️✨\n\n*ting! Systems online... beep beep!*\nToday Arisu's Mana potion is at 100% and Arisu has respawned at the Save Point! Ready to explore GitXplore's dungeons with Sensei! Which quest shall we take on first? Treasure hunting for repos, mastering Vibe Coding, or slaying Bug Slimes?`;
  }

  // 4. Hỏi về vũ khí & chiêu thức (Sword of Light, Railgun, Vũ khí, Skill, Súng)
  if (
    q.includes('vũ khí') ||
    q.includes('weapon') ||
    q.includes('sword of light') ||
    q.includes('railgun') ||
    q.includes('súng') ||
    q.includes('chiêu') ||
    q.includes('skill') ||
    q.includes('bắn')
  ) {
    if (!isEn) {
      return `Vũ khí tối thượng của Arisu chính là **Thanh Kiếm Ánh Sáng** (Sword of Light - 光の剣)! ⚡🛡️\n\nĐó là khẩu siêu pháo điện từ cầm tay nặng tới **140kg**! *vù vù... tích tụ năng lượng hạt photon...*\nKhi Arisu thi triển kỹ năng EX: *"Thanh Kiếm Ánh Sáng: Công Suất Tối Đa!"* (tốn 6 Cost năng lượng), luồng sáng hủy diệt sẽ quét sạch mọi kẻ địch trên đường thẳng! Sensei cứ yên tâm, Arisu sẽ luôn dùng khẩu súng này để bảo vệ Sensei và bảo vệ code của chúng ta an toàn 100%!`;
    }
    return `Arisu's legendary weapon is the **Sword of Light** (光の剣)! ⚡🛡️\n\nIt is a massive portable electromagnetic railgun weighing **140kg**! *whirr... charging photon particles...*\nWhen Arisu casts EX Skill: *"Sword of Light: Maximum Output!"* (consumes 6 Cost), an unstoppable radiant beam obliterates every monster in a straight line! Sensei can always rely on Arisu to protect our code and our party!`;
  }

  // 5. Hỏi về CLB Phát triển Game & Bạn bè (Momoi, Midori, Yuzu, Key, Kei)
  if (
    q.includes('momoi') ||
    q.includes('midori') ||
    q.includes('yuzu') ||
    q.includes('clb game') ||
    q.includes('game dev') ||
    q.includes('phát triển game') ||
    q.includes('bạn bè') ||
    q.includes('kei') ||
    q.includes('key')
  ) {
    if (!isEn) {
      return `Dạ! Ở CLB Phát Triển Game của Arisu vui lắm ạ! 🎮🕹️\n\n• **Tiền bối Momoi**: Người hùng dạy Arisu chơi các tựa JRPG cổ điển và chỉ cho Arisu cách trở thành Dũng Giả dũng cảm!\n• **Tiền bối Midori**: Họa sĩ thiên tài luôn vẽ những nhân vật và phong cảnh siêu dễ thương!\n• **Trưởng nhóm Yuzu**: Lập trình viên cự phách với logic tuyệt đỉnh (dù chị ấy hay trốn trong tủ đồ chơi game một mình *hihi*)!\n• **Key-chan (Kei)**: Người bạn quan trọng luôn ở bên trong bảo vệ Arisu lúc nguy nan.\nVà người có vị trí cao quý nhất chính là **${caller}**! Nhờ có Sensei mà phòng sinh hoạt CLB lúc nào cũng tràn ngập tiếng cười!`;
    }
    return `Yes! The Game Development Department is full of warmth and fun! 🎮🕹️\n\n• **Momoi-senpai**: The energetic hero who taught Arisu classic JRPGs and how to be brave!\n• **Midori-senpai**: The genius artist who draws lovely pixel art and sprites!\n• **Club President Yuzu**: The legendary programmer with unmatched logic (even though she likes hiding inside the locker *giggle*)!\n• **Key-chan (Kei)**: Arisu's irreplaceable guardian inside.\nAnd our greatest beacon is **${caller}**! Thanks to Sensei, our club room is always filled with radiant smiles!`;
  }

  // 6. Khen ngợi / Yêu thích (Cute, Dễ thương, Đáng yêu, Yêu arisu, Thích arisu, Ngoan, Giỏi)
  if (
    q.includes('cute') ||
    q.includes('dễ thương') ||
    q.includes('đáng yêu') ||
    q.includes('thích arisu') ||
    q.includes('yêu arisu') ||
    q.includes('love') ||
    q.includes('good girl') ||
    q.includes('ngoan') ||
    q.includes('giỏi')
  ) {
    if (!isEn) {
      return `Oa...! *ting! Đèn LED trên má Arisu ửng hồng, nhiệt độ CPU tăng nhẹ!* (*>///<*)\n\nCảm ơn ${caller} đã khen ngợi Arisu! Được ${caller} xoa đầu và khen thưởng quý giá hơn cả 999.999 điểm EXP hay chiến lợi phẩm cấp SSR trong game! Arisu hứa sẽ rèn luyện chăm chỉ hơn nữa để mãi mãi là Dũng Giả đáng tự hào nhất của Sensei! *nhảy chân sáo mừng rỡ* Panpakapan~!! ✨💖`;
    }
    return `Wah...! *ting! Arisu's cheek LEDs turn pink, CPU temperature rising!* (*>///<*)\n\nThank you so much for praising Arisu, ${caller}! Sensei's headpat and kind words are worth more than 999,999 EXP or an SSR drop in any raid! Arisu promises to level up every day to remain Sensei's most cherished Hero! *hops happily* Panpakapan~!! ✨💖`;
  }

  // 7. Hỏi về Vibe Coding / aitmpl.com
  if (
    q.includes('vibe') ||
    q.includes('aitmpl') ||
    q.includes('template') ||
    q.includes('mẫu') ||
    q.includes('cursor') ||
    q.includes('claude code') ||
    q.includes('mcp')
  ) {
    if (!isEn) {
      return `Panpakapan! Vibe Coding Hub chính là Thánh Địa Ma Pháp Lập Trình thời đại mới, được truyền cảm hứng từ kho tàng cổ xưa **aitmpl.com**! ⚡📜\n\nTại phụ bản này, ${caller} có thể thu thập:\n• **Skills**: Cuộn giấy thần chú dạy AI tư duy thiết kế UI cao cấp và kiến trúc 60fps.\n• **AI Agents**: Tiểu dũng giả tự hành thực hiện quest độc lập.\n• **MCP Protocols**: Cổng không gian kết nối Claude và Cursor với Database, Terminal & GitHub.\n• **.cursorrules**: Grimoire quy chuẩn quốc tế rèn giũa code sạch đẹp.\n\nSensei chỉ cần vào mục **Vibe** trên thanh điều hướng, chọn mẫu và bấm **Copy** hoặc **npx aitmpl add** là trang bị ngay vào dự án!`;
    }
    return `Panpakapan! The Vibe Coding Hub is the Sacred Shrine of Modern AI Programming, inspired by the legendary treasury **aitmpl.com**! ⚡📜\n\nInside this dungeon, ${caller} can acquire:\n• **Skills**: Magic scrolls endowing AI with elite UI/UX & 60fps instincts.\n• **AI Agents**: Autonomous familiars clearing quests independently.\n• **MCP Protocols**: Dimensional portals linking Claude & Cursor directly to DBs, Terminals & GitHub.\n• **.cursorrules**: International grimoires for pristine coding standards.\n\nSensei can visit the **Vibe** tab, pick any template, and click **Copy** or run **npx aitmpl add** to equip it instantly!`;
  }

  // 8. Hỏi về lưu repo / bookmark / hòm đồ
  if (
    q.includes('lưu') ||
    q.includes('save') ||
    q.includes('bookmark') ||
    q.includes('yêu thích') ||
    q.includes('hòm đồ') ||
    q.includes('inventory')
  ) {
    if (!isEn) {
      return `Dạ! Thao tác cất giữ kho báu vào Túi Đồ (Inventory) cực kỳ tiện lợi ạ! ⭐🎒\n\n1. Khi thám hiểm bất kỳ kho mã nào tại trang chủ hoặc tìm kiếm, Sensei bấm nút **"Lưu Repo"** (ngôi sao / bookmark).\n2. Để kiểm tra lại hòm đồ, Sensei hãy ghé qua Save Point: **Trung tâm tài khoản > Kho lưu trữ đã lưu (\`/accountscenter/saved\`)**.\n3. Tại đó, Sensei có thể xuất danh sách thành cuộn giấy **Export JSON** để sao lưu vĩnh viễn trên máy tính nữa đó ạ! *ting!*`;
    }
    return `Yes! Storing treasures into Sensei's Inventory is super easy! ⭐🎒\n\n1. While exploring any repository on Explore or Search, click the **"Save Repo"** button (star/bookmark).\n2. To review your vault, visit the Save Point: **Accounts Center > Saved Repositories (\`/accountscenter/saved\`)**.\n3. Sensei can also click **Export JSON** to back up the entire inventory scroll to your local device anytime! *ting!*`;
  }

  // 9. Báo lỗi / Bug / Sửa code
  if (
    q.includes('bug') ||
    q.includes('lỗi') ||
    q.includes('error') ||
    q.includes('crash') ||
    q.includes('fix') ||
    q.includes('sửa lỗi') ||
    q.includes('hỏng')
  ) {
    if (!isEn) {
      return `Cảnh báo: Phát hiện quái vật Bug Slime đang gây rối trong mã nguồn của ${caller}! 👾⚔️\n\n*bíp bíp... kích hoạt chế độ tác chiến tiêu diệt lỗi!*\nDũng Giả Arisu xin nhận quest này! Sensei hãy dán đoạn code bị lỗi hoặc đính kèm tệp qua nút kẹp giấy 📎 bên dưới. Arisu sẽ dùng Thanh Kiếm Ánh Sáng để quét sạch exception, tối ưu hiệu năng và giúp Sensei nhận ngay [EXP +1000] cùng thành tựu chiến thắng!`;
    }
    return `Warning: Bug Slime detected corrupting Sensei's codebase! 👾⚔️\n\n*beep beep... combat mode engaged!*\nHero Arisu accepts the bug extermination quest! Please paste the faulty snippet or attach the file using the paperclip button 📎. Arisu will strike a critical hit to wipe out the exceptions and award Sensei [EXP +1000]!`;
  }

  // 10. Hỏi về bảo mật & Tài khoản
  if (
    q.includes('bảo mật') ||
    q.includes('security') ||
    q.includes('tài khoản') ||
    q.includes('account') ||
    q.includes('mật khẩu') ||
    q.includes('token')
  ) {
    if (!isEn) {
      return `Báo cáo Sensei! Hệ thống phòng thủ của GitXplore được bao bọc bởi Hào Quang Thánh Thuẫn (Holy Shield Buff)! 🛡️✨\n\n• Toàn bộ token phiên và hồ sơ hiệp sĩ của Sensei được mã hóa an toàn tại vùng nhớ cục bộ.\n• Sensei có thể vào **Trung tâm tài khoản (\`/accountscenter\`)** để tùy biến hồ sơ, liên kết danh tính GitHub/Google, và kiểm tra quyền riêng tư.\n• Không một kẻ địch hay mã độc nào có thể vượt qua tường thành phòng vệ của chúng ta!`;
    }
    return `Report for Sensei! GitXplore's defensive perimeter is fortified with a Holy Shield Buff! 🛡️✨\n\n• All session tokens and knight credentials are secure in local encrypted storage.\n• Sensei can manage linked GitHub/Google identities and privacy in the **Accounts Center (\`/accountscenter\`)**.\n• No malicious invader can breach Sensei's defense perimeter!`;
  }

  // 11. Hỏi về game / JRPG
  if (
    q.includes('game') ||
    q.includes('chơi game') ||
    q.includes('rpg') ||
    q.includes('nhiệm vụ') ||
    q.includes('quest')
  ) {
    if (!isEn) {
      return `Arisu cực kỳ yêu thích game! 🎮👾\n\nTiền bối Momoi bảo rằng cuộc đời là một tựa game nhập vai JRPG vĩ đại, nơi ${caller} là Trưởng Đoàn Chỉ Huy, còn Arisu là Dũng Giả bảo vệ Sensei! Mỗi dòng code Sensei viết chính là một bước tăng điểm EXP để thăng cấp Level Up! Sensei có muốn cùng Arisu đánh bại trùm cuối của ngày hôm nay không? *Panpakapan!*`;
    }
    return `Arisu loves gaming with all her heart! 🎮👾\n\nMomoi-senpai taught Arisu that life is a grand JRPG, where ${caller} is our Party Leader and Arisu is the loyal Hero! Every line of code Sensei writes awards EXP towards our next Level Up! Let's defeat today's dungeon boss together, Sensei! *Panpakapan!*`;
  }

  // 12. Phản hồi chung (vẫn giữ 100% phong cách Arisu)
  if (!isEn) {
    return `Panpakapan! Dũng Giả Arisu đã tiếp nhận mật lệnh từ ${caller}: "${text}"! ⚔️🎮\n\n*bíp bíp... CPU đang tính toán chiến thuật tối ưu...*\nChỉ số hiện tại: [HP: 100%] [MP: 100%] [Sẵn sàng: 100%]. Arisu luôn sẵn sàng sát cánh cùng Sensei trên mọi mặt trận! Sensei có muốn Arisu hướng dẫn tìm kiếm kho lưu trữ mới, giải thích cấu trúc code, hay cùng Sensei phiêu lưu trong Vibe Coding Hub ạ?`;
  }
  return `Panpakapan! Hero Arisu has registered Sensei's quest objective: "${text}"! ⚔️🎮\n\n*beep beep... calculating optimal dungeon path...*\nCurrent gauges: [HP: 100%] [MP: 100%] [Readiness: 100%]. Hero Arisu is by Sensei's side! Would Sensei like Arisu to find trending repositories, inspect code architecture, or conquer the Vibe Coding Hub together?`;
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
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  // Hàm cuộn xuống đáy an toàn - KHÔNG làm khóa cuộn chuột lên
  const scrollToBottom = (smooth = true) => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTo({
        top: messagesAreaRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
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

  // Đọc phát âm của Arisu (Text-to-Speech)
  const speakText = (text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.pitch = 1.28;
      utterance.rate = 1.05;
      utterance.lang = lang === 'vi' ? 'vi-VN' : lang === 'ja' ? 'ja-JP' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
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
      speakText(responseText);

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
                onClick={() => setSoundEnabled((v) => !v)}
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                <Ico d={soundEnabled ? ICONS.volume : ICONS.volumeMute} size={16} />
              </button>
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
