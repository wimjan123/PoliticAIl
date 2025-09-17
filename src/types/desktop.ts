export interface PoliticalApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'analytics' | 'social' | 'monitoring' | 'management';
  isRunning: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  windowId?: string | undefined;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isFocused: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary';
  onClick: () => void;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  handler: () => void;
}

export interface DesktopTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    taskbar: string;
    text: string;
    accent: string;
  };
  wallpaper: string;
  taskbarPosition: 'bottom' | 'top' | 'left' | 'right';
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
  disabled?: boolean;
}

export interface DesktopState {
  apps: PoliticalApp[];
  windows: WindowState[];
  notifications: NotificationItem[];
  theme: DesktopTheme;
  shortcuts: KeyboardShortcut[];
  showLauncher: boolean;
  showNotifications: boolean;
  contextMenu: {
    visible: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
  };
}