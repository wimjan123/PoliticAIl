import { useDesktop } from '../../../contexts/DesktopContext';
import type { NotificationItem } from '../../../types/desktop';
import '../../../styles/components/notification-center.css';

interface NotificationItemProps {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
  theme: any;
}

function NotificationItemComponent({ notification, onDismiss, theme }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div
      className={`notification-item ${notification.type} ${notification.isRead ? 'read' : 'unread'}`}
      style={{
        backgroundColor: theme.colors.taskbar,
        borderColor: theme.colors.secondary,
        borderLeftColor: notification.type === 'error' ? '#ef4444' :
                       notification.type === 'warning' ? '#f59e0b' :
                       notification.type === 'success' ? '#10b981' :
                       theme.colors.accent,
      }}
    >
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
          <h4 className="notification-title" style={{ color: theme.colors.text }}>
            {notification.title}
          </h4>
          <span className="notification-time" style={{ color: `${theme.colors.text}60` }}>
            {formatTime(notification.timestamp)}
          </span>
        </div>
        <p className="notification-message" style={{ color: `${theme.colors.text}80` }}>
          {notification.message}
        </p>
        {notification.actions && notification.actions.length > 0 && (
          <div className="notification-actions">
            {notification.actions.map(action => (
              <button
                key={action.id}
                className={`notification-action ${action.type}`}
                onClick={action.onClick}
                style={{
                  backgroundColor: action.type === 'primary' ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.secondary,
                  color: theme.colors.text,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        className="notification-dismiss"
        onClick={() => onDismiss(notification.id)}
        style={{ color: `${theme.colors.text}60` }}
        title="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationCenter() {
  const { state, actions } = useDesktop();
  const { notifications, theme } = state;

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const clearAllNotifications = () => {
    notifications.forEach(notification => {
      actions.dismissNotification(notification.id);
    });
  };

  const markAllAsRead = () => {
    // This would need to be implemented in the context
    actions.addNotification({
      title: 'Mark as Read',
      message: 'Mark all as read functionality coming soon!',
      type: 'info',
    });
  };

  // Demo notifications for testing
  const addDemoNotifications = () => {
    actions.addNotification({
      title: 'Political Update',
      message: 'New approval rating data available for analysis',
      type: 'info',
    });

    setTimeout(() => {
      actions.addNotification({
        title: 'Social Media Alert',
        message: 'High engagement detected on latest campaign post',
        type: 'success',
      });
    }, 1000);

    setTimeout(() => {
      actions.addNotification({
        title: 'News Monitor',
        message: 'Breaking political news requires immediate attention',
        type: 'warning',
        actions: [
          {
            id: 'view',
            label: 'View News',
            type: 'primary',
            onClick: () => actions.launchApp('news-monitor'),
          },
          {
            id: 'dismiss',
            label: 'Later',
            type: 'secondary',
            onClick: () => {},
          },
        ],
      });
    }, 2000);
  };

  return (
    <div
      className="notification-center-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          actions.toggleNotifications();
        }
      }}
    >
      <div
        className="notification-center"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.secondary,
          color: theme.colors.text,
        }}
      >
        {/* Header */}
        <div className="notification-header">
          <div className="notification-title">
            <span className="notification-icon">🔔</span>
            <h2>Notifications</h2>
            {unreadNotifications.length > 0 && (
              <span
                className="unread-badge"
                style={{ backgroundColor: theme.colors.accent }}
              >
                {unreadNotifications.length}
              </span>
            )}
          </div>
          <div className="notification-controls">
            {notifications.length > 0 && (
              <>
                <button
                  className="control-button"
                  onClick={markAllAsRead}
                  style={{ color: theme.colors.text }}
                  title="Mark all as read"
                >
                  ✓
                </button>
                <button
                  className="control-button"
                  onClick={clearAllNotifications}
                  style={{ color: theme.colors.text }}
                  title="Clear all notifications"
                >
                  🗑️
                </button>
              </>
            )}
            <button
              className="control-button close-button"
              onClick={actions.toggleNotifications}
              style={{ color: theme.colors.text }}
              title="Close Notifications (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="notification-content">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <span className="no-notifications-icon">🔕</span>
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
              <button
                className="demo-button"
                onClick={addDemoNotifications}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.secondary,
                  color: theme.colors.text,
                }}
              >
                Add Demo Notifications
              </button>
            </div>
          ) : (
            <div className="notifications-list">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div className="notification-section">
                  <h3 className="section-title" style={{ color: theme.colors.accent }}>
                    New ({unreadNotifications.length})
                  </h3>
                  {unreadNotifications.map(notification => (
                    <NotificationItemComponent
                      key={notification.id}
                      notification={notification}
                      onDismiss={actions.dismissNotification}
                      theme={theme}
                    />
                  ))}
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div className="notification-section">
                  <h3 className="section-title" style={{ color: `${theme.colors.text}60` }}>
                    Earlier ({readNotifications.length})
                  </h3>
                  {readNotifications.slice(0, 5).map(notification => (
                    <NotificationItemComponent
                      key={notification.id}
                      notification={notification}
                      onDismiss={actions.dismissNotification}
                      theme={theme}
                    />
                  ))}
                  {readNotifications.length > 5 && (
                    <div className="more-notifications" style={{ color: `${theme.colors.text}60` }}>
                      +{readNotifications.length - 5} more notifications
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="notification-footer">
          <div className="notification-stats" style={{ color: `${theme.colors.text}60` }}>
            <span>{notifications.length} total</span>
            <span>•</span>
            <span>{unreadNotifications.length} unread</span>
          </div>
        </div>
      </div>
    </div>
  );
}