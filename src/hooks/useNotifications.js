import { useState, useEffect, useCallback } from 'react';
import { INITIAL_NOTIFICATIONS } from '../data/notificationsData';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const storageKey = `gx_notifs_${user?.identifier || 'guest'}`;

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  };

  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, [storageKey]);

  // Lắng nghe sự kiện thêm thông báo từ mọi nơi trên web (real-time)
  useEffect(() => {
    const handleCustomNotif = (e) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener('gx-add-notification', handleCustomNotif);
    return () => window.removeEventListener('gx-add-notification', handleCustomNotif);
  }, []);

  const saveNotifications = useCallback((updated) => {
    setNotifications(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // private mode
    }
  }, [storageKey]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id) => {
    saveNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [notifications, saveNotifications]);

  const markAllAsRead = useCallback(() => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications, saveNotifications]);

  const deleteNotification = useCallback((id) => {
    saveNotifications(notifications.filter((n) => n.id !== id));
  }, [notifications, saveNotifications]);

  const clearAllNotifications = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  const addNotification = useCallback((newItem) => {
    const itemWithDefaults = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      read: false,
      category: 'system',
      ...newItem,
    };
    saveNotifications([itemWithDefaults, ...notifications]);
  }, [notifications, saveNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  };
}

/**
 * Hàm gửi thông báo toàn sàn (Order, Escrow, Payout, Fee Collection)
 */
export function sendMarketplaceNotification(newItem, targetEmail) {
  const itemWithDefaults = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: Date.now(),
    read: false,
    category: 'market',
    ...newItem,
  };

  try {
    const currentUser = JSON.parse(localStorage.getItem('hka_user') || '{}');
    const userKey = `gx_notifs_${currentUser?.identifier || 'guest'}`;
    const userList = JSON.parse(localStorage.getItem(userKey) || '[]');
    localStorage.setItem(userKey, JSON.stringify([itemWithDefaults, ...userList]));
  } catch {
    // ignore
  }

  // Đồng thời lưu cho Admin nếu có target
  if (targetEmail) {
    try {
      const adminKey = `gx_notifs_${targetEmail}`;
      const adminList = JSON.parse(localStorage.getItem(adminKey) || '[]');
      localStorage.setItem(adminKey, JSON.stringify([itemWithDefaults, ...adminList]));
    } catch {
      // ignore
    }
  }

  // Bắn event để TopNav Notification bell cập nhật tức thì
  window.dispatchEvent(new CustomEvent('gx-add-notification', { detail: itemWithDefaults }));
}
