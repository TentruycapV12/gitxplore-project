/**
 * Dữ liệu và trạng thái thông báo thời gian thực phong cách Facebook.
 * Hỗ trợ:
 * - Tương tác từ người khác (Like, Comment, Thả tim, Chia sẻ)
 * - Tag & Nhắc đến (@mention, gắn thẻ)
 * - Lời mời kết bạn (Chấp nhận / Xóa trực tiếp)
 * - Hoạt động trong nhóm & trang
 * - Nhắc nhở ngày sinh nhật bạn bè
 * - Cập nhật bảo mật & xu hướng kho lưu trữ
 */

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'like',
    actor: {
      name: 'Trần Minh Tuấn',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      avatarChar: 'T',
    },
    title: 'đã thích bài viết của bạn',
    content: '“Chia sẻ kiến trúc Micro-Frontend hiệu năng cao với Vite & React 19.”',
    time: '5 phút trước',
    timestamp: Date.now() - 5 * 60 * 1000,
    read: false,
    link: '/forum',
    category: 'interaction',
  },
  {
    id: 'notif-2',
    type: 'friend_request',
    actor: {
      name: 'Vũ Đình Long',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      avatarChar: 'V',
      mutualFriends: 6,
    },
    title: 'đã gửi cho bạn lời mời kết bạn',
    content: 'Có 6 bạn chung trong cộng đồng GitXplore.',
    time: '28 phút trước',
    timestamp: Date.now() - 28 * 60 * 1000,
    read: false,
    link: '/community/requests',
    category: 'friends',
    status: 'pending', // 'pending' | 'accepted' | 'declined'
  },
  {
    id: 'notif-3',
    type: 'comment',
    actor: {
      name: 'Lê Hoàng Yến',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      avatarChar: 'Y',
    },
    title: 'đã bình luận về kho lưu trữ bạn đóng góp',
    content: '“Bộ template Vibe Coding này dùng cho Cursor rất mượt, cảm ơn bạn đã chia sẻ!”',
    time: '1 giờ trước',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: false,
    link: '/vibe',
    category: 'interaction',
  },
  {
    id: 'notif-4',
    type: 'birthday',
    actor: {
      name: 'Lê Bảo Châu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      avatarChar: 'C',
    },
    title: 'Hôm nay là sinh nhật của Lê Bảo Châu! 🎂🎉',
    content: 'Hãy gửi lời chúc mừng sinh nhật đến bạn ấy ngay trên trang cá nhân.',
    time: 'Hôm nay lúc 08:00',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    read: false,
    link: '/community/birthdays',
    category: 'birthday',
  },
  {
    id: 'notif-5',
    type: 'mention',
    actor: {
      name: 'Nguyễn Văn Đức',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      avatarChar: 'Đ',
    },
    title: 'đã nhắc đến bạn trong một bình luận',
    content: '“@bạn ơi thử xem qua giải pháp này xem có khắc phục được lỗi hydration không nhé.”',
    time: '2 giờ trước',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    read: true,
    link: '/forum',
    category: 'tag',
  },
  {
    id: 'notif-6',
    type: 'tag',
    actor: {
      name: 'Đặng Thu Thảo',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      avatarChar: 'T',
    },
    title: 'đã gắn thẻ bạn trong một bài viết',
    content: '“Tổng kết sự kiện Vibe Coding Hackathon 2026 với hơn 50 đội thi tài.”',
    time: 'Hôm qua lúc 18:30',
    timestamp: Date.now() - 16 * 60 * 60 * 1000,
    read: true,
    link: '/community',
    category: 'tag',
  },
  {
    id: 'notif-7',
    type: 'group',
    actor: {
      name: 'Nhóm React & Vibe Coding Vietnam',
      avatar: null,
      avatarChar: 'R',
    },
    title: 'có 8 bài viết thảo luận mới hôm nay',
    content: 'Chủ đề hot: Tối ưu hoá bundle size và tích hợp MCP PostgreSQL vào AI.',
    time: 'Hôm qua',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    link: '/community',
    category: 'group',
  },
  {
    id: 'notif-8',
    type: 'security',
    actor: {
      name: 'Hệ thống Bảo mật GitXplore',
      avatar: null,
      avatarChar: '🛡️',
    },
    title: 'Đăng nhập mới từ thiết bị đã nhận diện',
    content: 'Tài khoản được đăng nhập thành công từ Chrome trên Windows 11.',
    time: '2 ngày trước',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    read: true,
    link: '/accountscenter/security',
    category: 'system',
  },
];
