import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

// Window configuration types
export interface WindowConfig {
  window_type: string;
  title: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  resizable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  closable: boolean;
  always_on_top: boolean;
  decorations: boolean;
  transparent: boolean;
  focus: boolean;
  fullscreen: boolean;
  url?: string;
}

export interface WindowState {
  label: string;
  config: WindowConfig;
  z_order: number;
  is_focused: boolean;
  is_minimized: boolean;
  is_maximized: boolean;
  monitor_id?: string;
  created_at: number;
  last_focused_at: number;
}

export interface MonitorInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale_factor: number;
  is_primary: boolean;
}

export type SnapPosition =
  | 'Left'
  | 'Right'
  | 'Top'
  | 'Bottom'
  | 'TopLeft'
  | 'TopRight'
  | 'BottomLeft'
  | 'BottomRight'
  | 'Center'
  | 'Maximize';

// Window Manager Context
interface WindowManagerContextType {
  windows: WindowState[];
  focusedWindow: WindowState | null;
  monitors: MonitorInfo[];
  createWindow: (windowType: string, config: WindowConfig) => Promise<string>;
  closeWindow: (label: string) => Promise<void>;
  focusWindow: (label: string) => Promise<void>;
  minimizeWindow: (label: string) => Promise<void>;
  maximizeWindow: (label: string) => Promise<void>;
  unmaximizeWindow: (label: string) => Promise<void>;
  resizeWindow: (label: string, width: number, height: number) => Promise<void>;
  moveWindow: (label: string, x: number, y: number) => Promise<void>;
  snapWindow: (label: string, position: SnapPosition) => Promise<void>;
  cycleWindows: (forward: boolean) => Promise<void>;
  saveWindowState: () => Promise<void>;
  loadWindowState: () => Promise<string[]>;
  refreshWindowList: () => Promise<void>;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};

// Window Manager Provider Component
export const WindowManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindow, setFocusedWindow] = useState<WindowState | null>(null);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);

  // Refresh window list from backend
  const refreshWindowList = useCallback(async () => {
    try {
      const windowList = await invoke<WindowState[]>('get_window_list');
      setWindows(windowList);

      const focused = await invoke<WindowState | null>('get_focused_window');
      setFocusedWindow(focused);
    } catch (error) {
      console.error('Failed to refresh window list:', error);
    }
  }, []);

  // Load monitor information
  const loadMonitors = useCallback(async () => {
    try {
      const monitorList = await invoke<MonitorInfo[]>('get_monitors');
      setMonitors(monitorList);
    } catch (error) {
      console.error('Failed to load monitors:', error);
    }
  }, []);

  // Initialize window manager
  useEffect(() => {
    refreshWindowList();
    loadMonitors();

    // Set up periodic refresh (every 5 seconds)
    const interval = setInterval(refreshWindowList, 5000);
    return () => clearInterval(interval);
  }, [refreshWindowList, loadMonitors]);

  // Window management functions
  const createWindow = useCallback(async (windowType: string, config: WindowConfig): Promise<string> => {
    try {
      const label = await invoke<string>('create_app_window', { windowType, config });
      await refreshWindowList();
      return label;
    } catch (error) {
      console.error('Failed to create window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const closeWindow = useCallback(async (label: string): Promise<void> => {
    try {
      await invoke('close_app_window', { label });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to close window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const focusWindow = useCallback(async (label: string): Promise<void> => {
    try {
      await invoke('focus_app_window', { label });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to focus window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const minimizeWindow = useCallback(async (label: string): Promise<void> => {
    try {
      await invoke('minimize_window', { label });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to minimize window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const maximizeWindow = useCallback(async (label: string): Promise<void> => {
    try {
      await invoke('maximize_window', { label });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to maximize window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const unmaximizeWindow = useCallback(async (label: string): Promise<void> => {
    try {
      await invoke('unmaximize_window', { label });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to unmaximize window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const resizeWindow = useCallback(async (label: string, width: number, height: number): Promise<void> => {
    try {
      await invoke('resize_app_window', { label, width, height });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to resize window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const moveWindow = useCallback(async (label: string, x: number, y: number): Promise<void> => {
    try {
      await invoke('move_window', { label, x, y });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to move window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const snapWindow = useCallback(async (label: string, position: SnapPosition): Promise<void> => {
    try {
      await invoke('snap_window', { label, position });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to snap window:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const cycleWindows = useCallback(async (forward: boolean): Promise<void> => {
    try {
      await invoke('cycle_windows', { forward });
      await refreshWindowList();
    } catch (error) {
      console.error('Failed to cycle windows:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const saveWindowState = useCallback(async (): Promise<void> => {
    try {
      await invoke('save_window_state');
    } catch (error) {
      console.error('Failed to save window state:', error);
      throw error;
    }
  }, []);

  const loadWindowState = useCallback(async (): Promise<string[]> => {
    try {
      const restoredLabels = await invoke<string[]>('load_window_state');
      await refreshWindowList();
      return restoredLabels;
    } catch (error) {
      console.error('Failed to load window state:', error);
      throw error;
    }
  }, [refreshWindowList]);

  const contextValue: WindowManagerContextType = {
    windows,
    focusedWindow,
    monitors,
    createWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    unmaximizeWindow,
    resizeWindow,
    moveWindow,
    snapWindow,
    cycleWindows,
    saveWindowState,
    loadWindowState,
    refreshWindowList,
  };

  return (
    <WindowManagerContext.Provider value={contextValue}>
      {children}
    </WindowManagerContext.Provider>
  );
};