/**
 * Subsystem Coordinator - Parallel Processing Manager
 *
 * Manages parallel execution of simulation subsystems with dependency resolution,
 * communication protocols, and performance budgeting.
 */

import {
  SubsystemConfig,
  SubsystemResult,
  SubsystemMessage,
  TickIssue,
  PoliticalEntity,
  EngineEvent,
  EngineEventListener
} from './types';

import { Politician, Bloc, Policy } from '../types/entities';

/**
 * Abstract base class for simulation subsystems
 */
export abstract class SimulationSubsystem {
  public readonly name: string;
  protected config: SubsystemConfig;
  protected messageQueue: SubsystemMessage[] = [];
  protected eventListeners: EngineEventListener[] = [];

  constructor(name: string, config: SubsystemConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Process entities for this tick
   */
  abstract processEntities(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<SubsystemResult>;

  /**
   * Send message to another subsystem
   */
  protected sendMessage(message: Omit<SubsystemMessage, 'from' | 'timestamp'>): void {
    const fullMessage: SubsystemMessage = {
      ...message,
      from: this.name,
      timestamp: new Date()
    };

    // This will be handled by SubsystemCoordinator
    this.emitEvent({
      type: 'SUBSYSTEM_MESSAGE' as any,
      payload: fullMessage
    });
  }

  /**
   * Receive message from another subsystem
   */
  public receiveMessage(message: SubsystemMessage): void {
    this.messageQueue.push(message);
  }

  /**
   * Get and clear pending messages
   */
  protected getPendingMessages(): SubsystemMessage[] {
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    return messages;
  }

  /**
   * Get subsystem configuration
   */
  public getConfig(): SubsystemConfig {
    return { ...this.config };
  }

  /**
   * Update subsystem configuration
   */
  public updateConfig(updates: Partial<SubsystemConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: EngineEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Emit event to listeners
   */
  protected emitEvent(event: EngineEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`[${this.name}] Error in event listener:`, error);
      }
    });
  }
}

/**
 * Coordinates execution of multiple subsystems with dependency resolution
 */
export class SubsystemCoordinator {
  private subsystems: Map<string, SimulationSubsystem> = new Map();
  private executionOrder: string[] = [];
  private messageRouter: Map<string, SubsystemMessage[]> = new Map();
  private eventListeners: EngineEventListener[] = [];
  private performanceBudgets: Map<string, number> = new Map();

  /**
   * Register a subsystem for processing
   */
  public registerSubsystem(subsystem: SimulationSubsystem): void {
    const config = subsystem.getConfig();

    this.subsystems.set(config.name, subsystem);
    this.performanceBudgets.set(config.name, config.timeBudget);

    // Set up message routing
    this.messageRouter.set(config.name, []);

    // Connect subsystem events to coordinator
    subsystem.addEventListener((event: EngineEvent) => {
      if ((event as any).type === 'SUBSYSTEM_MESSAGE') {
        this.routeMessage((event as any).payload);
      } else {
        this.emitEvent(event);
      }
    });

    // Recalculate execution order
    this.calculateExecutionOrder();

    console.log(`[SubsystemCoordinator] Registered subsystem: ${config.name}`);
  }

  /**
   * Remove a subsystem
   */
  public unregisterSubsystem(name: string): void {
    this.subsystems.delete(name);
    this.performanceBudgets.delete(name);
    this.messageRouter.delete(name);
    this.calculateExecutionOrder();

    console.log(`[SubsystemCoordinator] Unregistered subsystem: ${name}`);
  }

  /**
   * Execute all subsystems for a tick
   */
  public async executeSubsystems(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<{
    results: SubsystemResult[];
    totalTime: number;
    issues: TickIssue[];
  }> {
    const startTime = performance.now();
    const results: SubsystemResult[] = [];
    const issues: TickIssue[] = [];

    console.log(`[SubsystemCoordinator] Executing ${this.subsystems.size} subsystems for tick ${tickNumber}`);

    try {
      // Group subsystems by execution waves based on dependencies
      const executionWaves = this.planExecutionWaves();

      for (const wave of executionWaves) {
        // Execute subsystems in parallel within each wave
        const wavePromises = wave.map(async (subsystemName) => {
          const subsystem = this.subsystems.get(subsystemName);
          if (!subsystem) {
            throw new Error(`Subsystem not found: ${subsystemName}`);
          }

          return this.executeSubsystem(subsystem, politicians, blocs, policies, tickNumber);
        });

        // Wait for all subsystems in this wave to complete
        const waveResults = await Promise.all(wavePromises);
        results.push(...waveResults);

        // Check for issues in this wave
        waveResults.forEach(result => {
          if (!result.withinBudget) {
            issues.push({
              level: 'warning',
              subsystem: result.name,
              message: `Subsystem exceeded time budget: ${result.processingTime.toFixed(2)}ms > ${result.timeBudget}ms`
            });
          }

          if (!result.success) {
            issues.push({
              level: 'error',
              subsystem: result.name,
              message: 'Subsystem execution failed',
              context: result.metadata
            });
          }
        });

        // Process inter-subsystem messages after each wave
        this.processMessages();
      }

    } catch (error) {
      issues.push({
        level: 'error',
        subsystem: 'SubsystemCoordinator',
        message: `Failed to execute subsystems: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: { error }
      });
    }

    const totalTime = performance.now() - startTime;

    console.log(`[SubsystemCoordinator] Completed execution in ${totalTime.toFixed(2)}ms`);

    return { results, totalTime, issues };
  }

  /**
   * Execute a single subsystem with performance monitoring
   */
  private async executeSubsystem(
    subsystem: SimulationSubsystem,
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<SubsystemResult> {
    const config = subsystem.getConfig();
    const startTime = performance.now();

    console.log(`[SubsystemCoordinator] Executing subsystem: ${config.name}`);

    try {
      const result = await subsystem.processEntities(politicians, blocs, policies, tickNumber);
      const actualTime = performance.now() - startTime;

      // Override timing with actual measurement
      const finalResult: SubsystemResult = {
        ...result,
        processingTime: actualTime,
        withinBudget: actualTime <= config.timeBudget,
        timeBudget: config.timeBudget
      };

      // Emit performance events
      if (!finalResult.withinBudget) {
        this.emitEvent({
          type: 'PERFORMANCE_WARNING',
          payload: { subsystem: config.name, time: actualTime }
        });
      }

      console.log(`[SubsystemCoordinator] ${config.name} completed in ${actualTime.toFixed(2)}ms`);

      return finalResult;

    } catch (error) {
      const actualTime = performance.now() - startTime;

      console.error(`[SubsystemCoordinator] ${config.name} failed:`, error);

      return {
        name: config.name,
        processingTime: actualTime,
        entitiesProcessed: 0,
        withinBudget: actualTime <= config.timeBudget,
        timeBudget: config.timeBudget,
        success: false,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Calculate execution order based on dependencies
   */
  private calculateExecutionOrder(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string): void => {
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving: ${name}`);
      }

      if (visited.has(name)) {
        return;
      }

      visiting.add(name);

      const subsystem = this.subsystems.get(name);
      if (subsystem) {
        const config = subsystem.getConfig();
        config.dependencies.forEach(dep => {
          if (this.subsystems.has(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    // Visit all subsystems
    for (const name of this.subsystems.keys()) {
      visit(name);
    }

    this.executionOrder = order;

    console.log(`[SubsystemCoordinator] Execution order: ${order.join(' -> ')}`);
  }

  /**
   * Plan execution waves for parallel processing
   */
  private planExecutionWaves(): string[][] {
    const waves: string[][] = [];
    const processed = new Set<string>();

    while (processed.size < this.subsystems.size) {
      const currentWave: string[] = [];

      // Find all subsystems whose dependencies are satisfied
      for (const name of this.subsystems.keys()) {
        if (processed.has(name)) {
          continue;
        }

        const subsystem = this.subsystems.get(name);
        if (!subsystem) continue;

        const config = subsystem.getConfig();
        const dependenciesSatisfied = config.dependencies.every(dep => processed.has(dep));

        if (dependenciesSatisfied && config.canRunParallel) {
          currentWave.push(name);
        }
      }

      // If no parallel subsystems available, add the first sequential one
      if (currentWave.length === 0) {
        for (const name of this.subsystems.keys()) {
          if (!processed.has(name)) {
            const subsystem = this.subsystems.get(name);
            if (subsystem) {
              const config = subsystem.getConfig();
              const dependenciesSatisfied = config.dependencies.every(dep => processed.has(dep));

              if (dependenciesSatisfied) {
                currentWave.push(name);
                break;
              }
            }
          }
        }
      }

      if (currentWave.length === 0) {
        throw new Error('Unable to resolve subsystem dependencies');
      }

      waves.push(currentWave);
      currentWave.forEach(name => processed.add(name));
    }

    console.log(`[SubsystemCoordinator] Planned ${waves.length} execution waves:`, waves);

    return waves;
  }

  /**
   * Route message between subsystems
   */
  private routeMessage(message: SubsystemMessage): void {
    const targetMessages = this.messageRouter.get(message.to);
    if (targetMessages) {
      targetMessages.push(message);
    }
  }

  /**
   * Process and deliver messages to subsystems
   */
  private processMessages(): void {
    for (const [subsystemName, messages] of this.messageRouter.entries()) {
      if (messages.length > 0) {
        const subsystem = this.subsystems.get(subsystemName);
        if (subsystem) {
          messages.forEach(message => subsystem.receiveMessage(message));
        }

        // Clear processed messages
        this.messageRouter.set(subsystemName, []);
      }
    }
  }

  /**
   * Get registered subsystems
   */
  public getSubsystems(): string[] {
    return Array.from(this.subsystems.keys());
  }

  /**
   * Get subsystem configuration
   */
  public getSubsystemConfig(name: string): SubsystemConfig | undefined {
    const subsystem = this.subsystems.get(name);
    return subsystem?.getConfig();
  }

  /**
   * Update subsystem performance budget
   */
  public updateSubsystemBudget(name: string, timeBudget: number): void {
    const subsystem = this.subsystems.get(name);
    if (subsystem) {
      subsystem.updateConfig({ timeBudget });
      this.performanceBudgets.set(name, timeBudget);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: EngineEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: EngineEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SubsystemCoordinator] Error in event listener:', error);
      }
    });
  }
}