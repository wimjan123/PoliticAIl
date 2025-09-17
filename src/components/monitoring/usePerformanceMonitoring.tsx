/**
 * Performance Monitoring Hook
 * React hook for integrating performance monitoring with simulation components
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import {
  performanceMonitor,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  markTickStart,
  markTickEnd,
  trackSubsystemPerformance,
  recordPerformanceError,
  getPerformanceMetrics,
  getPerformanceAlerts,
  PerformanceMetrics,
  PerformanceAlert,
} from '../../utils/performance';

interface UsePerformanceMonitoringOptions {
  autoStart?: boolean;
  trackSimulationTicks?: boolean;
  trackSubsystems?: boolean;
  alertCallback?: (alert: PerformanceAlert) => void;
  refreshInterval?: number;
}

interface PerformanceMonitoringHook {
  // Metrics and data
  metrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;

  // Control functions
  start: () => void;
  stop: () => void;
  reset: () => void;

  // Tracking functions
  startTick: () => void;
  endTick: () => void;
  trackSubsystem: (name: string, duration: number) => void;
  recordError: (error: Error) => void;

  // Performance analysis
  getPerformanceStatus: () => 'good' | 'warning' | 'critical';
  getRecommendations: () => string[];
}

export const usePerformanceMonitoring = (
  options: UsePerformanceMonitoringOptions = {}
): PerformanceMonitoringHook => {
  const {
    autoStart = false,
    trackSimulationTicks = true,
    trackSubsystems = true,
    alertCallback,
    refreshInterval = 1000,
  } = options;

  const { state, actions } = useSimulation();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refs for tracking
  const tickStartTimeRef = useRef<number>(0);
  const subsystemTimersRef = useRef<Map<string, number>>(new Map());
  const previousStateRef = useRef(state);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !isMonitoring) {
      start();
    }
  }, [autoStart]);

  // Track simulation state changes as ticks
  useEffect(() => {
    if (!trackSimulationTicks || !isMonitoring) return;

    const prevState = previousStateRef.current;
    const currentState = state;

    // Detect if significant state change occurred (simulation tick)
    const stateChanged =
      prevState.gameTime.current !== currentState.gameTime.current ||
      prevState.player.approval !== currentState.player.approval ||
      prevState.currentEvents.length !== currentState.currentEvents.length ||
      prevState.gameStats.totalTicks !== currentState.gameStats.totalTicks;

    if (stateChanged) {
      // If we have a start time, end the previous tick
      if (tickStartTimeRef.current > 0) {
        endTick();
      }
      // Start new tick
      startTick();
    }

    previousStateRef.current = currentState;
  }, [state, trackSimulationTicks, isMonitoring]);

  // Periodic metrics update
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const currentMetrics = getPerformanceMetrics();
      const currentAlerts = getPerformanceAlerts();

      setMetrics(currentMetrics);

      // Check for new alerts
      const newAlerts = currentAlerts.filter(alert =>
        !alerts.some(existing => existing.id === alert.id)
      );

      if (newAlerts.length > 0 && alertCallback) {
        newAlerts.forEach(alertCallback);
      }

      setAlerts(currentAlerts);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, alerts, alertCallback]);

  // Monitor for performance issues in simulation actions
  useEffect(() => {
    if (!trackSubsystems || !isMonitoring) return;

    // Wrap simulation actions to track their performance
    const originalActions = { ...actions };

    // Override actions with performance tracking
    Object.keys(originalActions).forEach(actionName => {
      const originalAction = (originalActions as any)[actionName];
      if (typeof originalAction === 'function') {
        (actions as any)[actionName] = (...args: any[]) => {
          const startTime = performance.now();

          try {
            const result = originalAction(...args);

            // Track as a Promise if it's async
            if (result && typeof result.then === 'function') {
              return result
                .then((value: any) => {
                  const duration = performance.now() - startTime;
                  trackSubsystemPerformance(actionName, duration);
                  return value;
                })
                .catch((error: Error) => {
                  const duration = performance.now() - startTime;
                  trackSubsystemPerformance(actionName, duration);
                  recordError(error);
                  throw error;
                });
            } else {
              const duration = performance.now() - startTime;
              trackSubsystemPerformance(actionName, duration);
              return result;
            }
          } catch (error) {
            const duration = performance.now() - startTime;
            trackSubsystemPerformance(actionName, duration);
            recordError(error as Error);
            throw error;
          }
        };
      }
    });

    // Cleanup: restore original actions when component unmounts
    return () => {
      Object.assign(actions, originalActions);
    };
  }, [actions, trackSubsystems, isMonitoring]);

  // Control functions
  const start = useCallback(() => {
    startPerformanceMonitoring();
    setIsMonitoring(true);
  }, []);

  const stop = useCallback(() => {
    stopPerformanceMonitoring();
    setIsMonitoring(false);
    tickStartTimeRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    performanceMonitor.reset();
    setMetrics(null);
    setAlerts([]);
    tickStartTimeRef.current = 0;
    subsystemTimersRef.current.clear();
  }, []);

  // Tracking functions
  const startTick = useCallback(() => {
    tickStartTimeRef.current = performance.now();
    markTickStart();
  }, []);

  const endTick = useCallback(() => {
    if (tickStartTimeRef.current > 0) {
      markTickEnd();
      tickStartTimeRef.current = 0;
    }
  }, []);

  const trackSubsystem = useCallback((name: string, duration: number) => {
    trackSubsystemPerformance(name as any, duration);
  }, []);

  const recordError = useCallback((error: Error) => {
    recordPerformanceError(error);
  }, []);

  // Analysis functions
  const getPerformanceStatus = useCallback((): 'good' | 'warning' | 'critical' => {
    if (!metrics) return 'good';

    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    const warningAlerts = alerts.filter(a => a.type === 'warning');

    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 0) return 'warning';
    if (metrics.averageTickTime > 100) return 'warning';
    if (metrics.memoryLeakScore > 50) return 'warning';

    return 'good';
  }, [metrics, alerts]);

  const getRecommendations = useCallback((): string[] => {
    if (!metrics) return [];

    const recommendations: string[] = [];

    // Performance recommendations
    if (metrics.averageTickTime > 100) {
      recommendations.push('Simulation is running slowly. Consider optimizing game logic.');
    }

    if (metrics.memoryLeakScore > 30) {
      recommendations.push('Potential memory leak detected. Check for unremoved event listeners.');
    }

    if (metrics.currentMemoryUsage > 200 * 1024 * 1024) { // 200MB
      recommendations.push('High memory usage detected. Consider optimizing data structures.');
    }

    if (metrics.errorsPerMinute > 0) {
      recommendations.push('System errors detected. Check console for error details.');
    }

    // Subsystem-specific recommendations
    const { subsystemPerformance } = metrics;
    if (subsystemPerformance.policyProcessing > 50) {
      recommendations.push('Policy processing is slow. Consider caching policy calculations.');
    }

    if (subsystemPerformance.eventHandling > 50) {
      recommendations.push('Event handling is slow. Consider optimizing event processing logic.');
    }

    if (subsystemPerformance.aiDecisionMaking > 100) {
      recommendations.push('AI decisions are slow. Consider simplifying AI algorithms or adding caching.');
    }

    // Alert-based recommendations
    alerts.forEach(alert => {
      switch (alert.category) {
        case 'memory':
          if (!recommendations.some(r => r.includes('memory'))) {
            recommendations.push('Memory usage is concerning. Review data lifecycle management.');
          }
          break;
        case 'timing':
          if (!recommendations.some(r => r.includes('slow'))) {
            recommendations.push('Performance timing issues detected. Profile code for bottlenecks.');
          }
          break;
        case 'error':
          if (!recommendations.some(r => r.includes('error'))) {
            recommendations.push('System errors are affecting performance. Address error conditions.');
          }
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('System performance is optimal. No immediate action required.');
    }

    return recommendations;
  }, [metrics, alerts]);

  return {
    // Data
    metrics,
    alerts,
    isMonitoring,

    // Controls
    start,
    stop,
    reset,

    // Tracking
    startTick,
    endTick,
    trackSubsystem,
    recordError,

    // Analysis
    getPerformanceStatus,
    getRecommendations,
  };
};

/**
 * Higher-Order Component for automatic performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UsePerformanceMonitoringOptions = {}
) => {
  const WithPerformanceMonitoring: React.FC<P> = (props) => {
    const performanceHook = usePerformanceMonitoring({
      autoStart: true,
      ...options,
    });

    // Add performance monitoring to props
    const enhancedProps = {
      ...props,
      performanceMonitoring: performanceHook,
    } as P & { performanceMonitoring: PerformanceMonitoringHook };

    return <WrappedComponent {...enhancedProps} />;
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithPerformanceMonitoring;
};

/**
 * Performance timing decorator for functions
 */
export const performanceTimed = (
  subsystemName: string,
  trackErrors: boolean = true
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;
        trackSubsystemPerformance(subsystemName as any, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        trackSubsystemPerformance(subsystemName as any, duration);

        if (trackErrors) {
          recordPerformanceError(error as Error);
        }

        throw error;
      }
    };

    return descriptor;
  };
};

export default usePerformanceMonitoring;