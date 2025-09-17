/**
 * AI Decision Engine
 *
 * Core system for AI political decision-making with personality-driven behavior.
 * Analyzes political situations, generates possible actions, and selects optimal choices
 * based on personality traits, relationships, and strategic goals.
 */

import { Politician, Policy, PoliticalClimate } from '../types/entities';
import { SimulationEvent } from '../types/simulation';
import { AIPersonalityTraits, PersonalityArchetype, PERSONALITY_ARCHETYPES } from './personalities';
import { calculatePersonalityCompatibility } from './personalities';

/**
 * Context information for AI decision-making
 */
export interface DecisionContext {
  /** Current political climate */
  climate: PoliticalClimate;

  /** Recent events affecting the political landscape */
  recent_events: SimulationEvent[];

  /** All politicians in the current simulation */
  all_politicians: Politician[];

  /** Active policies under consideration */
  active_policies: Policy[];

  /** Current simulation tick/timestamp */
  current_tick: number;

  /** Specific event triggering this decision (if any) */
  triggering_event?: SimulationEvent;

  /** Time pressure factor (0-100, higher means more urgent) */
  urgency: number;
}

/**
 * Possible political action that an AI can take
 */
export interface PoliticalAction {
  /** Unique identifier for the action type */
  type: string;

  /** Human-readable description of the action */
  description: string;

  /** Target entity (politician, policy, bloc) if applicable */
  target_id?: string;

  /** Parameters specific to this action */
  parameters: Record<string, any>;

  /** Expected outcomes and effects */
  expected_effects: {
    /** Expected change to approval rating */
    approval_change: number;

    /** Expected relationship changes */
    relationship_changes: Array<{
      politician_id: string;
      change: number;
    }>;

    /** Expected resource costs */
    resource_costs: {
      influence: number;
      media: number;
      money: number;
    };

    /** Probability of success (0-100) */
    success_probability: number;
  };

  /** Strategic priority level (1-10) */
  priority: number;
}

/**
 * Assessment of current political situation
 */
export interface SituationAssessment {
  /** Overall threat level to the politician (0-100) */
  threat_level: number;

  /** Available opportunities (0-100) */
  opportunity_level: number;

  /** Strength of current political position (0-100) */
  position_strength: number;

  /** Key allies and their reliability */
  allies: Array<{
    politician_id: string;
    reliability: number;
    influence: number;
  }>;

  /** Key threats and rivals */
  threats: Array<{
    politician_id: string;
    threat_level: number;
    influence: number;
  }>;

  /** Most important issues requiring attention */
  priority_issues: string[];

  /** Predicted political stability over next period */
  stability_forecast: number;
}

/**
 * Weighted action with selection probability
 */
export interface WeightedAction {
  action: PoliticalAction;
  weight: number;
  reasoning: string;
}

/**
 * Core AI Decision Engine implementing personality-driven political behavior
 */
export class AIDecisionEngine {
  private readonly politician: Politician;
  private readonly personalityTraits: AIPersonalityTraits;
  private readonly archetype: PersonalityArchetype;
  private readonly decisionHistory: Array<{
    tick: number;
    action: PoliticalAction;
    outcome: any;
  }> = [];

  constructor(
    politician: Politician,
    archetypeName: keyof typeof PERSONALITY_ARCHETYPES,
    personalityVariation?: AIPersonalityTraits
  ) {
    this.politician = politician;
    this.archetype = PERSONALITY_ARCHETYPES[archetypeName];
    this.personalityTraits = personalityVariation || this.archetype.traits;
  }

  /**
   * Main decision-making method
   * @param context - Current political situation and context
   * @returns Selected political action
   */
  async makeDecision(context: DecisionContext): Promise<PoliticalAction> {
    // Step 1: Analyze current political situation
    const situationAssessment = this.assessSituation(context);

    // Step 2: Generate possible actions based on personality and context
    const possibleActions = await this.generateActionOptions(context, situationAssessment);

    // Step 3: Weight actions by personality traits and strategic goals
    const weightedActions = this.weightActions(possibleActions, context, situationAssessment);

    // Step 4: Select action with highest weight (with unpredictability factor)
    const selectedAction = this.selectAction(weightedActions);

    // Step 5: Record decision for consistency tracking
    this.recordDecision(context.current_tick, selectedAction);

    return selectedAction;
  }

  /**
   * Assess the current political situation
   * @param context - Political context
   * @returns Situation assessment
   */
  private assessSituation(context: DecisionContext): SituationAssessment {
    const politician = this.politician;

    // Calculate threat level based on approval rating and opposition
    const threatLevel = this.calculateThreatLevel(context);

    // Identify opportunities based on political climate and events
    const opportunityLevel = this.calculateOpportunityLevel(context);

    // Assess current position strength
    const positionStrength = this.calculatePositionStrength(context);

    // Analyze relationships
    const allies = this.identifyAllies(context);
    const threats = this.identifyThreats(context);

    // Determine priority issues based on personality and events
    const priorityIssues = this.identifyPriorityIssues(context);

    // Forecast political stability
    const stabilityForecast = this.forecastStability(context);

    return {
      threat_level: threatLevel,
      opportunity_level: opportunityLevel,
      position_strength: positionStrength,
      allies,
      threats,
      priority_issues: priorityIssues,
      stability_forecast: stabilityForecast
    };
  }

  /**
   * Generate possible actions based on context and personality
   * @param context - Political context
   * @param assessment - Situation assessment
   * @returns Array of possible actions
   */
  private async generateActionOptions(
    context: DecisionContext,
    assessment: SituationAssessment
  ): Promise<PoliticalAction[]> {
    const actions: PoliticalAction[] = [];

    // Generate actions based on archetype preferences
    for (const actionType of this.archetype.preferred_actions) {
      const action = await this.generateSpecificAction(actionType, context, assessment);
      if (action) {
        actions.push(action);
      }
    }

    // Add reactive actions based on current events
    if (context.triggering_event) {
      const reactiveActions = await this.generateReactiveActions(
        context.triggering_event,
        context,
        assessment
      );
      actions.push(...reactiveActions);
    }

    // Add relationship-building actions
    const relationshipActions = await this.generateRelationshipActions(context, assessment);
    actions.push(...relationshipActions);

    // Add policy-related actions
    const policyActions = await this.generatePolicyActions(context, assessment);
    actions.push(...policyActions);

    return actions;
  }

  /**
   * Weight actions based on personality and strategic considerations
   * @param actions - Possible actions
   * @param context - Political context
   * @param assessment - Situation assessment
   * @returns Weighted actions
   */
  private weightActions(
    actions: PoliticalAction[],
    context: DecisionContext,
    assessment: SituationAssessment
  ): WeightedAction[] {
    return actions.map(action => {
      let weight = action.priority * 10; // Base weight from action priority

      // Apply personality-based modifiers
      weight = this.applyPersonalityModifiers(weight, action);

      // Apply strategic modifiers based on situation
      weight = this.applyStrategicModifiers(weight, action, assessment);

      // Apply relationship considerations
      weight = this.applyRelationshipModifiers(weight, action, context);

      // Apply urgency modifiers
      weight *= (1 + context.urgency / 200); // 0-50% bonus for urgency

      const reasoning = this.generateWeightingReasoning(action, weight);

      return {
        action,
        weight: Math.max(0, weight),
        reasoning
      };
    });
  }

  /**
   * Select action from weighted options with unpredictability
   * @param weightedActions - Actions with weights
   * @returns Selected action
   */
  private selectAction(weightedActions: WeightedAction[]): PoliticalAction {
    if (weightedActions.length === 0) {
      throw new Error('No actions available for decision');
    }

    // Sort by weight
    weightedActions.sort((a, b) => b.weight - a.weight);

    // Apply unpredictability factor
    const unpredictability = this.personalityTraits.unpredictability / 100;
    const randomFactor = Math.random();

    if (randomFactor < unpredictability && weightedActions.length > 1) {
      // Choose randomly from top 3 options
      const topOptions = weightedActions.slice(0, Math.min(3, weightedActions.length));
      const randomIndex = Math.floor(Math.random() * topOptions.length);
      return topOptions[randomIndex].action;
    }

    // Return highest weighted action
    return weightedActions[0].action;
  }

  /**
   * Calculate threat level based on current situation
   */
  private calculateThreatLevel(context: DecisionContext): number {
    const politician = this.politician;
    let threatLevel = 0;

    // Base threat from low approval
    threatLevel += Math.max(0, 60 - politician.approval_rating);

    // Threat from hostile relationships
    for (const [politicianId, relationship] of politician.relationships) {
      if (relationship < -30) {
        const otherPolitician = context.all_politicians.find(p => p.id === politicianId);
        if (otherPolitician) {
          threatLevel += Math.abs(relationship) / 5;
        }
      }
    }

    // Threat from recent negative events
    const recentNegativeEvents = context.recent_events.filter(
      event => event.impact.approval && event.impact.approval < 0
    );
    threatLevel += recentNegativeEvents.length * 5;

    return Math.min(100, threatLevel);
  }

  /**
   * Calculate opportunity level from current context
   */
  private calculateOpportunityLevel(context: DecisionContext): number {
    let opportunityLevel = 0;

    // Opportunities from high approval
    opportunityLevel += Math.max(0, this.politician.approval_rating - 60);

    // Opportunities from positive events
    const positiveEvents = context.recent_events.filter(
      event => event.impact.approval && event.impact.approval > 0
    );
    opportunityLevel += positiveEvents.length * 10;

    // Opportunities from political climate
    opportunityLevel += context.climate.public_trust / 2;

    return Math.min(100, opportunityLevel);
  }

  /**
   * Calculate current position strength
   */
  private calculatePositionStrength(context: DecisionContext): number {
    const politician = this.politician;
    let strength = politician.approval_rating;

    // Add relationship strength
    const positiveRelationships = Array.from(politician.relationships.values())
      .filter(score => score > 0);
    strength += positiveRelationships.length * 2;

    // Add attribute bonuses
    strength += (politician.attributes.charisma + politician.attributes.intelligence) / 4;

    return Math.min(100, strength);
  }

  /**
   * Identify reliable allies
   */
  private identifyAllies(context: DecisionContext): Array<{
    politician_id: string;
    reliability: number;
    influence: number;
  }> {
    const allies = [];

    for (const [politicianId, relationship] of this.politician.relationships) {
      if (relationship > 30) {
        const ally = context.all_politicians.find(p => p.id === politicianId);
        if (ally) {
          allies.push({
            politician_id: politicianId,
            reliability: relationship,
            influence: ally.attributes.charisma + ally.attributes.intelligence
          });
        }
      }
    }

    return allies.sort((a, b) => b.reliability - a.reliability);
  }

  /**
   * Identify political threats
   */
  private identifyThreats(context: DecisionContext): Array<{
    politician_id: string;
    threat_level: number;
    influence: number;
  }> {
    const threats = [];

    for (const [politicianId, relationship] of this.politician.relationships) {
      if (relationship < -20) {
        const threat = context.all_politicians.find(p => p.id === politicianId);
        if (threat) {
          threats.push({
            politician_id: politicianId,
            threat_level: Math.abs(relationship),
            influence: threat.attributes.charisma + threat.attributes.intelligence
          });
        }
      }
    }

    return threats.sort((a, b) => b.threat_level - a.threat_level);
  }

  /**
   * Identify priority issues based on personality
   */
  private identifyPriorityIssues(context: DecisionContext): string[] {
    const priorities = [];

    // Add issues based on personality traits
    if (this.personalityTraits.social_justice_focus > 70) {
      priorities.push('social_justice', 'civil_rights', 'equality');
    }

    if (this.personalityTraits.stability_preference > 70) {
      priorities.push('economic_stability', 'institutional_strength', 'public_order');
    }

    if (this.personalityTraits.anti_establishment > 70) {
      priorities.push('government_reform', 'corruption_fighting', 'transparency');
    }

    // Add issues from climate
    priorities.push(...context.climate.dominant_issues);

    return Array.from(new Set(priorities)).slice(0, 5);
  }

  /**
   * Forecast political stability
   */
  private forecastStability(context: DecisionContext): number {
    return context.climate.stability;
  }

  /**
   * Apply personality-based weight modifiers
   */
  private applyPersonalityModifiers(weight: number, action: PoliticalAction): number {
    // Apply archetype decision modifiers based on action type
    if (action.type.includes('economic')) {
      weight *= this.archetype.decision_modifiers.economic_policy_weight;
    }
    if (action.type.includes('social')) {
      weight *= this.archetype.decision_modifiers.social_policy_weight;
    }
    if (action.type.includes('foreign')) {
      weight *= this.archetype.decision_modifiers.foreign_policy_weight;
    }

    // Apply specific trait modifiers
    if (action.type.includes('coalition')) {
      weight *= (1 + this.personalityTraits.coalition_building / 100);
    }
    if (action.type.includes('compromise')) {
      weight *= (1 + this.personalityTraits.compromise_willingness / 100);
    }
    if (action.type.includes('risk')) {
      weight *= (1 + this.personalityTraits.risk_tolerance / 100);
    }

    return weight;
  }

  /**
   * Apply strategic modifiers based on situation
   */
  private applyStrategicModifiers(
    weight: number,
    action: PoliticalAction,
    assessment: SituationAssessment
  ): number {
    // Boost defensive actions when under threat
    if (assessment.threat_level > 60 && action.type.includes('defensive')) {
      weight *= 1.5;
    }

    // Boost aggressive actions when position is strong
    if (assessment.position_strength > 70 && action.type.includes('aggressive')) {
      weight *= 1.3;
    }

    // Boost relationship actions when isolated
    if (assessment.allies.length < 2 && action.type.includes('relationship')) {
      weight *= 1.4;
    }

    return weight;
  }

  /**
   * Apply relationship-based modifiers
   */
  private applyRelationshipModifiers(
    weight: number,
    action: PoliticalAction,
    context: DecisionContext
  ): number {
    if (action.target_id) {
      const relationship = this.politician.relationships.get(action.target_id) || 0;

      // Boost cooperative actions with allies
      if (relationship > 0 && action.type.includes('cooperative')) {
        weight *= (1 + relationship / 100);
      }

      // Boost competitive actions with rivals
      if (relationship < 0 && action.type.includes('competitive')) {
        weight *= (1 + Math.abs(relationship) / 100);
      }
    }

    return weight;
  }

  /**
   * Generate reasoning for action weighting
   */
  private generateWeightingReasoning(action: PoliticalAction, weight: number): string {
    const reasons = [];

    if (weight > 50) {
      reasons.push('High strategic value');
    }
    if (action.expected_effects.success_probability > 70) {
      reasons.push('High success probability');
    }
    if (action.expected_effects.approval_change > 0) {
      reasons.push('Positive approval impact');
    }

    return reasons.join(', ') || 'Standard consideration';
  }

  /**
   * Record decision for consistency tracking
   */
  private recordDecision(tick: number, action: PoliticalAction): void {
    this.decisionHistory.push({
      tick,
      action,
      outcome: null // Will be filled after action execution
    });

    // Keep only recent history (last 50 decisions)
    if (this.decisionHistory.length > 50) {
      this.decisionHistory.shift();
    }
  }

  /**
   * Generate specific action based on type
   */
  private async generateSpecificAction(
    actionType: string,
    context: DecisionContext,
    assessment: SituationAssessment
  ): Promise<PoliticalAction | null> {
    // Implementation would generate specific actions based on action type
    // This is a placeholder that returns a basic action structure
    return {
      type: actionType,
      description: `Execute ${actionType} strategy`,
      parameters: {},
      expected_effects: {
        approval_change: 0,
        relationship_changes: [],
        resource_costs: { influence: 10, media: 5, money: 0 },
        success_probability: 50
      },
      priority: 5
    };
  }

  /**
   * Generate reactive actions to events
   */
  private async generateReactiveActions(
    event: SimulationEvent,
    context: DecisionContext,
    assessment: SituationAssessment
  ): Promise<PoliticalAction[]> {
    const actions: PoliticalAction[] = [];

    // Get appropriate response patterns from archetype
    const responsePatterns = this.archetype.response_patterns[event.type as keyof typeof this.archetype.response_patterns] || [];

    for (const pattern of responsePatterns) {
      actions.push({
        type: `event_response_${pattern}`,
        description: `Respond to ${event.title} with ${pattern}`,
        parameters: { event_id: event.id, response_type: pattern },
        expected_effects: {
          approval_change: Math.random() * 20 - 10,
          relationship_changes: [],
          resource_costs: { influence: 5, media: 10, money: 0 },
          success_probability: 60
        },
        priority: 7
      });
    }

    return actions;
  }

  /**
   * Generate relationship-building actions
   */
  private async generateRelationshipActions(
    context: DecisionContext,
    assessment: SituationAssessment
  ): Promise<PoliticalAction[]> {
    const actions: PoliticalAction[] = [];

    // Build relationships with compatible politicians
    for (const politician of context.all_politicians) {
      if (politician.id === this.politician.id) continue;

      const compatibility = calculatePersonalityCompatibility(
        this.personalityTraits,
        politician.personality as AIPersonalityTraits
      );

      if (compatibility > 30) {
        actions.push({
          type: 'build_relationship',
          description: `Build relationship with ${politician.name}`,
          target_id: politician.id,
          parameters: { compatibility },
          expected_effects: {
            approval_change: 2,
            relationship_changes: [{ politician_id: politician.id, change: 10 }],
            resource_costs: { influence: 5, media: 0, money: 10 },
            success_probability: compatibility
          },
          priority: 6
        });
      }
    }

    return actions;
  }

  /**
   * Generate policy-related actions
   */
  private async generatePolicyActions(
    context: DecisionContext,
    assessment: SituationAssessment
  ): Promise<PoliticalAction[]> {
    const actions: PoliticalAction[] = [];

    // Support or oppose policies based on personality
    for (const policy of context.active_policies) {
      const alignment = this.calculatePolicyAlignment(policy);

      if (Math.abs(alignment) > 30) {
        const actionType = alignment > 0 ? 'support_policy' : 'oppose_policy';
        actions.push({
          type: actionType,
          description: `${actionType.split('_')[0]} ${policy.title}`,
          target_id: policy.id,
          parameters: { alignment },
          expected_effects: {
            approval_change: alignment / 10,
            relationship_changes: [],
            resource_costs: { influence: 10, media: 5, money: 0 },
            success_probability: 70
          },
          priority: Math.abs(alignment) / 10
        });
      }
    }

    return actions;
  }

  /**
   * Calculate alignment with a policy based on personality
   */
  private calculatePolicyAlignment(policy: Policy): number {
    // This is a simplified calculation - in practice would consider
    // policy category, politician's stance, and personality traits
    let alignment = 0;

    // Base alignment on political stance similarity
    if (this.politician.political_stance === 'left' && policy.category === 'social') {
      alignment += 40;
    }
    if (this.politician.political_stance === 'right' && policy.category === 'economic') {
      alignment += 40;
    }

    // Apply personality modifiers
    if (policy.category === 'social' && this.personalityTraits.social_justice_focus > 70) {
      alignment += 30;
    }

    return Math.max(-100, Math.min(100, alignment));
  }

  /**
   * Get politician's decision history for consistency analysis
   */
  public getDecisionHistory(): Array<{ tick: number; action: PoliticalAction; outcome: any }> {
    return [...this.decisionHistory];
  }

  /**
   * Get politician's personality traits
   */
  public getPersonalityTraits(): AIPersonalityTraits {
    return { ...this.personalityTraits };
  }

  /**
   * Get politician's archetype
   */
  public getArchetype(): PersonalityArchetype {
    return { ...this.archetype };
  }
}