/**
 * Window Persistence Usage Examples
 * Demonstrates how to integrate window persistence into the main application
 */

import React, { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  windowPersistence,
  useWindowPersistence,
  createWorkspace,
  restoreWorkspace,
  loadAllWorkspaces,
  getMonitorInfo,
  WorkspaceLayout,
} from '../utils/windowPersistence';

// Example 1: Basic window persistence in main App component
export const MainAppWithPersistence: React.FC = () => {
  const { windowState, updateWindowState, saveState, isLoading } = useWindowPersistence({
    windowLabel: 'main_window',
    autoSave: true,
    saveDelay: 500,
  });

  useEffect(() => {
    // Set up window event listeners for persistence
    const setupWindowListeners = async () => {
      const currentWindow = getCurrentWindow();

      // Listen for window move events
      const unlistenMove = await currentWindow.onMoved(({ payload }) => {
        updateWindowState({
          position: { x: payload.x, y: payload.y },
        });
      });

      // Listen for window resize events
      const unlistenResize = await currentWindow.onResized(({ payload }) => {
        updateWindowState({
          size: { width: payload.width, height: payload.height },
        });
      });

      // Listen for window state changes
      const unlistenFocusChanged = await currentWindow.onFocusChanged(({ payload }) => {
        // Update focus state if needed
        console.log('Window focus changed:', payload);
      });

      // Cleanup listeners on unmount
      return () => {
        unlistenMove();
        unlistenResize();
        unlistenFocusChanged();
      };
    };

    setupWindowListeners();
  }, [updateWindowState]);

  // Save window state when app is about to close
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  return (
    <div>
      <h1>Main Application with Window Persistence</h1>
      {isLoading && <p>Loading window state...</p>}
      {windowState && (
        <div>
          <p>Window Position: {windowState.position.x}, {windowState.position.y}</p>
          <p>Window Size: {windowState.size.width} × {windowState.size.height}</p>
        </div>
      )}
    </div>
  );
};

// Example 2: Workspace-aware component
export const WorkspaceManager: React.FC = () => {
  const [workspaces, setWorkspaces] = React.useState<WorkspaceLayout[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = React.useState<string | null>(null);

  useEffect(() => {
    // Load saved workspaces on component mount
    const loadWorkspaces = async () => {
      const savedWorkspaces = loadAllWorkspaces();
      setWorkspaces(savedWorkspaces);

      // Auto-restore the most recently used workspace
      if (savedWorkspaces.length > 0) {
        const mostRecent = savedWorkspaces[0]; // Already sorted by lastUsed
        if (mostRecent) {
          await restoreWorkspace(mostRecent.id);
          setCurrentWorkspace(mostRecent.id);
        }
      }
    };

    loadWorkspaces();
  }, []);

  const handleSaveCurrentWorkspace = async () => {
    const name = prompt('Enter workspace name:');
    if (!name) return;

    try {
      const workspace = await createWorkspace(name, `Saved at ${new Date().toLocaleString()}`);
      setWorkspaces(prev => [workspace, ...prev]);
      setCurrentWorkspace(workspace.id);
      alert('Workspace saved successfully!');
    } catch (error) {
      console.error('Failed to save workspace:', error);
      alert('Failed to save workspace');
    }
  };

  const handleLoadWorkspace = async (workspaceId: string) => {
    try {
      const success = await restoreWorkspace(workspaceId);
      if (success) {
        setCurrentWorkspace(workspaceId);
        alert('Workspace restored successfully!');
      } else {
        alert('Failed to restore workspace');
      }
    } catch (error) {
      console.error('Failed to restore workspace:', error);
      alert('Failed to restore workspace');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Workspace Manager</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleSaveCurrentWorkspace}>
          💾 Save Current Workspace
        </button>
      </div>

      <div>
        <h3>Saved Workspaces</h3>
        {workspaces.map(workspace => (
          <div
            key={workspace.id}
            style={{
              padding: '10px',
              margin: '5px 0',
              border: currentWorkspace === workspace.id ? '2px solid #007bff' : '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => handleLoadWorkspace(workspace.id)}
          >
            <strong>{workspace.name}</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
              {workspace.description}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              Last used: {new Date(workspace.lastUsed).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 3: Multi-window application with persistence
export const MultiWindowApp: React.FC = () => {
  const [windows, setWindows] = React.useState<string[]>([]);

  const createNewWindow = async (windowType: string) => {
    try {
      const label = await invoke<string>('create_app_window', {
        windowType,
        config: {
          window_type: windowType,
          title: `${windowType} Window`,
          width: 800,
          height: 600,
          x: Math.random() * 200 + 100, // Random position
          y: Math.random() * 200 + 100,
          resizable: true,
          minimizable: true,
          maximizable: true,
          closable: true,
          always_on_top: false,
          decorations: true,
          transparent: false,
          focus: true,
          fullscreen: false,
          url: 'index.html', // Or specific URL for the window
        }
      });

      setWindows(prev => [...prev, label]);
      console.log('Created window:', label);
    } catch (error) {
      console.error('Failed to create window:', error);
    }
  };

  const saveAllWindowStates = async () => {
    try {
      await invoke('save_window_state');
      alert('All window states saved!');
    } catch (error) {
      console.error('Failed to save window states:', error);
      alert('Failed to save window states');
    }
  };

  const restoreAllWindowStates = async () => {
    try {
      const restoredLabels = await invoke<string[]>('load_window_state');
      setWindows(restoredLabels);
      alert(`Restored ${restoredLabels.length} windows!`);
    } catch (error) {
      console.error('Failed to restore window states:', error);
      alert('Failed to restore window states');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Multi-Window Application</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => createNewWindow('editor')}
          style={{ marginRight: '10px' }}
        >
          ➕ Create Editor Window
        </button>
        <button
          onClick={() => createNewWindow('browser')}
          style={{ marginRight: '10px' }}
        >
          ➕ Create Browser Window
        </button>
        <button
          onClick={() => createNewWindow('terminal')}
          style={{ marginRight: '10px' }}
        >
          ➕ Create Terminal Window
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={saveAllWindowStates}
          style={{ marginRight: '10px' }}
        >
          💾 Save All Window States
        </button>
        <button onClick={restoreAllWindowStates}>
          🔄 Restore All Window States
        </button>
      </div>

      <div>
        <h3>Active Windows ({windows.length})</h3>
        {windows.map(label => (
          <div key={label} style={{ padding: '5px', margin: '2px 0', border: '1px solid #ddd' }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 4: Monitor-aware positioning
export const MonitorAwareComponent: React.FC = () => {
  const [monitors, setMonitors] = React.useState<any[]>([]);

  useEffect(() => {
    const loadMonitors = async () => {
      try {
        const monitorInfo = await getMonitorInfo();
        setMonitors(monitorInfo);
      } catch (error) {
        console.error('Failed to get monitor info:', error);
      }
    };

    loadMonitors();
  }, []);

  const moveWindowToMonitor = async (monitorIndex: number) => {
    try {
      const monitor = monitors[monitorIndex];
      if (!monitor) return;

      await invoke('move_window', {
        label: 'main_window', // Assuming current window
        x: monitor.position.x + 100, // Offset from monitor edge
        y: monitor.position.y + 100,
      });

      console.log(`Moved window to monitor ${monitorIndex}`);
    } catch (error) {
      console.error('Failed to move window:', error);
    }
  };

  const snapWindowToPosition = async (position: string) => {
    try {
      await invoke('snap_window', {
        label: 'main_window',
        position: position,
      });

      console.log(`Snapped window to ${position}`);
    } catch (error) {
      console.error('Failed to snap window:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Monitor-Aware Positioning</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Available Monitors</h3>
        {monitors.map((monitor, index) => (
          <div key={index} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
            <strong>{monitor.name}</strong> ({monitor.size.width} × {monitor.size.height})
            <br />
            Position: ({monitor.position.x}, {monitor.position.y})
            <br />
            <button
              onClick={() => moveWindowToMonitor(index)}
              style={{ marginTop: '5px' }}
            >
              Move Window Here
            </button>
          </div>
        ))}
      </div>

      <div>
        <h3>Window Snapping</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
          <button onClick={() => snapWindowToPosition('TopLeft')}>↖️ Top Left</button>
          <button onClick={() => snapWindowToPosition('Top')}>⬆️ Top</button>
          <button onClick={() => snapWindowToPosition('TopRight')}>↗️ Top Right</button>
          <button onClick={() => snapWindowToPosition('Left')}>⬅️ Left</button>
          <button onClick={() => snapWindowToPosition('Center')}>🎯 Center</button>
          <button onClick={() => snapWindowToPosition('Right')}>➡️ Right</button>
          <button onClick={() => snapWindowToPosition('BottomLeft')}>↙️ Bottom Left</button>
          <button onClick={() => snapWindowToPosition('Bottom')}>⬇️ Bottom</button>
          <button onClick={() => snapWindowToPosition('BottomRight')}>↘️ Bottom Right</button>
        </div>
        <button
          onClick={() => snapWindowToPosition('Maximize')}
          style={{ width: '100%', marginTop: '10px' }}
        >
          🔲 Maximize
        </button>
      </div>
    </div>
  );
};

// Example 5: Integration into existing app
export const IntegrateWindowPersistence = () => {
  // This example shows how to add persistence to an existing React component

  React.useEffect(() => {
    // Initialize window persistence on app startup
    const initializePersistence = async () => {
      try {
        // Try to restore the last window state
        const savedState = windowPersistence.loadWindowState('main_window');

        if (savedState) {
          // Validate the saved state against current monitors
          const monitors = await getMonitorInfo();
          const validatedState = await windowPersistence.validateWindowPosition(savedState, monitors);

          // Apply the validated state to the current window
          await invoke('set_window_state', {
            label: 'main_window',
            state: {
              x: validatedState.position.x,
              y: validatedState.position.y,
              width: validatedState.size.width,
              height: validatedState.size.height,
              is_maximized: validatedState.isMaximized,
              is_minimized: validatedState.isMinimized,
              is_fullscreen: validatedState.isFullscreen,
              monitor: validatedState.monitor,
              monitor_name: validatedState.monitorName,
            }
          });

          console.log('Window state restored from persistence');
        }
      } catch (error) {
        console.warn('Failed to restore window state:', error);
      }
    };

    initializePersistence();

    // Save state when the app is closing
    const handleBeforeUnload = () => {
      // This will be handled by the auto-save mechanism if using useWindowPersistence
      // or manually save here if needed
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div>
      <h1>App with Window Persistence</h1>
      <p>Window position and size will be remembered across application restarts.</p>
    </div>
  );
};

export default {
  MainAppWithPersistence,
  WorkspaceManager,
  MultiWindowApp,
  MonitorAwareComponent,
  IntegrateWindowPersistence,
};