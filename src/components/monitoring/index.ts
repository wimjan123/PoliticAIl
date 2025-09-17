/**
 * Performance Monitoring Components
 * Index file exporting all performance monitoring components and utilities
 */

// Main Dashboard
export { default as PerformanceDashboard } from './PerformanceDashboard';

// Individual Components
export { default as PerformanceMonitor } from './PerformanceMonitor';
export { default as PerformanceAlerts } from './PerformanceAlerts';
export { default as PerformanceTrends } from './PerformanceTrends';
export { default as MemoryLeakDetector } from './MemoryLeakDetector';

// Test Components
export { default as PerformanceMonitoringTest } from './PerformanceMonitoringTest';

// Hooks and Utilities
export { default as usePerformanceMonitoring, withPerformanceMonitoring, performanceTimed } from './usePerformanceMonitoring';

// Re-export performance utilities for convenience
export {
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getPerformanceMetrics,
  getPerformanceAlerts,
  getPerformanceTrends,
  getPerformanceSummary,
  generatePerformanceReport,
  resetPerformanceMonitor,
  recordPerformanceError,
  markTickStart,
  markTickEnd,
  trackSubsystemPerformance,
  performanceMonitor,
} from '../../utils/performance';

// Export types for use in other components
export type {
  PerformanceMetrics,
  PerformanceAlert,
  PerformanceTrend,
  PerformanceConfig,
} from '../../utils/performance';