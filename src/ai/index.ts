/**
 * AI System Index
 *
 * Main export file for the AI political behavior system.
 * Provides easy access to all AI components and types.
 */

// Core AI Decision Making
export {
  AIDecisionEngine,
  type DecisionContext,
  type PoliticalAction,
  type SituationAssessment,
  type WeightedAction
} from './decision-engine';

// Personality System
export {
  type AIPersonalityTraits,
  type PersonalityArchetype,
  PERSONALITY_ARCHETYPES,
  PROGRESSIVE_ACTIVIST,
  CONSERVATIVE_TRADITIONALIST,
  PRAGMATIC_CENTRIST,
  POPULIST_OUTSIDER,
  TECHNOCRATIC_EXPERT,
  generatePersonalityVariation,
  calculatePersonalityCompatibility
} from './personalities';

// Consistency Validation
export {
  AIConsistencyValidator,
  type ConsistencyTestResult,
  type AIBehaviorAssessment,
  type ConsistencyTestScenario
} from './consistency-validator';

// Main Orchestration System
export {
  AIOrchestrater,
  type AIPolitician,
  type SimulationTickResult
} from './ai-orchestrator';

// Behavior Systems (from behavior directory)
export {
  RelationshipManager,
  type PoliticalRelationship,
  type RelationshipEvent
} from '../behavior/relationship-manager';

export {
  EventResponseSystem,
  type EventResponse,
  type EventResponseTemplate,
  type ResponsePattern
} from '../behavior/event-response-system';

/**
 * Quick setup function for creating a complete AI political system
 * @returns Configured AI orchestrator ready for use
 */
export function createAISystem(): AIOrchestrater {
  return new AIOrchestrater();
}

/**
 * Available personality archetype names for easy reference
 */
export const ARCHETYPE_NAMES = [
  'progressive',
  'conservative',
  'pragmatic',
  'populist',
  'technocratic'
] as const;

export type ArchetypeName = typeof ARCHETYPE_NAMES[number];

/**
 * Default AI system configuration
 */
export const DEFAULT_AI_CONFIG = {
  /** Default personality variation amount (0-20) */
  default_personality_variation: 10,

  /** How often to run consistency checks (every N ticks) */
  consistency_check_interval: 10,

  /** Minimum consistency score before flagging issues */
  min_consistency_threshold: 60,

  /** Maximum number of historical ticks to keep */
  max_history_length: 100,

  /** Default decision context urgency (0-100) */
  default_urgency: 25,

  /** Relationship decay rate per tick */
  relationship_decay_rate: 0.01,

  /** Probability of AI responding to random events */
  event_response_probability: 0.3
} as const;

/**
 * Utility functions for AI system management
 */
export const AIUtils = {
  /**
   * Validate AI politician configuration
   */
  validateAIConfiguration(politician: any, archetype: string): boolean {
    if (!politician.id || !politician.name) return false;
    if (!ARCHETYPE_NAMES.includes(archetype as ArchetypeName)) return false;
    if (!politician.personality || !politician.attributes) return false;
    return true;
  },

  /**
   * Calculate average consistency score for multiple politicians
   */
  calculateAverageConsistency(politicians: AIPolitician[]): number {
    if (politicians.length === 0) return 0;

    const scores = politicians
      .map(p => p.performance.consistency_scores)
      .filter(scores => scores.length > 0)
      .map(scores => scores[scores.length - 1]); // Latest score

    if (scores.length === 0) return 0;

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  },

  /**
   * Find politicians with compatibility above threshold
   */
  findCompatiblePoliticians(
    target: AIPolitician,
    candidates: AIPolitician[],
    threshold: number = 50
  ): Array<{ politician: AIPolitician; compatibility: number }> {
    return candidates
      .filter(candidate => candidate.politician.id !== target.politician.id)
      .map(candidate => ({
        politician: candidate,
        compatibility: calculatePersonalityCompatibility(
          target.archetype.traits,
          candidate.archetype.traits
        )
      }))
      .filter(result => result.compatibility >= threshold)
      .sort((a, b) => b.compatibility - a.compatibility);
  },

  /**
   * Generate summary statistics for AI performance
   */
  generatePerformanceStats(politicians: AIPolitician[]) {
    const stats = {
      total_politicians: politicians.length,
      average_decisions: 0,
      average_approval: 0,
      average_consistency: 0,
      most_active: '',
      least_active: '',
      highest_approval: '',
      lowest_approval: ''
    };

    if (politicians.length === 0) return stats;

    // Calculate averages
    let totalDecisions = 0;
    let totalApproval = 0;
    let totalConsistency = 0;
    let consistencyCount = 0;

    let mostDecisions = 0;
    let leastDecisions = Infinity;
    let highestApproval = 0;
    let lowestApproval = 100;

    for (const politician of politicians) {
      const decisions = politician.performance.decisions_made;
      const approval = politician.politician.approval_rating;
      const consistency = politician.performance.consistency_scores.length > 0
        ? politician.performance.consistency_scores[politician.performance.consistency_scores.length - 1]
        : 0;

      totalDecisions += decisions;
      totalApproval += approval;

      if (consistency > 0) {
        totalConsistency += consistency;
        consistencyCount++;
      }

      // Track extremes
      if (decisions > mostDecisions) {
        mostDecisions = decisions;
        stats.most_active = politician.politician.name;
      }
      if (decisions < leastDecisions) {
        leastDecisions = decisions;
        stats.least_active = politician.politician.name;
      }
      if (approval > highestApproval) {
        highestApproval = approval;
        stats.highest_approval = politician.politician.name;
      }
      if (approval < lowestApproval) {
        lowestApproval = approval;
        stats.lowest_approval = politician.politician.name;
      }
    }

    stats.average_decisions = totalDecisions / politicians.length;
    stats.average_approval = totalApproval / politicians.length;
    stats.average_consistency = consistencyCount > 0 ? totalConsistency / consistencyCount : 0;

    return stats;
  }
};

/**
 * Error types for AI system
 */
export class AISystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public politician_id?: string
  ) {
    super(message);
    this.name = 'AISystemError';
  }
}

export class ConsistencyValidationError extends AISystemError {
  constructor(message: string, politician_id?: string) {
    super(message, 'CONSISTENCY_ERROR', politician_id);
    this.name = 'ConsistencyValidationError';
  }
}

export class DecisionEngineError extends AISystemError {
  constructor(message: string, politician_id?: string) {
    super(message, 'DECISION_ERROR', politician_id);
    this.name = 'DecisionEngineError';
  }
}

/**
 * Version information
 */
export const AI_SYSTEM_VERSION = '1.0.0';

/**
 * Default export - the main orchestrator class
 */
export default AIOrchestrater;