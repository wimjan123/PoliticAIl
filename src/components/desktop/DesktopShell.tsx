import React from 'react';
import { DesktopProvider, useDesktop } from '../../contexts/DesktopContext';
import { DesktopBackground } from './background/DesktopBackground';
import { Taskbar } from './taskbar/Taskbar';
import { AppLauncher } from './launcher/AppLauncher';
import { NotificationCenter } from './notifications/NotificationCenter';
import { ContextMenu } from './ContextMenu';
import '../../styles/components/desktop-shell.css';

function DesktopShellContent() {
  const { state, actions } = useDesktop();

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    const contextItems = [
      {
        id: 'refresh',
        label: 'Refresh Desktop',
        icon: '🔄',
        onClick: () => window.location.reload(),
      },
      {
        id: 'separator1',
        separator: true,
      },
      {
        id: 'launcher',
        label: 'Open App Launcher',
        icon: '🚀',
        shortcut: 'Super',
        onClick: actions.toggleLauncher,
      },
      {
        id: 'notifications',
        label: 'Show Notifications',
        icon: '🔔',
        onClick: actions.toggleNotifications,
      },
      {
        id: 'separator2',
        separator: true,
      },
      {
        id: 'settings',
        label: 'Desktop Settings',
        icon: '⚙️',
        onClick: () => {
          actions.addNotification({
            title: 'Settings',
            message: 'Desktop settings coming soon!',
            type: 'info',
          });
        },
      },
    ];

    actions.showContextMenu(event.clientX, event.clientY, contextItems);
  };

  return (
    <div
      className="desktop-shell"
      onContextMenu={handleContextMenu}
      style={{
        background: state.theme.wallpaper,
        color: state.theme.colors.text,
      }}
    >
      <DesktopBackground />

      {/* Main desktop area */}
      <div className="desktop-main">
        {/* Windows would be rendered here */}
        <div className="windows-container">
          {state.windows.map(window => (
            <div
              key={window.id}
              className={`window ${window.isFocused ? 'focused' : ''} ${window.isMinimized ? 'minimized' : ''}`}
              style={{
                left: window.position.x,
                top: window.position.y,
                width: window.size.width,
                height: window.size.height,
                zIndex: window.zIndex,
              }}
              onClick={() => actions.focusWindow(window.id)}
            >
              <div className="window-header">
                <div className="window-title">{window.title}</div>
                <div className="window-controls">
                  <button
                    className="window-control minimize"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.minimizeWindow(window.id);
                    }}
                    title="Minimize"
                  >
                    −
                  </button>
                  <button
                    className="window-control close"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.closeApp(window.appId);
                    }}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="window-content">
                <div className="app-placeholder">
                  <div className="app-icon">{state.apps.find(app => app.id === window.appId)?.icon}</div>
                  <h3>{window.title}</h3>
                  <p>Application content would be rendered here.</p>
                  <p>This is a placeholder for the {state.apps.find(app => app.id === window.appId)?.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop UI Components */}
      <Taskbar />

      {state.showLauncher && <AppLauncher />}
      {state.showNotifications && <NotificationCenter />}
      {state.contextMenu.visible && <ContextMenu />}
    </div>
  );
}

export function DesktopShell() {
  return (
    <DesktopProvider>
      <DesktopShellContent />
    </DesktopProvider>
  );
}