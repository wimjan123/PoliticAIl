/**
 * Window State Persistence Utilities
 * Handles window position, size, and workspace persistence across application sessions
 */

import { invoke } from '@tauri-apps/api/core';

// Window state interfaces
export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  position: WindowPosition;
  size: WindowSize;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  monitor: number; // Monitor index
  monitorName?: string; // Monitor identifier for validation
}

export interface MonitorInfo {
  index: number;
  name: string;
  size: WindowSize;
  position: WindowPosition;
  scaleFactor: number;
  isPrimary: boolean;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  windows: Record<string, WindowState>; // window label -> state
  monitors: MonitorInfo[];
  createdAt: number;
  lastUsed: number;
}

export interface WindowPersistenceConfig {
  storageKey: string;
  workspaceStorageKey: string;
  version: string;
  maxAge: number; // Maximum age in milliseconds
  validatePosition: boolean;
  fallbackPosition: WindowPosition;
  fallbackSize: WindowSize;
  debounceDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: WindowPersistenceConfig = {
  storageKey: 'politicAIl_window_state',
  workspaceStorageKey: 'politicAIl_workspaces',
  version: '1.0.0',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  validatePosition: true,
  fallbackPosition: { x: 100, y: 100 },
  fallbackSize: { width: 1200, height: 800 },
  debounceDelay: 500,
};

interface StoredWindowState {
  version: string;
  timestamp: number;
  data: Record<string, WindowState>;
  monitors: MonitorInfo[];
}

interface StoredWorkspaces {
  version: string;
  timestamp: number;
  workspaces: Record<string, WorkspaceLayout>;
}

// Storage utilities
class WindowPersistenceStorage {
  private config: WindowPersistenceConfig;
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<WindowPersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__window_storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current monitor information
   */
  async getMonitorInfo(): Promise<MonitorInfo[]> {
    try {
      const monitors = await invoke<MonitorInfo[]>('get_monitor_info');
      return monitors;
    } catch (error) {
      console.warn('Failed to get monitor info:', error);
      return [{
        index: 0,
        name: 'Primary Monitor',
        size: this.config.fallbackSize,
        position: { x: 0, y: 0 },
        scaleFactor: 1,
        isPrimary: true,
      }];
    }
  }

  /**
   * Validate window position against current monitor setup
   */
  async validateWindowPosition(
    windowState: WindowState,
    monitors: MonitorInfo[]
  ): Promise<WindowState> {
    if (!this.config.validatePosition) {
      return windowState;
    }

    // Check if the window's monitor still exists
    const targetMonitor = monitors.find(m => m.index === windowState.monitor);
    if (!targetMonitor) {
      // Fallback to primary monitor
      const primaryMonitor = monitors.find(m => m.isPrimary) || monitors[0];
      if (!primaryMonitor) {
        // Ultimate fallback if no monitors are available
        return {
          ...windowState,
          position: this.config.fallbackPosition,
          monitor: 0,
          monitorName: 'Primary Monitor',
        };
      }
      return {
        ...windowState,
        position: {
          x: primaryMonitor.position.x + this.config.fallbackPosition.x,
          y: primaryMonitor.position.y + this.config.fallbackPosition.y,
        },
        monitor: primaryMonitor.index,
        monitorName: primaryMonitor.name,
      };
    }

    // Validate position is within monitor bounds
    const { position, size } = windowState;
    const monitor = targetMonitor;

    const minX = monitor.position.x;
    const maxX = monitor.position.x + monitor.size.width - size.width;
    const minY = monitor.position.y;
    const maxY = monitor.position.y + monitor.size.height - size.height;

    const validatedPosition = {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y)),
    };

    // Ensure window is not completely off-screen
    if (validatedPosition.x + size.width < monitor.position.x ||
        validatedPosition.x > monitor.position.x + monitor.size.width ||
        validatedPosition.y + size.height < monitor.position.y ||
        validatedPosition.y > monitor.position.y + monitor.size.height) {

      validatedPosition.x = monitor.position.x + this.config.fallbackPosition.x;
      validatedPosition.y = monitor.position.y + this.config.fallbackPosition.y;
    }

    return {
      ...windowState,
      position: validatedPosition,
      monitorName: monitor.name,
    };
  }

  /**
   * Save window state to localStorage
   */
  saveWindowState(windowLabel: string, state: WindowState): void {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available for window persistence');
      return;
    }

    try {
      const stored = this.loadStoredWindowStates();
      stored.data[windowLabel] = state;
      stored.timestamp = Date.now();

      localStorage.setItem(this.config.storageKey, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to save window state:', error);
    }
  }

  /**
   * Load window state from localStorage
   */
  loadWindowState(windowLabel: string): WindowState | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const stored = this.loadStoredWindowStates();

      // Check version and age
      if (stored.version !== this.config.version ||
          Date.now() - stored.timestamp > this.config.maxAge) {
        this.clearWindowStates();
        return null;
      }

      return stored.data[windowLabel] || null;
    } catch (error) {
      console.warn('Failed to load window state:', error);
      this.clearWindowStates();
      return null;
    }
  }

  /**
   * Load all stored window states
   */
  private loadStoredWindowStates(): StoredWindowState {
    const defaultStored: StoredWindowState = {
      version: this.config.version,
      timestamp: Date.now(),
      data: {},
      monitors: [],
    };

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return defaultStored;

      return { ...defaultStored, ...JSON.parse(stored) };
    } catch {
      return defaultStored;
    }
  }

  /**
   * Clear all window states
   */
  clearWindowStates(): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.warn('Failed to clear window states:', error);
    }
  }

  /**
   * Debounced save to prevent excessive storage writes
   */
  debouncedSaveWindowState(windowLabel: string, state: WindowState): void {
    const existingTimeout = this.saveTimeouts.get(windowLabel);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.saveWindowState(windowLabel, state);
      this.saveTimeouts.delete(windowLabel);
    }, this.config.debounceDelay);

    this.saveTimeouts.set(windowLabel, timeout);
  }

  /**
   * Save workspace layout
   */
  saveWorkspace(workspace: WorkspaceLayout): void {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available for workspace persistence');
      return;
    }

    try {
      const stored = this.loadStoredWorkspaces();
      stored.workspaces[workspace.id] = {
        ...workspace,
        lastUsed: Date.now(),
      };
      stored.timestamp = Date.now();

      localStorage.setItem(this.config.workspaceStorageKey, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to save workspace:', error);
    }
  }

  /**
   * Load workspace layout
   */
  loadWorkspace(workspaceId: string): WorkspaceLayout | null {
    if (!this.isStorageAvailable()) return null;

    try {
      const stored = this.loadStoredWorkspaces();

      if (stored.version !== this.config.version ||
          Date.now() - stored.timestamp > this.config.maxAge) {
        this.clearWorkspaces();
        return null;
      }

      return stored.workspaces[workspaceId] || null;
    } catch (error) {
      console.warn('Failed to load workspace:', error);
      return null;
    }
  }

  /**
   * Load all workspaces
   */
  loadAllWorkspaces(): WorkspaceLayout[] {
    if (!this.isStorageAvailable()) return [];

    try {
      const stored = this.loadStoredWorkspaces();

      if (stored.version !== this.config.version ||
          Date.now() - stored.timestamp > this.config.maxAge) {
        this.clearWorkspaces();
        return [];
      }

      return Object.values(stored.workspaces)
        .sort((a, b) => b.lastUsed - a.lastUsed);
    } catch (error) {
      console.warn('Failed to load workspaces:', error);
      return [];
    }
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(workspaceId: string): void {
    if (!this.isStorageAvailable()) return;

    try {
      const stored = this.loadStoredWorkspaces();
      delete stored.workspaces[workspaceId];
      stored.timestamp = Date.now();

      localStorage.setItem(this.config.workspaceStorageKey, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to delete workspace:', error);
    }
  }

  /**
   * Clear all workspaces
   */
  clearWorkspaces(): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.removeItem(this.config.workspaceStorageKey);
    } catch (error) {
      console.warn('Failed to clear workspaces:', error);
    }
  }

  /**
   * Load stored workspaces
   */
  private loadStoredWorkspaces(): StoredWorkspaces {
    const defaultStored: StoredWorkspaces = {
      version: this.config.version,
      timestamp: Date.now(),
      workspaces: {},
    };

    try {
      const stored = localStorage.getItem(this.config.workspaceStorageKey);
      if (!stored) return defaultStored;

      return { ...defaultStored, ...JSON.parse(stored) };
    } catch {
      return defaultStored;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    try {
      const windowStates = localStorage.getItem(this.config.storageKey);
      const workspaces = localStorage.getItem(this.config.workspaceStorageKey);

      return {
        hasWindowStates: !!windowStates,
        hasWorkspaces: !!workspaces,
        windowStatesSize: windowStates ? new Blob([windowStates]).size : 0,
        workspacesSize: workspaces ? new Blob([workspaces]).size : 0,
        totalSize: (windowStates ? new Blob([windowStates]).size : 0) +
                  (workspaces ? new Blob([workspaces]).size : 0),
      };
    } catch {
      return {
        hasWindowStates: false,
        hasWorkspaces: false,
        windowStatesSize: 0,
        workspacesSize: 0,
        totalSize: 0,
      };
    }
  }
}

// Export singleton instance
export const windowPersistence = new WindowPersistenceStorage();

// Convenience functions
export const saveWindowState = (label: string, state: WindowState) =>
  windowPersistence.saveWindowState(label, state);

export const loadWindowState = (label: string) =>
  windowPersistence.loadWindowState(label);

export const debouncedSaveWindowState = (label: string, state: WindowState) =>
  windowPersistence.debouncedSaveWindowState(label, state);

export const saveWorkspace = (workspace: WorkspaceLayout) =>
  windowPersistence.saveWorkspace(workspace);

export const loadWorkspace = (id: string) =>
  windowPersistence.loadWorkspace(id);

export const loadAllWorkspaces = () =>
  windowPersistence.loadAllWorkspaces();

export const deleteWorkspace = (id: string) =>
  windowPersistence.deleteWorkspace(id);

export const getMonitorInfo = () =>
  windowPersistence.getMonitorInfo();

export const validateWindowPosition = (state: WindowState, monitors: MonitorInfo[]) =>
  windowPersistence.validateWindowPosition(state, monitors);

export const getStorageStats = () =>
  windowPersistence.getStorageStats();

export const clearAllWindowData = () => {
  windowPersistence.clearWindowStates();
  windowPersistence.clearWorkspaces();
};

// Workspace management utilities
export const createWorkspace = async (
  name: string,
  description?: string
): Promise<WorkspaceLayout> => {
  const monitors = await getMonitorInfo();
  const windowStates = await getCurrentWindowStates();

  const workspace: WorkspaceLayout = {
    id: generateWorkspaceId(),
    name,
    ...(description ? { description } : {}),
    windows: windowStates,
    monitors,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  };

  saveWorkspace(workspace);
  return workspace;
};

export const restoreWorkspace = async (workspaceId: string): Promise<boolean> => {
  const workspace = loadWorkspace(workspaceId);
  if (!workspace) {
    console.warn(`Workspace ${workspaceId} not found`);
    return false;
  }

  try {
    const currentMonitors = await getMonitorInfo();

    // Apply window states with validation
    for (const [windowLabel, windowState] of Object.entries(workspace.windows)) {
      const validatedState = await validateWindowPosition(windowState, currentMonitors);
      await applyWindowState(windowLabel, validatedState);
    }

    // Update last used timestamp
    workspace.lastUsed = Date.now();
    saveWorkspace(workspace);

    return true;
  } catch (error) {
    console.error('Failed to restore workspace:', error);
    return false;
  }
};

// Helper functions
async function getCurrentWindowStates(): Promise<Record<string, WindowState>> {
  try {
    return await invoke<Record<string, WindowState>>('get_all_window_states');
  } catch (error) {
    console.warn('Failed to get current window states:', error);
    return {};
  }
}

async function applyWindowState(windowLabel: string, state: WindowState): Promise<void> {
  try {
    await invoke('set_window_state', {
      label: windowLabel,
      state: state,
    });
  } catch (error) {
    console.warn(`Failed to apply window state for ${windowLabel}:`, error);
  }
}

function generateWorkspaceId(): string {
  return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Hook for React components
export interface UseWindowPersistenceOptions {
  windowLabel: string;
  autoSave?: boolean;
  saveDelay?: number;
}

export function useWindowPersistence({
  windowLabel,
  autoSave = true,
  saveDelay = 500,
}: UseWindowPersistenceOptions) {
  const [windowState, setWindowState] = React.useState<WindowState | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Load initial state
    const loadInitialState = async () => {
      try {
        const savedState = loadWindowState(windowLabel);
        if (savedState) {
          const monitors = await getMonitorInfo();
          const validatedState = await validateWindowPosition(savedState, monitors);
          setWindowState(validatedState);
          await applyWindowState(windowLabel, validatedState);
        }
      } catch (error) {
        console.warn('Failed to load initial window state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, [windowLabel]);

  const updateWindowState = React.useCallback((newState: Partial<WindowState>) => {
    setWindowState(current => {
      if (!current) return null;

      const updatedState = { ...current, ...newState };

      if (autoSave) {
        if (saveDelay > 0) {
          debouncedSaveWindowState(windowLabel, updatedState);
        } else {
          saveWindowState(windowLabel, updatedState);
        }
      }

      return updatedState;
    });
  }, [windowLabel, autoSave, saveDelay]);

  const saveState = React.useCallback(() => {
    if (windowState) {
      saveWindowState(windowLabel, windowState);
    }
  }, [windowLabel, windowState]);

  return {
    windowState,
    updateWindowState,
    saveState,
    isLoading,
  };
}

// Import React for the hook
import React from 'react';