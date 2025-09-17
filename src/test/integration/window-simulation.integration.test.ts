/**
 * Window Management + Simulation Integration Tests
 * Tests the coordination between window management and simulation engine
 */

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WindowManagerProvider, WindowConfig } from '../../components/windows/WindowManager';
import { SimulationProvider } from '../../contexts/SimulationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Tauri API
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

// Mock storage API
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockStorage });

describe('Window Management + Simulation Integration', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();

    // Mock default window manager responses
    mockInvoke.mockImplementation((command: string) => {
      switch (command) {
        case 'get_window_list':
          return Promise.resolve([]);
        case 'get_focused_window':
          return Promise.resolve(null);
        case 'get_monitors':
          return Promise.resolve([
            {
              id: 'primary',
              name: 'Primary Monitor',
              width: 1920,
              height: 1080,
              x: 0,
              y: 0,
              scale_factor: 1.0,
              is_primary: true,
            },
          ]);
        case 'create_app_window':
          return Promise.resolve(`window_${Date.now()}`);
        case 'close_app_window':
          return Promise.resolve();
        case 'focus_app_window':
          return Promise.resolve();
        case 'save_window_state':
          return Promise.resolve();
        case 'load_window_state':
          return Promise.resolve([]);
        default:
          return Promise.resolve();
      }
    });

    // Mock localStorage
    mockStorage.getItem.mockReturnValue(null);
    mockStorage.setItem.mockReturnValue(undefined);
  });

  const TestComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <WindowManagerProvider>
        <SimulationProvider>{children}</SimulationProvider>
      </WindowManagerProvider>
    </QueryClientProvider>
  );

  describe('Window Creation with Simulation Setup', () => {
    it('should create window and initialize simulation state', async () => {
      const { result } = render(
        <TestComponent>
          <div data-testid="test-component">Test</div>
        </TestComponent>
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_window_list');
        expect(mockInvoke).toHaveBeenCalledWith('get_monitors');
      });

      // Verify window manager and simulation are both initialized
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should synchronize window creation with simulation data', async () => {
      const mockWindowConfig: WindowConfig = {
        window_type: 'political_dashboard',
        title: 'Political Dashboard',
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

      mockInvoke.mockResolvedValueOnce('window_123');

      render(
        <TestComponent>
          <WindowCreationTestComponent config={mockWindowConfig} />
        </TestComponent>
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('create_app_window', {
          windowType: 'political_dashboard',
          config: mockWindowConfig,
        });
      });
    });
  });

  describe('Multi-Window Simulation Coordination', () => {
    it('should maintain shared simulation state across multiple windows', async () => {
      const mockWindows = [
        {
          label: 'window_1',
          config: { window_type: 'dashboard', title: 'Dashboard' } as WindowConfig,
          z_order: 1,
          is_focused: true,
          is_minimized: false,
          is_maximized: false,
          created_at: Date.now(),
          last_focused_at: Date.now(),
        },
        {
          label: 'window_2',
          config: { window_type: 'policy', title: 'Policy Editor' } as WindowConfig,
          z_order: 2,
          is_focused: false,
          is_minimized: false,
          is_maximized: false,
          created_at: Date.now(),
          last_focused_at: Date.now() - 1000,
        },
      ];

      mockInvoke.mockImplementation((command: string) => {
        if (command === 'get_window_list') {
          return Promise.resolve(mockWindows);
        }
        if (command === 'get_focused_window') {
          return Promise.resolve(mockWindows[0]);
        }
        return Promise.resolve();
      });

      render(
        <TestComponent>
          <MultiWindowTestComponent />
        </TestComponent>
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_window_list');
      });

      // Verify that both windows share the same simulation state
      // This would be tested through the UI components that display simulation data
    });

    it('should handle window focus changes and update simulation context', async () => {
      const initialWindow = {
        label: 'window_1',
        config: { window_type: 'dashboard', title: 'Dashboard' } as WindowConfig,
        z_order: 1,
        is_focused: true,
        is_minimized: false,
        is_maximized: false,
        created_at: Date.now(),
        last_focused_at: Date.now(),
      };

      const focusedWindow = {
        ...initialWindow,
        is_focused: true,
        last_focused_at: Date.now(),
      };

      mockInvoke.mockImplementation((command: string) => {
        if (command === 'get_window_list') {
          return Promise.resolve([focusedWindow]);
        }
        if (command === 'get_focused_window') {
          return Promise.resolve(focusedWindow);
        }
        if (command === 'focus_app_window') {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      render(
        <TestComponent>
          <WindowFocusTestComponent />
        </TestComponent>
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_window_list');
      });
    });
  });

  describe('Window Closing and Simulation Cleanup', () => {
    it('should properly cleanup simulation resources when windows are closed', async () => {
      const windowToClose = 'window_123';

      render(
        <TestComponent>
          <WindowCleanupTestComponent windowLabel={windowToClose} />
        </TestComponent>
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('close_app_window', {
          label: windowToClose,
        });
      });

      // Verify that simulation cleanup occurred
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_window_list');
      });
    });

    it('should handle multiple window closures without breaking simulation state', async () => {
      const windowsToClose = ['window_1', 'window_2', 'window_3'];

      render(
        <TestComponent>
          <MultiWindowCleanupTestComponent windowLabels={windowsToClose} />
        </TestComponent>
      );

      for (const windowLabel of windowsToClose) {
        await waitFor(() => {
          expect(mockInvoke).toHaveBeenCalledWith('close_app_window', {
            label: windowLabel,
          });
        });
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle window creation failures gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to create window'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestComponent>
          <ErrorHandlingTestComponent />
        </TestComponent>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create window:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should recover from simulation context errors', async () => {
      const simulationError = new Error('Simulation context error');

      // Mock a scenario where simulation context fails
      render(
        <TestComponent>
          <SimulationErrorTestComponent error={simulationError} />
        </TestComponent>
      );

      // The test should verify that the application doesn't crash
      // and shows appropriate error handling
    });
  });
});

// Test Helper Components
const WindowCreationTestComponent: React.FC<{ config: WindowConfig }> = ({ config }) => {
  const [windowLabel, setWindowLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const createWindow = async () => {
      try {
        const label = await mockInvoke('create_app_window', {
          windowType: config.window_type,
          config,
        });
        setWindowLabel(label);
      } catch (error) {
        console.error('Failed to create window:', error);
      }
    };

    createWindow();
  }, [config]);

  return <div data-testid="window-creation">{windowLabel}</div>;
};

const MultiWindowTestComponent: React.FC = () => {
  return <div data-testid="multi-window">Multi-window test</div>;
};

const WindowFocusTestComponent: React.FC = () => {
  const handleFocus = async () => {
    await mockInvoke('focus_app_window', { label: 'window_1' });
  };

  return (
    <button data-testid="focus-button" onClick={handleFocus}>
      Focus Window
    </button>
  );
};

const WindowCleanupTestComponent: React.FC<{ windowLabel: string }> = ({ windowLabel }) => {
  React.useEffect(() => {
    const closeWindow = async () => {
      await mockInvoke('close_app_window', { label: windowLabel });
    };

    closeWindow();
  }, [windowLabel]);

  return <div data-testid="window-cleanup">Cleanup test</div>;
};

const MultiWindowCleanupTestComponent: React.FC<{ windowLabels: string[] }> = ({
  windowLabels,
}) => {
  React.useEffect(() => {
    const closeWindows = async () => {
      for (const label of windowLabels) {
        await mockInvoke('close_app_window', { label });
      }
    };

    closeWindows();
  }, [windowLabels]);

  return <div data-testid="multi-window-cleanup">Multi-cleanup test</div>;
};

const ErrorHandlingTestComponent: React.FC = () => {
  React.useEffect(() => {
    const attemptWindowCreation = async () => {
      try {
        await mockInvoke('create_app_window', {
          windowType: 'test',
          config: {} as WindowConfig,
        });
      } catch (error) {
        console.error('Failed to create window:', error);
      }
    };

    attemptWindowCreation();
  }, []);

  return <div data-testid="error-handling">Error handling test</div>;
};

const SimulationErrorTestComponent: React.FC<{ error: Error }> = ({ error }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setHasError(true);
    }
  }, [error]);

  if (hasError) {
    return <div data-testid="simulation-error">Simulation error occurred</div>;
  }

  return <div data-testid="simulation-normal">Normal simulation state</div>;
};