/**
 * Window Persistence Test and Validation Utilities
 * Tests window state persistence functionality
 */

import {
  WindowState,
  MonitorInfo,
  windowPersistence,
  createWorkspace,
  restoreWorkspace,
  getMonitorInfo,
  validateWindowPosition,
  getStorageStats,
  clearAllWindowData,
} from './windowPersistence';

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class WindowPersistenceValidator {
  private results: TestResult[] = [];

  /**
   * Run all window persistence tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    // Clear any existing test data
    clearAllWindowData();

    await this.testStorageAvailability();
    await this.testWindowStatePersistence();
    await this.testWorkspaceManagement();
    await this.testMultiMonitorSupport();
    await this.testPositionValidation();
    await this.testPerformanceOptimization();
    await this.testCrossPlatformCompatibility();

    return this.results;
  }

  /**
   * Test localStorage availability and basic functionality
   */
  private async testStorageAvailability(): Promise<void> {
    try {
      const stats = getStorageStats();
      this.addResult('Storage Availability', true, { stats });
    } catch (error) {
      this.addResult('Storage Availability', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Test window state save/load functionality
   */
  private async testWindowStatePersistence(): Promise<void> {
    try {
      const testLabel = 'test_window_001';
      const testState: WindowState = {
        position: { x: 100, y: 200 },
        size: { width: 800, height: 600 },
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        monitor: 0,
        monitorName: 'Primary Monitor',
      };

      // Save state
      windowPersistence.saveWindowState(testLabel, testState);

      // Load state
      const loadedState = windowPersistence.loadWindowState(testLabel);

      const passed = loadedState !== null &&
        loadedState.position.x === testState.position.x &&
        loadedState.position.y === testState.position.y &&
        loadedState.size.width === testState.size.width &&
        loadedState.size.height === testState.size.height;

      this.addResult('Window State Persistence', passed, { testState, loadedState });

      // Test debounced save
      let debounceSaveCompleted = false;
      windowPersistence.debouncedSaveWindowState(testLabel, {
        ...testState,
        position: { x: 150, y: 250 },
      });

      // Wait for debounce
      setTimeout(() => {
        const debouncedState = windowPersistence.loadWindowState(testLabel);
        debounceSaveCompleted = debouncedState?.position.x === 150;
      }, 600);

      setTimeout(() => {
        this.addResult('Debounced Save', debounceSaveCompleted, {
          expectedX: 150,
          actualX: windowPersistence.loadWindowState(testLabel)?.position.x || 0
        });
      }, 700);

    } catch (error) {
      this.addResult('Window State Persistence', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Test workspace save/restore functionality
   */
  private async testWorkspaceManagement(): Promise<void> {
    try {
      // Mock getCurrentWindowStates for testing
      const originalGetCurrentWindowStates = (window as any).getCurrentWindowStates;
      (window as any).getCurrentWindowStates = () => Promise.resolve({
        'main_window': {
          position: { x: 100, y: 100 },
          size: { width: 1200, height: 800 },
          isMaximized: false,
          isMinimized: false,
          isFullscreen: false,
          monitor: 0,
          monitorName: 'Primary Monitor',
        },
      });

      // Create workspace
      const workspace = await createWorkspace('Test Workspace', 'Test workspace description');

      const passed = Boolean(workspace.id && workspace.name === 'Test Workspace');
      this.addResult('Workspace Creation', passed, { workspace });

      // Test workspace loading
      const loadedWorkspace = windowPersistence.loadWorkspace(workspace.id);
      const loadPassed = loadedWorkspace !== null && loadedWorkspace !== undefined && loadedWorkspace.name === workspace.name;
      this.addResult('Workspace Loading', loadPassed, { loadedWorkspace });

      // Test workspace listing
      const allWorkspaces = windowPersistence.loadAllWorkspaces();
      const listPassed = allWorkspaces.length >= 1 && allWorkspaces.some(w => w.id === workspace.id);
      this.addResult('Workspace Listing', listPassed, { allWorkspaces });

      // Clean up mock
      (window as any).getCurrentWindowStates = originalGetCurrentWindowStates;

    } catch (error) {
      this.addResult('Workspace Management', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Test multi-monitor support
   */
  private async testMultiMonitorSupport(): Promise<void> {
    try {
      const monitors = await getMonitorInfo();
      const passed = Array.isArray(monitors) && monitors.length > 0;

      // Test monitor structure
      const firstMonitor = monitors[0];
      const validStructure = Boolean(firstMonitor &&
        typeof firstMonitor.index === 'number' &&
        typeof firstMonitor.name === 'string' &&
        typeof firstMonitor.size === 'object' &&
        typeof firstMonitor.position === 'object');

      this.addResult('Multi-Monitor Support', passed && validStructure, {
        monitorsCount: monitors.length,
        firstMonitor
      });

    } catch (error) {
      this.addResult('Multi-Monitor Support', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Test position validation
   */
  private async testPositionValidation(): Promise<void> {
    try {
      const mockMonitors: MonitorInfo[] = [
        {
          index: 0,
          name: 'Primary',
          size: { width: 1920, height: 1080 },
          position: { x: 0, y: 0 },
          scaleFactor: 1,
          isPrimary: true,
        },
      ];

      // Test valid position (should remain unchanged)
      const validState: WindowState = {
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        monitor: 0,
      };

      const validatedState = await validateWindowPosition(validState, mockMonitors);
      const validPassed = validatedState.position.x === 100 && validatedState.position.y === 100;

      // Test invalid position (should be corrected)
      const invalidState: WindowState = {
        position: { x: -1000, y: -1000 },
        size: { width: 800, height: 600 },
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        monitor: 0,
      };

      const correctedState = await validateWindowPosition(invalidState, mockMonitors);
      const correctedPassed = correctedState.position.x >= 0 && correctedState.position.y >= 0;

      this.addResult('Position Validation', validPassed && correctedPassed, {
        validState: { original: validState, validated: validatedState },
        invalidState: { original: invalidState, corrected: correctedState }
      });

    } catch (error) {
      this.addResult('Position Validation', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Test performance optimization
   */
  private async testPerformanceOptimization(): Promise<void> {
    try {
      const testLabel = 'perf_test_window';
      const startTime = performance.now();

      // Rapid saves should be debounced
      for (let i = 0; i < 100; i++) {
        windowPersistence.debouncedSaveWindowState(testLabel, {
          position: { x: i, y: i },
          size: { width: 800, height: 600 },
          isMaximized: false,
          isMinimized: false,
          isFullscreen: false,
          monitor: 0,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly due to debouncing
      const passed = duration < 100; // Should take less than 100ms

      this.addResult('Performance Optimization', passed, {
        duration: `${duration.toFixed(2)}ms`,
        operationsCount: 100
      });

    } catch (error) {
      this.addResult('Performance Optimization', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Test cross-platform compatibility
   */
  private async testCrossPlatformCompatibility(): Promise<void> {
    try {
      // Test storage format compatibility
      const testState: WindowState = {
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        monitor: 0,
      };

      // Save and immediately load to test serialization
      windowPersistence.saveWindowState('compatibility_test', testState);
      const loadedState = windowPersistence.loadWindowState('compatibility_test');

      // Test that all properties are preserved
      const passed = loadedState !== null &&
        JSON.stringify(testState) === JSON.stringify(loadedState);

      this.addResult('Cross-Platform Compatibility', passed, {
        originalState: testState,
        loadedState: loadedState,
        serializedMatch: JSON.stringify(testState) === JSON.stringify(loadedState)
      });

    } catch (error) {
      this.addResult('Cross-Platform Compatibility', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Add test result
   */
  private addResult(testName: string, passed: boolean, details?: any): void {
    const result: TestResult = {
      testName,
      passed,
    };

    if (!passed && details) {
      result.error = typeof details === 'string' ? details : JSON.stringify(details);
    } else if (passed && details) {
      result.details = details;
    }

    this.results.push(result);
  }

  /**
   * Get test summary
   */
  getTestSummary(): { total: number; passed: number; failed: number; passRate: string } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%';

    return { total, passed, failed, passRate };
  }

  /**
   * Print test results to console
   */
  printResults(): void {
    const summary = this.getTestSummary();

    console.group('🖼️ Window Persistence Test Results');
    console.log(`📊 Summary: ${summary.passed}/${summary.total} tests passed (${summary.passRate})`);
    console.log('');

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.group(`${icon} ${result.testName}`);

      if (result.passed && result.details) {
        console.log('Details:', result.details);
      } else if (!result.passed && result.error) {
        console.error('Error:', result.error);
      }

      console.groupEnd();
    });

    console.groupEnd();
  }
}

/**
 * Convenience function to run tests
 */
export const runWindowPersistenceTests = async (): Promise<TestResult[]> => {
  const validator = new WindowPersistenceValidator();
  const results = await validator.runAllTests();
  validator.printResults();
  return results;
};

/**
 * Integration test for real window operations
 */
export const testRealWindowOperations = async (): Promise<boolean> => {
  try {
    // This would require actual Tauri context
    console.log('🧪 Running real window operations test...');

    // Test getting current monitor info
    const monitors = await getMonitorInfo();
    console.log('📺 Monitors detected:', monitors.length);

    // Test creating and restoring a workspace
    const workspace = await createWorkspace('Integration Test Workspace');
    console.log('💾 Created workspace:', workspace.name);

    // Test restoring workspace
    const restored = await restoreWorkspace(workspace.id);
    console.log('🔄 Workspace restored:', restored);

    return true;
  } catch (error) {
    console.error('❌ Real window operations test failed:', error);
    return false;
  }
};

// Export validator for external use
export { WindowPersistenceValidator };