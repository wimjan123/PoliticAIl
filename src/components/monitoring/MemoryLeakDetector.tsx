/**
 * Memory Leak Detector Component
 * Advanced memory usage monitoring and leak detection for React applications
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { recordPerformanceError } from '../../utils/performance';

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  listeners: number;
  domNodes: number;
  reactFibers: number;
}

interface MemoryLeak {
  id: string;
  type: 'gradual_increase' | 'sudden_spike' | 'listener_leak' | 'dom_leak' | 'react_leak';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: number;
  affectedMemory: number;
  growthRate: number;
}

interface MemoryLeakDetectorProps {
  enabled?: boolean;
  checkInterval?: number;
  memoryThreshold?: number; // MB
  growthThreshold?: number; // % per minute
  onLeakDetected?: (leak: MemoryLeak) => void;
}

const MemoryLeakDetector: React.FC<MemoryLeakDetectorProps> = ({
  enabled = true,
  checkInterval = 5000, // 5 seconds
  memoryThreshold = 100, // 100MB
  growthThreshold = 10, // 10% growth per minute
  onLeakDetected,
}) => {
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [detectedLeaks, setDetectedLeaks] = useState<MemoryLeak[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(enabled);
  const [currentSnapshot, setCurrentSnapshot] = useState<MemorySnapshot | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const baselineRef = useRef<MemorySnapshot | null>(null);

  // Get memory information
  const getMemorySnapshot = useCallback((): MemorySnapshot => {
    const now = Date.now();
    let memoryInfo: MemorySnapshot = {
      timestamp: now,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      listeners: 0,
      domNodes: 0,
      reactFibers: 0,
    };

    // Get browser memory info if available
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        memoryInfo.heapUsed = memory.usedJSHeapSize || 0;
        memoryInfo.heapTotal = memory.totalJSHeapSize || 0;
        memoryInfo.external = memory.usedJSHeapSize || 0;
      }
    }

    // Count DOM nodes
    if (typeof document !== 'undefined') {
      memoryInfo.domNodes = document.querySelectorAll('*').length;
    }

    // Estimate event listeners (rough approximation)
    memoryInfo.listeners = estimateEventListeners();

    // Estimate React fibers (if React DevTools is available)
    memoryInfo.reactFibers = estimateReactFibers();

    return memoryInfo;
  }, []);

  // Estimate event listeners count
  const estimateEventListeners = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    let count = 0;
    const proto = EventTarget.prototype;
    const originalAddEventListener = proto.addEventListener;
    const originalRemoveEventListener = proto.removeEventListener;

    // This is a rough estimate based on common patterns
    // In production, you'd want a more sophisticated tracking system
    try {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        // Check for common event properties
        const eventProps = ['onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup'];
        eventProps.forEach(prop => {
          if ((el as any)[prop]) count++;
        });
      });

      // Add estimates for programmatically added listeners
      count += Math.floor(allElements.length * 0.1); // Rough estimate
    } catch (error) {
      // Fallback estimate
      count = Math.floor(memoryInfo.domNodes * 0.05);
    }

    return count;
  }, []);

  // Estimate React fibers count
  const estimateReactFibers = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    try {
      // Try to access React DevTools global
      const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactDevTools && reactDevTools.renderers) {
        let fiberCount = 0;
        reactDevTools.renderers.forEach((renderer: any) => {
          if (renderer.getFiberRoots) {
            const roots = renderer.getFiberRoots();
            fiberCount += roots.size || 0;
          }
        });
        return fiberCount * 50; // Rough multiplier for total fiber nodes
      }

      // Fallback: estimate based on React components
      const reactRoots = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
      return reactRoots.length * 20; // Rough estimate
    } catch (error) {
      return 0;
    }
  }, []);

  // Analyze snapshots for memory leaks
  const analyzeMemoryLeaks = useCallback((snapshots: MemorySnapshot[]): MemoryLeak[] => {
    if (snapshots.length < 3) return [];

    const leaks: MemoryLeak[] = [];
    const recent = snapshots.slice(-10); // Last 10 snapshots
    const baseline = baselineRef.current || snapshots[0];

    // Check for gradual memory increase
    const memoryGrowth = recent.map((snapshot, index) => {
      if (index === 0) return 0;
      return snapshot.heapUsed - recent[index - 1].heapUsed;
    });

    const avgGrowth = memoryGrowth.reduce((sum, growth) => sum + growth, 0) / memoryGrowth.length;
    const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 60000; // minutes
    const growthRatePerMinute = timeSpan > 0 ? (avgGrowth / (baseline.heapUsed || 1)) * 100 / timeSpan : 0;

    if (growthRatePerMinute > growthThreshold) {
      leaks.push({
        id: `gradual_${Date.now()}`,
        type: 'gradual_increase',
        severity: growthRatePerMinute > 20 ? 'high' : growthRatePerMinute > 10 ? 'medium' : 'low',
        description: `Memory usage increasing at ${growthRatePerMinute.toFixed(2)}% per minute`,
        detectedAt: Date.now(),
        affectedMemory: avgGrowth,
        growthRate: growthRatePerMinute,
      });
    }

    // Check for sudden memory spikes
    const currentSnapshot = recent[recent.length - 1];
    const previousSnapshot = recent[recent.length - 2];
    if (previousSnapshot) {
      const suddenIncrease = currentSnapshot.heapUsed - previousSnapshot.heapUsed;
      const suddenIncreasePercent = (suddenIncrease / previousSnapshot.heapUsed) * 100;

      if (suddenIncreasePercent > 20) { // 20% sudden increase
        leaks.push({
          id: `spike_${Date.now()}`,
          type: 'sudden_spike',
          severity: suddenIncreasePercent > 50 ? 'high' : 'medium',
          description: `Sudden memory spike of ${(suddenIncrease / 1024 / 1024).toFixed(2)}MB (${suddenIncreasePercent.toFixed(1)}%)`,
          detectedAt: Date.now(),
          affectedMemory: suddenIncrease,
          growthRate: suddenIncreasePercent,
        });
      }
    }

    // Check for DOM node leaks
    const domGrowth = currentSnapshot.domNodes - baseline.domNodes;
    if (domGrowth > 1000) { // More than 1000 new DOM nodes
      leaks.push({
        id: `dom_${Date.now()}`,
        type: 'dom_leak',
        severity: domGrowth > 5000 ? 'high' : domGrowth > 2000 ? 'medium' : 'low',
        description: `DOM nodes increased by ${domGrowth} (potential DOM leak)`,
        detectedAt: Date.now(),
        affectedMemory: domGrowth * 100, // Rough estimate of memory per DOM node
        growthRate: (domGrowth / baseline.domNodes) * 100,
      });
    }

    // Check for event listener leaks
    const listenerGrowth = currentSnapshot.listeners - baseline.listeners;
    if (listenerGrowth > 100) { // More than 100 new listeners
      leaks.push({
        id: `listener_${Date.now()}`,
        type: 'listener_leak',
        severity: listenerGrowth > 500 ? 'high' : listenerGrowth > 200 ? 'medium' : 'low',
        description: `Event listeners increased by ${listenerGrowth} (potential listener leak)`,
        detectedAt: Date.now(),
        affectedMemory: listenerGrowth * 50, // Rough estimate
        growthRate: (listenerGrowth / baseline.listeners) * 100,
      });
    }

    // Check for React fiber leaks
    const fiberGrowth = currentSnapshot.reactFibers - baseline.reactFibers;
    if (fiberGrowth > 500) { // More than 500 new fibers
      leaks.push({
        id: `react_${Date.now()}`,
        type: 'react_leak',
        severity: fiberGrowth > 2000 ? 'high' : fiberGrowth > 1000 ? 'medium' : 'low',
        description: `React fibers increased by ${fiberGrowth} (potential React memory leak)`,
        detectedAt: Date.now(),
        affectedMemory: fiberGrowth * 200, // Rough estimate
        growthRate: (fiberGrowth / baseline.reactFibers) * 100,
      });
    }

    return leaks;
  }, [growthThreshold]);

  // Main monitoring loop
  useEffect(() => {
    if (!isMonitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      try {
        const snapshot = getMemorySnapshot();
        setCurrentSnapshot(snapshot);

        setSnapshots(prev => {
          const newSnapshots = [...prev, snapshot].slice(-50); // Keep last 50 snapshots

          // Set baseline if not set
          if (!baselineRef.current && newSnapshots.length >= 3) {
            baselineRef.current = newSnapshots[2]; // Use 3rd snapshot as baseline for stability
          }

          // Analyze for leaks
          const leaks = analyzeMemoryLeaks(newSnapshots);
          if (leaks.length > 0) {
            setDetectedLeaks(prevLeaks => {
              const newLeaks = leaks.filter(leak =>
                !prevLeaks.some(existing =>
                  existing.type === leak.type &&
                  Math.abs(existing.detectedAt - leak.detectedAt) < 30000 // Avoid duplicate alerts within 30s
                )
              );

              // Trigger callbacks for new leaks
              newLeaks.forEach(leak => {
                if (onLeakDetected) {
                  onLeakDetected(leak);
                }

                // Record as performance error
                const error = new Error(`Memory leak detected: ${leak.description}`);
                recordPerformanceError(error);
              });

              return [...prevLeaks, ...newLeaks].slice(-20); // Keep last 20 leaks
            });
          }

          return newSnapshots;
        });

      } catch (error) {
        console.error('Memory monitoring error:', error);
        recordPerformanceError(error as Error);
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, checkInterval, getMemorySnapshot, analyzeMemoryLeaks, onLeakDetected]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const getLeakTypeIcon = (type: MemoryLeak['type']) => {
    switch (type) {
      case 'gradual_increase': return '📈';
      case 'sudden_spike': return '⚡';
      case 'dom_leak': return '🌐';
      case 'listener_leak': return '👂';
      case 'react_leak': return '⚛️';
      default: return '⚠️';
    }
  };

  const clearLeaks = () => {
    setDetectedLeaks([]);
  };

  const resetBaseline = () => {
    if (currentSnapshot) {
      baselineRef.current = currentSnapshot;
      setDetectedLeaks([]);
    }
  };

  return (
    <div className="memory-leak-detector">
      <div className="detector-header">
        <h3>Memory Leak Detector</h3>
        <div className="detector-controls">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={isMonitoring ? 'btn-warning' : 'btn-success'}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
          <button onClick={resetBaseline} className="btn-secondary">
            Reset Baseline
          </button>
          <button onClick={clearLeaks} className="btn-secondary">
            Clear Leaks
          </button>
        </div>
      </div>

      {currentSnapshot && (
        <div className="memory-status">
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Heap Used</div>
              <div className="status-value">{formatBytes(currentSnapshot.heapUsed)}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Heap Total</div>
              <div className="status-value">{formatBytes(currentSnapshot.heapTotal)}</div>
            </div>
            <div className="status-item">
              <div className="status-label">DOM Nodes</div>
              <div className="status-value">{currentSnapshot.domNodes.toLocaleString()}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Event Listeners</div>
              <div className="status-value">{currentSnapshot.listeners.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {detectedLeaks.length > 0 && (
        <div className="leaks-section">
          <h4>Detected Memory Leaks ({detectedLeaks.length})</h4>
          <div className="leaks-list">
            {detectedLeaks.map(leak => (
              <div
                key={leak.id}
                className="leak-item"
                style={{ borderLeftColor: getSeverityColor(leak.severity) }}
              >
                <div className="leak-header">
                  <span className="leak-icon">{getLeakTypeIcon(leak.type)}</span>
                  <span className="leak-type">{leak.type.replace(/_/g, ' ').toUpperCase()}</span>
                  <span
                    className="leak-severity"
                    style={{ color: getSeverityColor(leak.severity) }}
                  >
                    {leak.severity.toUpperCase()}
                  </span>
                  <span className="leak-time">
                    {new Date(leak.detectedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="leak-description">{leak.description}</div>
                <div className="leak-details">
                  <div>Affected Memory: {formatBytes(leak.affectedMemory)}</div>
                  <div>Growth Rate: {leak.growthRate.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {detectedLeaks.length === 0 && isMonitoring && (
        <div className="no-leaks">
          <div className="success-icon">✓</div>
          <p>No memory leaks detected</p>
        </div>
      )}

      <style jsx>{`
        .memory-leak-detector {
          background: #1a1a1a;
          color: #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .detector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }

        .detector-header h3 {
          margin: 0;
          color: #3B82F6;
        }

        .detector-controls {
          display: flex;
          gap: 10px;
        }

        .detector-controls button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .btn-success { background: #22C55E; color: white; }
        .btn-warning { background: #F59E0B; color: white; }
        .btn-secondary { background: #6B7280; color: white; }

        .memory-status {
          margin-bottom: 20px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .status-item {
          background: #2A2A2A;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }

        .status-label {
          color: #9CA3AF;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .status-value {
          color: #22C55E;
          font-size: 18px;
          font-weight: bold;
        }

        .leaks-section h4 {
          color: #EF4444;
          margin: 20px 0 15px 0;
        }

        .leaks-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .leak-item {
          background: #2A2A2A;
          border-radius: 6px;
          border-left: 4px solid;
          padding: 15px;
        }

        .leak-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .leak-icon {
          font-size: 16px;
        }

        .leak-type {
          font-weight: bold;
          font-size: 12px;
        }

        .leak-severity {
          font-weight: bold;
          font-size: 11px;
        }

        .leak-time {
          color: #6B7280;
          font-size: 11px;
          margin-left: auto;
        }

        .leak-description {
          color: #E5E5E5;
          margin-bottom: 10px;
        }

        .leak-details {
          display: flex;
          gap: 20px;
          color: #9CA3AF;
          font-size: 12px;
        }

        .no-leaks {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 150px;
          text-align: center;
        }

        .success-icon {
          font-size: 32px;
          color: #22C55E;
          margin-bottom: 10px;
        }

        .no-leaks p {
          color: #6B7280;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default MemoryLeakDetector;