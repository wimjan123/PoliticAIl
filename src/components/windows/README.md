# Window Management System

## Overview

This is a comprehensive window management system for the desktop OS metaphor, implemented using Tauri (Rust backend) and React (TypeScript frontend). The system provides advanced window creation, management, and state persistence capabilities.

## Features

### Core Window Management
- **Advanced Window Creation**: Create windows with extensive configuration options
- **Window Registry**: Track all window states with Z-ordering and focus management
- **Focus Management**: Predictable window focus behavior with automatic Z-ordering updates
- **Multi-Window Support**: Handle 4+ simultaneous windows efficiently

### Window Operations
- **Basic Operations**: Create, close, focus, minimize, maximize, resize, move
- **Window Snapping**: Snap windows to predefined positions (left, right, corners, center, maximize)
- **Window Cycling**: Navigate between windows using keyboard shortcuts (Alt+Tab)
- **State Persistence**: Save and restore window states across application sessions

### Multi-Monitor Support
- **Monitor Detection**: Cross-platform monitor enumeration (Windows, macOS, Linux)
- **Monitor-Aware Positioning**: Position windows on specific monitors
- **Scalable Architecture**: Extensible for additional monitor features

## Architecture

### Backend (Rust/Tauri)

#### Core Structures
```rust
pub struct WindowConfig {
    pub window_type: String,
    pub title: String,
    pub width: f64,
    pub height: f64,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub resizable: bool,
    pub minimizable: bool,
    pub maximizable: bool,
    pub closable: bool,
    pub always_on_top: bool,
    pub decorations: bool,
    pub transparent: bool,
    pub focus: bool,
    pub fullscreen: bool,
    pub url: Option<String>,
}

pub struct WindowState {
    pub label: String,
    pub config: WindowConfig,
    pub z_order: u32,
    pub is_focused: bool,
    pub is_minimized: bool,
    pub is_maximized: bool,
    pub monitor_id: Option<String>,
    pub created_at: u64,
    pub last_focused_at: u64,
}

pub struct WindowRegistry {
    windows: HashMap<String, WindowState>,
    z_order_counter: u32,
    focused_window: Option<String>,
}
```

#### Key Commands
- `create_app_window`: Advanced window creation with full configuration
- `focus_app_window`: Focus management with Z-ordering updates
- `cycle_windows`: Window cycling for keyboard navigation
- `snap_window`: Window snapping to predefined positions
- `save_window_state` / `load_window_state`: State persistence
- `get_window_list`: Retrieve windows sorted by Z-order
- `get_monitors`: Multi-monitor support

### Frontend (React/TypeScript)

#### Components
1. **WindowManager**: Context provider with window management APIs
2. **WindowList**: Display and control active windows
3. **WindowCreator**: Create new windows with configuration options
4. **WindowControls**: Navigation, shortcuts, and persistence controls
5. **WindowDemo**: Demonstration and testing interface

#### Key Features
- **React Context**: Centralized window state management
- **TypeScript Types**: Full type safety for all window operations
- **Real-time Updates**: Automatic window list refresh
- **Keyboard Shortcuts**: Alt+Tab cycling, Ctrl+Shift+S/O for save/load
- **Visual Feedback**: Status indicators and real-time state display

## Usage

### Basic Setup
```tsx
import { WindowManagerProvider } from './components/windows';

function App() {
  return (
    <WindowManagerProvider>
      {/* Your app content */}
    </WindowManagerProvider>
  );
}
```

### Creating Windows
```tsx
import { useWindowManager } from './components/windows';

function MyComponent() {
  const { createWindow } = useWindowManager();

  const handleCreateWindow = async () => {
    const config = {
      window_type: 'app',
      title: 'My Window',
      width: 800,
      height: 600,
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      always_on_top: false,
      decorations: true,
      transparent: false,
      focus: true,
      fullscreen: false,
    };

    const label = await createWindow('app', config);
    console.log('Created window:', label);
  };

  return <button onClick={handleCreateWindow}>Create Window</button>;
}
```

### Window Management
```tsx
function WindowManager() {
  const {
    windows,
    focusedWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    snapWindow,
    cycleWindows,
  } = useWindowManager();

  return (
    <div>
      <h3>Windows ({windows.length})</h3>
      {windows.map(window => (
        <div key={window.label}>
          <h4>{window.config.title}</h4>
          <button onClick={() => focusWindow(window.label)}>
            Focus
          </button>
          <button onClick={() => minimizeWindow(window.label)}>
            Minimize
          </button>
          <button onClick={() => snapWindow(window.label, 'Left')}>
            Snap Left
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Testing

### Manual Testing
Use the `WindowDemo` component to test all functionality:
```tsx
import WindowDemo from './components/windows/WindowDemo';

// Renders a complete test interface
<WindowDemo />
```

### Automated Testing
Use the `WindowManagementTest` component for systematic testing:
```tsx
import WindowManagementTest from './components/windows/WindowManagementTest';

// Provides automated test suite
<WindowManagementTest />
```

### Test Scenarios
1. **Create 4+ Windows**: Verify simultaneous window creation and management
2. **Focus Management**: Test predictable focus behavior and Z-ordering
3. **Window Manipulation**: Test minimize, maximize, snap operations
4. **State Persistence**: Verify save/load functionality across sessions
5. **Keyboard Navigation**: Test Alt+Tab cycling and shortcuts

## Acceptance Criteria Verification

- ✅ **Can create and manage 4+ windows simultaneously**: Implemented with window registry and state tracking
- ✅ **Window focus management behaves predictably**: Z-ordering system with automatic focus updates
- ✅ **Window state persistence works across application restarts**: JSON-based save/load with full state restoration
- ✅ **Multi-monitor support functional**: Cross-platform monitor detection with extensible architecture

## File Structure

```
src/components/windows/
├── WindowManager.tsx      # Core context and state management
├── WindowList.tsx         # Window list display and controls
├── WindowCreator.tsx      # Window creation interface
├── WindowControls.tsx     # Navigation and persistence controls
├── WindowDemo.tsx         # Demo and testing interface
├── WindowManagementTest.tsx # Automated test suite
├── WindowManager.css      # Comprehensive styling
├── index.ts              # Exports and re-exports
└── README.md             # This documentation
```

## Keyboard Shortcuts

- **Alt + Tab**: Cycle to next window
- **Shift + Alt + Tab**: Cycle to previous window
- **Ctrl + Shift + S**: Save window state
- **Ctrl + Shift + O**: Load window state
- **F5**: Refresh window list

## Cross-Platform Compatibility

The system is designed for cross-platform compatibility:

- **Windows**: Uses Windows API for monitor detection and window management
- **macOS**: Uses macOS APIs for native window management
- **Linux**: Uses X11/Wayland for window management
- **Fallback**: Provides mock implementations for unsupported platforms

## Performance Considerations

- **Efficient State Management**: Centralized registry with minimal re-renders
- **Lazy Loading**: Components load only when needed
- **Debounced Updates**: Automatic refresh with configurable intervals
- **Memory Management**: Proper cleanup of window event listeners

## Future Enhancements

1. **Advanced Snapping**: Grid-based snapping, custom snap zones
2. **Window Groups**: Tabbed windows, window grouping
3. **Advanced Persistence**: Window workspace management
4. **Accessibility**: Screen reader support, high contrast themes
5. **Performance**: Virtual scrolling for large window lists
6. **Animations**: Smooth window transitions and effects

## Dependencies

### Backend
- `tauri`: Cross-platform application framework
- `serde`: Serialization/deserialization
- `serde_json`: JSON support

### Frontend
- `react`: UI framework
- `@tauri-apps/api`: Tauri frontend integration
- `typescript`: Type safety

## Contributing

When contributing to the window management system:

1. **Maintain Type Safety**: All new features must include proper TypeScript types
2. **Update Tests**: Add test cases for new functionality
3. **Cross-Platform**: Consider all supported platforms
4. **Documentation**: Update README and inline documentation
5. **Performance**: Ensure efficient state management and minimal re-renders

## License

This window management system is part of the PoliticAIl project and follows the project's licensing terms.