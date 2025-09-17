/**
 * Relationship Management System
 *
 * Manages dynamic relationships between AI politicians based on:
 * - Personality compatibility
 * - Policy agreement/disagreement
 * - Historical interactions
 * - Political events and their outcomes
 * - Strategic considerations
 */

import { Politician, Policy } from '../types/entities';
import { SimulationEvent } from '../types/simulation';
import { AIPersonalityTraits, calculatePersonalityCompatibility } from '../ai/personalities';
import { PoliticalAction } from '../ai/decision-engine';

/**
 * Relationship change event tracking
 */
export interface RelationshipEvent {
  /** Unique identifier for the event */
  id: string;

  /** Timestamp when the event occurred */
  timestamp: number;

  /** Type of interaction that caused relationship change */
  interaction_type: 'policy_agreement' | 'policy_disagreement' | 'public_support' | 'public_opposition' |
                   'coalition_formation' | 'betrayal' | 'scandal_association' | 'mutual_benefit' |
                   'competition' | 'personal_attack' | 'praise' | 'favor' | 'backstab';

  /** Magnitude of relationship change (-50 to +50) */
  impact: number;

  /** Context or reason for the change */
  context: string;

  /** Policy or event that triggered this change (if applicable) */
  trigger_id?: string;

  /** Whether this was a public or private interaction */
  public_interaction: boolean;

  /** Decay rate for this relationship change (how quickly it fades) */
  decay_rate: number;
}

/**
 * Relationship state between two politicians
 */
export interface PoliticalRelationship {
  /** ID of the first politician */
  politician_1_id: string;

  /** ID of the second politician */
  politician_2_id: string;

  /** Current relationship score (-100 to +100) */
  current_score: number;

  /** Base compatibility score from personality traits */
  base_compatibility: number;

  /** History of relationship-changing events */
  event_history: RelationshipEvent[];

  /** Relationship type based on current score and history */
  relationship_type: 'close_ally' | 'ally' | 'friendly' | 'neutral' | 'tense' | 'rival' | 'enemy';

  /** Trust level between politicians (0-100) */
  trust_level: number;

  /** Influence each politician has on the other (0-100) */
  mutual_influence: {
    politician_1_on_2: number;
    politician_2_on_1: number;
  };

  /** Strategic value of this relationship for each politician */
  strategic_value: {
    for_politician_1: number;
    for_politician_2: number;
  };

  /** Last significant interaction timestamp */
  last_interaction: number;

  /** Stability of the relationship (how resistant to change) */
  stability: number;
}

/**
 * Relationship management algorithms and utilities
 */
export class RelationshipManager {
  private relationships: Map<string, PoliticalRelationship> = new Map();
  private eventCounter: number = 0;

  /**
   * Initialize or update relationship between two politicians
   * @param politician1 - First politician
   * @param politician2 - Second politician
   * @returns The relationship object
   */
  public initializeRelationship(
    politician1: Politician,
    politician2: Politician
  ): PoliticalRelationship {
    const relationshipId = this.generateRelationshipId(politician1.id, politician2.id);

    let relationship = this.relationships.get(relationshipId);

    if (!relationship) {
      // Calculate base compatibility from personality traits
      const baseCompatibility = calculatePersonalityCompatibility(
        politician1.personality as AIPersonalityTraits,
        politician2.personality as AIPersonalityTraits
      );

      relationship = {
        politician_1_id: politician1.id,
        politician_2_id: politician2.id,
        current_score: baseCompatibility,
        base_compatibility: baseCompatibility,
        event_history: [],
        relationship_type: this.determineRelationshipType(baseCompatibility),
        trust_level: Math.max(0, baseCompatibility + 50),
        mutual_influence: {
          politician_1_on_2: this.calculateInfluence(politician1, politician2),
          politician_2_on_1: this.calculateInfluence(politician2, politician1)
        },
        strategic_value: {
          for_politician_1: this.calculateStrategicValue(politician1, politician2),
          for_politician_2: this.calculateStrategicValue(politician2, politician1)
        },
        last_interaction: Date.now(),
        stability: 50 // Neutral stability initially
      };

      this.relationships.set(relationshipId, relationship);
    }

    return relationship;
  }

  /**
   * Process policy agreement/disagreement between politicians
   * @param politician1 - First politician
   * @param politician2 - Second politician
   * @param policy - Policy they agreed/disagreed on
   * @param agreement - Whether they agreed (true) or disagreed (false)
   * @param public_stance - Whether this was a public stance
   * @returns Updated relationship
   */
  public processPolicyStance(
    politician1: Politician,
    politician2: Politician,
    policy: Policy,
    agreement: boolean,
    public_stance: boolean = true
  ): PoliticalRelationship {
    const relationship = this.initializeRelationship(politician1, politician2);

    // Calculate impact based on policy importance and personality traits
    const baseImpact = this.calculatePolicyImpact(politician1, politician2, policy, agreement);
    const publicMultiplier = public_stance ? 1.2 : 0.8;
    const finalImpact = Math.round(baseImpact * publicMultiplier);

    // Create relationship event
    const event: RelationshipEvent = {
      id: `policy_${agreement ? 'agreement' : 'disagreement'}_${this.eventCounter++}`,
      timestamp: Date.now(),
      interaction_type: agreement ? 'policy_agreement' : 'policy_disagreement',
      impact: finalImpact,
      context: `${agreement ? 'Agreed' : 'Disagreed'} on policy: ${policy.title}`,
      trigger_id: policy.id,
      public_interaction: public_stance,
      decay_rate: public_stance ? 0.1 : 0.2 // Public stances fade slower
    };

    this.applyRelationshipEvent(relationship, event);
    return relationship;
  }

  /**
   * Process political action that affects relationships
   * @param actor - Politician taking the action
   * @param target - Target politician (if applicable)
   * @param action - The political action taken
   * @param outcome - Result of the action
   * @returns Array of updated relationships
   */
  public processActionImpact(
    actor: Politician,
    target: Politician | null,
    action: PoliticalAction,
    outcome: { success: boolean; public_response: number }
  ): PoliticalRelationship[] {
    const updatedRelationships: PoliticalRelationship[] = [];

    // Direct impact on target relationship
    if (target) {
      const relationship = this.initializeRelationship(actor, target);
      const impact = this.calculateActionImpact(actor, target, action, outcome);

      const event: RelationshipEvent = {
        id: `action_${action.type}_${this.eventCounter++}`,
        timestamp: Date.now(),
        interaction_type: this.mapActionToInteractionType(action.type),
        impact,
        context: `${actor.name} performed ${action.description} affecting ${target.name}`,
        public_interaction: outcome.public_response > 50,
        decay_rate: 0.15
      };

      this.applyRelationshipEvent(relationship, event);
      updatedRelationships.push(relationship);
    }

    // Indirect impacts on other politicians based on action visibility and outcome
    if (outcome.public_response > 70) {
      // High-visibility actions affect relationships with other politicians
      const indirectImpacts = this.calculateIndirectImpacts(actor, action, outcome);
      updatedRelationships.push(...indirectImpacts);
    }

    return updatedRelationships;
  }

  /**
   * Process political event impact on relationships
   * @param event - Political event
   * @param affectedPoliticians - Politicians affected by the event
   * @returns Updated relationships
   */
  public processEventImpact(
    event: SimulationEvent,
    affectedPoliticians: Politician[]
  ): PoliticalRelationship[] {
    const updatedRelationships: PoliticalRelationship[] = [];

    // Process relationships between politicians based on their responses to the event
    for (let i = 0; i < affectedPoliticians.length; i++) {
      for (let j = i + 1; j < affectedPoliticians.length; j++) {
        const politician1 = affectedPoliticians[i];
        const politician2 = affectedPoliticians[j];

        const relationship = this.initializeRelationship(politician1, politician2);
        const impact = this.calculateEventImpact(politician1, politician2, event);

        if (Math.abs(impact) > 2) {
          const relationshipEvent: RelationshipEvent = {
            id: `event_response_${this.eventCounter++}`,
            timestamp: Date.now(),
            interaction_type: impact > 0 ? 'mutual_benefit' : 'competition',
            impact,
            context: `Response to event: ${event.title}`,
            trigger_id: event.id,
            public_interaction: true,
            decay_rate: 0.12
          };

          this.applyRelationshipEvent(relationship, relationshipEvent);
          updatedRelationships.push(relationship);
        }
      }
    }

    return updatedRelationships;
  }

  /**
   * Update relationship scores over time (decay, stability changes)
   * @param currentTick - Current simulation tick
   * @returns Array of relationships that changed
   */
  public processTimeDecay(currentTick: number): PoliticalRelationship[] {
    const updatedRelationships: PoliticalRelationship[] = [];

    for (const relationship of this.relationships.values()) {
      let hasChanged = false;

      // Apply decay to historical events
      for (const event of relationship.event_history) {
        const timeSinceEvent = currentTick - event.timestamp;
        const decayAmount = Math.floor(timeSinceEvent / 1000) * event.decay_rate;

        if (decayAmount > 0) {
          event.impact *= (1 - decayAmount);
          hasChanged = true;
        }
      }

      // Remove events with negligible impact
      const initialLength = relationship.event_history.length;
      relationship.event_history = relationship.event_history.filter(
        event => Math.abs(event.impact) > 0.5
      );

      if (relationship.event_history.length !== initialLength) {
        hasChanged = true;
      }

      // Recalculate current score if events decayed
      if (hasChanged) {
        this.recalculateRelationshipScore(relationship);
        updatedRelationships.push(relationship);
      }
    }

    return updatedRelationships;
  }

  /**
   * Get relationship between two politicians
   * @param politician1Id - First politician ID
   * @param politician2Id - Second politician ID
   * @returns Relationship object or null if not found
   */
  public getRelationship(politician1Id: string, politician2Id: string): PoliticalRelationship | null {
    const relationshipId = this.generateRelationshipId(politician1Id, politician2Id);
    return this.relationships.get(relationshipId) || null;
  }

  /**
   * Get all relationships for a specific politician
   * @param politicianId - Politician ID
   * @returns Array of relationships
   */
  public getPoliticianRelationships(politicianId: string): PoliticalRelationship[] {
    return Array.from(this.relationships.values()).filter(
      rel => rel.politician_1_id === politicianId || rel.politician_2_id === politicianId
    );
  }

  /**
   * Calculate influence one politician has on another
   */
  private calculateInfluence(influencer: Politician, target: Politician): number {
    let influence = 0;

    // Base influence from attributes
    influence += influencer.attributes.charisma * 0.4;
    influence += influencer.attributes.intelligence * 0.2;
    influence += influencer.attributes.integrity * 0.2;

    // Approval rating factor
    influence += influencer.approval_rating * 0.2;

    // Position/office factor (placeholder - would depend on actual position)
    if (influencer.position && influencer.position.includes('President')) {
      influence += 20;
    } else if (influencer.position && influencer.position.includes('Senator')) {
      influence += 10;
    }

    return Math.min(100, influence);
  }

  /**
   * Calculate strategic value of a relationship
   */
  private calculateStrategicValue(politician: Politician, other: Politician): number {
    let value = 0;

    // Value based on other's influence and approval
    value += other.approval_rating * 0.3;
    value += other.attributes.charisma * 0.2;
    value += other.attributes.intelligence * 0.2;

    // Value based on potential policy alignment
    const policyAlignment = this.calculatePolicyAlignment(politician, other);
    value += Math.abs(policyAlignment) * 0.3;

    return Math.min(100, value);
  }

  /**
   * Calculate policy alignment between two politicians
   */
  private calculatePolicyAlignment(politician1: Politician, politician2: Politician): number {
    // Simplified alignment calculation based on political stance
    const stanceValues = { left: -1, center: 0, right: 1 };
    const stance1 = stanceValues[politician1.political_stance];
    const stance2 = stanceValues[politician2.political_stance];

    return 100 - Math.abs(stance1 - stance2) * 50;
  }

  /**
   * Determine relationship type from score
   */
  private determineRelationshipType(score: number): PoliticalRelationship['relationship_type'] {
    if (score >= 75) return 'close_ally';
    if (score >= 50) return 'ally';
    if (score >= 25) return 'friendly';
    if (score >= -25) return 'neutral';
    if (score >= -50) return 'tense';
    if (score >= -75) return 'rival';
    return 'enemy';
  }

  /**
   * Calculate impact of policy stance on relationship
   */
  private calculatePolicyImpact(
    politician1: Politician,
    politician2: Politician,
    policy: Policy,
    agreement: boolean
  ): number {
    // Base impact from agreement/disagreement
    let impact = agreement ? 5 : -5;

    // Amplify based on policy importance (simplified)
    if (policy.category === 'economic') impact *= 1.2;
    if (policy.category === 'social') impact *= 1.1;

    // Amplify based on personality traits
    const traits1 = politician1.personality as AIPersonalityTraits;
    const traits2 = politician2.personality as AIPersonalityTraits;

    if (traits1.compromise_willingness < 30 || traits2.compromise_willingness < 30) {
      impact *= 1.3; // Uncompromising politicians have stronger reactions
    }

    return Math.round(impact);
  }

  /**
   * Calculate impact of political action on relationship
   */
  private calculateActionImpact(
    actor: Politician,
    target: Politician,
    action: PoliticalAction,
    outcome: { success: boolean; public_response: number }
  ): number {
    let impact = 0;

    // Base impact from action type
    if (action.type.includes('support')) impact = 8;
    if (action.type.includes('oppose')) impact = -8;
    if (action.type.includes('attack')) impact = -15;
    if (action.type.includes('coalition')) impact = 12;

    // Modify based on success
    if (!outcome.success) impact *= 0.5;

    // Modify based on public response
    impact *= (1 + outcome.public_response / 200);

    return Math.round(impact);
  }

  /**
   * Map action type to relationship interaction type
   */
  private mapActionToInteractionType(actionType: string): RelationshipEvent['interaction_type'] {
    if (actionType.includes('support')) return 'public_support';
    if (actionType.includes('oppose')) return 'public_opposition';
    if (actionType.includes('attack')) return 'personal_attack';
    if (actionType.includes('coalition')) return 'coalition_formation';
    if (actionType.includes('praise')) return 'praise';
    return 'competition';
  }

  /**
   * Calculate indirect impacts on other politicians
   */
  private calculateIndirectImpacts(
    actor: Politician,
    action: PoliticalAction,
    outcome: { success: boolean; public_response: number }
  ): PoliticalRelationship[] {
    // This would calculate how high-visibility actions affect relationships
    // with other politicians who observe the action
    // For now, returning empty array as placeholder
    return [];
  }

  /**
   * Calculate event impact on relationship between two politicians
   */
  private calculateEventImpact(
    politician1: Politician,
    politician2: Politician,
    event: SimulationEvent
  ): number {
    // Simplified calculation - in practice would consider how each politician
    // responded to the event and whether their responses aligned
    let impact = 0;

    // If both politicians are affected similarly by event, it brings them together
    if (event.impact.approval) {
      const sharedImpact = Math.abs(event.impact.approval) > 10;
      if (sharedImpact) {
        impact = event.impact.approval > 0 ? 3 : -2;
      }
    }

    return impact;
  }

  /**
   * Apply relationship event and update relationship scores
   */
  private applyRelationshipEvent(
    relationship: PoliticalRelationship,
    event: RelationshipEvent
  ): void {
    relationship.event_history.push(event);
    relationship.last_interaction = event.timestamp;

    // Recalculate current score
    this.recalculateRelationshipScore(relationship);

    // Update relationship type
    relationship.relationship_type = this.determineRelationshipType(relationship.current_score);

    // Update trust level based on recent events
    this.updateTrustLevel(relationship);

    // Update stability based on consistency of interactions
    this.updateStability(relationship);
  }

  /**
   * Recalculate relationship score from base compatibility and events
   */
  private recalculateRelationshipScore(relationship: PoliticalRelationship): void {
    let score = relationship.base_compatibility;

    // Add impact from all historical events
    for (const event of relationship.event_history) {
      score += event.impact;
    }

    // Ensure score stays within bounds
    relationship.current_score = Math.max(-100, Math.min(100, score));
  }

  /**
   * Update trust level based on relationship history
   */
  private updateTrustLevel(relationship: PoliticalRelationship): void {
    const recentEvents = relationship.event_history
      .filter(event => Date.now() - event.timestamp < 100000) // Recent events
      .slice(-10); // Last 10 events

    let trustAdjustment = 0;
    for (const event of recentEvents) {
      if (event.interaction_type === 'betrayal' || event.interaction_type === 'backstab') {
        trustAdjustment -= 20;
      } else if (event.interaction_type === 'mutual_benefit' || event.interaction_type === 'favor') {
        trustAdjustment += 5;
      }
    }

    relationship.trust_level = Math.max(0, Math.min(100,
      relationship.trust_level + trustAdjustment
    ));
  }

  /**
   * Update relationship stability based on consistency
   */
  private updateStability(relationship: PoliticalRelationship): void {
    const recentEvents = relationship.event_history.slice(-10);

    if (recentEvents.length < 3) {
      relationship.stability = 50;
      return;
    }

    // Calculate variance in event impacts (lower variance = higher stability)
    const impacts = recentEvents.map(event => event.impact);
    const mean = impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
    const variance = impacts.reduce((sum, impact) => sum + Math.pow(impact - mean, 2), 0) / impacts.length;

    // Convert variance to stability (0-100, where 100 is most stable)
    relationship.stability = Math.max(0, Math.min(100, 100 - variance * 2));
  }

  /**
   * Generate consistent relationship ID from two politician IDs
   */
  private generateRelationshipId(id1: string, id2: string): string {
    return [id1, id2].sort().join('_');
  }
}