// Window Management System Exports
export { WindowManagerProvider, useWindowManager } from './WindowManager';
export type {
  WindowConfig,
  WindowState,
  MonitorInfo,
  SnapPosition,
} from './WindowManager';

export { default as WindowList } from './WindowList';
export { default as WindowCreator } from './WindowCreator';
export { default as WindowControls } from './WindowControls';

// Re-export for convenience
export * from './WindowManager';