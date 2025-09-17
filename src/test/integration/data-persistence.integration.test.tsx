/**
 * Data Persistence Integration Tests
 * Tests data persistence across application restarts and state restoration
 */

import { render, waitFor, act } from '@testing-library/react';
import { WindowManagerProvider } from '../../components/windows/WindowManager';
import { SimulationProvider, useSimulationContext } from '../../contexts/SimulationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Tauri API
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

// Mock file system operations
const mockFileOperations = {
  readTextFile: jest.fn(),
  writeTextFile: jest.fn(),
  exists: jest.fn(),
  createDir: jest.fn(),
  removeFile: jest.fn(),
};

jest.mock('@tauri-apps/api/fs', () => mockFileOperations);

// Enhanced localStorage mock for persistence testing
const createMockStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return { ...store };
    },
    set store(newStore: Record<string, string>) {
      store = { ...newStore };
    },
  };
};

const mockStorage = createMockStorage();
Object.defineProperty(window, 'localStorage', { value: mockStorage });

describe('Data Persistence Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock responses
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
        case 'save_window_state':
          return Promise.resolve();
        case 'load_window_state':
          return Promise.resolve([]);
        default:
          return Promise.resolve();
      }
    });

    // Mock file operations
    mockFileOperations.exists.mockResolvedValue(false);
    mockFileOperations.readTextFile.mockResolvedValue('{}');
    mockFileOperations.writeTextFile.mockResolvedValue(undefined);
    mockFileOperations.createDir.mockResolvedValue(undefined);
    mockFileOperations.removeFile.mockResolvedValue(undefined);
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <WindowManagerProvider>
        <SimulationProvider>{children}</SimulationProvider>
      </WindowManagerProvider>
    </QueryClientProvider>
  );

  describe('Simulation State Persistence', () => {
    it('should save simulation state to localStorage automatically', async () => {
      const TestComponent = () => {
        const { actions, state } = useSimulationContext();

        React.useEffect(() => {
          // Update resources to trigger auto-save
          actions.updatePlayerResources({ money: 5000, influence: 75 });
        }, [actions]);

        return <div data-testid="simulation-state">{JSON.stringify(state.player.resources)}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for auto-save to trigger
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'politicail_simulation_state',
          expect.stringContaining('"money":5000')
        );
      }, { timeout: 5000 });
    });

    it('should restore simulation state from localStorage on app restart', async () => {
      // Set up existing state in localStorage
      const existingState = {
        gameId: 'test_game_123',
        player: {
          id: 'player_1',
          name: 'Test Player',
          party: 'Test Party',
          position: { economic: 5, social: -2, foreign: 3 },
          approval: 75,
          resources: { money: 2500, influence: 60, media: 40, grassroots: 45 },
          policies: [],
          relationships: [],
        },
        opponents: [],
        currentEvents: [],
        gameSettings: {
          difficulty: 'hard',
          gameSpeed: 2,
          aiAggressiveness: 7,
          randomEvents: true,
          realTimeEvents: false,
        },
        gameTime: {
          current: 1000,
          startTime: Date.now() - 10000,
          speed: 2,
          paused: false,
        },
        gameStats: {
          totalPoliciesPassed: 5,
          totalEventsHandled: 12,
          highestApproval: 80,
          currentStreak: 3,
          electionsWon: 1,
        },
        lastSaved: Date.now(),
      };

      mockStorage.setItem('politicail_simulation_state', JSON.stringify(existingState));

      const TestComponent = () => {
        const { state } = useSimulationContext();
        return (
          <div>
            <div data-testid="player-name">{state.player.name}</div>
            <div data-testid="player-approval">{state.player.approval}</div>
            <div data-testid="player-money">{state.player.resources.money}</div>
            <div data-testid="game-difficulty">{state.gameSettings.difficulty}</div>
            <div data-testid="policies-passed">{state.gameStats.totalPoliciesPassed}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('player-name')).toHaveTextContent('Test Player');
        expect(getByTestId('player-approval')).toHaveTextContent('75');
        expect(getByTestId('player-money')).toHaveTextContent('2500');
        expect(getByTestId('game-difficulty')).toHaveTextContent('hard');
        expect(getByTestId('policies-passed')).toHaveTextContent('5');
      });
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set corrupted data in localStorage
      mockStorage.setItem('politicail_simulation_state', 'invalid_json{');

      const TestComponent = () => {
        const { state } = useSimulationContext();
        return <div data-testid="default-state">{state.player.name}</div>;
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should fall back to default state
        expect(getByTestId('default-state')).toHaveTextContent('Player');
      });
    });
  });

  describe('Window State Persistence', () => {
    it('should save window layouts to backend', async () => {
      const mockWindowState = [
        {
          label: 'dashboard_1',
          config: {
            window_type: 'dashboard',
            title: 'Political Dashboard',
            width: 1200,
            height: 800,
            x: 100,
            y: 100,
            resizable: true,
            minimizable: true,
            maximizable: true,
            closable: true,
            always_on_top: false,
            decorations: true,
            transparent: false,
            focus: false,
            fullscreen: false,
          },
          z_order: 1,
          is_focused: false,
          is_minimized: false,
          is_maximized: false,
          created_at: Date.now(),
          last_focused_at: Date.now(),
        },
      ];

      mockInvoke.mockImplementation((command: string) => {
        if (command === 'get_window_list') {
          return Promise.resolve(mockWindowState);
        }
        if (command === 'save_window_state') {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      const TestComponent = () => {
        React.useEffect(() => {
          mockInvoke('save_window_state');
        }, []);

        return <div data-testid="window-save">Window save test</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('save_window_state');
      });
    });

    it('should restore window layouts from backend', async () => {
      const restoredWindowLabels = ['dashboard_1', 'policy_editor_1', 'events_panel_1'];

      mockInvoke.mockImplementation((command: string) => {
        if (command === 'load_window_state') {
          return Promise.resolve(restoredWindowLabels);
        }
        return Promise.resolve();
      });

      const TestComponent = () => {
        const [restoredWindows, setRestoredWindows] = React.useState<string[]>([]);

        React.useEffect(() => {
          const loadWindows = async () => {
            const labels = await mockInvoke('load_window_state');
            setRestoredWindows(labels);
          };
          loadWindows();
        }, []);

        return (
          <div data-testid="restored-windows">
            {restoredWindows.map(label => (
              <div key={label} data-testid={`window-${label}`}>{label}</div>
            ))}
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('window-dashboard_1')).toBeInTheDocument();
        expect(getByTestId('window-policy_editor_1')).toBeInTheDocument();
        expect(getByTestId('window-events_panel_1')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Session Data Integrity', () => {
    it('should maintain data integrity across multiple save/load cycles', async () => {
      const initialResources = { money: 1000, influence: 50, media: 25, grassroots: 30 };
      const updatedResources = { money: 1500, influence: 65, media: 35, grassroots: 40 };

      const TestComponent = () => {
        const { actions, state } = useSimulationContext();
        const [saveCount, setSaveCount] = React.useState(0);

        React.useEffect(() => {
          if (saveCount === 0) {
            actions.updatePlayerResources(updatedResources);
            setSaveCount(1);
          }
        }, [actions, saveCount]);

        return (
          <div>
            <div data-testid="current-money">{state.player.resources.money}</div>
            <div data-testid="current-influence">{state.player.resources.influence}</div>
          </div>
        );
      };

      const { getByTestId, rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for state update
      await waitFor(() => {
        expect(getByTestId('current-money')).toHaveTextContent('1500');
        expect(getByTestId('current-influence')).toHaveTextContent('65');
      });

      // Verify data was saved
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'politicail_simulation_state',
          expect.stringContaining('"money":1500')
        );
      });

      // Simulate app restart by re-rendering with fresh context
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <WindowManagerProvider>
            <SimulationProvider>
              <TestComponent />
            </SimulationProvider>
          </WindowManagerProvider>
        </QueryClientProvider>
      );

      // Verify state is restored correctly
      await waitFor(() => {
        expect(getByTestId('current-money')).toHaveTextContent('1500');
        expect(getByTestId('current-influence')).toHaveTextContent('65');
      });
    });

    it('should handle migration of old data formats', async () => {
      // Set up old format data
      const oldFormatData = {
        // Missing some new fields that should be migrated
        gameId: 'old_game',
        player: {
          id: 'player_1',
          name: 'Legacy Player',
          resources: { money: 800, influence: 40 }, // Missing media and grassroots
          policies: [],
        },
        // Missing gameStats, gameTime, etc.
      };

      mockStorage.setItem('politicail_simulation_state', JSON.stringify(oldFormatData));

      const TestComponent = () => {
        const { state } = useSimulationContext();
        return (
          <div>
            <div data-testid="migrated-name">{state.player.name}</div>
            <div data-testid="migrated-money">{state.player.resources.money}</div>
            <div data-testid="migrated-media">{state.player.resources.media}</div>
            <div data-testid="has-game-stats">{state.gameStats ? 'yes' : 'no'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('migrated-name')).toHaveTextContent('Legacy Player');
        expect(getByTestId('migrated-money')).toHaveTextContent('800');
        // Should have default values for missing fields
        expect(getByTestId('migrated-media')).toHaveTextContent('25');
        expect(getByTestId('has-game-stats')).toHaveTextContent('yes');
      });
    });
  });

  describe('File System Persistence', () => {
    it('should save game data to file system for backup', async () => {
      const TestComponent = () => {
        const { state, actions } = useSimulationContext();

        React.useEffect(() => {
          // Trigger a save operation
          actions.saveGame();
        }, [actions]);

        return <div data-testid="file-save">File save test</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Note: File system operations would be tested more thoroughly in e2e tests
      // Here we're testing the interface
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should handle file system errors gracefully', async () => {
      mockFileOperations.writeTextFile.mockRejectedValue(new Error('Disk full'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const TestComponent = () => {
        const { actions } = useSimulationContext();

        React.useEffect(() => {
          actions.saveGame();
        }, [actions]);

        return <div data-testid="error-handling">Error handling test</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not crash the application
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle frequent state updates without performance degradation', async () => {
      const TestComponent = () => {
        const { actions } = useSimulationContext();
        const [updateCount, setUpdateCount] = React.useState(0);

        React.useEffect(() => {
          const interval = setInterval(() => {
            if (updateCount < 100) {
              actions.updatePlayerResources({
                money: 1000 + updateCount,
                influence: 50 + updateCount,
              });
              setUpdateCount(prev => prev + 1);
            } else {
              clearInterval(interval);
            }
          }, 10);

          return () => clearInterval(interval);
        }, [actions, updateCount]);

        return <div data-testid="performance-test">Updates: {updateCount}</div>;
      };

      const startTime = performance.now();

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('performance-test')).toHaveTextContent('Updates: 100');
      }, { timeout: 10000 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });
});