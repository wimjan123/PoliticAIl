/**
 * Degradation Manager - Graceful Performance Degradation
 *
 * Manages graceful degradation under high load with performance budget
 * enforcement and dynamic complexity scaling.
 */

import {
  DegradationSettings,
  PerformanceConfig,
  SubsystemConfig,
  EngineEvent,
  EngineEventListener
} from './types';

interface DegradationLevel {
  /** Degradation level identifier */
  level: number;

  /** Level name */
  name: string;

  /** Performance threshold that triggers this level */
  threshold: number;

  /** Settings to apply at this level */
  settings: DegradationSettings;

  /** Description of changes */
  description: string;
}

interface ScalingRule {
  /** Rule identifier */
  id: string;

  /** Subsystem this rule applies to */
  subsystem: string;

  /** Performance metric to monitor */
  metric: 'average_time' | 'max_time' | 'compliance_rate';

  /** Threshold value */
  threshold: number;

  /** Scaling action */
  action: 'reduce_complexity' | 'skip_processing' | 'batch_operations' | 'simplify_algorithms';

  /** Scaling factor (0.1 to 1.0) */
  scalingFactor: number;

  /** Is rule currently active */
  active: boolean;
}

interface DegradationState {
  /** Current degradation level */
  currentLevel: number;

  /** When degradation was activated */
  activatedAt: Date | null;

  /** Current degradation settings */
  settings: DegradationSettings;

  /** Active scaling rules */
  activeRules: Set<string>;

  /** Original subsystem configurations */
  originalConfigs: Map<string, SubsystemConfig>;

  /** Performance history that triggered degradation */
  triggerHistory: number[];
}

/**
 * Manages graceful performance degradation and recovery
 */
export class DegradationManager {
  private performanceConfig: PerformanceConfig;
  private degradationLevels: DegradationLevel[];
  private scalingRules: Map<string, ScalingRule> = new Map();
  private currentState: DegradationState;
  private eventListeners: EngineEventListener[] = [];
  private ruleIdCounter: number = 0;

  constructor(performanceConfig: PerformanceConfig) {
    this.performanceConfig = performanceConfig;
    this.degradationLevels = this.initializeDegradationLevels();
    this.currentState = this.initializeState();
    this.initializeDefaultScalingRules();
  }

  /**
   * Initialize degradation levels
   */
  private initializeDegradationLevels(): DegradationLevel[] {
    const { maxTickTime, degradationThresholds } = this.performanceConfig;

    return [
      {
        level: 0,
        name: 'Optimal',
        threshold: 0,
        settings: {
          reduceComplexity: false,
          skipNonCritical: false,
          reduceFrequency: false,
          enableBatching: false,
          useSimplifiedAlgorithms: false
        },
        description: 'Normal operation with full features'
      },
      {
        level: 1,
        name: 'Light Degradation',
        threshold: maxTickTime * (degradationThresholds.warning / 100),
        settings: {
          reduceComplexity: true,
          skipNonCritical: false,
          reduceFrequency: false,
          enableBatching: true,
          useSimplifiedAlgorithms: false
        },
        description: 'Reduced complexity calculations and batched operations'
      },
      {
        level: 2,
        name: 'Moderate Degradation',
        threshold: maxTickTime * (degradationThresholds.critical / 100),
        settings: {
          reduceComplexity: true,
          skipNonCritical: true,
          reduceFrequency: true,
          enableBatching: true,
          useSimplifiedAlgorithms: true
        },
        description: 'Skip non-critical systems and use simplified algorithms'
      },
      {
        level: 3,
        name: 'Severe Degradation',
        threshold: maxTickTime,
        settings: {
          reduceComplexity: true,
          skipNonCritical: true,
          reduceFrequency: true,
          enableBatching: true,
          useSimplifiedAlgorithms: true
        },
        description: 'Minimal processing to maintain core functionality'
      }
    ];
  }

  /**
   * Initialize degradation state
   */
  private initializeState(): DegradationState {
    return {
      currentLevel: 0,
      activatedAt: null,
      settings: this.degradationLevels[0].settings,
      activeRules: new Set(),
      originalConfigs: new Map(),
      triggerHistory: []
    };
  }

  /**
   * Initialize default scaling rules
   */
  private initializeDefaultScalingRules(): void {
    // Add default scaling rules for common scenarios
    this.addScalingRule({
      subsystem: 'PoliticalEntitySubsystem',
      metric: 'average_time',
      threshold: 25, // 25ms threshold
      action: 'reduce_complexity',
      scalingFactor: 0.7
    });

    this.addScalingRule({
      subsystem: 'RelationshipSubsystem',
      metric: 'average_time',
      threshold: 15, // 15ms threshold
      action: 'batch_operations',
      scalingFactor: 0.8
    });

    this.addScalingRule({
      subsystem: 'EventSubsystem',
      metric: 'compliance_rate',
      threshold: 50, // 50% compliance rate
      action: 'skip_processing',
      scalingFactor: 0.5
    });

    this.addScalingRule({
      subsystem: 'DecisionSubsystem',
      metric: 'max_time',
      threshold: 35, // 35ms max time
      action: 'simplify_algorithms',
      scalingFactor: 0.6
    });
  }

  /**
   * Add a scaling rule
   */
  public addScalingRule(rule: Omit<ScalingRule, 'id' | 'active'>): string {
    const fullRule: ScalingRule = {
      ...rule,
      id: `rule_${++this.ruleIdCounter}`,
      active: false
    };

    this.scalingRules.set(fullRule.id, fullRule);

    console.log(`[DegradationManager] Added scaling rule: ${fullRule.id} for ${fullRule.subsystem}`);

    return fullRule.id;
  }

  /**
   * Evaluate performance and adjust degradation level
   */
  public evaluatePerformance(recentTickTimes: number[], subsystemMetrics: Map<string, any>): void {
    if (recentTickTimes.length === 0) {
      return;
    }

    // Calculate average recent performance
    const averageTime = recentTickTimes.reduce((sum, time) => sum + time, 0) / recentTickTimes.length;

    // Determine appropriate degradation level
    const newLevel = this.determineDegradationLevel(averageTime);

    // Apply degradation changes if needed
    if (newLevel !== this.currentState.currentLevel) {
      this.applyDegradationLevel(newLevel, averageTime);
    }

    // Evaluate and apply scaling rules
    this.evaluateScalingRules(subsystemMetrics);

    // Store performance history
    this.currentState.triggerHistory.push(averageTime);
    if (this.currentState.triggerHistory.length > 10) {
      this.currentState.triggerHistory.shift();
    }
  }

  /**
   * Determine appropriate degradation level based on performance
   */
  private determineDegradationLevel(averageTime: number): number {
    // Find the highest level that should be activated
    let targetLevel = 0;

    for (let i = this.degradationLevels.length - 1; i >= 0; i--) {
      if (averageTime >= this.degradationLevels[i].threshold) {
        targetLevel = i;
        break;
      }
    }

    // Add hysteresis to prevent oscillation
    if (targetLevel < this.currentState.currentLevel) {
      // Only reduce degradation if performance is significantly better
      const hysteresisThreshold = this.degradationLevels[this.currentState.currentLevel].threshold * 0.8;
      if (averageTime > hysteresisThreshold) {
        targetLevel = this.currentState.currentLevel; // Stay at current level
      }
    }

    return targetLevel;
  }

  /**
   * Apply a specific degradation level
   */
  private applyDegradationLevel(level: number, triggerValue: number): void {
    const previousLevel = this.currentState.currentLevel;
    const degradationLevel = this.degradationLevels[level];

    this.currentState.currentLevel = level;
    this.currentState.settings = { ...degradationLevel.settings };

    if (level > 0 && this.currentState.activatedAt === null) {
      this.currentState.activatedAt = new Date();
    } else if (level === 0) {
      this.currentState.activatedAt = null;
    }

    // Emit degradation event
    this.emitEvent({
      type: 'DEGRADATION_ACTIVATED',
      payload: this.currentState.settings
    });

    const direction = level > previousLevel ? 'increased' : 'decreased';
    console.log(`[DegradationManager] Degradation ${direction} from level ${previousLevel} to ${level} (${degradationLevel.name})`);
    console.log(`[DegradationManager] Trigger: ${triggerValue.toFixed(2)}ms average`);
    console.log(`[DegradationManager] Applied settings:`, degradationLevel.settings);
  }

  /**
   * Evaluate and apply scaling rules
   */
  private evaluateScalingRules(subsystemMetrics: Map<string, any>): void {
    for (const [ruleId, rule] of this.scalingRules.entries()) {
      const metrics = subsystemMetrics.get(rule.subsystem);
      if (!metrics) continue;

      const shouldActivate = this.shouldActivateRule(rule, metrics);

      if (shouldActivate && !rule.active) {
        this.activateScalingRule(rule);
      } else if (!shouldActivate && rule.active) {
        this.deactivateScalingRule(rule);
      }
    }
  }

  /**
   * Check if a scaling rule should be activated
   */
  private shouldActivateRule(rule: ScalingRule, metrics: any): boolean {
    let metricValue: number;

    switch (rule.metric) {
      case 'average_time':
        metricValue = metrics.averageTime || 0;
        break;
      case 'max_time':
        metricValue = Math.max(...(metrics.recentTimes || [0]));
        break;
      case 'compliance_rate':
        metricValue = metrics.budgetComplianceRate || 100;
        return metricValue < rule.threshold; // For compliance rate, lower is worse
      default:
        return false;
    }

    return metricValue > rule.threshold;
  }

  /**
   * Activate a scaling rule
   */
  private activateScalingRule(rule: ScalingRule): void {
    rule.active = true;
    this.currentState.activeRules.add(rule.id);

    console.log(`[DegradationManager] Activated scaling rule: ${rule.id} (${rule.action} for ${rule.subsystem})`);

    // Emit event about rule activation
    this.emitEvent({
      type: 'SCALING_RULE_ACTIVATED' as any,
      payload: { rule }
    });
  }

  /**
   * Deactivate a scaling rule
   */
  private deactivateScalingRule(rule: ScalingRule): void {
    rule.active = false;
    this.currentState.activeRules.delete(rule.id);

    console.log(`[DegradationManager] Deactivated scaling rule: ${rule.id}`);

    // Emit event about rule deactivation
    this.emitEvent({
      type: 'SCALING_RULE_DEACTIVATED' as any,
      payload: { rule }
    });
  }

  /**
   * Get subsystem configuration with degradation applied
   */
  public getScaledSubsystemConfig(originalConfig: SubsystemConfig): SubsystemConfig {
    // Store original config if not already stored
    if (!this.currentState.originalConfigs.has(originalConfig.name)) {
      this.currentState.originalConfigs.set(originalConfig.name, { ...originalConfig });
    }

    let scaledConfig = { ...originalConfig };

    // Apply degradation settings
    if (this.currentState.settings.reduceComplexity) {
      scaledConfig.timeBudget *= 0.8; // 20% less time budget
    }

    // Apply active scaling rules
    for (const ruleId of this.currentState.activeRules) {
      const rule = this.scalingRules.get(ruleId);
      if (rule && rule.subsystem === originalConfig.name) {
        scaledConfig = this.applyScalingRule(scaledConfig, rule);
      }
    }

    return scaledConfig;
  }

  /**
   * Apply a scaling rule to subsystem configuration
   */
  private applyScalingRule(config: SubsystemConfig, rule: ScalingRule): SubsystemConfig {
    const scaled = { ...config };

    switch (rule.action) {
      case 'reduce_complexity':
        scaled.timeBudget *= rule.scalingFactor;
        scaled.scalingFactor = rule.scalingFactor;
        break;

      case 'batch_operations':
        // This would be handled by the subsystem implementation
        scaled.scalingFactor = rule.scalingFactor;
        break;

      case 'simplify_algorithms':
        scaled.timeBudget *= rule.scalingFactor;
        scaled.scalingFactor = rule.scalingFactor;
        break;

      case 'skip_processing':
        // Mark for potential skipping
        scaled.scalingFactor = rule.scalingFactor;
        break;
    }

    return scaled;
  }

  /**
   * Check if a subsystem should be skipped
   */
  public shouldSkipSubsystem(subsystemName: string): boolean {
    if (!this.currentState.settings.skipNonCritical) {
      return false;
    }

    // Define critical subsystems that should never be skipped
    const criticalSubsystems = ['PoliticalEntitySubsystem'];

    if (criticalSubsystems.includes(subsystemName)) {
      return false;
    }

    // Check if any active rules suggest skipping this subsystem
    for (const ruleId of this.currentState.activeRules) {
      const rule = this.scalingRules.get(ruleId);
      if (rule && rule.subsystem === subsystemName && rule.action === 'skip_processing') {
        return Math.random() > rule.scalingFactor; // Probabilistic skipping
      }
    }

    // Skip non-critical subsystems under severe degradation
    return this.currentState.currentLevel >= 2 && Math.random() < 0.3; // 30% skip chance
  }

  /**
   * Get current degradation status
   */
  public getDegradationStatus(): {
    level: number;
    name: string;
    settings: DegradationSettings;
    activeRules: number;
    activatedAt: Date | null;
    description: string;
  } {
    const currentLevel = this.degradationLevels[this.currentState.currentLevel];

    return {
      level: this.currentState.currentLevel,
      name: currentLevel.name,
      settings: this.currentState.settings,
      activeRules: this.currentState.activeRules.size,
      activatedAt: this.currentState.activatedAt,
      description: currentLevel.description
    };
  }

  /**
   * Get performance budget for a subsystem
   */
  public getPerformanceBudget(subsystemName: string, originalBudget: number): number {
    // Apply degradation scaling
    let budget = originalBudget;

    if (this.currentState.settings.reduceComplexity) {
      budget *= 0.8;
    }

    // Apply active scaling rules
    for (const ruleId of this.currentState.activeRules) {
      const rule = this.scalingRules.get(ruleId);
      if (rule && rule.subsystem === subsystemName) {
        budget *= rule.scalingFactor;
      }
    }

    return Math.max(budget, originalBudget * 0.3); // Never go below 30% of original
  }

  /**
   * Force reset to optimal performance
   */
  public resetToOptimal(): void {
    this.currentState = this.initializeState();

    // Deactivate all scaling rules
    for (const rule of this.scalingRules.values()) {
      rule.active = false;
    }

    console.log('[DegradationManager] Reset to optimal performance');

    this.emitEvent({
      type: 'DEGRADATION_RESET' as any,
      payload: {}
    });
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
        console.error('[DegradationManager] Error in event listener:', error);
      }
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.performanceConfig = { ...this.performanceConfig, ...newConfig };
    this.degradationLevels = this.initializeDegradationLevels();
    console.log('[DegradationManager] Configuration updated');
  }

  /**
   * Get scaling rules for monitoring
   */
  public getScalingRules(): ScalingRule[] {
    return Array.from(this.scalingRules.values());
  }

  /**
   * Remove a scaling rule
   */
  public removeScalingRule(ruleId: string): boolean {
    const rule = this.scalingRules.get(ruleId);
    if (rule) {
      if (rule.active) {
        this.deactivateScalingRule(rule);
      }
      this.scalingRules.delete(ruleId);
      return true;
    }
    return false;
  }
}