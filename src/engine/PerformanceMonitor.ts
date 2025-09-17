/**
 * Performance Monitor - Real-time Performance Tracking
 *
 * Monitors simulation performance with <100ms target validation,
 * tracks subsystem performance, and provides alerts for degradation.
 */

import {
  TickResult,
  SubsystemResult,
  PerformanceConfig,
  EngineEvent,
  EngineEventListener
} from './types';

interface PerformanceMetrics {
  /** Average tick time over monitoring window */
  averageTickTime: number;

  /** Maximum tick time in monitoring window */
  maxTickTime: number;

  /** Minimum tick time in monitoring window */
  minTickTime: number;

  /** Current performance status */
  status: 'optimal' | 'degraded' | 'critical';

  /** Percentage of ticks meeting performance target */
  targetComplianceRate: number;

  /** Trend direction */
  trend: 'improving' | 'stable' | 'degrading';

  /** Subsystem-specific metrics */
  subsystemMetrics: Map<string, SubsystemPerformanceMetrics>;

  /** Timestamp of last update */
  lastUpdated: Date;
}

interface SubsystemPerformanceMetrics {
  /** Subsystem name */
  name: string;

  /** Average processing time */
  averageTime: number;

  /** Time budget */
  timeBudget: number;

  /** Budget compliance rate */
  budgetComplianceRate: number;

  /** Current performance status */
  status: 'optimal' | 'degraded' | 'critical';

  /** Number of samples in calculation */
  sampleCount: number;

  /** Recent processing times */
  recentTimes: number[];
}

interface PerformanceAlert {
  /** Alert ID */
  id: string;

  /** Alert level */
  level: 'info' | 'warning' | 'critical';

  /** Alert type */
  type: 'tick_performance' | 'subsystem_performance' | 'trend_degradation' | 'budget_exceeded';

  /** Affected component */
  component: string;

  /** Alert message */
  message: string;

  /** Alert data */
  data: Record<string, any>;

  /** When alert was created */
  createdAt: Date;

  /** Is alert still active */
  active: boolean;
}

/**
 * Monitors and tracks simulation performance in real-time
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private tickHistory: TickResult[] = [];
  private subsystemHistory: Map<string, SubsystemResult[]> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private eventListeners: EngineEventListener[] = [];
  private alertIdCounter: number = 0;
  private isMonitoring: boolean = false;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      averageTickTime: 0,
      maxTickTime: 0,
      minTickTime: 0,
      status: 'optimal',
      targetComplianceRate: 100,
      trend: 'stable',
      subsystemMetrics: new Map(),
      lastUpdated: new Date()
    };
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('[PerformanceMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.metrics = this.initializeMetrics();
    this.tickHistory = [];
    this.subsystemHistory.clear();
    this.alerts.clear();

    console.log('[PerformanceMonitor] Performance monitoring started');

    this.emitEvent({
      type: 'PERFORMANCE_MONITORING_STARTED' as any,
      payload: { config: this.config }
    });
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    console.log('[PerformanceMonitor] Performance monitoring stopped');

    this.emitEvent({
      type: 'PERFORMANCE_MONITORING_STOPPED' as any,
      payload: { finalMetrics: this.metrics }
    });
  }

  /**
   * Record tick performance data
   */
  public recordTick(tickResult: TickResult): void {
    if (!this.isMonitoring) {
      return;
    }

    // Add to history
    this.tickHistory.push(tickResult);

    // Maintain window size
    if (this.tickHistory.length > this.config.monitoringWindow) {
      this.tickHistory.shift();
    }

    // Record subsystem results
    tickResult.subsystemResults.forEach(result => {
      this.recordSubsystemResult(result);
    });

    // Update metrics
    this.updateMetrics();

    // Check for performance issues
    this.checkPerformanceAlerts(tickResult);

    console.log(`[PerformanceMonitor] Recorded tick ${tickResult.tickNumber}: ${tickResult.tickTime.toFixed(2)}ms`);
  }

  /**
   * Record subsystem performance data
   */
  private recordSubsystemResult(result: SubsystemResult): void {
    if (!this.subsystemHistory.has(result.name)) {
      this.subsystemHistory.set(result.name, []);
    }

    const history = this.subsystemHistory.get(result.name)!;
    history.push(result);

    // Maintain window size
    if (history.length > this.config.monitoringWindow) {
      history.shift();
    }
  }

  /**
   * Update performance metrics based on recent data
   */
  private updateMetrics(): void {
    if (this.tickHistory.length === 0) {
      return;
    }

    // Calculate tick metrics
    const times = this.tickHistory.map(tick => tick.tickTime);
    this.metrics.averageTickTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    this.metrics.maxTickTime = Math.max(...times);
    this.metrics.minTickTime = Math.min(...times);

    // Calculate compliance rate
    const withinTarget = this.tickHistory.filter(tick => tick.passed).length;
    this.metrics.targetComplianceRate = (withinTarget / this.tickHistory.length) * 100;

    // Update status
    this.metrics.status = this.calculateOverallStatus();

    // Calculate trend
    this.metrics.trend = this.calculateTrend();

    // Update subsystem metrics
    this.updateSubsystemMetrics();

    this.metrics.lastUpdated = new Date();
  }

  /**
   * Update subsystem-specific metrics
   */
  private updateSubsystemMetrics(): void {
    this.metrics.subsystemMetrics.clear();

    for (const [subsystemName, history] of this.subsystemHistory.entries()) {
      if (history.length === 0) continue;

      const times = history.map(result => result.processingTime);
      const withinBudget = history.filter(result => result.withinBudget).length;
      const budget = history[0].timeBudget; // Assuming budget doesn't change

      const subsystemMetrics: SubsystemPerformanceMetrics = {
        name: subsystemName,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        timeBudget: budget,
        budgetComplianceRate: (withinBudget / history.length) * 100,
        status: this.calculateSubsystemStatus(subsystemName, history),
        sampleCount: history.length,
        recentTimes: times.slice(-10) // Last 10 samples
      };

      this.metrics.subsystemMetrics.set(subsystemName, subsystemMetrics);
    }
  }

  /**
   * Calculate overall performance status
   */
  private calculateOverallStatus(): 'optimal' | 'degraded' | 'critical' {
    const { maxTickTime, degradationThresholds } = this.config;

    if (this.metrics.averageTickTime > maxTickTime * (degradationThresholds.critical / 100)) {
      return 'critical';
    } else if (this.metrics.averageTickTime > maxTickTime * (degradationThresholds.warning / 100)) {
      return 'degraded';
    }

    return 'optimal';
  }

  /**
   * Calculate subsystem performance status
   */
  private calculateSubsystemStatus(
    subsystemName: string,
    history: SubsystemResult[]
  ): 'optimal' | 'degraded' | 'critical' {
    const budget = history[0].timeBudget;
    const times = history.map(result => result.processingTime);
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

    if (averageTime > budget * 1.5) {
      return 'critical';
    } else if (averageTime > budget * 1.2) {
      return 'degraded';
    }

    return 'optimal';
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.tickHistory.length < 10) {
      return 'stable';
    }

    // Compare recent half vs older half
    const halfPoint = Math.floor(this.tickHistory.length / 2);
    const olderHalf = this.tickHistory.slice(0, halfPoint);
    const recentHalf = this.tickHistory.slice(halfPoint);

    const olderAverage = olderHalf.reduce((sum, tick) => sum + tick.tickTime, 0) / olderHalf.length;
    const recentAverage = recentHalf.reduce((sum, tick) => sum + tick.tickTime, 0) / recentHalf.length;

    const difference = recentAverage - olderAverage;
    const threshold = this.config.maxTickTime * 0.05; // 5% threshold

    if (difference > threshold) {
      return 'degrading';
    } else if (difference < -threshold) {
      return 'improving';
    }

    return 'stable';
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(tickResult: TickResult): void {
    // Check tick performance
    this.checkTickPerformanceAlerts(tickResult);

    // Check subsystem performance
    tickResult.subsystemResults.forEach(result => {
      this.checkSubsystemPerformanceAlerts(result);
    });

    // Check trend alerts
    this.checkTrendAlerts();
  }

  /**
   * Check tick-level performance alerts
   */
  private checkTickPerformanceAlerts(tickResult: TickResult): void {
    const { maxTickTime, degradationThresholds } = this.config;

    // Critical performance alert
    if (tickResult.tickTime > maxTickTime) {
      this.createAlert({
        level: 'critical',
        type: 'tick_performance',
        component: 'TickManager',
        message: `Tick ${tickResult.tickNumber} exceeded maximum time budget`,
        data: {
          tickTime: tickResult.tickTime,
          maxTickTime,
          overrunAmount: tickResult.tickTime - maxTickTime
        }
      });
    }

    // Warning alert
    else if (tickResult.tickTime > maxTickTime * (degradationThresholds.warning / 100)) {
      this.createAlert({
        level: 'warning',
        type: 'tick_performance',
        component: 'TickManager',
        message: `Tick ${tickResult.tickNumber} approaching performance limit`,
        data: {
          tickTime: tickResult.tickTime,
          warningThreshold: maxTickTime * (degradationThresholds.warning / 100)
        }
      });
    }
  }

  /**
   * Check subsystem performance alerts
   */
  private checkSubsystemPerformanceAlerts(result: SubsystemResult): void {
    if (!result.withinBudget) {
      this.createAlert({
        level: 'warning',
        type: 'subsystem_performance',
        component: result.name,
        message: `Subsystem ${result.name} exceeded time budget`,
        data: {
          processingTime: result.processingTime,
          timeBudget: result.timeBudget,
          overrunAmount: result.processingTime - result.timeBudget
        }
      });
    }

    if (!result.success) {
      this.createAlert({
        level: 'critical',
        type: 'subsystem_performance',
        component: result.name,
        message: `Subsystem ${result.name} execution failed`,
        data: {
          metadata: result.metadata
        }
      });
    }
  }

  /**
   * Check for trend-based alerts
   */
  private checkTrendAlerts(): void {
    if (this.metrics.trend === 'degrading' && this.metrics.status !== 'optimal') {
      this.createAlert({
        level: 'warning',
        type: 'trend_degradation',
        component: 'PerformanceMonitor',
        message: 'Performance trend showing degradation',
        data: {
          averageTickTime: this.metrics.averageTickTime,
          trend: this.metrics.trend,
          status: this.metrics.status
        }
      });
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'createdAt' | 'active'>): void {
    const alert: PerformanceAlert = {
      ...alertData,
      id: `alert_${++this.alertIdCounter}`,
      createdAt: new Date(),
      active: true
    };

    this.alerts.set(alert.id, alert);

    // Emit alert event
    if (alert.level === 'critical') {
      this.emitEvent({
        type: 'PERFORMANCE_CRITICAL',
        payload: { subsystem: alert.component, time: 0, alert }
      });
    } else if (alert.level === 'warning') {
      this.emitEvent({
        type: 'PERFORMANCE_WARNING',
        payload: { subsystem: alert.component, time: 0, alert }
      });
    }

    console.log(`[PerformanceMonitor] ${alert.level.toUpperCase()} Alert: ${alert.message}`);
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get subsystem metrics for a specific subsystem
   */
  public getSubsystemMetrics(subsystemName: string): SubsystemPerformanceMetrics | undefined {
    return this.metrics.subsystemMetrics.get(subsystemName);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.active);
  }

  /**
   * Get performance summary for display
   */
  public getPerformanceSummary(): {
    overall: string;
    tickCompliance: string;
    subsystemStatus: string[];
    activeAlerts: number;
  } {
    const subsystemStatus = Array.from(this.metrics.subsystemMetrics.values())
      .map(metrics => `${metrics.name}: ${metrics.status} (${metrics.averageTime.toFixed(1)}ms)`);

    return {
      overall: `${this.metrics.status} (${this.metrics.averageTickTime.toFixed(2)}ms avg)`,
      tickCompliance: `${this.metrics.targetComplianceRate.toFixed(1)}% on-time`,
      subsystemStatus,
      activeAlerts: this.getActiveAlerts().length
    };
  }

  /**
   * Clear old alerts
   */
  public clearOldAlerts(maxAge: number = 30000): void {
    const cutoff = new Date(Date.now() - maxAge);

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.createdAt < cutoff) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Update performance configuration
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[PerformanceMonitor] Configuration updated');
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: EngineEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: EngineEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: EngineEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[PerformanceMonitor] Error in event listener:', error);
      }
    });
  }

  /**
   * Reset all metrics and history
   */
  public reset(): void {
    this.metrics = this.initializeMetrics();
    this.tickHistory = [];
    this.subsystemHistory.clear();
    this.alerts.clear();
    this.alertIdCounter = 0;

    console.log('[PerformanceMonitor] Metrics reset');
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    metrics: PerformanceMetrics;
    tickHistory: TickResult[];
    subsystemHistory: Record<string, SubsystemResult[]>;
    alerts: PerformanceAlert[];
  } {
    return {
      metrics: this.getMetrics(),
      tickHistory: [...this.tickHistory],
      subsystemHistory: Object.fromEntries(this.subsystemHistory.entries()),
      alerts: Array.from(this.alerts.values())
    };
  }
}