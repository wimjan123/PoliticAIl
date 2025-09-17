# Window State Persistence

This document describes the window state persistence system implemented for PoliticAIl. The system allows windows to remember their position, size, and state across application restarts, supports multi-monitor configurations, and provides workspace management functionality.

## Features

### Core Persistence Features
- ✅ Window position and size storage across sessions
- ✅ Window state persistence (maximized, minimized, fullscreen)
- ✅ Multi-monitor layout preservation with validation
- ✅ Workspace save/restore functionality
- ✅ Cross-platform compatibility (Windows, macOS, Linux)
- ✅ Performance optimization with debounced saves
- ✅ Automatic validation and fallback for invalid positions

### Advanced Features
- ✅ Multi-window application support
- ✅ Window snapping and arrangement
- ✅ Keyboard shortcuts for window management
- ✅ Monitor-aware positioning
- ✅ Storage statistics and management
- ✅ Comprehensive testing suite

## Architecture

### File Structure
```
src/utils/windowPersistence.ts       # Core persistence utilities
src/utils/windowPersistenceTest.ts   # Testing and validation
src/components/WindowPersistenceDemo.tsx # Demo component
src/examples/windowPersistenceUsage.tsx # Usage examples
src-tauri/src/main.rs                # Tauri backend commands
src-tauri/tauri.conf.json            # Tauri configuration
```

### Core Components

#### WindowPersistenceStorage Class
The main class that handles all persistence operations:
- Window state save/load
- Workspace management
- Position validation
- Storage statistics
- Cross-platform compatibility

#### Types and Interfaces
```typescript
interface WindowState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  monitor: number;
  monitorName?: string;
}

interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  windows: Record<string, WindowState>;
  monitors: MonitorInfo[];
  createdAt: number;
  lastUsed: number;
}
```

## Usage

### Basic Window Persistence

```typescript
import { useWindowPersistence } from '../utils/windowPersistence';

const MyComponent = () => {
  const { windowState, updateWindowState, saveState, isLoading } = useWindowPersistence({
    windowLabel: 'main_window',
    autoSave: true,
    saveDelay: 500,
  });

  // Window state is automatically saved when changed
  // and restored on component mount

  return (
    <div>
      {windowState && (
        <p>Window at ({windowState.position.x}, {windowState.position.y})</p>
      )}
    </div>
  );
};
```

### Workspace Management

```typescript
import { createWorkspace, restoreWorkspace, loadAllWorkspaces } from '../utils/windowPersistence';

// Save current window layout as a workspace
const workspace = await createWorkspace('My Layout', 'Development setup');

// Restore a saved workspace
const success = await restoreWorkspace(workspace.id);

// List all saved workspaces
const workspaces = loadAllWorkspaces();
```

### Manual State Management

```typescript
import { saveWindowState, loadWindowState, validateWindowPosition } from '../utils/windowPersistence';

// Save a specific window state
saveWindowState('editor_window', {
  position: { x: 100, y: 100 },
  size: { width: 800, y: 600 },
  isMaximized: false,
  isMinimized: false,
  isFullscreen: false,
  monitor: 0,
});

// Load and validate window state
const savedState = loadWindowState('editor_window');
if (savedState) {
  const monitors = await getMonitorInfo();
  const validatedState = await validateWindowPosition(savedState, monitors);
  // Apply validated state to window
}
```

## Tauri Backend Commands

The following Tauri commands are available for window management:

### Window State Commands
- `get_monitor_info()` - Get information about all monitors
- `get_all_window_states()` - Get current state of all windows
- `set_window_state(label, state)` - Apply state to a specific window

### Window Management Commands
- `create_app_window(type, config)` - Create a new application window
- `focus_app_window(label)` - Focus a specific window
- `minimize_window(label)` - Minimize a window
- `maximize_window(label)` - Maximize a window
- `resize_app_window(label, width, height)` - Resize a window
- `move_window(label, x, y)` - Move a window

### Advanced Commands
- `cycle_windows(forward)` - Cycle through windows (Alt+Tab functionality)
- `snap_window(label, position)` - Snap window to screen position
- `save_window_state()` - Save all window states to file
- `load_window_state()` - Restore windows from saved state

## Multi-Monitor Support

The system automatically detects and handles multiple monitors:

```typescript
// Get monitor information
const monitors = await getMonitorInfo();

// Validate window position against current monitor setup
const validatedState = await validateWindowPosition(windowState, monitors);

// Position validation ensures windows remain on-screen even if
// monitor configuration changes between sessions
```

### Monitor Validation Features
- Automatically moves off-screen windows to valid positions
- Handles monitor disconnection gracefully
- Preserves relative positioning when possible
- Falls back to primary monitor when target monitor unavailable

## Storage

### LocalStorage
The system uses browser localStorage for persistence with the following features:
- JSON serialization for cross-platform compatibility
- Version checking for schema migrations
- Age validation to prevent stale data
- Storage size tracking and optimization

### Storage Keys
- `politicAIl_window_state` - Individual window states
- `politicAIl_workspaces` - Saved workspace layouts

### File System (Tauri)
For more persistent storage, window states can also be saved to the file system:
- JSON files in application data directory
- Automatic backup and restoration
- Cross-session state preservation

## Configuration

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  storageKey: 'politicAIl_window_state',
  workspaceStorageKey: 'politicAIl_workspaces',
  version: '1.0.0',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  validatePosition: true,
  fallbackPosition: { x: 100, y: 100 },
  fallbackSize: { width: 1200, height: 800 },
  debounceDelay: 500,
};
```

### Customization
```typescript
const customPersistence = new WindowPersistenceStorage({
  debounceDelay: 1000,    // Longer debounce for less frequent saves
  validatePosition: false, // Disable position validation
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days instead of 30
});
```

## Testing

### Automated Testing
Run the comprehensive test suite:

```typescript
import { runWindowPersistenceTests } from '../utils/windowPersistenceTest';

const results = await runWindowPersistenceTests();
// Results include: storage availability, persistence, validation, performance
```

### Test Coverage
- ✅ Storage availability and functionality
- ✅ Window state save/load operations
- ✅ Workspace management
- ✅ Multi-monitor support
- ✅ Position validation
- ✅ Performance optimization
- ✅ Cross-platform compatibility

### Manual Testing
Use the demo component to test functionality:

```typescript
import { WindowPersistenceDemo } from '../components/WindowPersistenceDemo';

// Renders a complete interface for testing all features
<WindowPersistenceDemo windowLabel="main_window" />
```

## Performance Considerations

### Debounced Saves
Window state changes are debounced to prevent excessive localStorage writes:
- Default 500ms delay
- Configurable per window
- Automatic cleanup of pending saves

### Storage Optimization
- JSON compression for large workspaces
- Selective property persistence
- Automatic cleanup of old data
- Storage size monitoring

### Memory Management
- Lazy loading of window states
- Event listener cleanup
- Timeout management for debounced operations

## Cross-Platform Compatibility

### Platform Differences
The system handles platform-specific differences:

**Windows:**
- Window decoration handling
- DPI scaling awareness
- Multi-monitor enumeration

**macOS:**
- Menu bar height consideration
- Dock positioning
- Mission Control integration

**Linux:**
- X11/Wayland compatibility
- Window manager differences
- Desktop environment variations

### Fallback Behavior
When platform-specific features are unavailable:
- Mock monitor information
- Default positioning
- Basic window state management

## Troubleshooting

### Common Issues

**Windows not restoring position:**
1. Check if localStorage is available
2. Verify monitor configuration hasn't changed significantly
3. Check browser security settings for localStorage

**Position validation failing:**
1. Ensure monitor information is available
2. Check fallback configuration
3. Verify position validation is enabled

**Performance issues:**
1. Increase debounce delay
2. Reduce auto-save frequency
3. Clear old workspace data

### Debug Information
```typescript
import { getStorageStats } from '../utils/windowPersistence';

const stats = getStorageStats();
console.log('Storage stats:', stats);

// Monitor storage usage and performance
```

## Future Enhancements

### Planned Features
- [ ] Cloud synchronization for workspace sharing
- [ ] Advanced window arrangement templates
- [ ] Keyboard shortcut customization
- [ ] Integration with system window managers
- [ ] Enhanced multi-display support
- [ ] Window grouping and tabbing

### API Extensions
- Window animation during restoration
- Custom validation rules per window type
- Workspace import/export functionality
- Real-time collaboration on window layouts

## Integration Guide

### Adding to Existing Application

1. **Install Dependencies**
   ```bash
   # Already included in package.json
   npm install @tauri-apps/api @tauri-apps/plugin-shell
   ```

2. **Import Utilities**
   ```typescript
   import { useWindowPersistence, createWorkspace } from '../utils/windowPersistence';
   ```

3. **Add to Main Component**
   ```typescript
   const App = () => {
     useWindowPersistence({ windowLabel: 'main_window' });
     return <YourApp />;
   };
   ```

4. **Configure Tauri**
   - Commands are already registered in `main.rs`
   - Configuration is set in `tauri.conf.json`

### Best Practices

1. **Use Descriptive Window Labels**
   ```typescript
   useWindowPersistence({ windowLabel: 'editor_main' });
   useWindowPersistence({ windowLabel: 'browser_devtools' });
   ```

2. **Handle Loading States**
   ```typescript
   const { isLoading, windowState } = useWindowPersistence({...});
   if (isLoading) return <LoadingSpinner />;
   ```

3. **Validate Before Applying**
   ```typescript
   if (windowState) {
     const monitors = await getMonitorInfo();
     const validatedState = await validateWindowPosition(windowState, monitors);
     // Apply validatedState
   }
   ```

4. **Cleanup Resources**
   ```typescript
   useEffect(() => {
     return () => {
       saveState(); // Save on unmount
     };
   }, [saveState]);
   ```

## Conclusion

The window persistence system provides comprehensive window state management for the PoliticAIl application. It handles the complexity of multi-monitor setups, provides robust error handling and validation, and offers both automatic and manual control over window positioning and sizing.

The system is designed to be unobtrusive when working correctly, but provide detailed debugging information when issues arise. It balances performance with functionality, ensuring that window management doesn't impact the overall application performance.

For questions or contributions to the window persistence system, refer to the source code documentation and test suite for implementation details.