/**
 * Behavior Systems Index
 *
 * Export file for AI political behavior systems including
 * relationship management and event response systems.
 */

// Relationship Management
export {
  RelationshipManager,
  type PoliticalRelationship,
  type RelationshipEvent
} from './relationship-manager';

// Event Response System
export {
  EventResponseSystem,
  type EventResponse,
  type EventResponseTemplate,
  type ResponsePattern
} from './event-response-system';

/**
 * Behavior system configuration
 */
export const BEHAVIOR_CONFIG = {
  /** Default relationship decay rate per tick */
  default_decay_rate: 0.1,

  /** Minimum relationship impact to record as event */
  min_relationship_impact: 2,

  /** Maximum number of relationship events to keep in history */
  max_relationship_history: 50,

  /** Default trust level for new relationships */
  default_trust_level: 50,

  /** Default stability for new relationships */
  default_stability: 50,

  /** Minimum compatibility score for automatic relationship building */
  min_compatibility_for_relationship: 30,

  /** Maximum number of response templates per event type */
  max_response_templates: 10,

  /** Default response confidence level */
  default_response_confidence: 70,

  /** Minimum consistency score before flagging response issues */
  min_response_consistency: 60
} as const;

/**
 * Utility functions for behavior systems
 */
export const BehaviorUtils = {
  /**
   * Calculate relationship health score
   */
  calculateRelationshipHealth(relationship: PoliticalRelationship): number {
    const scoreWeight = 0.4;
    const stabilityWeight = 0.3;
    const trustWeight = 0.3;

    const normalizedScore = (relationship.current_score + 100) / 200; // Normalize -100 to 100 range to 0-1
    const normalizedStability = relationship.stability / 100;
    const normalizedTrust = relationship.trust_level / 100;

    return (normalizedScore * scoreWeight +
            normalizedStability * stabilityWeight +
            normalizedTrust * trustWeight) * 100;
  },

  /**
   * Determine if relationship is stable
   */
  isRelationshipStable(relationship: PoliticalRelationship): boolean {
    return relationship.stability >= 60 &&
           relationship.event_history.slice(-5).every(event => Math.abs(event.impact) < 20);
  },

  /**
   * Calculate response appropriateness score
   */
  calculateResponseAppropriatenessScore(
    response: EventResponse,
    expectedPatterns: string[]
  ): number {
    let score = 70; // Base score

    // Check if response type matches expected patterns
    if (expectedPatterns.includes(response.response_type)) {
      score += 20;
    }

    // Adjust for confidence level
    score = score * (response.confidence / 100);

    // Adjust for timing appropriateness
    switch (response.timing) {
      case 'immediate':
        score += 5;
        break;
      case 'strategic':
        score += 10;
        break;
      case 'calculated':
        score += 8;
        break;
      case 'delayed':
        score -= 5;
        break;
    }

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Generate relationship summary for a politician
   */
  generateRelationshipSummary(relationships: PoliticalRelationship[]) {
    const summary = {
      total_relationships: relationships.length,
      close_allies: 0,
      allies: 0,
      neutral: 0,
      rivals: 0,
      enemies: 0,
      average_score: 0,
      average_stability: 0,
      average_trust: 0,
      most_stable_relationship: '',
      least_stable_relationship: '',
      strongest_ally: '',
      strongest_rival: ''
    };

    if (relationships.length === 0) return summary;

    let totalScore = 0;
    let totalStability = 0;
    let totalTrust = 0;
    let mostStable = relationships[0];
    let leastStable = relationships[0];
    let strongestAlly = relationships[0];
    let strongestRival = relationships[0];

    for (const rel of relationships) {
      // Count relationship types
      switch (rel.relationship_type) {
        case 'close_ally':
          summary.close_allies++;
          break;
        case 'ally':
        case 'friendly':
          summary.allies++;
          break;
        case 'neutral':
          summary.neutral++;
          break;
        case 'tense':
        case 'rival':
          summary.rivals++;
          break;
        case 'enemy':
          summary.enemies++;
          break;
      }

      // Calculate totals
      totalScore += rel.current_score;
      totalStability += rel.stability;
      totalTrust += rel.trust_level;

      // Track extremes
      if (rel.stability > mostStable.stability) {
        mostStable = rel;
      }
      if (rel.stability < leastStable.stability) {
        leastStable = rel;
      }
      if (rel.current_score > strongestAlly.current_score) {
        strongestAlly = rel;
      }
      if (rel.current_score < strongestRival.current_score) {
        strongestRival = rel;
      }
    }

    // Calculate averages
    summary.average_score = totalScore / relationships.length;
    summary.average_stability = totalStability / relationships.length;
    summary.average_trust = totalTrust / relationships.length;

    // Set extreme relationship identifiers
    summary.most_stable_relationship = `${mostStable.politician_1_id}_${mostStable.politician_2_id}`;
    summary.least_stable_relationship = `${leastStable.politician_1_id}_${leastStable.politician_2_id}`;
    summary.strongest_ally = strongestAlly.current_score > 0
      ? `${strongestAlly.politician_1_id}_${strongestAlly.politician_2_id}`
      : '';
    summary.strongest_rival = strongestRival.current_score < 0
      ? `${strongestRival.politician_1_id}_${strongestRival.politician_2_id}`
      : '';

    return summary;
  },

  /**
   * Analyze response patterns for consistency
   */
  analyzeResponseConsistency(responses: EventResponse[]): {
    consistency_score: number;
    pattern_analysis: Record<string, number>;
    timing_consistency: number;
    confidence_trend: 'improving' | 'declining' | 'stable';
  } {
    if (responses.length === 0) {
      return {
        consistency_score: 0,
        pattern_analysis: {},
        timing_consistency: 0,
        confidence_trend: 'stable'
      };
    }

    // Analyze response type patterns
    const typeCount: Record<string, number> = {};
    const timingCount: Record<string, number> = {};
    const confidenceLevels: number[] = [];

    for (const response of responses) {
      typeCount[response.response_type] = (typeCount[response.response_type] || 0) + 1;
      timingCount[response.timing] = (timingCount[response.timing] || 0) + 1;
      confidenceLevels.push(response.confidence);
    }

    // Calculate consistency score (based on response type distribution)
    const totalResponses = responses.length;
    const typeDistribution = Object.values(typeCount).map(count => count / totalResponses);
    const consistency = 100 - (calculateVariance(typeDistribution) * 100);

    // Calculate timing consistency
    const timingDistribution = Object.values(timingCount).map(count => count / totalResponses);
    const timingConsistency = 100 - (calculateVariance(timingDistribution) * 100);

    // Analyze confidence trend
    let confidenceTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (confidenceLevels.length >= 5) {
      const recent = confidenceLevels.slice(-5);
      const older = confidenceLevels.slice(-10, -5);
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, conf) => sum + conf, 0) / recent.length;
        const olderAvg = older.reduce((sum, conf) => sum + conf, 0) / older.length;

        if (recentAvg > olderAvg + 5) {
          confidenceTrend = 'improving';
        } else if (recentAvg < olderAvg - 5) {
          confidenceTrend = 'declining';
        }
      }
    }

    return {
      consistency_score: Math.max(0, Math.min(100, consistency)),
      pattern_analysis: typeCount,
      timing_consistency: Math.max(0, Math.min(100, timingConsistency)),
      confidence_trend: confidenceTrend
    };
  }
};

/**
 * Helper function to calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

/**
 * Behavior system error types
 */
export class BehaviorSystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public component: 'relationship' | 'response'
  ) {
    super(message);
    this.name = 'BehaviorSystemError';
  }
}

export class RelationshipError extends BehaviorSystemError {
  constructor(message: string) {
    super(message, 'RELATIONSHIP_ERROR', 'relationship');
    this.name = 'RelationshipError';
  }
}

export class ResponseError extends BehaviorSystemError {
  constructor(message: string) {
    super(message, 'RESPONSE_ERROR', 'response');
    this.name = 'ResponseError';
  }
}

/**
 * Version information
 */
export const BEHAVIOR_SYSTEM_VERSION = '1.0.0';