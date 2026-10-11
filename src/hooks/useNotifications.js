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

  const respondFriendRequest = useCallback((id, accept) => {
    saveNotifications(
      notifications.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            read: true,
            status: accept ? 'accepted' : 'declined',
            content: accept
              ? `Bạn và ${n.actor.name} đã trở thành bạn bè!`
              : `Bạn đã từ chối lời mời kết bạn từ ${n.actor.name}.`,
          };
        }
        return n;
      })
    );
  }, [notifications, saveNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    respondFriendRequest,
  };
}
