import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../context/LanguageContext';
import './NotificationDropdown.css';

const TYPE_ICONS = {
  like: { icon: '👍', bg: '#2563eb' },
  comment: { icon: '💬', bg: '#10b981' },
  reaction: { icon: '❤️', bg: '#ec4899' },
  friend_request: { icon: '👥', bg: '#8b5cf6' },
  friend_accept: { icon: '🤝', bg: '#10b981' },
  birthday: { icon: '🎂', bg: '#f59e0b' },
  mention: { icon: '🏷️', bg: '#f97316' },
  tag: { icon: '📌', bg: '#06b6d4' },
  group: { icon: '👥', bg: '#6366f1' },
  page: { icon: '🚩', bg: '#3b82f6' },
  security: { icon: '🛡️', bg: '#ef4444' },
  trending: { icon: '⭐', bg: '#f59e0b' },
};

export default function NotificationDropdown({ onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    respondFriendRequest,
  } = useNotifications();

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'friends'
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [wishedIds, setWishedIds] = useState([]);
  const containerRef = useRef(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const filteredList = notifications.filter((item) => {
    if (filterTab === 'unread') return !item.read;
    if (filterTab === 'friends') return item.category === 'friends' || item.category === 'birthday';
    return true;
  });

  const handleItemClick = (item) => {
    markAsRead(item.id);
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <div className="fb-notif-popover" ref={containerRef} role="dialog" aria-label={t('notif_title')}>
      {/* Header */}
      <div className="fb-notif-header">
        <div className="fb-notif-title-row">
          <div className="fb-notif-title-wrap">
            <h3 className="fb-notif-title">{t('notif_title')}</h3>
            {unreadCount > 0 && <span className="fb-notif-count-badge">{unreadCount} {t('notif_new')}</span>}
          </div>

          <div className="fb-notif-header-actions">
            <button
              type="button"
              className="fb-notif-tool-btn"
              onClick={markAllAsRead}
              title={t('notif_mark_all')}
            >
              ✓ {t('notif_mark_all')}
            </button>
          </div>
        </div>

        {/* Tabs: Tất cả / Chưa đọc / Bạn bè */}
        <div className="fb-notif-tabs">
          <button
            type="button"
            className={`fb-notif-tab ${filterTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            {t('notif_tab_all')}
          </button>
          <button
            type="button"
            className={`fb-notif-tab ${filterTab === 'unread' ? 'is-active' : ''}`}
            onClick={() => setFilterTab('unread')}
          >
            {t('notif_tab_unread')} {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            type="button"
            className={`fb-notif-tab ${filterTab === 'friends' ? 'is-active' : ''}`}
            onClick={() => setFilterTab('friends')}
          >
            {t('notif_tab_friends')}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="fb-notif-list">
        {filteredList.length === 0 ? (
          <div className="fb-notif-empty">
            <div className="fb-empty-bell">🔔</div>
            <p>{t('notif_empty')}</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const typeConfig = TYPE_ICONS[item.type] || { icon: '🔔', bg: '#6b7280' };

            return (
              <div
                key={item.id}
                className={`fb-notif-item ${!item.read ? 'is-unread' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {/* Avatar with small type badge */}
                <div className="fb-notif-avatar-wrap">
                  {item.actor.avatar ? (
                    <img src={item.actor.avatar} alt={item.actor.name} className="fb-notif-avatar" />
                  ) : (
                    <div className="fb-notif-avatar-fallback">{item.actor.avatarChar}</div>
                  )}
                  <span
                    className="fb-notif-type-icon"
                    style={{ backgroundColor: typeConfig.bg }}
                    title={item.type}
                  >
                    {typeConfig.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="fb-notif-content">
                  <p className="fb-notif-text">
                    <strong>{item.actor.name}</strong> {item.title}
                  </p>
                  {item.content && <p className="fb-notif-subtext">{item.content}</p>}

                  {/* Friend Request Action Buttons */}
                  {item.type === 'friend_request' && item.status === 'pending' && (
                    <div className="fb-notif-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="fb-btn-confirm"
                        onClick={() => respondFriendRequest(item.id, true)}
                      >
                        {t('notif_accept')}
                      </button>
                      <button
                        type="button"
                        className="fb-btn-delete"
                        onClick={() => respondFriendRequest(item.id, false)}
                      >
                        {t('notif_decline')}
                      </button>
                    </div>
                  )}

                  {/* Birthday Action Button */}
                  {item.type === 'birthday' && (
                    <div className="fb-notif-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="fb-btn-birthday"
                        onClick={() => {
                          setWishedIds((prev) => [...prev, item.id]);
                          markAsRead(item.id);
                        }}
                      >
                        {wishedIds.includes(item.id) ? t('notif_wished') : t('notif_wish_bday')}
                      </button>
                    </div>
                  )}

                  <span className="fb-notif-time">{item.time}</span>
                </div>

                {/* Unread dot & 3-dot options */}
                <div className="fb-notif-right" onClick={(e) => e.stopPropagation()}>
                  {!item.read && <span className="fb-blue-dot" />}

                  <button
                    type="button"
                    className="fb-more-btn"
                    onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                    title="Options"
                  >
                    •••
                  </button>

                  {activeMenuId === item.id && (
                    <div className="fb-item-menu">
                      <button
                        type="button"
                        onClick={() => {
                          markAsRead(item.id);
                          setActiveMenuId(null);
                        }}
                      >
                        ✓ {t('notif_mark_read')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteNotification(item.id);
                          setActiveMenuId(null);
                        }}
                      >
                        ✕ {t('notif_delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="fb-notif-footer">
        <button
          type="button"
          onClick={() => {
            navigate('/community');
            onClose();
          }}
        >
          {t('community')} →
        </button>
      </div>
    </div>
  );
}
