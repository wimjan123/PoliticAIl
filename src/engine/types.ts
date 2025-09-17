/**
 * Game Engine Types and Interfaces
 *
 * Core types for the political simulation engine including tick system,
 * performance monitoring, and subsystem coordination.
 */

import { Politician, Bloc, Policy, PoliticalLandscape } from '../types/entities';

// =====================================================
// Core Engine Types
// =====================================================

/**
 * Political entity union type for processing
 */
export type PoliticalEntity = Politician | Bloc | Policy;

/**
 * Simulation tick result with performance metrics
 */
export interface TickResult {
  /** Tick number in the simulation */
  tickNumber: number;

  /** Time taken to process this tick in milliseconds */
  tickTime: number;

  /** Number of entities processed in this tick */
  entitiesProcessed: number;

  /** Whether tick completed within performance target */
  passed: boolean;

  /** Individual subsystem performance results */
  subsystemResults: SubsystemResult[];

  /** Any errors or warnings during processing */
  issues: TickIssue[];

  /** Timestamp when tick completed */
  completedAt: Date;
}

/**
 * Individual subsystem processing result
 */
export interface SubsystemResult {
  /** Name of the subsystem */
  name: string;

  /** Time taken in milliseconds */
  processingTime: number;

  /** Number of entities processed */
  entitiesProcessed: number;

  /** Whether subsystem met its performance target */
  withinBudget: boolean;

  /** Allocated time budget in milliseconds */
  timeBudget: number;

  /** Success status */
  success: boolean;

  /** Any subsystem-specific data */
  metadata?: Record<string, any>;
}

/**
 * Tick processing issues and alerts
 */
export interface TickIssue {
  /** Issue severity level */
  level: 'info' | 'warning' | 'error';

  /** Affected subsystem */
  subsystem: string;

  /** Issue description */
  message: string;

  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Target maximum tick time in milliseconds */
  maxTickTime: number;

  /** Individual subsystem time budgets */
  subsystemBudgets: Map<string, number>;

  /** Performance degradation thresholds */
  degradationThresholds: {
    /** Warning threshold as percentage of max tick time */
    warning: number;

    /** Critical threshold as percentage of max tick time */
    critical: number;
  };

  /** Performance monitoring window size */
  monitoringWindow: number;
}

/**
 * Simulation state tracking
 */
export interface SimulationState {
  /** Current tick number */
  currentTick: number;

  /** Simulation start time */
  startTime: Date;

  /** Is simulation currently running */
  isRunning: boolean;

  /** Is simulation paused */
  isPaused: boolean;

  /** Total entities in simulation */
  totalEntities: number;

  /** Current political landscape */
  landscape: PoliticalLandscape;

  /** Performance metrics history */
  performanceHistory: TickResult[];

  /** Current performance status */
  performanceStatus: 'optimal' | 'degraded' | 'critical';
}

/**
 * Subsystem execution priority and dependencies
 */
export interface SubsystemConfig {
  /** Subsystem identifier */
  name: string;

  /** Execution priority (lower numbers run first) */
  priority: number;

  /** Subsystems that must complete before this one */
  dependencies: string[];

  /** Time budget in milliseconds */
  timeBudget: number;

  /** Can this subsystem run in parallel with others */
  canRunParallel: boolean;

  /** Scaling factor for performance degradation */
  scalingFactor: number;
}

/**
 * Inter-subsystem communication protocol
 */
export interface SubsystemMessage {
  /** Source subsystem */
  from: string;

  /** Target subsystem */
  to: string;

  /** Message type */
  type: 'data' | 'event' | 'command';

  /** Message payload */
  payload: Record<string, any>;

  /** Message priority */
  priority: 'low' | 'normal' | 'high';

  /** Message timestamp */
  timestamp: Date;
}

/**
 * Graceful degradation scaling options
 */
export interface DegradationSettings {
  /** Reduce entity processing complexity */
  reduceComplexity: boolean;

  /** Skip non-critical subsystems */
  skipNonCritical: boolean;

  /** Reduce update frequency for some systems */
  reduceFrequency: boolean;

  /** Batch similar operations */
  enableBatching: boolean;

  /** Use simplified algorithms */
  useSimplifiedAlgorithms: boolean;
}

// =====================================================
// Engine Event Types
// =====================================================

/**
 * Engine lifecycle events
 */
export type EngineEvent =
  | { type: 'TICK_START'; payload: { tickNumber: number } }
  | { type: 'TICK_COMPLETE'; payload: TickResult }
  | { type: 'PERFORMANCE_WARNING'; payload: { subsystem: string; time: number } }
  | { type: 'PERFORMANCE_CRITICAL'; payload: { subsystem: string; time: number } }
  | { type: 'DEGRADATION_ACTIVATED'; payload: DegradationSettings }
  | { type: 'SIMULATION_PAUSED'; payload: { reason: string } }
  | { type: 'SIMULATION_RESUMED'; payload: {} }
  | { type: 'ERROR'; payload: { error: Error; subsystem?: string } };

/**
 * Event listener callback type
 */
export type EngineEventListener = (event: EngineEvent) => void;