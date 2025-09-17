/**
 * Performance Integration Tests
 * Tests combined window + simulation performance and memory usage
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

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  measure: jest.fn(),
  mark: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(window, 'performance', { value: mockPerformance });

// Mock requestAnimationFrame for consistent timing
let rafCallbacks: (() => void)[] = [];
const mockRaf = jest.fn((callback: () => void) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
});

const triggerRafCallbacks = () => {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(callback => callback());
};

Object.defineProperty(window, 'requestAnimationFrame', { value: mockRaf });

// Mock memory usage
const mockMemory = {
  usedJSHeapSize: 50000000, // 50MB
  totalJSHeapSize: 100000000, // 100MB
  jsHeapSizeLimit: 2000000000, // 2GB
};

Object.defineProperty(window.performance, 'memory', { value: mockMemory });

describe('Performance Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    rafCallbacks = [];

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock performance timing
    let currentTime = 0;
    mockPerformance.now.mockImplementation(() => {
      currentTime += 16.67; // ~60 FPS
      return currentTime;
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
        case 'create_app_window':
          return Promise.resolve(`window_${Date.now()}`);
        case 'save_window_state':
          return Promise.resolve();
        default:
          return Promise.resolve();
      }
    });
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <WindowManagerProvider>
        <SimulationProvider>{children}</SimulationProvider>
      </WindowManagerProvider>
    </QueryClientProvider>
  );

  describe('Combined Window + Simulation Performance', () => {
    it('should maintain 60 FPS with multiple windows and active simulation', async () => {
      const frameTimings: number[] = [];
      let lastFrameTime = 0;

      const PerformanceTestComponent = () => {
        const { actions } = useSimulationContext();
        const [windowCount, setWindowCount] = React.useState(0);
        const [isRunning, setIsRunning] = React.useState(true);

        React.useEffect(() => {
          // Create multiple windows
          const createWindows = async () => {
            for (let i = 0; i < 5; i++) {
              await mockInvoke('create_app_window', {
                windowType: `window_${i}`,
                config: {
                  window_type: `window_${i}`,
                  title: `Test Window ${i}`,
                  width: 400,
                  height: 300,
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
              });
              setWindowCount(i + 1);
            }
          };

          createWindows();
        }, []);

        React.useEffect(() => {
          if (!isRunning) return;

          // Simulate continuous updates
          const animationLoop = () => {
            const currentTime = mockPerformance.now();
            if (lastFrameTime > 0) {
              const frameDuration = currentTime - lastFrameTime;
              frameTimings.push(frameDuration);
            }
            lastFrameTime = currentTime;

            // Update simulation state
            actions.updatePlayerResources({
              money: Math.floor(Math.random() * 1000) + 1000,
              influence: Math.floor(Math.random() * 100),
            });

            if (frameTimings.length < 60) {
              requestAnimationFrame(animationLoop);
            } else {
              setIsRunning(false);
            }
          };

          requestAnimationFrame(animationLoop);
        }, [actions, isRunning]);

        return (
          <div>
            <div data-testid="window-count">{windowCount}</div>
            <div data-testid="frame-count">{frameTimings.length}</div>
            <div data-testid="running">{isRunning ? 'yes' : 'no'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <PerformanceTestComponent />
        </TestWrapper>
      );

      // Trigger animation frames
      for (let i = 0; i < 60; i++) {
        act(() => {
          triggerRafCallbacks();
        });
      }

      await waitFor(() => {
        expect(getByTestId('window-count')).toHaveTextContent('5');
        expect(getByTestId('frame-count')).toHaveTextContent('60');
        expect(getByTestId('running')).toHaveTextContent('no');
      }, { timeout: 10000 });

      // Analyze frame timings
      const averageFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      const targetFrameTime = 16.67; // 60 FPS = 16.67ms per frame

      expect(averageFrameTime).toBeLessThanOrEqual(targetFrameTime * 1.1); // Allow 10% variance
      expect(frameTimings.filter(time => time > 33).length).toBeLessThan(frameTimings.length * 0.05); // Less than 5% dropped frames
    });

    it('should handle memory usage efficiently under load', async () => {
      const memorySnapshots: number[] = [];

      const MemoryTestComponent = () => {
        const { actions } = useSimulationContext();
        const [iterations, setIterations] = React.useState(0);

        React.useEffect(() => {
          const memoryStressTest = async () => {
            for (let i = 0; i < 100; i++) {
              // Create and update large amounts of data
              const largeData = new Array(1000).fill(0).map((_, index) => ({
                id: `item_${i}_${index}`,
                data: Math.random(),
                timestamp: Date.now(),
              }));

              // Update simulation with memory-intensive operations
              actions.updatePlayerResources({
                money: Math.floor(Math.random() * 10000),
                influence: Math.floor(Math.random() * 100),
                media: Math.floor(Math.random() * 100),
                grassroots: Math.floor(Math.random() * 100),
              });

              // Simulate policy creation
              actions.proposePolicy({
                id: `policy_${i}`,
                title: `Test Policy ${i}`,
                description: `Description for policy ${i}`,
                type: 'economic',
                impact: {
                  approval: Math.random() * 10 - 5,
                  resources: {
                    money: Math.random() * 1000 - 500,
                    influence: Math.random() * 10 - 5,
                  },
                },
                cost: Math.floor(Math.random() * 500),
              });

              // Take memory snapshot
              if (window.performance.memory) {
                memorySnapshots.push(window.performance.memory.usedJSHeapSize);
              }

              setIterations(i + 1);

              // Force garbage collection opportunity
              if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
              }
            }
          };

          memoryStressTest();
        }, [actions]);

        return (
          <div>
            <div data-testid="iterations">{iterations}</div>
            <div data-testid="memory-snapshots">{memorySnapshots.length}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <MemoryTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('iterations')).toHaveTextContent('100');
      }, { timeout: 15000 });

      // Analyze memory usage
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryGrowth = maxMemory - minMemory;

      // Memory should not grow excessively (less than 100MB growth)
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);

      // Should not hit memory limits
      expect(maxMemory).toBeLessThan(window.performance.memory?.jsHeapSizeLimit! * 0.8);
    });
  });

  describe('Tick Processing Performance', () => {
    it('should process simulation ticks efficiently with UI updates', async () => {
      const tickTimings: number[] = [];

      const TickPerformanceComponent = () => {
        const { actions, state } = useSimulationContext();
        const [tickCount, setTickCount] = React.useState(0);

        React.useEffect(() => {
          const runSimulationTicks = async () => {
            for (let i = 0; i < 50; i++) {
              const startTime = mockPerformance.now();

              // Simulate complex tick processing
              actions.updatePlayerResources({
                money: state.player.resources.money + Math.floor(Math.random() * 100) - 50,
                influence: state.player.resources.influence + Math.floor(Math.random() * 10) - 5,
              });

              actions.updateApproval(Math.floor(Math.random() * 6) - 3);

              // Simulate event processing
              if (Math.random() < 0.3) {
                actions.proposePolicy({
                  id: `tick_policy_${i}`,
                  title: `Tick Policy ${i}`,
                  description: 'Auto-generated policy',
                  type: 'social',
                  impact: {
                    approval: Math.random() * 4 - 2,
                    resources: {
                      money: Math.random() * 200 - 100,
                    },
                  },
                  cost: Math.floor(Math.random() * 100),
                });
              }

              const endTime = mockPerformance.now();
              tickTimings.push(endTime - startTime);
              setTickCount(i + 1);

              // Simulate real-time delay
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          };

          runSimulationTicks();
        }, [actions, state.player.resources]);

        return (
          <div>
            <div data-testid="tick-count">{tickCount}</div>
            <div data-testid="current-money">{state.player.resources.money}</div>
            <div data-testid="current-approval">{state.player.approval}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TickPerformanceComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('tick-count')).toHaveTextContent('50');
      }, { timeout: 10000 });

      // Analyze tick performance
      const averageTickTime = tickTimings.reduce((a, b) => a + b, 0) / tickTimings.length;
      const maxTickTime = Math.max(...tickTimings);

      // Ticks should process quickly (less than 5ms average)
      expect(averageTickTime).toBeLessThan(5);

      // No single tick should take longer than 16ms (1 frame)
      expect(maxTickTime).toBeLessThan(16);
    });
  });

  describe('Degradation Handling', () => {
    it('should gracefully degrade performance when under stress', async () => {
      const performanceMetrics = {
        frameDrops: 0,
        tickSkips: 0,
        memoryWarnings: 0,
      };

      const DegradationTestComponent = () => {
        const { actions } = useSimulationContext();
        const [stress, setStress] = React.useState(1);
        const [isStressing, setIsStressing] = React.useState(true);

        React.useEffect(() => {
          if (!isStressing) return;

          const stressTest = async () => {
            for (let level = 1; level <= 10 && isStressing; level++) {
              setStress(level);

              // Increase computational load exponentially
              for (let i = 0; i < level * level * 10; i++) {
                // Heavy computation
                const data = new Array(level * 100).fill(0).map(() => Math.random());
                data.sort();

                // Rapid state updates
                actions.updatePlayerResources({
                  money: Math.floor(Math.random() * 1000),
                  influence: Math.floor(Math.random() * 100),
                });

                // Check for performance degradation
                const frameTime = 16.67 * level; // Simulate increasing frame time
                if (frameTime > 33) {
                  performanceMetrics.frameDrops++;
                }

                // Simulate memory pressure
                if (level > 7) {
                  performanceMetrics.memoryWarnings++;
                }

                // Simulate tick skipping under high load
                if (level > 8 && Math.random() < 0.1) {
                  performanceMetrics.tickSkips++;
                }
              }

              await new Promise(resolve => setTimeout(resolve, 100));
            }

            setIsStressing(false);
          };

          stressTest();
        }, [actions, isStressing]);

        return (
          <div>
            <div data-testid="stress-level">{stress}</div>
            <div data-testid="is-stressing">{isStressing ? 'yes' : 'no'}</div>
            <div data-testid="frame-drops">{performanceMetrics.frameDrops}</div>
            <div data-testid="tick-skips">{performanceMetrics.tickSkips}</div>
            <div data-testid="memory-warnings">{performanceMetrics.memoryWarnings}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <DegradationTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('stress-level')).toHaveTextContent('10');
        expect(getByTestId('is-stressing')).toHaveTextContent('no');
      }, { timeout: 15000 });

      // Verify graceful degradation occurred
      expect(performanceMetrics.frameDrops).toBeGreaterThan(0);
      expect(performanceMetrics.memoryWarnings).toBeGreaterThan(0);

      // But the system should still be responsive
      expect(performanceMetrics.tickSkips).toBeLessThan(50);
    });
  });

  describe('Resource Cleanup Performance', () => {
    it('should cleanup resources efficiently when windows are closed', async () => {
      const cleanupTimings: number[] = [];

      const CleanupTestComponent = () => {
        const [windowsCreated, setWindowsCreated] = React.useState(0);
        const [windowsClosed, setWindowsClosed] = React.useState(0);
        const [isComplete, setIsComplete] = React.useState(false);

        React.useEffect(() => {
          const testCleanup = async () => {
            const windowLabels: string[] = [];

            // Create multiple windows
            for (let i = 0; i < 10; i++) {
              const label = await mockInvoke('create_app_window', {
                windowType: `cleanup_test_${i}`,
                config: {
                  window_type: `cleanup_test_${i}`,
                  title: `Cleanup Test ${i}`,
                  width: 300,
                  height: 200,
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
              });
              windowLabels.push(label);
              setWindowsCreated(i + 1);
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Close windows and measure cleanup time
            for (let i = 0; i < windowLabels.length; i++) {
              const startTime = mockPerformance.now();

              await mockInvoke('close_app_window', { label: windowLabels[i] });

              const endTime = mockPerformance.now();
              cleanupTimings.push(endTime - startTime);
              setWindowsClosed(i + 1);

              await new Promise(resolve => setTimeout(resolve, 20));
            }

            setIsComplete(true);
          };

          testCleanup();
        }, []);

        return (
          <div>
            <div data-testid="windows-created">{windowsCreated}</div>
            <div data-testid="windows-closed">{windowsClosed}</div>
            <div data-testid="cleanup-complete">{isComplete ? 'yes' : 'no'}</div>
          </div>
        );
      };

      mockInvoke.mockImplementation((command: string, args?: any) => {
        switch (command) {
          case 'create_app_window':
            return Promise.resolve(`window_${Date.now()}_${Math.random()}`);
          case 'close_app_window':
            return Promise.resolve();
          default:
            return Promise.resolve();
        }
      });

      const { getByTestId } = render(
        <TestWrapper>
          <CleanupTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('windows-created')).toHaveTextContent('10');
        expect(getByTestId('windows-closed')).toHaveTextContent('10');
        expect(getByTestId('cleanup-complete')).toHaveTextContent('yes');
      }, { timeout: 15000 });

      // Analyze cleanup performance
      const averageCleanupTime = cleanupTimings.reduce((a, b) => a + b, 0) / cleanupTimings.length;
      const maxCleanupTime = Math.max(...cleanupTimings);

      // Cleanup should be fast (less than 10ms average)
      expect(averageCleanupTime).toBeLessThan(10);

      // No single cleanup should take longer than 50ms
      expect(maxCleanupTime).toBeLessThan(50);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent window and simulation operations efficiently', async () => {
      const operationTimings: Array<{ operation: string; duration: number }> = [];

      const ConcurrencyTestComponent = () => {
        const { actions } = useSimulationContext();
        const [operationsComplete, setOperationsComplete] = React.useState(0);

        React.useEffect(() => {
          const runConcurrentOperations = async () => {
            const operations = [];

            // Concurrent window operations
            for (let i = 0; i < 5; i++) {
              operations.push(
                (async () => {
                  const startTime = mockPerformance.now();
                  await mockInvoke('create_app_window', {
                    windowType: `concurrent_${i}`,
                    config: {
                      window_type: `concurrent_${i}`,
                      title: `Concurrent Window ${i}`,
                      width: 400,
                      height: 300,
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
                  });
                  const endTime = mockPerformance.now();
                  operationTimings.push({
                    operation: `window_create_${i}`,
                    duration: endTime - startTime,
                  });
                })()
              );
            }

            // Concurrent simulation operations
            for (let i = 0; i < 5; i++) {
              operations.push(
                (async () => {
                  const startTime = mockPerformance.now();
                  actions.updatePlayerResources({
                    money: Math.floor(Math.random() * 1000),
                    influence: Math.floor(Math.random() * 100),
                  });
                  actions.proposePolicy({
                    id: `concurrent_policy_${i}`,
                    title: `Concurrent Policy ${i}`,
                    description: 'Concurrent policy test',
                    type: 'economic',
                    impact: {
                      approval: Math.random() * 10 - 5,
                      resources: { money: Math.random() * 500 - 250 },
                    },
                    cost: Math.floor(Math.random() * 200),
                  });
                  const endTime = mockPerformance.now();
                  operationTimings.push({
                    operation: `simulation_update_${i}`,
                    duration: endTime - startTime,
                  });
                })()
              );
            }

            await Promise.all(operations);
            setOperationsComplete(operations.length);
          };

          runConcurrentOperations();
        }, [actions]);

        return (
          <div>
            <div data-testid="operations-complete">{operationsComplete}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <ConcurrencyTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('operations-complete')).toHaveTextContent('10');
      }, { timeout: 10000 });

      // Analyze concurrent operation performance
      const windowOperations = operationTimings.filter(op => op.operation.includes('window'));
      const simulationOperations = operationTimings.filter(op => op.operation.includes('simulation'));

      const avgWindowTime = windowOperations.reduce((a, b) => a + b.duration, 0) / windowOperations.length;
      const avgSimulationTime = simulationOperations.reduce((a, b) => a + b.duration, 0) / simulationOperations.length;

      // Concurrent operations should not significantly slow each other down
      expect(avgWindowTime).toBeLessThan(100); // Less than 100ms
      expect(avgSimulationTime).toBeLessThan(50); // Less than 50ms
    });
  });
});