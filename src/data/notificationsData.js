/**
 * Dữ liệu và trạng thái thông báo thực tế của nền tảng GitXplore.
 * Hỗ trợ đa ngôn ngữ đồng bộ (10 ngôn ngữ), sự kiện hệ thống, Vibe Coding Hub,
 * cập nhật kho mã và an ninh tài khoản.
 */

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-welcome',
    type: 'welcome',
    actor: {
      name: 'GitXplore Team',
      avatarChar: 'G',
    },
    titleKey: 'notif_welcome_title',
    contentKey: 'notif_welcome_content',
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
    link: '/',
    category: 'system',
  },
  {
    id: 'notif-vibe',
    type: 'vibe',
    actor: {
      name: 'Vibe Coding Hub',
      avatarChar: 'V',
    },
    titleKey: 'notif_vibe_title',
    contentKey: 'notif_vibe_content',
    timestamp: Date.now() - 42 * 60 * 1000,
    read: false,
    link: '/vibe',
    category: 'system',
  },
  {
    id: 'notif-security',
    type: 'security',
    actor: {
      name: 'Security Vault',
      avatarChar: 'S',
    },
    titleKey: 'notif_security_title',
    contentKey: 'notif_security_content',
    timestamp: Date.now() - 110 * 60 * 1000,
    read: true,
    link: '/accountscenter/security',
    category: 'system',
  },
];
