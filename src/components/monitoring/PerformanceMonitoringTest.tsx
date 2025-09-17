/**
 * Performance Monitoring Test Component
 * Test component to validate performance monitoring system integration with simulation
 */

import React, { useState, useEffect, useRef } from 'react';
import { PerformanceDashboard, usePerformanceMonitoring } from './index';
import { useSimulation } from '../../hooks/useSimulation';

interface PerformanceMonitoringTestProps {
  enableStressTest?: boolean;
  simulationSpeed?: number;
}

const PerformanceMonitoringTest: React.FC<PerformanceMonitoringTestProps> = ({
  enableStressTest = false,
  simulationSpeed = 1,
}) => {
  const [testMode, setTestMode] = useState<'dashboard' | 'integration' | 'stress'>('dashboard');
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [simulationData, setSimulationData] = useState<any[]>([]);

  // Use simulation context if available
  let simulation: any = null;
  try {
    simulation = useSimulation();
  } catch (error) {
    // Simulation context not available, create mock
    simulation = createMockSimulation();
  }

  // Performance monitoring hook
  const performanceHook = usePerformanceMonitoring({
    autoStart: true,
    trackSimulationTicks: true,
    trackSubsystems: true,
    alertCallback: (alert) => {
      console.log('Performance Alert:', alert);
      setTestResults(prev => [...prev, {
        type: 'alert',
        timestamp: Date.now(),
        data: alert,
      }]);
    },
  });

  const stressTestRef = useRef<NodeJS.Timeout | null>(null);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Create mock simulation for testing
  function createMockSimulation() {
    return {
      state: {
        gameTime: { current: Date.now(), paused: false },
        player: { approval: 50, resources: { money: 1000, influence: 50 } },
        currentEvents: [],
        gameStats: { totalTicks: 0 },
      },
      actions: {
        updatePlayerResources: (resources: any) => {
          console.log('Mock: Update resources', resources);
        },
        updateApproval: (change: number) => {
          console.log('Mock: Update approval', change);
        },
        proposePolicy: (policy: any) => {
          console.log('Mock: Propose policy', policy);
        },
        handleEvent: (eventId: string) => {
          console.log('Mock: Handle event', eventId);
        },
      },
    };
  }

  // Simulate regular game activity
  const simulateGameActivity = () => {
    if (!simulation) return;

    const activities = [
      () => {
        performanceHook.startTick();
        // Simulate policy processing
        const start = performance.now();
        // Artificial processing time
        const processingTime = 10 + Math.random() * 40; // 10-50ms
        setTimeout(() => {
          performanceHook.trackSubsystem('policyProcessing', performance.now() - start);
        }, processingTime);
      },
      () => {
        // Simulate event handling
        const start = performance.now();
        simulation.actions.handleEvent('test_event_' + Date.now());
        performanceHook.trackSubsystem('eventHandling', performance.now() - start);
      },
      () => {
        // Simulate resource updates
        const start = performance.now();
        simulation.actions.updatePlayerResources({
          money: Math.floor(Math.random() * 100),
          influence: Math.floor(Math.random() * 10),
        });
        performanceHook.trackSubsystem('resourceCalculation', performance.now() - start);
      },
      () => {
        // Simulate AI decision making
        const start = performance.now();
        // Artificial AI processing delay
        setTimeout(() => {
          performanceHook.trackSubsystem('aiDecisionMaking', performance.now() - start);
        }, 20 + Math.random() * 80); // 20-100ms
      },
      () => {
        // End simulation tick
        performanceHook.endTick();
      },
    ];

    // Execute random activity
    const activity = activities[Math.floor(Math.random() * activities.length)];
    activity();

    // Update simulation data
    setSimulationData(prev => [...prev.slice(-50), {
      timestamp: Date.now(),
      activity: activity.name,
      memory: performance.memory?.usedJSHeapSize || 0,
    }]);
  };

  // Run stress test
  const runStressTest = () => {
    if (isStressTesting) {
      // Stop stress test
      if (stressTestRef.current) {
        clearInterval(stressTestRef.current);
        stressTestRef.current = null;
      }
      setIsStressTesting(false);
      setTestResults(prev => [...prev, {
        type: 'stress_test_end',
        timestamp: Date.now(),
        data: { status: 'completed' },
      }]);
    } else {
      // Start stress test
      setIsStressTesting(true);
      setTestResults(prev => [...prev, {
        type: 'stress_test_start',
        timestamp: Date.now(),
        data: { status: 'started' },
      }]);

      // Create memory pressure
      const memoryHogs: any[] = [];

      stressTestRef.current = setInterval(() => {
        // Simulate heavy computation
        performanceHook.startTick();

        // Create artificial load
        for (let i = 0; i < 1000; i++) {
          const data = new Array(1000).fill(Math.random());
          memoryHogs.push(data);
        }

        // Simulate multiple subsystem calls
        performanceHook.trackSubsystem('policyProcessing', 50 + Math.random() * 100);
        performanceHook.trackSubsystem('eventHandling', 30 + Math.random() * 70);
        performanceHook.trackSubsystem('aiDecisionMaking', 100 + Math.random() * 200);
        performanceHook.trackSubsystem('resourceCalculation', 20 + Math.random() * 40);

        // Clean up some memory occasionally
        if (memoryHogs.length > 100 && Math.random() < 0.3) {
          memoryHogs.splice(0, 50);
        }

        performanceHook.endTick();

        // Occasionally trigger errors for testing
        if (Math.random() < 0.1) {
          performanceHook.recordError(new Error('Stress test simulated error'));
        }
      }, 50); // High frequency updates
    }
  };

  // Start simulation activity
  useEffect(() => {
    simulationRef.current = setInterval(simulateGameActivity, 1000 / simulationSpeed);

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
      if (stressTestRef.current) {
        clearInterval(stressTestRef.current);
      }
    };
  }, [simulationSpeed]);

  const clearTestResults = () => {
    setTestResults([]);
    setSimulationData([]);
  };

  const exportTestResults = () => {
    const report = {
      testStartTime: Date.now(),
      performanceStatus: performanceHook.getPerformanceStatus(),
      recommendations: performanceHook.getRecommendations(),
      testResults: testResults.slice(-50), // Last 50 results
      simulationData: simulationData.slice(-50), // Last 50 data points
      metrics: performanceHook.metrics,
      alerts: performanceHook.alerts,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="performance-monitoring-test">
      <div className="test-header">
        <h2>Performance Monitoring System Test</h2>
        <div className="test-controls">
          <select
            value={testMode}
            onChange={(e) => setTestMode(e.target.value as any)}
            className="test-mode-select"
          >
            <option value="dashboard">Dashboard View</option>
            <option value="integration">Integration Test</option>
            <option value="stress">Stress Test</option>
          </select>
          <button onClick={exportTestResults} className="btn-primary">
            Export Results
          </button>
          <button onClick={clearTestResults} className="btn-secondary">
            Clear Results
          </button>
        </div>
      </div>

      {testMode === 'dashboard' && (
        <div className="dashboard-test">
          <PerformanceDashboard
            autoStart={true}
            showAdvanced={true}
            enableNotifications={true}
            refreshInterval={1000}
          />
        </div>
      )}

      {testMode === 'integration' && (
        <div className="integration-test">
          <div className="test-panels">
            <div className="test-panel">
              <h3>Performance Status</h3>
              <div className="status-info">
                <div>Status: <span className={`status-${performanceHook.getPerformanceStatus()}`}>
                  {performanceHook.getPerformanceStatus().toUpperCase()}
                </span></div>
                <div>Monitoring: {performanceHook.isMonitoring ? '🟢 ACTIVE' : '🔴 INACTIVE'}</div>
                <div>Alerts: {performanceHook.alerts.length}</div>
                {performanceHook.metrics && (
                  <>
                    <div>Avg Tick Time: {performanceHook.metrics.averageTickTime.toFixed(2)}ms</div>
                    <div>Memory: {(performanceHook.metrics.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB</div>
                  </>
                )}
              </div>
            </div>

            <div className="test-panel">
              <h3>Simulation Activity</h3>
              <div className="simulation-info">
                <div>Speed: {simulationSpeed}x</div>
                <div>Data Points: {simulationData.length}</div>
                {simulationData.length > 0 && (
                  <div>Last Activity: {new Date(simulationData[simulationData.length - 1].timestamp).toLocaleTimeString()}</div>
                )}
              </div>
              <div className="simulation-controls">
                <button
                  onClick={() => setSimulationSpeed(prev => Math.max(0.5, prev - 0.5))}
                  className="btn-secondary"
                >
                  Slower
                </button>
                <button
                  onClick={() => setSimulationSpeed(prev => Math.min(5, prev + 0.5))}
                  className="btn-secondary"
                >
                  Faster
                </button>
              </div>
            </div>

            <div className="test-panel">
              <h3>Recommendations</h3>
              <div className="recommendations">
                {performanceHook.getRecommendations().slice(0, 3).map((rec, index) => (
                  <div key={index} className="recommendation">
                    {index + 1}. {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="test-results">
            <h3>Test Results ({testResults.length})</h3>
            <div className="results-list">
              {testResults.slice(-10).reverse().map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <span className="result-type">{result.type}</span>
                    <span className="result-time">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="result-data">
                    {result.type === 'alert' && (
                      <div>
                        {result.data.type.toUpperCase()}: {result.data.message}
                      </div>
                    )}
                    {result.type !== 'alert' && (
                      <div>{JSON.stringify(result.data)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {testMode === 'stress' && (
        <div className="stress-test">
          <div className="stress-controls">
            <button
              onClick={runStressTest}
              className={isStressTesting ? 'btn-warning' : 'btn-primary'}
            >
              {isStressTesting ? 'Stop Stress Test' : 'Start Stress Test'}
            </button>
            {isStressTesting && (
              <div className="stress-warning">
                ⚠️ High CPU and memory usage test running...
              </div>
            )}
          </div>

          <div className="stress-results">
            <h3>Stress Test Metrics</h3>
            {performanceHook.metrics && (
              <div className="stress-metrics">
                <div className="metric">
                  <label>Avg Tick Time:</label>
                  <span className={performanceHook.metrics.averageTickTime > 100 ? 'metric-bad' : 'metric-good'}>
                    {performanceHook.metrics.averageTickTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="metric">
                  <label>Max Tick Time:</label>
                  <span className={performanceHook.metrics.maxTickTime > 200 ? 'metric-bad' : 'metric-good'}>
                    {performanceHook.metrics.maxTickTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="metric">
                  <label>Memory Leak Score:</label>
                  <span className={performanceHook.metrics.memoryLeakScore > 50 ? 'metric-bad' : 'metric-good'}>
                    {performanceHook.metrics.memoryLeakScore.toFixed(1)}/100
                  </span>
                </div>
                <div className="metric">
                  <label>Errors/min:</label>
                  <span className={performanceHook.metrics.errorsPerMinute > 0 ? 'metric-bad' : 'metric-good'}>
                    {performanceHook.metrics.errorsPerMinute}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-monitoring-test {
          background: #0F172A;
          color: #E2E8F0;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #334155;
          background: #1E293B;
        }

        .test-header h2 {
          margin: 0;
          color: #F1F5F9;
        }

        .test-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .test-mode-select {
          padding: 8px 12px;
          background: #334155;
          border: 1px solid #475569;
          border-radius: 6px;
          color: #E2E8F0;
        }

        .btn-primary { background: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-secondary { background: #6B7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-warning { background: #F59E0B; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }

        .dashboard-test {
          height: calc(100vh - 80px);
          overflow: auto;
        }

        .integration-test {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .test-panels {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .test-panel {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .test-panel h3 {
          margin: 0 0 15px 0;
          color: #F1F5F9;
        }

        .status-info, .simulation-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }

        .status-good { color: #22C55E; font-weight: bold; }
        .status-warning { color: #F59E0B; font-weight: bold; }
        .status-critical { color: #EF4444; font-weight: bold; }

        .simulation-controls {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .recommendations {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recommendation {
          font-size: 13px;
          line-height: 1.4;
          color: #94A3B8;
        }

        .test-results {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .test-results h3 {
          margin: 0 0 15px 0;
          color: #F1F5F9;
        }

        .results-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .result-item {
          background: #0F172A;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          border-left: 3px solid #3B82F6;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .result-type {
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          color: #9CA3AF;
        }

        .result-time {
          font-size: 11px;
          color: #6B7280;
        }

        .result-data {
          font-size: 13px;
          color: #E2E8F0;
        }

        .stress-test {
          padding: 30px;
        }

        .stress-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .stress-warning {
          color: #F59E0B;
          font-size: 14px;
          font-weight: 500;
        }

        .stress-results {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .stress-results h3 {
          margin: 0 0 20px 0;
          color: #F1F5F9;
        }

        .stress-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #0F172A;
          border-radius: 6px;
        }

        .metric label {
          color: #9CA3AF;
        }

        .metric-good { color: #22C55E; font-weight: bold; }
        .metric-bad { color: #EF4444; font-weight: bold; }
      `}</style>
    </div>
  );
};

export default PerformanceMonitoringTest;