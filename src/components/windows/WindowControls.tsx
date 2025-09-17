import React, { useEffect, useState } from 'react';
import { useWindowManager } from './WindowManager';

interface WindowControlsProps {
  showKeyboardShortcuts?: boolean;
  showPersistenceControls?: boolean;
}

const WindowControls: React.FC<WindowControlsProps> = ({
  showKeyboardShortcuts = true,
  showPersistenceControls = true,
}) => {
  const {
    windows,
    focusedWindow,
    cycleWindows,
    saveWindowState,
    loadWindowState,
    refreshWindowList,
  } = useWindowManager();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    if (!showKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Tab for window cycling
      if (event.altKey && event.key === 'Tab') {
        event.preventDefault();
        cycleWindows(!event.shiftKey); // Shift+Alt+Tab for reverse cycling
      }

      // Ctrl+S for saving window state
      if (event.ctrlKey && event.key === 's' && event.shiftKey) {
        event.preventDefault();
        handleSaveState();
      }

      // Ctrl+O for loading window state
      if (event.ctrlKey && event.key === 'o' && event.shiftKey) {
        event.preventDefault();
        handleLoadState();
      }

      // F5 for refreshing window list
      if (event.key === 'F5') {
        event.preventDefault();
        refreshWindowList();
        showMessage('Window list refreshed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleWindows, refreshWindowList, showKeyboardShortcuts]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCycleForward = async () => {
    try {
      await cycleWindows(true);
      showMessage('Cycled to next window');
    } catch (error) {
      console.error('Failed to cycle windows:', error);
      showMessage('Failed to cycle windows');
    }
  };

  const handleCycleBackward = async () => {
    try {
      await cycleWindows(false);
      showMessage('Cycled to previous window');
    } catch (error) {
      console.error('Failed to cycle windows:', error);
      showMessage('Failed to cycle windows');
    }
  };

  const handleSaveState = async () => {
    if (windows.length === 0) {
      showMessage('No windows to save');
      return;
    }

    setIsSaving(true);
    try {
      await saveWindowState();
      showMessage(`Saved state for ${windows.length} windows`);
    } catch (error) {
      console.error('Failed to save window state:', error);
      showMessage('Failed to save window state');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadState = async () => {
    setIsLoading(true);
    try {
      const restoredLabels = await loadWindowState();
      if (restoredLabels.length > 0) {
        showMessage(`Restored ${restoredLabels.length} windows`);
      } else {
        showMessage('No saved window state found');
      }
    } catch (error) {
      console.error('Failed to load window state:', error);
      showMessage('Failed to load window state');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshWindowList();
      showMessage('Window list refreshed');
    } catch (error) {
      console.error('Failed to refresh window list:', error);
      showMessage('Failed to refresh window list');
    }
  };

  return (
    <div className="window-controls">
      <h3>Window Controls</h3>

      {message && (
        <div className="message-bar">
          <p>{message}</p>
        </div>
      )}

      <div className="control-sections">
        {/* Window Navigation */}
        <div className="control-section">
          <h4>Navigation</h4>
          <div className="control-buttons">
            <button
              onClick={handleCycleBackward}
              className="control-btn"
              disabled={windows.length <= 1}
              title="Previous Window (Shift+Alt+Tab)"
            >
              ← Previous
            </button>

            <button
              onClick={handleCycleForward}
              className="control-btn"
              disabled={windows.length <= 1}
              title="Next Window (Alt+Tab)"
            >
              Next →
            </button>

            <button
              onClick={handleRefresh}
              className="control-btn refresh-btn"
              title="Refresh Window List (F5)"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Window Persistence */}
        {showPersistenceControls && (
          <div className="control-section">
            <h4>Session Management</h4>
            <div className="control-buttons">
              <button
                onClick={handleSaveState}
                className="control-btn save-btn"
                disabled={isSaving || windows.length === 0}
                title="Save Window State (Ctrl+Shift+S)"
              >
                {isSaving ? '💾 Saving...' : '💾 Save State'}
              </button>

              <button
                onClick={handleLoadState}
                className="control-btn load-btn"
                disabled={isLoading}
                title="Load Window State (Ctrl+Shift+O)"
              >
                {isLoading ? '📂 Loading...' : '📂 Load State'}
              </button>
            </div>
          </div>
        )}

        {/* Window Statistics */}
        <div className="control-section">
          <h4>Statistics</h4>
          <div className="window-stats">
            <div className="stat-item">
              <span className="stat-label">Total Windows:</span>
              <span className="stat-value">{windows.length}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Focused Window:</span>
              <span className="stat-value">
                {focusedWindow ? focusedWindow.config.title : 'None'}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Minimized:</span>
              <span className="stat-value">
                {windows.filter(w => w.is_minimized).length}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Maximized:</span>
              <span className="stat-value">
                {windows.filter(w => w.is_maximized).length}
              </span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        {showKeyboardShortcuts && (
          <div className="control-section">
            <h4>Keyboard Shortcuts</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Alt + Tab</span>
                <span className="shortcut-desc">Cycle to next window</span>
              </div>

              <div className="shortcut-item">
                <span className="shortcut-key">Shift + Alt + Tab</span>
                <span className="shortcut-desc">Cycle to previous window</span>
              </div>

              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + Shift + S</span>
                <span className="shortcut-desc">Save window state</span>
              </div>

              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + Shift + O</span>
                <span className="shortcut-desc">Load window state</span>
              </div>

              <div className="shortcut-item">
                <span className="shortcut-key">F5</span>
                <span className="shortcut-desc">Refresh window list</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WindowControls;