import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../context/LanguageContext';
import './NotificationDropdown.css';

const TYPE_ICONS = {
  welcome: { icon: '🎉', bg: '#8b5cf6' },
  vibe: { icon: '⚡', bg: '#f59e0b' },
  security: { icon: '🛡️', bg: '#10b981' },
  repo: { icon: '⭐', bg: '#3b82f6' },
  system: { icon: '🔔', bg: '#6366f1' },
  like: { icon: '👍', bg: '#2563eb' },
  comment: { icon: '💬', bg: '#10b981' },
  reaction: { icon: '❤️', bg: '#ec4899' },
  order: { icon: '📦', bg: '#f59e0b' },
  escrow: { icon: '🛡️', bg: '#10b981' },
  wallet: { icon: '💰', bg: '#3b82f6' },
  admin: { icon: '👑', bg: '#ec4899' },
};

const formatRelTime = (ts, t) => {
  if (!ts) return '';
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diff < 1) return t('nw_now');
  if (diff < 60) return t('nw_ago_m', { n: diff });
  const h = Math.floor(diff / 60);
  if (h < 24) return t('nw_ago_h', { n: h });
  const d = Math.floor(h / 24);
  return t('nw_ago_d', { n: d });
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
    clearAllNotifications,
  } = useNotifications();

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [activeMenuId, setActiveMenuId] = useState(null);
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
    <div className="fb-notif-popover" ref={containerRef} role="dialog" aria-label={t('notif_title')} data-lenis-prevent="true">
      {/* Header */}
      <div className="fb-notif-header">
        <div className="fb-notif-title-row">
          <div className="fb-notif-title-wrap">
            <h3 className="fb-notif-title">{t('notif_title')}</h3>
            {unreadCount > 0 && (
              <span className="fb-notif-count-badge">
                {unreadCount} {t('notif_new')}
              </span>
            )}
          </div>

          <div className="fb-notif-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="fb-notif-tool-btn"
                onClick={markAllAsRead}
                title={t('notif_mark_all')}
              >
                ✓ {t('notif_mark_all')}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                className="fb-notif-tool-btn fb-notif-clear-btn"
                onClick={clearAllNotifications}
                title={t('notif_clear_all')}
              >
                ✕ {t('notif_clear_all')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs: Tất cả / Chưa đọc */}
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
        </div>
      </div>

      {/* Notifications List */}
      <div className="fb-notif-list">
        {filteredList.length === 0 ? (
          <div className="fb-notif-empty">
            <div className="fb-empty-bell">🔔</div>
            <h4>{t('notif_empty')}</h4>
            <p>{t('notif_empty_desc')}</p>
            <button
              type="button"
              className="fb-empty-action-btn"
              onClick={() => {
                navigate('/vibe');
                onClose();
              }}
            >
              {t('notif_empty_action')}
            </button>
          </div>
        ) : (
          filteredList.map((item) => {
            const typeConfig = TYPE_ICONS[item.type] || { icon: '🔔', bg: '#6366f1' };
            const titleText = item.titleKey ? t(item.titleKey) : item.title;
            const contentText = item.contentKey ? t(item.contentKey) : item.content;
            const timeText = item.timestamp ? formatRelTime(item.timestamp, t) : item.time || '';

            return (
              <div
                key={item.id}
                className={`fb-notif-item ${!item.read ? 'is-unread' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {/* Avatar with small type badge */}
                <div className="fb-notif-avatar-wrap">
                  {item.actor?.avatar ? (
                    <img src={item.actor.avatar} alt="" className="fb-notif-avatar" />
                  ) : (
                    <div className="fb-notif-avatar-fallback">{item.actor?.avatarChar || 'G'}</div>
                  )}
                  <span
                    className="fb-notif-type-icon"
                    style={{ backgroundColor: typeConfig.bg }}
                  >
                    {typeConfig.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="fb-notif-content">
                  <p className="fb-notif-text">
                    <strong>{item.actor?.name || 'GitXplore'}</strong> {titleText}
                  </p>
                  {contentText && <p className="fb-notif-subtext">{contentText}</p>}
                  <span className="fb-notif-time">{timeText}</span>
                </div>

                {/* Unread dot & 3-dot options */}
                <div className="fb-notif-right" onClick={(e) => e.stopPropagation()}>
                  {!item.read && <span className="fb-blue-dot" />}

                  <button
                    type="button"
                    className="fb-more-btn"
                    onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                    title="Tùy chọn"
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
            navigate('/vibe');
            onClose();
          }}
        >
          {t('vibe_nav') || 'Vibe Coding Hub'} →
        </button>
      </div>
    </div>
  );
}
