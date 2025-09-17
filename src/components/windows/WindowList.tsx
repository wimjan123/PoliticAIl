import React from 'react';
import { useWindowManager, WindowState, SnapPosition } from './WindowManager';

interface WindowListProps {
  showControls?: boolean;
  showSnapControls?: boolean;
}

const WindowList: React.FC<WindowListProps> = ({
  showControls = true,
  showSnapControls = false
}) => {
  const {
    windows,
    focusedWindow,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    unmaximizeWindow,
    snapWindow,
  } = useWindowManager();

  const handleSnapWindow = async (label: string, position: SnapPosition) => {
    try {
      await snapWindow(label, position);
    } catch (error) {
      console.error('Failed to snap window:', error);
    }
  };

  const handleFocusWindow = async (label: string) => {
    try {
      await focusWindow(label);
    } catch (error) {
      console.error('Failed to focus window:', error);
    }
  };

  const handleCloseWindow = async (label: string) => {
    try {
      await closeWindow(label);
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  const handleMinimizeWindow = async (label: string) => {
    try {
      await minimizeWindow(label);
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximizeToggle = async (window: WindowState) => {
    try {
      if (window.is_maximized) {
        await unmaximizeWindow(window.label);
      } else {
        await maximizeWindow(window.label);
      }
    } catch (error) {
      console.error('Failed to toggle maximize window:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="window-list">
      <h3>Active Windows ({windows.length})</h3>

      {windows.length === 0 ? (
        <div className="no-windows">
          <p>No windows currently open</p>
        </div>
      ) : (
        <div className="window-grid">
          {windows.map((window) => (
            <div
              key={window.label}
              className={`window-item ${window.is_focused ? 'focused' : ''} ${
                window.is_minimized ? 'minimized' : ''
              } ${window.is_maximized ? 'maximized' : ''}`}
            >
              <div className="window-header">
                <div className="window-info">
                  <h4 className="window-title">{window.config.title}</h4>
                  <span className="window-type">{window.config.window_type}</span>
                  <span className="window-z-order">Z: {window.z_order}</span>
                </div>

                {showControls && (
                  <div className="window-controls">
                    <button
                      onClick={() => handleFocusWindow(window.label)}
                      className="control-btn focus-btn"
                      title="Focus Window"
                      disabled={window.is_focused}
                    >
                      🎯
                    </button>

                    <button
                      onClick={() => handleMinimizeWindow(window.label)}
                      className="control-btn minimize-btn"
                      title="Minimize Window"
                      disabled={window.is_minimized}
                    >
                      🗕
                    </button>

                    <button
                      onClick={() => handleMaximizeToggle(window)}
                      className="control-btn maximize-btn"
                      title={window.is_maximized ? "Restore Window" : "Maximize Window"}
                    >
                      {window.is_maximized ? '🗗' : '🗖'}
                    </button>

                    <button
                      onClick={() => handleCloseWindow(window.label)}
                      className="control-btn close-btn"
                      title="Close Window"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="window-details">
                <div className="window-properties">
                  <span>Size: {window.config.width}×{window.config.height}</span>
                  {window.config.x !== undefined && window.config.y !== undefined && (
                    <span>Position: ({window.config.x}, {window.config.y})</span>
                  )}
                  <span>Created: {formatTimestamp(window.created_at)}</span>
                  {window.is_focused && (
                    <span>Last Focused: {formatTimestamp(window.last_focused_at)}</span>
                  )}
                </div>

                <div className="window-status">
                  {window.is_focused && <span className="status-badge focused">Focused</span>}
                  {window.is_minimized && <span className="status-badge minimized">Minimized</span>}
                  {window.is_maximized && <span className="status-badge maximized">Maximized</span>}
                  {window.config.always_on_top && <span className="status-badge always-on-top">Always On Top</span>}
                </div>
              </div>

              {showSnapControls && (
                <div className="snap-controls">
                  <h5>Snap to:</h5>
                  <div className="snap-grid">
                    <button
                      onClick={() => handleSnapWindow(window.label, 'TopLeft')}
                      className="snap-btn"
                      title="Top Left"
                    >
                      ↖
                    </button>
                    <button
                      onClick={() => handleSnapWindow(window.label, 'Top')}
                      className="snap-btn"
                      title="Top"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleSnapWindow(window.label, 'TopRight')}
                      className="snap-btn"
                      title="Top Right"
                    >
                      ↗
                    </button>

                    <button
                      onClick={() => handleSnapWindow(window.label, 'Left')}
                      className="snap-btn"
                      title="Left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleSnapWindow(window.label, 'Center')}
                      className="snap-btn"
                      title="Center"
                    >
                      ⊡
                    </button>
                    <button
                      onClick={() => handleSnapWindow(window.label, 'Right')}
                      className="snap-btn"
                      title="Right"
                    >
                      →
                    </button>

                    <button
                      onClick={() => handleSnapWindow(window.label, 'BottomLeft')}
                      className="snap-btn"
                      title="Bottom Left"
                    >
                      ↙
                    </button>
                    <button
                      onClick={() => handleSnapWindow(window.label, 'Bottom')}
                      className="snap-btn"
                      title="Bottom"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleSnapWindow(window.label, 'BottomRight')}
                      className="snap-btn"
                      title="Bottom Right"
                    >
                      ↘
                    </button>
                  </div>

                  <button
                    onClick={() => handleSnapWindow(window.label, 'Maximize')}
                    className="snap-btn maximize-snap"
                    title="Maximize"
                  >
                    Maximize
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {focusedWindow && (
        <div className="focused-window-info">
          <h4>Currently Focused: {focusedWindow.config.title}</h4>
          <p>Label: {focusedWindow.label}</p>
        </div>
      )}
    </div>
  );
};

export default WindowList;