/**
 * Performance Monitoring Utilities
 * Real-time performance tracking for the political simulation system
 */

export interface PerformanceMetrics {
  // Timing metrics
  simulationTickTime: number;
  averageTickTime: number;
  maxTickTime: number;
  minTickTime: number;

  // Memory metrics
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  memoryLeakScore: number;

  // System metrics
  entityProcessingTime: number;
  aiDecisionLatency: number;
  uiResponseTime: number;

  // Subsystem breakdown
  subsystemPerformance: {
    policyProcessing: number;
    eventHandling: number;
    relationshipUpdates: number;
    resourceCalculation: number;
    aiDecisionMaking: number;
    uiRendering: number;
  };

  // Counters
  totalTicks: number;
  errorsPerMinute: number;
  warningsPerMinute: number;

  // Timestamps
  measurementTime: number;
  sessionStartTime: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'memory' | 'timing' | 'error' | 'resource';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  resolved: boolean;
}

export interface PerformanceTrend {
  timestamp: number;
  tickTime: number;
  memoryUsage: number;
  entityCount: number;
}

export interface PerformanceConfig {
  // Alert thresholds
  maxTickTime: number; // 100ms default
  memoryWarningThreshold: number; // 200MB default
  memoryCriticalThreshold: number; // 500MB default

  // Monitoring settings
  measurementInterval: number; // 1000ms default
  trendRetentionPeriod: number; // 5 minutes default
  maxHistorySize: number; // 300 data points default

  // Performance targets
  targetTickTime: number; // 50ms ideal
  targetMemoryUsage: number; // 100MB ideal
}

/**
 * Performance Monitor Class
 * Centralized performance tracking and analysis
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private config: PerformanceConfig;
  private alerts: PerformanceAlert[] = [];
  private trends: PerformanceTrend[] = [];
  private measurementTimer: NodeJS.Timeout | null = null;
  private tickStartTime = 0;
  private isMonitoring = false;
  private memoryBaseline = 0;

  // Performance tracking arrays
  private tickTimes: number[] = [];
  private memoryReadings: number[] = [];
  private errorCounts: number[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      maxTickTime: 100,
      memoryWarningThreshold: 200 * 1024 * 1024, // 200MB
      memoryCriticalThreshold: 500 * 1024 * 1024, // 500MB
      measurementInterval: 1000,
      trendRetentionPeriod: 5 * 60 * 1000, // 5 minutes
      maxHistorySize: 300,
      targetTickTime: 50,
      targetMemoryUsage: 100 * 1024 * 1024, // 100MB
      ...config,
    };

    this.metrics = this.createInitialMetrics();

    // Set memory baseline
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.memoryBaseline = this.getCurrentMemoryUsage();
    }
  }

  private createInitialMetrics(): PerformanceMetrics {
    const now = Date.now();
    return {
      simulationTickTime: 0,
      averageTickTime: 0,
      maxTickTime: 0,
      minTickTime: Infinity,
      currentMemoryUsage: 0,
      peakMemoryUsage: 0,
      memoryLeakScore: 0,
      entityProcessingTime: 0,
      aiDecisionLatency: 0,
      uiResponseTime: 0,
      subsystemPerformance: {
        policyProcessing: 0,
        eventHandling: 0,
        relationshipUpdates: 0,
        resourceCalculation: 0,
        aiDecisionMaking: 0,
        uiRendering: 0,
      },
      totalTicks: 0,
      errorsPerMinute: 0,
      warningsPerMinute: 0,
      measurementTime: now,
      sessionStartTime: now,
    };
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.metrics.sessionStartTime = Date.now();

    this.measurementTimer = setInterval(() => {
      this.collectMetrics();
      this.analyzeTrends();
      this.checkAlerts();
    }, this.config.measurementInterval);

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.measurementTimer) {
      clearInterval(this.measurementTimer);
      this.measurementTimer = null;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * Mark the start of a simulation tick
   */
  startTick(): void {
    this.tickStartTime = performance.now();
  }

  /**
   * Mark the end of a simulation tick
   */
  endTick(): void {
    if (this.tickStartTime === 0) return;

    const tickTime = performance.now() - this.tickStartTime;
    this.tickTimes.push(tickTime);

    // Keep only recent tick times
    if (this.tickTimes.length > 100) {
      this.tickTimes.shift();
    }

    this.metrics.simulationTickTime = tickTime;
    this.metrics.averageTickTime = this.tickTimes.reduce((sum, t) => sum + t, 0) / this.tickTimes.length;
    this.metrics.maxTickTime = Math.max(this.metrics.maxTickTime, tickTime);
    this.metrics.minTickTime = Math.min(this.metrics.minTickTime, tickTime);
    this.metrics.totalTicks++;

    this.tickStartTime = 0;
  }

  /**
   * Track subsystem performance
   */
  trackSubsystem(subsystem: keyof PerformanceMetrics['subsystemPerformance'], duration: number): void {
    this.metrics.subsystemPerformance[subsystem] = duration;
  }

  /**
   * Record error occurrence
   */
  recordError(error: Error): void {
    console.error('Performance Monitor - Error:', error);
    this.errorCounts.push(Date.now());

    // Clean old error timestamps
    const oneMinuteAgo = Date.now() - 60000;
    this.errorCounts = this.errorCounts.filter(t => t > oneMinuteAgo);

    this.metrics.errorsPerMinute = this.errorCounts.length;

    // Create critical alert for errors
    this.createAlert('critical', 'error', `System error occurred: ${error.message}`, 0, 1);
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return 0;
    }

    const memory = (performance as any).memory;
    if (!memory) return 0;

    return memory.usedJSHeapSize || 0;
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const now = Date.now();
    const currentMemory = this.getCurrentMemoryUsage();

    // Update memory metrics
    this.metrics.currentMemoryUsage = currentMemory;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, currentMemory);
    this.memoryReadings.push(currentMemory);

    // Keep only recent memory readings
    if (this.memoryReadings.length > 60) {
      this.memoryReadings.shift();
    }

    // Calculate memory leak score
    this.calculateMemoryLeakScore();

    // Update timestamp
    this.metrics.measurementTime = now;

    // Add to trends
    this.trends.push({
      timestamp: now,
      tickTime: this.metrics.averageTickTime,
      memoryUsage: currentMemory,
      entityCount: this.estimateEntityCount(),
    });

    // Clean old trends
    const cutoff = now - this.config.trendRetentionPeriod;
    this.trends = this.trends.filter(t => t.timestamp > cutoff);

    // Limit history size
    if (this.trends.length > this.config.maxHistorySize) {
      this.trends.shift();
    }
  }

  /**
   * Calculate memory leak score based on memory growth trend
   */
  private calculateMemoryLeakScore(): void {
    if (this.memoryReadings.length < 10) {
      this.metrics.memoryLeakScore = 0;
      return;
    }

    const recent = this.memoryReadings.slice(-10);
    const older = this.memoryReadings.slice(-20, -10);

    if (older.length === 0) {
      this.metrics.memoryLeakScore = 0;
      return;
    }

    const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
    const olderAvg = older.reduce((sum, o) => sum + o, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    // Score from 0-100, where higher is worse
    this.metrics.memoryLeakScore = Math.max(0, Math.min(100, growthRate * 1000));
  }

  /**
   * Estimate entity count based on available information
   */
  private estimateEntityCount(): number {
    // This is a rough estimation - in a real implementation,
    // this would be connected to the actual simulation state
    return Math.floor(this.metrics.currentMemoryUsage / (1024 * 10)); // Rough estimate
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): void {
    if (this.trends.length < 10) return;

    const recent = this.trends.slice(-10);
    const avgTickTime = recent.reduce((sum, t) => sum + t.tickTime, 0) / recent.length;
    const avgMemory = recent.reduce((sum, t) => sum + t.memoryUsage, 0) / recent.length;

    // Check for performance degradation
    if (avgTickTime > this.config.maxTickTime * 0.8) {
      this.createAlert('warning', 'timing', 'Performance degrading - tick time increasing', this.config.maxTickTime, avgTickTime);
    }

    // Check for memory growth
    if (avgMemory > this.config.memoryWarningThreshold) {
      this.createAlert('warning', 'memory', 'Memory usage approaching threshold', this.config.memoryWarningThreshold, avgMemory);
    }
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    const now = Date.now();

    // Check tick time alerts
    if (this.metrics.averageTickTime > this.config.maxTickTime) {
      this.createAlert('critical', 'timing', 'Simulation running too slowly', this.config.maxTickTime, this.metrics.averageTickTime);
    }

    // Check memory alerts
    if (this.metrics.currentMemoryUsage > this.config.memoryCriticalThreshold) {
      this.createAlert('critical', 'memory', 'Memory usage critical', this.config.memoryCriticalThreshold, this.metrics.currentMemoryUsage);
    } else if (this.metrics.currentMemoryUsage > this.config.memoryWarningThreshold) {
      this.createAlert('warning', 'memory', 'Memory usage high', this.config.memoryWarningThreshold, this.metrics.currentMemoryUsage);
    }

    // Check memory leak alerts
    if (this.metrics.memoryLeakScore > 50) {
      this.createAlert('warning', 'memory', 'Potential memory leak detected', 50, this.metrics.memoryLeakScore);
    }

    // Auto-resolve old alerts
    this.alerts.forEach(alert => {
      if (!alert.resolved && (now - alert.timestamp > 30000)) {
        alert.resolved = true;
      }
    });

    // Clean resolved alerts older than 5 minutes
    this.alerts = this.alerts.filter(alert =>
      !alert.resolved || (now - alert.timestamp < 5 * 60 * 1000)
    );
  }

  /**
   * Create a performance alert
   */
  private createAlert(type: PerformanceAlert['type'], category: PerformanceAlert['category'], message: string, threshold: number, currentValue: number): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert =>
      !alert.resolved &&
      alert.category === category &&
      alert.message === message
    );

    if (existingAlert) return;

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      message,
      threshold,
      currentValue,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);
    console.warn('Performance Alert:', alert);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts.filter(alert => !alert.resolved)];
  }

  /**
   * Get historical trends
   */
  getTrends(): PerformanceTrend[] {
    return [...this.trends];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const sessionDuration = now - this.metrics.sessionStartTime;

    return {
      status: this.getOverallStatus(),
      sessionDuration,
      averageTickTime: this.metrics.averageTickTime,
      memoryEfficiency: this.calculateMemoryEfficiency(),
      alertCount: this.alerts.filter(a => !a.resolved).length,
      uptime: sessionDuration,
      ticksPerSecond: this.metrics.totalTicks / (sessionDuration / 1000),
    };
  }

  /**
   * Get overall system status
   */
  private getOverallStatus(): 'good' | 'warning' | 'critical' {
    const criticalAlerts = this.alerts.filter(a => !a.resolved && a.type === 'critical');
    const warningAlerts = this.alerts.filter(a => !a.resolved && a.type === 'warning');

    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length > 0) return 'warning';
    return 'good';
  }

  /**
   * Calculate memory efficiency score
   */
  private calculateMemoryEfficiency(): number {
    if (this.metrics.currentMemoryUsage === 0) return 100;

    const efficiency = Math.max(0, 100 - (this.metrics.currentMemoryUsage / this.config.memoryCriticalThreshold) * 100);
    return Math.round(efficiency);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const sessionHours = summary.sessionDuration / (1000 * 60 * 60);

    return `
Performance Monitor Report
Generated: ${new Date().toISOString()}

=== SUMMARY ===
Overall Status: ${summary.status.toUpperCase()}
Session Duration: ${sessionHours.toFixed(2)} hours
Average Tick Time: ${this.metrics.averageTickTime.toFixed(2)}ms
Memory Efficiency: ${summary.memoryEfficiency}%
Active Alerts: ${summary.alertCount}

=== TIMING METRICS ===
Current Tick Time: ${this.metrics.simulationTickTime.toFixed(2)}ms
Average Tick Time: ${this.metrics.averageTickTime.toFixed(2)}ms
Max Tick Time: ${this.metrics.maxTickTime.toFixed(2)}ms
Min Tick Time: ${this.metrics.minTickTime.toFixed(2)}ms
Total Ticks: ${this.metrics.totalTicks}
Ticks/Second: ${summary.ticksPerSecond.toFixed(2)}

=== MEMORY METRICS ===
Current Usage: ${(this.metrics.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB
Peak Usage: ${(this.metrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB
Memory Leak Score: ${this.metrics.memoryLeakScore.toFixed(1)}/100

=== SUBSYSTEM PERFORMANCE ===
Policy Processing: ${this.metrics.subsystemPerformance.policyProcessing.toFixed(2)}ms
Event Handling: ${this.metrics.subsystemPerformance.eventHandling.toFixed(2)}ms
Relationship Updates: ${this.metrics.subsystemPerformance.relationshipUpdates.toFixed(2)}ms
Resource Calculation: ${this.metrics.subsystemPerformance.resourceCalculation.toFixed(2)}ms
AI Decision Making: ${this.metrics.subsystemPerformance.aiDecisionMaking.toFixed(2)}ms
UI Rendering: ${this.metrics.subsystemPerformance.uiRendering.toFixed(2)}ms

=== ALERTS ===
${this.alerts.filter(a => !a.resolved).map(alert =>
  `[${alert.type.toUpperCase()}] ${alert.message} (${alert.currentValue.toFixed(2)} > ${alert.threshold})`
).join('\n') || 'No active alerts'}

=== RECOMMENDATIONS ===
${this.generateRecommendations().join('\n')}
    `.trim();
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.averageTickTime > this.config.targetTickTime * 2) {
      recommendations.push('- Consider optimizing simulation algorithms to reduce tick time');
    }

    if (this.metrics.memoryLeakScore > 30) {
      recommendations.push('- Investigate potential memory leaks in event handlers or data structures');
    }

    if (this.metrics.currentMemoryUsage > this.config.memoryWarningThreshold) {
      recommendations.push('- Review data structures for memory efficiency improvements');
    }

    if (this.metrics.errorsPerMinute > 0) {
      recommendations.push('- Address system errors to improve stability');
    }

    if (recommendations.length === 0) {
      recommendations.push('- System performance is within acceptable parameters');
    }

    return recommendations;
  }

  /**
   * Clear all historical data
   */
  reset(): void {
    this.metrics = this.createInitialMetrics();
    this.alerts = [];
    this.trends = [];
    this.tickTimes = [];
    this.memoryReadings = [];
    this.errorCounts = [];
    console.log('Performance monitor reset');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export utilities
export const startPerformanceMonitoring = () => performanceMonitor.start();
export const stopPerformanceMonitoring = () => performanceMonitor.stop();
export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const getPerformanceAlerts = () => performanceMonitor.getAlerts();
export const getPerformanceTrends = () => performanceMonitor.getTrends();
export const getPerformanceSummary = () => performanceMonitor.getPerformanceSummary();
export const generatePerformanceReport = () => performanceMonitor.generateReport();
export const resetPerformanceMonitor = () => performanceMonitor.reset();
export const recordPerformanceError = (error: Error) => performanceMonitor.recordError(error);

// Simulation-specific utilities
export const markTickStart = () => performanceMonitor.startTick();
export const markTickEnd = () => performanceMonitor.endTick();
export const trackSubsystemPerformance = (subsystem: keyof PerformanceMetrics['subsystemPerformance'], duration: number) =>
  performanceMonitor.trackSubsystem(subsystem, duration);

// Export the monitor instance for advanced usage
export { performanceMonitor };

export default performanceMonitor;