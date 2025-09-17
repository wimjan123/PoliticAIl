import { useDesktop } from '../../../contexts/DesktopContext';
import '../../../styles/components/taskbar.css';

export function Taskbar() {
  const { state, actions } = useDesktop();
  const { apps, windows, theme, notifications, showLauncher, showNotifications } = state;

  const runningApps = apps.filter(app => app.isRunning);
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAppClick = (app: any) => {
    const appWindow = windows.find(w => w.appId === app.id);
    if (appWindow) {
      if (appWindow.isMinimized || !appWindow.isFocused) {
        actions.focusWindow(appWindow.id);
      } else {
        actions.minimizeWindow(appWindow.id);
      }
    } else {
      actions.launchApp(app.id);
    }
  };

  return (
    <div
      className="taskbar"
      style={{
        backgroundColor: theme.colors.taskbar,
        borderTop: `1px solid ${theme.colors.secondary}`,
      }}
    >
      {/* Start/Launcher Button */}
      <button
        className={`taskbar-button start-button ${showLauncher ? 'active' : ''}`}
        onClick={actions.toggleLauncher}
        style={{
          backgroundColor: showLauncher ? theme.colors.primary : 'transparent',
          color: theme.colors.text,
        }}
        title="Open App Launcher (Super Key)"
      >
        <span className="start-icon">🏛️</span>
        <span className="start-text">PoliticAIl</span>
      </button>

      {/* App Indicators */}
      <div className="app-indicators">
        {runningApps.map(app => {
          const appWindow = windows.find(w => w.appId === app.id);
          const isActive = appWindow?.isFocused;
          const isMinimized = appWindow?.isMinimized;

          return (
            <button
              key={app.id}
              className={`taskbar-button app-button ${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}
              onClick={() => handleAppClick(app)}
              style={{
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
                color: theme.colors.text,
                borderBottom: isActive && !isMinimized ? `2px solid ${theme.colors.accent}` : 'none',
              }}
              title={app.name}
            >
              <span className="app-icon">{app.icon}</span>
              <span className="app-name">{app.name}</span>
              {isMinimized && <span className="minimized-indicator">_</span>}
            </button>
          );
        })}
      </div>

      {/* System Tray */}
      <div className="system-tray">
        {/* Notification Center */}
        <button
          className={`taskbar-button tray-button ${showNotifications ? 'active' : ''}`}
          onClick={actions.toggleNotifications}
          style={{
            backgroundColor: showNotifications ? theme.colors.primary : 'transparent',
            color: theme.colors.text,
          }}
          title={`Notifications ${unreadNotifications.length > 0 ? `(${unreadNotifications.length} unread)` : ''}`}
        >
          <span className="notification-icon">🔔</span>
          {unreadNotifications.length > 0 && (
            <span
              className="notification-badge"
              style={{ backgroundColor: theme.colors.accent }}
            >
              {unreadNotifications.length}
            </span>
          )}
        </button>

        {/* System Status */}
        <div className="system-status">
          <div className="network-status" title="Network Connected">📶</div>
          <div className="battery-status" title="Power Connected">🔌</div>
        </div>

        {/* Clock */}
        <div
          className="taskbar-clock"
          style={{ color: theme.colors.text }}
        >
          <div className="time">{formatTime()}</div>
          <div className="date">{formatDate()}</div>
        </div>
      </div>
    </div>
  );
}