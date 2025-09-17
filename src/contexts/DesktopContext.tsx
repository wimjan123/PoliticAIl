import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { DesktopState, PoliticalApp, WindowState, NotificationItem, DesktopTheme } from '../types/desktop';

interface DesktopContextType {
  state: DesktopState;
  actions: {
    launchApp: (appId: string) => void;
    closeApp: (appId: string) => void;
    minimizeWindow: (windowId: string) => void;
    maximizeWindow: (windowId: string) => void;
    focusWindow: (windowId: string) => void;
    addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
    dismissNotification: (notificationId: string) => void;
    toggleLauncher: () => void;
    toggleNotifications: () => void;
    showContextMenu: (x: number, y: number, items: any[]) => void;
    hideContextMenu: () => void;
    switchTheme: (theme: DesktopTheme) => void;
    cycleWindows: () => void;
  };
}

const politicalApps: PoliticalApp[] = [
  {
    id: 'dashboard',
    name: 'Political Dashboard',
    icon: '📊',
    description: 'Real-time approval ratings and political metrics',
    category: 'analytics',
    isRunning: false,
    isMinimized: false,
    isFocused: false,
    windowId: undefined,
  },
  {
    id: 'social-manager',
    name: 'Social Media Manager',
    icon: '📱',
    description: 'AI-generated political content and social media management',
    category: 'social',
    isRunning: false,
    isMinimized: false,
    isFocused: false,
    windowId: undefined,
  },
  {
    id: 'news-monitor',
    name: 'News Monitor',
    icon: '📰',
    description: 'Real-time news monitoring with political relevance analysis',
    category: 'monitoring',
    isRunning: false,
    isMinimized: false,
    isFocused: false,
    windowId: undefined,
  },
  {
    id: 'relationship-manager',
    name: 'Relationship Manager',
    icon: '🤝',
    description: 'Political network and relationship management',
    category: 'management',
    isRunning: false,
    isMinimized: false,
    isFocused: false,
    windowId: undefined,
  },
];

const defaultTheme: DesktopTheme = {
  name: 'Political Dark',
  colors: {
    primary: '#1e40af',
    secondary: '#1e3a8a',
    background: '#0f172a',
    taskbar: '#1e293b',
    text: '#f8fafc',
    accent: '#3b82f6',
  },
  wallpaper: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  taskbarPosition: 'bottom',
};

const initialState: DesktopState = {
  apps: politicalApps,
  windows: [],
  notifications: [],
  theme: defaultTheme,
  shortcuts: [],
  showLauncher: false,
  showNotifications: false,
  contextMenu: {
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
  },
};

type DesktopAction =
  | { type: 'LAUNCH_APP'; payload: string }
  | { type: 'CLOSE_APP'; payload: string }
  | { type: 'MINIMIZE_WINDOW'; payload: string }
  | { type: 'MAXIMIZE_WINDOW'; payload: string }
  | { type: 'FOCUS_WINDOW'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_LAUNCHER' }
  | { type: 'TOGGLE_NOTIFICATIONS' }
  | { type: 'SHOW_CONTEXT_MENU'; payload: { x: number; y: number; items: any[] } }
  | { type: 'HIDE_CONTEXT_MENU' }
  | { type: 'SWITCH_THEME'; payload: DesktopTheme }
  | { type: 'CYCLE_WINDOWS' };

function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case 'LAUNCH_APP': {
      const app = state.apps.find(a => a.id === action.payload);
      if (!app || app.isRunning) return state;

      const windowId = `window-${Date.now()}`;
      const newWindow: WindowState = {
        id: windowId,
        appId: action.payload,
        title: app.name,
        isMinimized: false,
        isFocused: true,
        isMaximized: false,
        position: { x: 100 + state.windows.length * 50, y: 100 + state.windows.length * 50 },
        size: { width: 800, height: 600 },
        zIndex: state.windows.length + 1,
      };

      return {
        ...state,
        apps: state.apps.map(a =>
          a.id === action.payload
            ? { ...a, isRunning: true, isFocused: true, windowId }
            : { ...a, isFocused: false }
        ),
        windows: [...state.windows.map(w => ({ ...w, isFocused: false })), newWindow],
        showLauncher: false,
      };
    }

    case 'CLOSE_APP': {
      return {
        ...state,
        apps: state.apps.map(a =>
          a.id === action.payload
            ? { ...a, isRunning: false, isFocused: false, isMinimized: false, windowId: undefined }
            : a
        ),
        windows: state.windows.filter(w => w.appId !== action.payload),
      };
    }

    case 'FOCUS_WINDOW': {
      const maxZ = Math.max(...state.windows.map(w => w.zIndex));
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, isFocused: true, zIndex: maxZ + 1, isMinimized: false }
            : { ...w, isFocused: false }
        ),
        apps: state.apps.map(a => {
          const window = state.windows.find(w => w.id === action.payload);
          return window && a.id === window.appId
            ? { ...a, isFocused: true, isMinimized: false }
            : { ...a, isFocused: false };
        }),
      };
    }

    case 'MINIMIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload ? { ...w, isMinimized: true, isFocused: false } : w
        ),
        apps: state.apps.map(a => {
          const window = state.windows.find(w => w.id === action.payload);
          return window && a.id === window.appId ? { ...a, isMinimized: true, isFocused: false } : a;
        }),
      };
    }

    case 'ADD_NOTIFICATION': {
      const notification: NotificationItem = {
        ...action.payload,
        id: `notification-${Date.now()}`,
        timestamp: new Date(),
        isRead: false,
      };
      return {
        ...state,
        notifications: [notification, ...state.notifications],
      };
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    }

    case 'TOGGLE_LAUNCHER': {
      return {
        ...state,
        showLauncher: !state.showLauncher,
        showNotifications: false,
      };
    }

    case 'TOGGLE_NOTIFICATIONS': {
      return {
        ...state,
        showNotifications: !state.showNotifications,
        showLauncher: false,
      };
    }

    case 'SHOW_CONTEXT_MENU': {
      return {
        ...state,
        contextMenu: {
          visible: true,
          position: { x: action.payload.x, y: action.payload.y },
          items: action.payload.items,
        },
      };
    }

    case 'HIDE_CONTEXT_MENU': {
      return {
        ...state,
        contextMenu: { ...state.contextMenu, visible: false },
      };
    }

    case 'CYCLE_WINDOWS': {
      const visibleWindows = state.windows.filter(w => !w.isMinimized);
      if (visibleWindows.length <= 1) return state;

      const currentIndex = visibleWindows.findIndex(w => w.isFocused);
      const nextIndex = (currentIndex + 1) % visibleWindows.length;
      const nextWindow = visibleWindows[nextIndex];

      if (!nextWindow) return state;

      const maxZ = Math.max(...state.windows.map(w => w.zIndex));

      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === nextWindow.id
            ? { ...w, isFocused: true, zIndex: maxZ + 1 }
            : { ...w, isFocused: false }
        ),
        apps: state.apps.map(a =>
          a.id === nextWindow.appId
            ? { ...a, isFocused: true }
            : { ...a, isFocused: false }
        ),
      };
    }

    default:
      return state;
  }
}

const DesktopContext = createContext<DesktopContextType | null>(null);

export function DesktopProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(desktopReducer, initialState);

  const actions = {
    launchApp: useCallback((appId: string) => {
      dispatch({ type: 'LAUNCH_APP', payload: appId });
    }, []),

    closeApp: useCallback((appId: string) => {
      dispatch({ type: 'CLOSE_APP', payload: appId });
    }, []),

    minimizeWindow: useCallback((windowId: string) => {
      dispatch({ type: 'MINIMIZE_WINDOW', payload: windowId });
    }, []),

    maximizeWindow: useCallback((windowId: string) => {
      dispatch({ type: 'MAXIMIZE_WINDOW', payload: windowId });
    }, []),

    focusWindow: useCallback((windowId: string) => {
      dispatch({ type: 'FOCUS_WINDOW', payload: windowId });
    }, []),

    addNotification: useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification as NotificationItem });
    }, []),

    dismissNotification: useCallback((notificationId: string) => {
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: notificationId });
    }, []),

    toggleLauncher: useCallback(() => {
      dispatch({ type: 'TOGGLE_LAUNCHER' });
    }, []),

    toggleNotifications: useCallback(() => {
      dispatch({ type: 'TOGGLE_NOTIFICATIONS' });
    }, []),

    showContextMenu: useCallback((x: number, y: number, items: any[]) => {
      dispatch({ type: 'SHOW_CONTEXT_MENU', payload: { x, y, items } });
    }, []),

    hideContextMenu: useCallback(() => {
      dispatch({ type: 'HIDE_CONTEXT_MENU' });
    }, []),

    switchTheme: useCallback((theme: DesktopTheme) => {
      dispatch({ type: 'SWITCH_THEME', payload: theme });
    }, []),

    cycleWindows: useCallback(() => {
      dispatch({ type: 'CYCLE_WINDOWS' });
    }, []),
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Tab for window cycling
      if (event.altKey && event.key === 'Tab') {
        event.preventDefault();
        actions.cycleWindows();
      }

      // Super/Windows key for launcher
      if (event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey) {
        if (event.key === 'Meta' || event.key === 'OS') {
          event.preventDefault();
          actions.toggleLauncher();
        }
      }

      // Escape to close launcher and notifications
      if (event.key === 'Escape') {
        if (state.showLauncher) {
          actions.toggleLauncher();
        }
        if (state.showNotifications) {
          actions.toggleNotifications();
        }
        if (state.contextMenu.visible) {
          actions.hideContextMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, state.showLauncher, state.showNotifications, state.contextMenu.visible]);

  // Click outside to close menus
  useEffect(() => {
    const handleClick = () => {
      if (state.contextMenu.visible) {
        actions.hideContextMenu();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [actions, state.contextMenu.visible]);

  return (
    <DesktopContext.Provider value={{ state, actions }}>
      {children}
    </DesktopContext.Provider>
  );
}

export function useDesktop() {
  const context = useContext(DesktopContext);
  if (!context) {
    throw new Error('useDesktop must be used within a DesktopProvider');
  }
  return context;
}