/**
 * Tick Manager - Core Simulation Timing System
 *
 * Implements deterministic simulation loop running at 1 tick per second
 * with precise timing and tick counter management.
 */

import {
  TickResult,
  SimulationState,
  PerformanceConfig,
  EngineEvent,
  EngineEventListener,
  TickIssue
} from './types';

/**
 * Manages the core simulation tick loop with precise timing
 */
export class TickManager {
  private tickInterval: NodeJS.Timeout | null = null;
  private currentTick: number = 0;
  private startTime: Date | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private eventListeners: EngineEventListener[] = [];
  private performanceConfig: PerformanceConfig;
  private lastTickTime: number = 0;
  private tickHistory: TickResult[] = [];
  private maxHistorySize: number = 100;

  constructor(performanceConfig: PerformanceConfig) {
    this.performanceConfig = performanceConfig;
  }

  /**
   * Start the simulation tick loop
   */
  public start(): void {
    if (this.isRunning) {
      this.emitEvent({ type: 'ERROR', payload: { error: new Error('Simulation already running') } });
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = new Date();
    this.currentTick = 0;

    // Use setInterval for consistent 1 tick per second timing
    this.tickInterval = setInterval(() => {
      if (!this.isPaused) {
        this.processTick();
      }
    }, 1000); // 1000ms = 1 second per tick

    console.log(`[TickManager] Simulation started at ${this.startTime.toISOString()}`);
  }

  /**
   * Stop the simulation tick loop
   */
  public stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.isRunning = false;
    this.isPaused = false;

    console.log(`[TickManager] Simulation stopped after ${this.currentTick} ticks`);
  }

  /**
   * Pause the simulation
   */
  public pause(reason: string = 'Manual pause'): void {
    if (!this.isRunning) {
      return;
    }

    this.isPaused = true;
    this.emitEvent({
      type: 'SIMULATION_PAUSED',
      payload: { reason }
    });

    console.log(`[TickManager] Simulation paused: ${reason}`);
  }

  /**
   * Resume the simulation
   */
  public resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.emitEvent({
      type: 'SIMULATION_RESUMED',
      payload: {}
    });

    console.log('[TickManager] Simulation resumed');
  }

  /**
   * Process a single simulation tick
   */
  private async processTick(): Promise<void> {
    const tickStartTime = performance.now();
    this.currentTick++;

    console.log(`[TickManager] Processing tick ${this.currentTick}`);

    // Emit tick start event
    this.emitEvent({
      type: 'TICK_START',
      payload: { tickNumber: this.currentTick }
    });

    try {
      // This will be expanded when we add subsystem processing
      const tickResult = await this.executeTickLogic();

      const tickEndTime = performance.now();
      const tickTime = tickEndTime - tickStartTime;

      // Create complete tick result
      const result: TickResult = {
        tickNumber: this.currentTick,
        tickTime,
        entitiesProcessed: 0, // Will be populated by subsystems
        passed: tickTime < this.performanceConfig.maxTickTime,
        subsystemResults: [],
        issues: [],
        completedAt: new Date()
      };

      // Check performance targets
      this.checkPerformanceTargets(result);

      // Store result in history
      this.updateTickHistory(result);

      // Emit tick complete event
      this.emitEvent({
        type: 'TICK_COMPLETE',
        payload: result
      });

      this.lastTickTime = tickTime;

      console.log(`[TickManager] Tick ${this.currentTick} completed in ${tickTime.toFixed(2)}ms`);

    } catch (error) {
      console.error(`[TickManager] Error processing tick ${this.currentTick}:`, error);

      this.emitEvent({
        type: 'ERROR',
        payload: { error: error as Error }
      });

      // Consider pausing simulation on critical errors
      if (error instanceof Error && error.message.includes('CRITICAL')) {
        this.pause('Critical error in tick processing');
      }
    }
  }

  /**
   * Execute the core tick logic (placeholder for subsystem integration)
   */
  private async executeTickLogic(): Promise<void> {
    // Placeholder for actual subsystem processing
    // This will be replaced when SubsystemCoordinator is integrated

    // Simulate some processing time for testing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  }

  /**
   * Check if tick met performance targets and emit warnings
   */
  private checkPerformanceTargets(result: TickResult): void {
    const { maxTickTime, degradationThresholds } = this.performanceConfig;

    // Check overall tick performance
    if (result.tickTime > maxTickTime) {
      result.issues.push({
        level: 'error',
        subsystem: 'TickManager',
        message: `Tick exceeded maximum time: ${result.tickTime.toFixed(2)}ms > ${maxTickTime}ms`
      });
    } else if (result.tickTime > maxTickTime * (degradationThresholds.critical / 100)) {
      result.issues.push({
        level: 'warning',
        subsystem: 'TickManager',
        message: `Tick approaching critical performance threshold: ${result.tickTime.toFixed(2)}ms`
      });

      this.emitEvent({
        type: 'PERFORMANCE_CRITICAL',
        payload: { subsystem: 'TickManager', time: result.tickTime }
      });
    } else if (result.tickTime > maxTickTime * (degradationThresholds.warning / 100)) {
      result.issues.push({
        level: 'warning',
        subsystem: 'TickManager',
        message: `Tick performance degrading: ${result.tickTime.toFixed(2)}ms`
      });

      this.emitEvent({
        type: 'PERFORMANCE_WARNING',
        payload: { subsystem: 'TickManager', time: result.tickTime }
      });
    }
  }

  /**
   * Update tick history with rolling window
   */
  private updateTickHistory(result: TickResult): void {
    this.tickHistory.push(result);

    // Maintain history size limit
    if (this.tickHistory.length > this.maxHistorySize) {
      this.tickHistory.shift();
    }
  }

  /**
   * Get current simulation state
   */
  public getSimulationState(): Partial<SimulationState> {
    return {
      currentTick: this.currentTick,
      startTime: this.startTime || new Date(),
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      performanceHistory: [...this.tickHistory],
      performanceStatus: this.getPerformanceStatus()
    };
  }

  /**
   * Calculate current performance status based on recent ticks
   */
  private getPerformanceStatus(): 'optimal' | 'degraded' | 'critical' {
    if (this.tickHistory.length === 0) {
      return 'optimal';
    }

    const recentTicks = this.tickHistory.slice(-10); // Last 10 ticks
    const averageTime = recentTicks.reduce((sum, tick) => sum + tick.tickTime, 0) / recentTicks.length;

    const { maxTickTime, degradationThresholds } = this.performanceConfig;

    if (averageTime > maxTickTime * (degradationThresholds.critical / 100)) {
      return 'critical';
    } else if (averageTime > maxTickTime * (degradationThresholds.warning / 100)) {
      return 'degraded';
    }

    return 'optimal';
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    averageTickTime: number;
    maxTickTime: number;
    minTickTime: number;
    totalTicks: number;
    ticksOverBudget: number;
  } {
    if (this.tickHistory.length === 0) {
      return {
        averageTickTime: 0,
        maxTickTime: 0,
        minTickTime: 0,
        totalTicks: 0,
        ticksOverBudget: 0
      };
    }

    const times = this.tickHistory.map(tick => tick.tickTime);
    const ticksOverBudget = this.tickHistory.filter(tick => !tick.passed).length;

    return {
      averageTickTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      maxTickTime: Math.max(...times),
      minTickTime: Math.min(...times),
      totalTicks: this.tickHistory.length,
      ticksOverBudget
    };
  }

  /**
   * Add event listener for engine events
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
   * Emit engine event to all listeners
   */
  private emitEvent(event: EngineEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[TickManager] Error in event listener:', error);
      }
    });
  }

  /**
   * Update performance configuration
   */
  public updatePerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.performanceConfig = { ...this.performanceConfig, ...config };
    console.log('[TickManager] Performance configuration updated');
  }

  /**
   * Get current tick number
   */
  public getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Get last tick processing time
   */
  public getLastTickTime(): number {
    return this.lastTickTime;
  }

  /**
   * Check if simulation is running
   */
  public isSimulationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if simulation is paused
   */
  public isSimulationPaused(): boolean {
    return this.isPaused;
  }
}