/**
 * Event Response System
 *
 * Handles AI politician responses to political events with personality-driven behavior.
 * Generates contextually appropriate responses based on:
 * - Personality archetype and traits
 * - Current political position and relationships
 * - Event type and severity
 * - Strategic considerations
 * - Historical response patterns
 */

import { Politician, PoliticalClimate } from '../types/entities';
import { SimulationEvent } from '../types/simulation';
import { AIPersonalityTraits, PersonalityArchetype, PERSONALITY_ARCHETYPES } from '../ai/personalities';
import { PoliticalAction } from '../ai/decision-engine';
import { RelationshipManager } from './relationship-manager';

/**
 * Categorized response templates for different event types
 */
export interface EventResponseTemplate {
  /** Response type identifier */
  type: string;

  /** Template for public statement */
  statement_template: string;

  /** Expected political impact */
  expected_impact: {
    approval_change: number;
    relationship_effects: Array<{
      target_group: 'allies' | 'opponents' | 'public' | 'media';
      effect: number;
    }>;
    resource_cost: {
      influence: number;
      media: number;
      money: number;
    };
  };

  /** Follow-up actions that might be taken */
  followup_actions: string[];

  /** Conditions where this response is most appropriate */
  conditions: {
    min_approval?: number;
    max_approval?: number;
    personality_requirements?: Array<{
      trait: keyof AIPersonalityTraits;
      min_value?: number;
      max_value?: number;
    }>;
    relationship_requirements?: Array<{
      type: 'allies' | 'enemies';
      min_count: number;
    }>;
  };
}

/**
 * Specific response to a political event
 */
export interface EventResponse {
  /** Politician making the response */
  politician_id: string;

  /** Event being responded to */
  event_id: string;

  /** Type of response */
  response_type: string;

  /** Actual statement or action taken */
  statement: string;

  /** Actions to be executed as part of response */
  actions: PoliticalAction[];

  /** Timing of the response (immediate, delayed, etc.) */
  timing: 'immediate' | 'calculated' | 'delayed' | 'strategic';

  /** Confidence level in this response (0-100) */
  confidence: number;

  /** Whether this response was coordinated with allies */
  coordinated: boolean;

  /** Expected vs actual outcomes */
  outcome_tracking: {
    expected_approval_change: number;
    actual_approval_change?: number;
    expected_relationship_changes: Array<{
      politician_id: string;
      expected_change: number;
      actual_change?: number;
    }>;
  };
}

/**
 * Response pattern analysis for consistency checking
 */
export interface ResponsePattern {
  politician_id: string;
  event_types: Record<string, number>; // Event type -> response count
  response_types: Record<string, number>; // Response type -> usage count
  consistency_score: number; // 0-100, how consistent responses are
  adaptability_score: number; // 0-100, how well politician adapts to context
}

/**
 * Event Response System for AI Politicians
 */
export class EventResponseSystem {
  private responseTemplates: Map<string, EventResponseTemplate[]> = new Map();
  private responseHistory: Map<string, EventResponse[]> = new Map();
  private relationshipManager: RelationshipManager;

  constructor(relationshipManager: RelationshipManager) {
    this.relationshipManager = relationshipManager;
    this.initializeResponseTemplates();
  }

  /**
   * Generate response to a political event
   * @param politician - Politician responding to event
   * @param event - Political event to respond to
   * @param context - Current political context
   * @param archetype - Politician's personality archetype
   * @returns Event response
   */
  public generateEventResponse(
    politician: Politician,
    event: SimulationEvent,
    context: {
      climate: PoliticalClimate;
      all_politicians: Politician[];
      current_tick: number;
    },
    archetype: PersonalityArchetype
  ): EventResponse {
    // Step 1: Analyze event and determine appropriate response types
    const candidateResponses = this.getCandidateResponses(politician, event, archetype);

    // Step 2: Evaluate each response option
    const evaluatedResponses = this.evaluateResponseOptions(
      politician,
      event,
      candidateResponses,
      context
    );

    // Step 3: Select best response based on personality and strategy
    const selectedResponse = this.selectOptimalResponse(
      politician,
      evaluatedResponses,
      archetype
    );

    // Step 4: Generate specific statement and actions
    const response = this.generateSpecificResponse(
      politician,
      event,
      selectedResponse,
      context,
      archetype
    );

    // Step 5: Record response for pattern analysis
    this.recordResponse(politician.id, response);

    return response;
  }

  /**
   * Analyze politician's response patterns for consistency
   * @param politicianId - Politician to analyze
   * @returns Response pattern analysis
   */
  public analyzeResponsePatterns(politicianId: string): ResponsePattern {
    const responses = this.responseHistory.get(politicianId) || [];

    if (responses.length === 0) {
      return {
        politician_id: politicianId,
        event_types: {},
        response_types: {},
        consistency_score: 50,
        adaptability_score: 50
      };
    }

    // Count event types and response types
    const eventTypes: Record<string, number> = {};
    const responseTypes: Record<string, number> = {};

    for (const response of responses) {
      eventTypes[response.event_id] = (eventTypes[response.event_id] || 0) + 1;
      responseTypes[response.response_type] = (responseTypes[response.response_type] || 0) + 1;
    }

    // Calculate consistency score (how often politician uses same response type for similar events)
    const consistencyScore = this.calculateConsistencyScore(responses);

    // Calculate adaptability score (how well politician adapts to different contexts)
    const adaptabilityScore = this.calculateAdaptabilityScore(responses);

    return {
      politician_id: politicianId,
      event_types,
      response_types,
      consistency_score: consistencyScore,
      adaptability_score: adaptabilityScore
    };
  }

  /**
   * Get coordinated response from multiple politicians
   * @param politicians - Politicians coordinating response
   * @param event - Event to respond to
   * @param context - Political context
   * @returns Coordinated responses
   */
  public generateCoordinatedResponse(
    politicians: Politician[],
    event: SimulationEvent,
    context: {
      climate: PoliticalClimate;
      all_politicians: Politician[];
      current_tick: number;
    }
  ): EventResponse[] {
    const responses: EventResponse[] = [];
    const coordination = this.planCoordination(politicians, event, context);

    for (const politician of politicians) {
      const archetype = this.getArchetypeForPolitician(politician);
      const response = this.generateEventResponse(politician, event, context, archetype);

      // Apply coordination modifications
      if (coordination.unified_message) {
        response.statement = this.adaptStatementForCoordination(
          response.statement,
          coordination.unified_message
        );
        response.coordinated = true;
      }

      responses.push(response);
    }

    return responses;
  }

  /**
   * Initialize response templates for different event types
   */
  private initializeResponseTemplates(): void {
    // Crisis Response Templates
    this.responseTemplates.set('crisis', [
      {
        type: 'calm_leadership',
        statement_template: 'In times of crisis, we must remain calm and work together. I propose {specific_action} to address this challenge.',
        expected_impact: {
          approval_change: 5,
          relationship_effects: [
            { target_group: 'public', effect: 8 },
            { target_group: 'allies', effect: 3 }
          ],
          resource_cost: { influence: 10, media: 15, money: 0 }
        },
        followup_actions: ['propose_legislation', 'form_committee', 'public_address'],
        conditions: {
          personality_requirements: [
            { trait: 'stability_preference', min_value: 60 }
          ]
        }
      },
      {
        type: 'aggressive_response',
        statement_template: 'This crisis demands immediate and decisive action. The time for half-measures is over.',
        expected_impact: {
          approval_change: 3,
          relationship_effects: [
            { target_group: 'allies', effect: 5 },
            { target_group: 'opponents', effect: -8 }
          ],
          resource_cost: { influence: 15, media: 20, money: 5 }
        },
        followup_actions: ['emergency_legislation', 'media_campaign', 'rally_base'],
        conditions: {
          personality_requirements: [
            { trait: 'risk_tolerance', min_value: 70 }
          ]
        }
      },
      {
        type: 'systematic_analysis',
        statement_template: 'We need to carefully analyze the data and consult with experts before rushing to judgment.',
        expected_impact: {
          approval_change: 2,
          relationship_effects: [
            { target_group: 'media', effect: 4 },
            { target_group: 'public', effect: 1 }
          ],
          resource_cost: { influence: 5, media: 10, money: 15 }
        },
        followup_actions: ['expert_consultation', 'data_analysis', 'measured_response'],
        conditions: {
          personality_requirements: [
            { trait: 'data_reliance', min_value: 70 }
          ]
        }
      }
    ]);

    // Scandal Response Templates
    this.responseTemplates.set('scandal', [
      {
        type: 'moral_outrage',
        statement_template: 'This behavior is completely unacceptable and goes against everything we stand for.',
        expected_impact: {
          approval_change: 4,
          relationship_effects: [
            { target_group: 'public', effect: 6 },
            { target_group: 'allies', effect: 2 }
          ],
          resource_cost: { influence: 8, media: 12, money: 0 }
        },
        followup_actions: ['demand_resignation', 'call_for_investigation', 'distance_from_scandal'],
        conditions: {
          personality_requirements: [
            { trait: 'integrity', min_value: 70 }
          ]
        }
      },
      {
        type: 'due_process',
        statement_template: 'While these allegations are serious, we must allow due process to take its course.',
        expected_impact: {
          approval_change: 1,
          relationship_effects: [
            { target_group: 'allies', effect: 3 },
            { target_group: 'public', effect: -2 }
          ],
          resource_cost: { influence: 5, media: 8, money: 0 }
        },
        followup_actions: ['support_investigation', 'measured_statement', 'await_facts'],
        conditions: {
          personality_requirements: [
            { trait: 'compromise_willingness', min_value: 60 }
          ]
        }
      }
    ]);

    // Opportunity Response Templates
    this.responseTemplates.set('opportunity', [
      {
        type: 'seize_initiative',
        statement_template: 'This is exactly the moment we\'ve been waiting for to advance {policy_area}.',
        expected_impact: {
          approval_change: 6,
          relationship_effects: [
            { target_group: 'allies', effect: 8 },
            { target_group: 'opponents', effect: -5 }
          ],
          resource_cost: { influence: 20, media: 25, money: 10 }
        },
        followup_actions: ['push_agenda', 'rally_support', 'media_blitz'],
        conditions: {
          personality_requirements: [
            { trait: 'ambition', min_value: 70 }
          ]
        }
      },
      {
        type: 'build_coalition',
        statement_template: 'This opportunity allows us to bring people together around our shared values.',
        expected_impact: {
          approval_change: 4,
          relationship_effects: [
            { target_group: 'allies', effect: 6 },
            { target_group: 'public', effect: 4 }
          ],
          resource_cost: { influence: 15, media: 10, money: 5 }
        },
        followup_actions: ['form_coalition', 'bipartisan_outreach', 'unity_message'],
        conditions: {
          personality_requirements: [
            { trait: 'coalition_building', min_value: 70 }
          ]
        }
      }
    ]);

    // Election Response Templates
    this.responseTemplates.set('election', [
      {
        type: 'populist_appeal',
        statement_template: 'The people have spoken, and I will fight for their interests against the establishment.',
        expected_impact: {
          approval_change: 8,
          relationship_effects: [
            { target_group: 'public', effect: 12 },
            { target_group: 'opponents', effect: -10 }
          ],
          resource_cost: { influence: 10, media: 20, money: 15 }
        },
        followup_actions: ['grassroots_mobilization', 'anti_elite_messaging', 'direct_democracy'],
        conditions: {
          personality_requirements: [
            { trait: 'populism_tendency', min_value: 70 }
          ]
        }
      },
      {
        type: 'unity_message',
        statement_template: 'Regardless of the outcome, we must come together as a nation to face our challenges.',
        expected_impact: {
          approval_change: 3,
          relationship_effects: [
            { target_group: 'public', effect: 5 },
            { target_group: 'allies', effect: 4 },
            { target_group: 'opponents', effect: 2 }
          ],
          resource_cost: { influence: 8, media: 12, money: 0 }
        },
        followup_actions: ['bipartisan_outreach', 'healing_rhetoric', 'inclusive_messaging'],
        conditions: {
          personality_requirements: [
            { trait: 'compromise_willingness', min_value: 60 }
          ]
        }
      }
    ]);
  }

  /**
   * Get candidate responses for an event
   */
  private getCandidateResponses(
    politician: Politician,
    event: SimulationEvent,
    archetype: PersonalityArchetype
  ): EventResponseTemplate[] {
    const eventTypeTemplates = this.responseTemplates.get(event.type) || [];
    const candidateResponses: EventResponseTemplate[] = [];

    for (const template of eventTypeTemplates) {
      if (this.isResponseAppropriate(politician, template, archetype)) {
        candidateResponses.push(template);
      }
    }

    // Add archetype-specific responses
    const archetypeResponses = this.getArchetypeSpecificResponses(event, archetype);
    candidateResponses.push(...archetypeResponses);

    return candidateResponses;
  }

  /**
   * Check if response is appropriate for politician
   */
  private isResponseAppropriate(
    politician: Politician,
    template: EventResponseTemplate,
    archetype: PersonalityArchetype
  ): boolean {
    const { conditions } = template;

    // Check approval requirements
    if (conditions.min_approval && politician.approval_rating < conditions.min_approval) {
      return false;
    }
    if (conditions.max_approval && politician.approval_rating > conditions.max_approval) {
      return false;
    }

    // Check personality requirements
    if (conditions.personality_requirements) {
      const traits = archetype.traits;
      for (const req of conditions.personality_requirements) {
        const traitValue = traits[req.trait];
        if (req.min_value && traitValue < req.min_value) return false;
        if (req.max_value && traitValue > req.max_value) return false;
      }
    }

    // Check relationship requirements
    if (conditions.relationship_requirements) {
      for (const req of conditions.relationship_requirements) {
        const relationships = this.relationshipManager.getPoliticianRelationships(politician.id);
        const relevantRels = relationships.filter(rel => {
          if (req.type === 'allies') return rel.current_score > 30;
          if (req.type === 'enemies') return rel.current_score < -30;
          return false;
        });

        if (relevantRels.length < req.min_count) return false;
      }
    }

    return true;
  }

  /**
   * Get archetype-specific responses
   */
  private getArchetypeSpecificResponses(
    event: SimulationEvent,
    archetype: PersonalityArchetype
  ): EventResponseTemplate[] {
    const responses: EventResponseTemplate[] = [];
    const patterns = archetype.response_patterns[event.type as keyof typeof archetype.response_patterns];

    if (patterns) {
      for (const pattern of patterns) {
        responses.push({
          type: pattern,
          statement_template: `Execute ${pattern} strategy in response to ${event.title}`,
          expected_impact: {
            approval_change: Math.random() * 10 - 5,
            relationship_effects: [],
            resource_cost: { influence: 10, media: 10, money: 5 }
          },
          followup_actions: [pattern],
          conditions: {}
        });
      }
    }

    return responses;
  }

  /**
   * Evaluate response options
   */
  private evaluateResponseOptions(
    politician: Politician,
    event: SimulationEvent,
    candidates: EventResponseTemplate[],
    context: any
  ): Array<{ template: EventResponseTemplate; score: number }> {
    return candidates.map(template => ({
      template,
      score: this.scoreResponseOption(politician, event, template, context)
    }));
  }

  /**
   * Score a response option
   */
  private scoreResponseOption(
    politician: Politician,
    event: SimulationEvent,
    template: EventResponseTemplate,
    context: any
  ): number {
    let score = 50; // Base score

    // Factor in expected approval change
    score += template.expected_impact.approval_change * 5;

    // Factor in resource costs (negative)
    const totalCost = template.expected_impact.resource_cost.influence +
                     template.expected_impact.resource_cost.media +
                     template.expected_impact.resource_cost.money;
    score -= totalCost / 5;

    // Factor in relationship effects
    for (const effect of template.expected_impact.relationship_effects) {
      score += effect.effect * 2;
    }

    // Factor in politician's attributes
    if (template.type.includes('leadership')) {
      score += politician.attributes.leadership || 0;
    }
    if (template.type.includes('charisma')) {
      score += politician.attributes.charisma || 0;
    }

    return Math.max(0, score);
  }

  /**
   * Select optimal response
   */
  private selectOptimalResponse(
    politician: Politician,
    evaluatedResponses: Array<{ template: EventResponseTemplate; score: number }>,
    archetype: PersonalityArchetype
  ): EventResponseTemplate {
    // Sort by score
    evaluatedResponses.sort((a, b) => b.score - a.score);

    // Apply unpredictability factor
    const unpredictability = archetype.traits.unpredictability / 100;
    if (Math.random() < unpredictability && evaluatedResponses.length > 1) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, evaluatedResponses.length));
      return evaluatedResponses[randomIndex].template;
    }

    return evaluatedResponses[0].template;
  }

  /**
   * Generate specific response
   */
  private generateSpecificResponse(
    politician: Politician,
    event: SimulationEvent,
    template: EventResponseTemplate,
    context: any,
    archetype: PersonalityArchetype
  ): EventResponse {
    // Generate actual statement from template
    const statement = this.fillStatementTemplate(template.statement_template, politician, event);

    // Generate actions
    const actions = this.generateResponseActions(template, politician, event);

    // Determine timing based on personality
    const timing = this.determineResponseTiming(archetype.traits);

    return {
      politician_id: politician.id,
      event_id: event.id,
      response_type: template.type,
      statement,
      actions,
      timing,
      confidence: Math.min(100, 50 + politician.attributes.intelligence / 2),
      coordinated: false,
      outcome_tracking: {
        expected_approval_change: template.expected_impact.approval_change,
        expected_relationship_changes: []
      }
    };
  }

  /**
   * Fill statement template with specific details
   */
  private fillStatementTemplate(
    template: string,
    politician: Politician,
    event: SimulationEvent
  ): string {
    return template
      .replace('{politician_name}', politician.name)
      .replace('{event_title}', event.title)
      .replace('{specific_action}', 'targeted legislative action')
      .replace('{policy_area}', 'key policy initiatives');
  }

  /**
   * Generate response actions
   */
  private generateResponseActions(
    template: EventResponseTemplate,
    politician: Politician,
    event: SimulationEvent
  ): PoliticalAction[] {
    return template.followup_actions.map(actionType => ({
      type: actionType,
      description: `Execute ${actionType} as follow-up to event response`,
      parameters: { event_id: event.id, response_type: template.type },
      expected_effects: {
        approval_change: 2,
        relationship_changes: [],
        resource_costs: { influence: 5, media: 5, money: 0 },
        success_probability: 70
      },
      priority: 6
    }));
  }

  /**
   * Determine response timing based on personality
   */
  private determineResponseTiming(traits: AIPersonalityTraits): EventResponse['timing'] {
    if (traits.risk_tolerance > 70) return 'immediate';
    if (traits.data_reliance > 70) return 'calculated';
    if (traits.compromise_willingness > 70) return 'delayed';
    return 'strategic';
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(responses: EventResponse[]): number {
    // Simplified consistency calculation
    // In practice, would analyze patterns of similar responses to similar events
    return Math.min(100, 50 + responses.length * 2);
  }

  /**
   * Calculate adaptability score
   */
  private calculateAdaptabilityScore(responses: EventResponse[]): number {
    // Simplified adaptability calculation
    // In practice, would analyze how well responses adapt to different contexts
    const uniqueResponseTypes = new Set(responses.map(r => r.response_type)).size;
    return Math.min(100, uniqueResponseTypes * 20);
  }

  /**
   * Plan coordination between politicians
   */
  private planCoordination(
    politicians: Politician[],
    event: SimulationEvent,
    context: any
  ): { unified_message: string | null } {
    // Simplified coordination planning
    // In practice, would analyze relationships and determine coordination strategy
    return { unified_message: null };
  }

  /**
   * Adapt statement for coordination
   */
  private adaptStatementForCoordination(
    originalStatement: string,
    unifiedMessage: string
  ): string {
    return `${originalStatement} ${unifiedMessage}`;
  }

  /**
   * Get archetype for politician
   */
  private getArchetypeForPolitician(politician: Politician): PersonalityArchetype {
    // In practice, this would be stored with the politician
    // For now, default to pragmatic centrist
    return PERSONALITY_ARCHETYPES.pragmatic;
  }

  /**
   * Record response for pattern analysis
   */
  private recordResponse(politicianId: string, response: EventResponse): void {
    if (!this.responseHistory.has(politicianId)) {
      this.responseHistory.set(politicianId, []);
    }

    const history = this.responseHistory.get(politicianId)!;
    history.push(response);

    // Keep only recent history (last 100 responses)
    if (history.length > 100) {
      history.shift();
    }
  }
}