/**
 * Prototype Simulation - Main Simulation Engine
 *
 * Integrates all simulation components including tick management,
 * subsystem coordination, performance monitoring, and graceful degradation.
 */

import { TickManager } from '../engine/TickManager';
import { SubsystemCoordinator } from '../engine/SubsystemCoordinator';
import { PerformanceMonitor } from '../engine/PerformanceMonitor';
import { DegradationManager } from '../engine/DegradationManager';

import { PoliticalEntitySubsystem } from './subsystems/PoliticalEntitySubsystem';
import { RelationshipSubsystem } from './subsystems/RelationshipSubsystem';
import { EventSubsystem } from './subsystems/EventSubsystem';
import { DecisionSubsystem } from './subsystems/DecisionSubsystem';

import {
  TickResult,
  PerformanceConfig,
  SimulationState,
  EngineEvent,
  EngineEventListener
} from '../engine/types';

import { Politician, Bloc, Policy, PoliticalLandscape } from '../types/entities';

interface SimulationConfig {
  /** Performance configuration */
  performance: PerformanceConfig;

  /** Auto-start simulation on initialization */
  autoStart: boolean;

  /** Enable performance monitoring */
  enableMonitoring: boolean;

  /** Enable graceful degradation */
  enableDegradation: boolean;

  /** Initial political entities */
  initialEntities: {
    politicians: Politician[];
    blocs: Bloc[];
    policies: Policy[];
  };
}

/**
 * Main simulation engine integrating all components
 */
export class PrototypeSimulation {
  private config: SimulationConfig;
  private tickManager: TickManager;
  private subsystemCoordinator: SubsystemCoordinator;
  private performanceMonitor: PerformanceMonitor;
  private degradationManager: DegradationManager;

  private politicians: Politician[] = [];
  private blocs: Bloc[] = [];
  private policies: Policy[] = [];

  private eventListeners: EngineEventListener[] = [];
  private isInitialized: boolean = false;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = this.createDefaultConfig(config);

    // Initialize core components
    this.tickManager = new TickManager(this.config.performance);
    this.subsystemCoordinator = new SubsystemCoordinator();
    this.performanceMonitor = new PerformanceMonitor(this.config.performance);
    this.degradationManager = new DegradationManager(this.config.performance);

    // Set up event connections
    this.setupEventHandlers();

    console.log('[PrototypeSimulation] Simulation engine initialized');
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(config: Partial<SimulationConfig>): SimulationConfig {
    const defaultPerformanceConfig: PerformanceConfig = {
      maxTickTime: 100, // 100ms target from research
      subsystemBudgets: new Map([
        ['PoliticalEntitySubsystem', 20],
        ['RelationshipSubsystem', 10],
        ['EventSubsystem', 15],
        ['DecisionSubsystem', 25]
      ]),
      degradationThresholds: {
        warning: 70,   // 70% of max tick time
        critical: 90   // 90% of max tick time
      },
      monitoringWindow: 20 // Last 20 ticks
    };

    return {
      performance: { ...defaultPerformanceConfig, ...config.performance },
      autoStart: config.autoStart ?? false,
      enableMonitoring: config.enableMonitoring ?? true,
      enableDegradation: config.enableDegradation ?? true,
      initialEntities: config.initialEntities ?? {
        politicians: [],
        blocs: [],
        policies: []
      }
    };
  }

  /**
   * Set up event handlers between components
   */
  private setupEventHandlers(): void {
    // Connect tick manager to performance monitor
    this.tickManager.addEventListener((event: EngineEvent) => {
      if (event.type === 'TICK_COMPLETE') {
        if (this.config.enableMonitoring) {
          this.performanceMonitor.recordTick(event.payload);
        }
      }

      // Forward to external listeners
      this.emitEvent(event);
    });

    // Connect subsystem coordinator events
    this.subsystemCoordinator.addEventListener((event: EngineEvent) => {
      this.emitEvent(event);
    });

    // Connect performance monitor events
    this.performanceMonitor.addEventListener((event: EngineEvent) => {
      if (this.config.enableDegradation) {
        // Performance events may trigger degradation
        if (event.type === 'PERFORMANCE_WARNING' || event.type === 'PERFORMANCE_CRITICAL') {
          this.evaluateDegradation();
        }
      }

      this.emitEvent(event);
    });

    // Connect degradation manager events
    this.degradationManager.addEventListener((event: EngineEvent) => {
      this.emitEvent(event);
    });
  }

  /**
   * Initialize simulation with entities and subsystems
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[PrototypeSimulation] Already initialized');
      return;
    }

    console.log('[PrototypeSimulation] Initializing simulation...');

    try {
      // Load initial entities
      this.politicians = [...this.config.initialEntities.politicians];
      this.blocs = [...this.config.initialEntities.blocs];
      this.policies = [...this.config.initialEntities.policies];

      // Register subsystems
      this.registerSubsystems();

      // Integrate tick manager with subsystem coordinator
      this.integrateTickManager();

      // Start monitoring if enabled
      if (this.config.enableMonitoring) {
        this.performanceMonitor.startMonitoring();
      }

      this.isInitialized = true;

      console.log(`[PrototypeSimulation] Initialized with ${this.getTotalEntityCount()} entities`);

      // Auto-start if configured
      if (this.config.autoStart) {
        this.start();
      }

    } catch (error) {
      console.error('[PrototypeSimulation] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register simulation subsystems
   */
  private registerSubsystems(): void {
    // Create and register subsystems in dependency order
    const politicalEntitySubsystem = new PoliticalEntitySubsystem();
    const relationshipSubsystem = new RelationshipSubsystem();
    const eventSubsystem = new EventSubsystem();
    const decisionSubsystem = new DecisionSubsystem();

    this.subsystemCoordinator.registerSubsystem(politicalEntitySubsystem);
    this.subsystemCoordinator.registerSubsystem(relationshipSubsystem);
    this.subsystemCoordinator.registerSubsystem(eventSubsystem);
    this.subsystemCoordinator.registerSubsystem(decisionSubsystem);

    console.log('[PrototypeSimulation] Registered 4 simulation subsystems');
  }

  /**
   * Integrate tick manager with subsystem processing
   */
  private integrateTickManager(): void {
    // Replace the placeholder tick logic with actual subsystem execution
    const originalProcessTick = (this.tickManager as any).executeTickLogic;

    (this.tickManager as any).executeTickLogic = async (): Promise<void> => {
      // Execute all subsystems for this tick
      const result = await this.subsystemCoordinator.executeSubsystems(
        this.politicians,
        this.blocs,
        this.policies,
        this.tickManager.getCurrentTick()
      );

      // Apply degradation evaluation
      if (this.config.enableDegradation) {
        this.evaluateDegradation();
      }

      // Clean up old performance data
      this.performanceMonitor.clearOldAlerts();

      // Update subsystem configurations based on degradation
      this.applyDegradationToSubsystems();

      // Log detailed results
      console.log(`[PrototypeSimulation] Tick ${this.tickManager.getCurrentTick()} processed ${result.results.length} subsystems in ${result.totalTime.toFixed(2)}ms`);

      if (result.issues.length > 0) {
        console.warn(`[PrototypeSimulation] Tick had ${result.issues.length} issues:`, result.issues);
      }
    };
  }

  /**
   * Evaluate degradation based on current performance
   */
  private evaluateDegradation(): void {
    const performanceMetrics = this.performanceMonitor.getMetrics();
    const recentTicks = this.tickManager.getSimulationState().performanceHistory || [];

    if (recentTicks.length > 0) {
      const recentTimes = recentTicks.slice(-10).map(tick => tick.tickTime);
      this.degradationManager.evaluatePerformance(recentTimes, performanceMetrics.subsystemMetrics);
    }
  }

  /**
   * Apply degradation settings to subsystems
   */
  private applyDegradationToSubsystems(): void {
    const subsystemNames = this.subsystemCoordinator.getSubsystems();

    for (const subsystemName of subsystemNames) {
      const config = this.subsystemCoordinator.getSubsystemConfig(subsystemName);
      if (config) {
        const scaledConfig = this.degradationManager.getScaledSubsystemConfig(config);

        // Update performance budget
        const newBudget = this.degradationManager.getPerformanceBudget(
          subsystemName,
          config.timeBudget
        );

        if (newBudget !== config.timeBudget) {
          this.subsystemCoordinator.updateSubsystemBudget(subsystemName, newBudget);
        }
      }
    }
  }

  /**
   * Start the simulation
   */
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('Simulation must be initialized before starting');
    }

    console.log('[PrototypeSimulation] Starting simulation...');
    this.tickManager.start();
  }

  /**
   * Stop the simulation
   */
  public stop(): void {
    console.log('[PrototypeSimulation] Stopping simulation...');
    this.tickManager.stop();

    if (this.config.enableMonitoring) {
      this.performanceMonitor.stopMonitoring();
    }
  }

  /**
   * Pause the simulation
   */
  public pause(reason: string = 'Manual pause'): void {
    this.tickManager.pause(reason);
  }

  /**
   * Resume the simulation
   */
  public resume(): void {
    this.tickManager.resume();
  }

  /**
   * Process a single tick manually
   */
  public async processTick(): Promise<TickResult> {
    if (!this.isInitialized) {
      throw new Error('Simulation must be initialized before processing ticks');
    }

    const startTime = performance.now();
    const currentTick = this.tickManager.getCurrentTick() + 1;

    console.log(`[PrototypeSimulation] Processing manual tick ${currentTick}`);

    try {
      // Execute subsystems
      const result = await this.subsystemCoordinator.executeSubsystems(
        this.politicians,
        this.blocs,
        this.policies,
        currentTick
      );

      const tickTime = performance.now() - startTime;

      const tickResult: TickResult = {
        tickNumber: currentTick,
        tickTime,
        entitiesProcessed: this.getTotalEntityCount(),
        passed: tickTime < this.config.performance.maxTickTime,
        subsystemResults: result.results,
        issues: result.issues,
        completedAt: new Date()
      };

      // Record performance if monitoring is enabled
      if (this.config.enableMonitoring) {
        this.performanceMonitor.recordTick(tickResult);
      }

      return tickResult;

    } catch (error) {
      console.error('[PrototypeSimulation] Manual tick processing failed:', error);
      throw error;
    }
  }

  /**
   * Add entities to the simulation
   */
  public addEntities(entities: {
    politicians?: Politician[];
    blocs?: Bloc[];
    policies?: Policy[];
  }): void {
    if (entities.politicians) {
      this.politicians.push(...entities.politicians);
    }

    if (entities.blocs) {
      this.blocs.push(...entities.blocs);
    }

    if (entities.policies) {
      this.policies.push(...entities.policies);
    }

    console.log(`[PrototypeSimulation] Added entities. Total: ${this.getTotalEntityCount()}`);
  }

  /**
   * Get current simulation status
   */
  public getStatus(): {
    isRunning: boolean;
    isPaused: boolean;
    currentTick: number;
    totalEntities: number;
    performance: any;
    degradation: any;
  } {
    const tickManagerState = this.tickManager.getSimulationState();
    const performanceMetrics = this.config.enableMonitoring
      ? this.performanceMonitor.getMetrics()
      : null;
    const degradationStatus = this.config.enableDegradation
      ? this.degradationManager.getDegradationStatus()
      : null;

    return {
      isRunning: this.tickManager.isSimulationRunning(),
      isPaused: this.tickManager.isSimulationPaused(),
      currentTick: this.tickManager.getCurrentTick(),
      totalEntities: this.getTotalEntityCount(),
      performance: performanceMetrics ? {
        averageTickTime: performanceMetrics.averageTickTime,
        status: performanceMetrics.status,
        compliance: performanceMetrics.targetComplianceRate
      } : null,
      degradation: degradationStatus
    };
  }

  /**
   * Get current political landscape
   */
  public getPoliticalLandscape(): PoliticalLandscape {
    return {
      politicians: [...this.politicians],
      blocs: [...this.blocs],
      policies: [...this.policies],
      climate: {
        public_trust: 60, // Default values
        economic_conditions: 'fair',
        dominant_issues: ['economic'],
        stability: 70
      },
      timestamp: new Date()
    };
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): any {
    if (!this.config.enableMonitoring) {
      return null;
    }

    return this.performanceMonitor.getPerformanceSummary();
  }

  /**
   * Get total entity count
   */
  private getTotalEntityCount(): number {
    return this.politicians.length + this.blocs.length + this.policies.length;
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
        console.error('[PrototypeSimulation] Error in event listener:', error);
      }
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.performance) {
      this.tickManager.updatePerformanceConfig(newConfig.performance);
      this.performanceMonitor.updateConfig(newConfig.performance);
      this.degradationManager.updateConfig(newConfig.performance);
    }

    console.log('[PrototypeSimulation] Configuration updated');
  }

  /**
   * Reset to optimal performance
   */
  public resetPerformance(): void {
    if (this.config.enableDegradation) {
      this.degradationManager.resetToOptimal();
    }

    if (this.config.enableMonitoring) {
      this.performanceMonitor.reset();
    }

    console.log('[PrototypeSimulation] Performance reset to optimal');
  }

  /**
   * Export simulation data for analysis
   */
  public exportData(): {
    entities: PoliticalLandscape;
    performance: any;
    configuration: SimulationConfig;
    status: any;
  } {
    return {
      entities: this.getPoliticalLandscape(),
      performance: this.config.enableMonitoring ? this.performanceMonitor.exportData() : null,
      configuration: this.config,
      status: this.getStatus()
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stop();
    this.eventListeners = [];
    console.log('[PrototypeSimulation] Cleanup completed');
  }
}