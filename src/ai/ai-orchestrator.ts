/**
 * AI Orchestrator
 *
 * Central system that coordinates all AI behavior components:
 * - Decision engine for political actions
 * - Event response system for political events
 * - Relationship management for politician interactions
 * - Consistency validation for behavior quality
 * - Simulation tick processing and state management
 */

import { Politician, Policy, PoliticalClimate } from '../types/entities';
import { SimulationEvent } from '../types/simulation';
import { AIDecisionEngine, DecisionContext, PoliticalAction } from './decision-engine';
import { EventResponseSystem, EventResponse } from '../behavior/event-response-system';
import { RelationshipManager, PoliticalRelationship } from '../behavior/relationship-manager';
import { AIConsistencyValidator, AIBehaviorAssessment } from './consistency-validator';
import { PERSONALITY_ARCHETYPES, PersonalityArchetype, generatePersonalityVariation } from './personalities';

/**
 * AI politician instance with all required components
 */
export interface AIPolitician {
  /** Core politician data */
  politician: Politician;

  /** Personality archetype */
  archetype: PersonalityArchetype;

  /** Decision engine instance */
  decisionEngine: AIDecisionEngine;

  /** Last decision made */
  lastDecision?: PoliticalAction;

  /** Last event response */
  lastResponse?: EventResponse;

  /** Performance tracking */
  performance: {
    decisions_made: number;
    approval_changes: number[];
    consistency_scores: number[];
    last_assessment?: AIBehaviorAssessment;
  };

  /** Active goals and priorities */
  goals: Array<{
    type: 'approval' | 'policy' | 'relationship' | 'power';
    target: string | number;
    priority: number;
    progress: number;
  }>;
}

/**
 * Simulation tick result
 */
export interface SimulationTickResult {
  /** Current tick number */
  tick: number;

  /** Actions taken by AI politicians */
  actions: Array<{
    politician_id: string;
    action: PoliticalAction;
    success: boolean;
    outcome: any;
  }>;

  /** Event responses generated */
  responses: Array<{
    politician_id: string;
    event_id: string;
    response: EventResponse;
  }>;

  /** Relationship changes */
  relationship_changes: PoliticalRelationship[];

  /** Performance summaries */
  performance_summary: {
    most_active_politician: string;
    highest_approval_change: { politician_id: string; change: number };
    most_relationship_changes: { politician_id: string; changes: number };
    average_consistency: number;
  };

  /** Any issues or warnings */
  issues: Array<{
    type: 'consistency' | 'performance' | 'error';
    politician_id: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * AI Orchestrator - Central coordination system for AI political behavior
 */
export class AIOrchestrater {
  private aiPoliticians: Map<string, AIPolitician> = new Map();
  private relationshipManager: RelationshipManager;
  private responseSystem: EventResponseSystem;
  private consistencyValidator: AIConsistencyValidator;
  private currentTick: number = 0;
  private simulationHistory: SimulationTickResult[] = [];

  constructor() {
    this.relationshipManager = new RelationshipManager();
    this.responseSystem = new EventResponseSystem(this.relationshipManager);

    // Initialize consistency validator with dummy decision engine
    // Will be properly configured when first politician is added
    const dummyEngine = new AIDecisionEngine(
      this.createDummyPolitician(),
      'pragmatic'
    );
    this.consistencyValidator = new AIConsistencyValidator(
      dummyEngine,
      this.responseSystem,
      this.relationshipManager
    );
  }

  /**
   * Initialize an AI politician with specified archetype
   * @param politician - Base politician data
   * @param archetypeName - Personality archetype to use
   * @param personalityVariation - Optional personality trait variations
   * @returns AI politician instance
   */
  public initializeAIPolitician(
    politician: Politician,
    archetypeName: keyof typeof PERSONALITY_ARCHETYPES,
    personalityVariation?: number
  ): AIPolitician {
    const archetype = PERSONALITY_ARCHETYPES[archetypeName];
    if (!archetype) {
      throw new Error(`Unknown personality archetype: ${archetypeName}`);
    }

    // Generate personality traits with optional variation
    const personalityTraits = personalityVariation
      ? generatePersonalityVariation(archetypeName, personalityVariation)
      : archetype.traits;

    // Create decision engine
    const decisionEngine = new AIDecisionEngine(
      politician,
      archetypeName,
      personalityTraits
    );

    // Initialize relationships with other politicians
    for (const [id, otherAI] of this.aiPoliticians) {
      if (id !== politician.id) {
        this.relationshipManager.initializeRelationship(politician, otherAI.politician);
      }
    }

    // Create AI politician instance
    const aiPolitician: AIPolitician = {
      politician,
      archetype: archetypeName,
      decisionEngine,
      performance: {
        decisions_made: 0,
        approval_changes: [],
        consistency_scores: [],
      },
      goals: this.generateInitialGoals(politician, archetypeName)
    };

    this.aiPoliticians.set(politician.id, aiPolitician);

    return aiPolitician;
  }

  /**
   * Process a single simulation tick for all AI politicians
   * @param context - Current simulation context
   * @param events - New events that occurred this tick
   * @returns Tick processing results
   */
  public async processSimulationTick(
    context: {
      climate: PoliticalClimate;
      all_politicians: Politician[];
      active_policies: Policy[];
      urgency: number;
    },
    events: SimulationEvent[] = []
  ): Promise<SimulationTickResult> {
    this.currentTick++;

    const tickResult: SimulationTickResult = {
      tick: this.currentTick,
      actions: [],
      responses: [],
      relationship_changes: [],
      performance_summary: {
        most_active_politician: '',
        highest_approval_change: { politician_id: '', change: 0 },
        most_relationship_changes: { politician_id: '', changes: 0 },
        average_consistency: 0
      },
      issues: []
    };

    try {
      // Step 1: Process event responses
      if (events.length > 0) {
        await this.processEventResponses(events, context, tickResult);
      }

      // Step 2: Generate and execute AI decisions
      await this.processAIDecisions(context, tickResult);

      // Step 3: Update relationships based on actions and responses
      await this.updateRelationships(tickResult);

      // Step 4: Process time-based relationship decay
      const decayedRelationships = this.relationshipManager.processTimeDecay(this.currentTick);
      tickResult.relationship_changes.push(...decayedRelationships);

      // Step 5: Update performance metrics
      await this.updatePerformanceMetrics(tickResult);

      // Step 6: Run consistency checks (every 10 ticks)
      if (this.currentTick % 10 === 0) {
        await this.runConsistencyChecks(tickResult);
      }

      // Step 7: Update goals and priorities
      this.updateGoals(tickResult);

      // Step 8: Generate performance summary
      this.generatePerformanceSummary(tickResult);

    } catch (error) {
      tickResult.issues.push({
        type: 'error',
        politician_id: 'system',
        description: `Tick processing error: ${error}`,
        severity: 'high'
      });
    }

    // Store tick result in history
    this.simulationHistory.push(tickResult);

    // Keep only recent history (last 100 ticks)
    if (this.simulationHistory.length > 100) {
      this.simulationHistory.shift();
    }

    return tickResult;
  }

  /**
   * Process event responses for all relevant AI politicians
   */
  private async processEventResponses(
    events: SimulationEvent[],
    context: any,
    tickResult: SimulationTickResult
  ): Promise<void> {
    for (const event of events) {
      // Determine which politicians should respond to this event
      const respondingPoliticians = this.getRespondingPoliticians(event);

      // Check if politicians should coordinate their response
      const shouldCoordinate = this.shouldCoordinateResponse(event, respondingPoliticians);

      if (shouldCoordinate && respondingPoliticians.length > 1) {
        // Generate coordinated response
        const coordinatedResponses = this.responseSystem.generateCoordinatedResponse(
          respondingPoliticians.map(ai => ai.politician),
          event,
          {
            climate: context.climate,
            all_politicians: context.all_politicians,
            current_tick: this.currentTick
          }
        );

        for (let i = 0; i < respondingPoliticians.length; i++) {
          const aiPolitician = respondingPoliticians[i];
          const response = coordinatedResponses[i];

          if (response && aiPolitician) {
            aiPolitician.lastResponse = response;
            tickResult.responses.push({
              politician_id: aiPolitician.politician.id,
              event_id: event.id,
              response
            });
          }
        }
      } else {
        // Generate individual responses
        for (const aiPolitician of respondingPoliticians) {
          const response = this.responseSystem.generateEventResponse(
            aiPolitician.politician,
            event,
            {
              climate: context.climate,
              all_politicians: context.all_politicians,
              current_tick: this.currentTick
            },
            aiPolitician.archetype
          );

          if (response) {
            aiPolitician.lastResponse = response;
            tickResult.responses.push({
              politician_id: aiPolitician.politician.id,
              event_id: event.id,
              response
            });
          }
        }
      }
    }
  }

  /**
   * Process AI decisions for all politicians
   */
  private async processAIDecisions(
    context: any,
    tickResult: SimulationTickResult
  ): Promise<void> {
    for (const [id, aiPolitician] of this.aiPoliticians) {
      try {
        // Create decision context
        const decisionContext: DecisionContext = {
          climate: context.climate,
          recent_events: this.getRecentEvents(),
          all_politicians: context.all_politicians,
          active_policies: context.active_policies,
          current_tick: this.currentTick,
          urgency: context.urgency
        };

        // Make decision
        const decision = await aiPolitician.decisionEngine.makeDecision(decisionContext);
        aiPolitician.lastDecision = decision;

        // Execute decision (simplified - in practice would interact with game systems)
        const executionResult = await this.executeDecision(aiPolitician, decision);

        tickResult.actions.push({
          politician_id: id,
          action: decision,
          success: executionResult.success,
          outcome: executionResult.outcome
        });

        // Update performance tracking
        aiPolitician.performance.decisions_made++;

        // Record behavior for consistency tracking
        this.consistencyValidator.recordBehavior(
          id,
          this.currentTick,
          decision,
          decisionContext
        );

      } catch (error) {
        tickResult.issues.push({
          type: 'error',
          politician_id: id,
          description: `Decision processing error: ${error}`,
          severity: 'medium'
        });
      }
    }
  }

  /**
   * Update relationships based on tick actions and responses
   */
  private async updateRelationships(tickResult: SimulationTickResult): Promise<void> {
    // Process relationship impacts from actions
    for (const actionResult of tickResult.actions) {
      const aiPolitician = this.aiPoliticians.get(actionResult.politician_id);
      if (!aiPolitician) continue;

      // Find target politician if action has one
      let targetPolitician: Politician | null = null;
      if (actionResult.action.target_id) {
        const targetAI = this.aiPoliticians.get(actionResult.action.target_id);
        targetPolitician = targetAI ? targetAI.politician : null;
      }

      // Process relationship impact
      const updatedRelationships = this.relationshipManager.processActionImpact(
        aiPolitician.politician,
        targetPolitician,
        actionResult.action,
        {
          success: actionResult.success,
          public_response: Math.random() * 100 // Simplified public response
        }
      );

      tickResult.relationship_changes.push(...updatedRelationships);
    }

    // Process relationship impacts from event responses
    for (const responseResult of tickResult.responses) {
      const aiPolitician = this.aiPoliticians.get(responseResult.politician_id);
      if (!aiPolitician) continue;

      // Process relationships based on response coordination and type
      // This would be more complex in practice
    }
  }

  /**
   * Update performance metrics for all politicians
   */
  private async updatePerformanceMetrics(tickResult: SimulationTickResult): Promise<void> {
    for (const [id, aiPolitician] of this.aiPoliticians) {
      // Update approval change tracking
      const currentApproval = aiPolitician.politician.approval_rating;
      const previousApproval = aiPolitician.performance.approval_changes.length > 0
        ? aiPolitician.performance.approval_changes[aiPolitician.performance.approval_changes.length - 1]
        : currentApproval;

      const approvalChange = currentApproval - (previousApproval || currentApproval);
      aiPolitician.performance.approval_changes.push(currentApproval);

      // Keep only recent history
      if (aiPolitician.performance.approval_changes.length > 50) {
        aiPolitician.performance.approval_changes.shift();
      }

      // Track approval change for performance summary
      if (Math.abs(approvalChange) > Math.abs(tickResult.performance_summary.highest_approval_change.change)) {
        tickResult.performance_summary.highest_approval_change = {
          politician_id: id,
          change: approvalChange
        };
      }
    }
  }

  /**
   * Run consistency checks on AI behavior
   */
  private async runConsistencyChecks(tickResult: SimulationTickResult): Promise<void> {
    for (const [, aiPolitician] of this.aiPoliticians) {
      try {
        const assessment = await this.consistencyValidator.validateAIConsistency(
          aiPolitician.politician,
          25 // Check last 25 ticks
        );

        aiPolitician.performance.last_assessment = assessment;
        aiPolitician.performance.consistency_scores.push(assessment.overall_consistency);

        // Keep only recent consistency scores
        if (aiPolitician.performance.consistency_scores.length > 20) {
          aiPolitician.performance.consistency_scores.shift();
        }

        // Flag consistency issues
        if (assessment.overall_consistency < 60) {
          tickResult.issues.push({
            type: 'consistency',
            politician_id: aiPolitician.politician.id,
            description: `Low consistency score: ${assessment.overall_consistency.toFixed(1)}%`,
            severity: assessment.overall_consistency < 40 ? 'high' : 'medium'
          });
        }

      } catch (error) {
        tickResult.issues.push({
          type: 'error',
          politician_id: aiPolitician.politician.id,
          description: `Consistency check error: ${error}`,
          severity: 'low'
        });
      }
    }
  }

  /**
   * Update goals and priorities for all politicians
   */
  private updateGoals(_tickResult: SimulationTickResult): void {
    for (const [, aiPolitician] of this.aiPoliticians) {
      // Update goal progress
      for (const goal of aiPolitician.goals) {
        switch (goal.type) {
          case 'approval':
            goal.progress = (aiPolitician.politician.approval_rating / (goal.target as number)) * 100;
            break;
          case 'relationship':
            // Simplified relationship goal progress
            goal.progress = Math.min(100, goal.progress + 5);
            break;
          // Add other goal types as needed
        }
      }

      // Remove completed goals and add new ones if needed
      aiPolitician.goals = aiPolitician.goals.filter(goal => goal.progress < 100);

      if (aiPolitician.goals.length < 3) {
        // Add new goals based on current situation
        aiPolitician.goals.push(...this.generateNewGoals(aiPolitician));
      }
    }
  }

  /**
   * Generate performance summary for the tick
   */
  private generatePerformanceSummary(tickResult: SimulationTickResult): void {
    let mostActiveId = '';
    let maxActions = 0;
    let totalConsistency = 0;
    let consistencyCount = 0;

    for (const [politicianId, aiPolitician] of this.aiPoliticians) {
      // Find most active politician
      const actionCount = tickResult.actions.filter(a => a.politician_id === politicianId).length;
      if (actionCount > maxActions) {
        maxActions = actionCount;
        mostActiveId = politicianId;
      }

      // Calculate average consistency
      if (aiPolitician.performance.consistency_scores.length > 0) {
        const avgConsistency = aiPolitician.performance.consistency_scores.reduce(
          (sum, score) => sum + score, 0
        ) / aiPolitician.performance.consistency_scores.length;
        totalConsistency += avgConsistency;
        consistencyCount++;
      }
    }

    tickResult.performance_summary.most_active_politician = mostActiveId;
    tickResult.performance_summary.average_consistency = consistencyCount > 0
      ? totalConsistency / consistencyCount
      : 0;

    // Count relationship changes per politician
    const relationshipChangeCounts: Record<string, number> = {};
    for (const change of tickResult.relationship_changes) {
      relationshipChangeCounts[change.politician_1_id] = (relationshipChangeCounts[change.politician_1_id] || 0) + 1;
      relationshipChangeCounts[change.politician_2_id] = (relationshipChangeCounts[change.politician_2_id] || 0) + 1;
    }

    let mostChanges = 0;
    let mostChangesId = '';
    for (const [politicianId, count] of Object.entries(relationshipChangeCounts)) {
      if (count > mostChanges) {
        mostChanges = count;
        mostChangesId = politicianId;
      }
    }

    tickResult.performance_summary.most_relationship_changes = {
      politician_id: mostChangesId,
      changes: mostChanges
    };
  }

  /**
   * Get politicians who should respond to an event
   */
  private getRespondingPoliticians(event: SimulationEvent): AIPolitician[] {
    const responding: AIPolitician[] = [];

    for (const [_id, aiPolitician] of this.aiPoliticians) {
      // Check if politician should respond based on event type and their role/interests
      if (this.shouldPoliticianRespondToEvent(aiPolitician, event)) {
        responding.push(aiPolitician);
      }
    }

    return responding;
  }

  /**
   * Determine if a politician should respond to an event
   */
  private shouldPoliticianRespondToEvent(aiPolitician: AIPolitician, event: SimulationEvent): boolean {
    // Simplified logic - in practice would consider:
    // - Event relevance to politician's portfolio/interests
    // - Politician's position and responsibilities
    // - Event severity and scope
    // - Personality traits (some politicians respond to everything, others are selective)

    // High severity events get responses from most politicians
    if (event.type === 'crisis' || event.type === 'scandal') {
      return true;
    }

    // Some archetypes are more responsive
    if (aiPolitician.archetype.traits.media_savviness > 70) {
      return true;
    }

    // Random chance for other events
    return Math.random() < 0.3;
  }

  /**
   * Determine if politicians should coordinate their response
   */
  private shouldCoordinateResponse(_event: SimulationEvent, politicians: AIPolitician[]): boolean {
    if (politicians.length < 2) return false;

    // Check if politicians are allies
    let alliesCount = 0;
    for (let i = 0; i < politicians.length; i++) {
      for (let j = i + 1; j < politicians.length; j++) {
        const politicianI = politicians[i];
        const politicianJ = politicians[j];
        if (!politicianI || !politicianJ) continue;

        const relationship = this.relationshipManager.getRelationship(
          politicianI.politician.id,
          politicianJ.politician.id
        );
        if (relationship && relationship.current_score > 50) {
          alliesCount++;
        }
      }
    }

    // Coordinate if most relationships are positive
    const totalPairs = (politicians.length * (politicians.length - 1)) / 2;
    return alliesCount / totalPairs > 0.6;
  }

  /**
   * Execute a political decision (simplified)
   */
  private async executeDecision(
    aiPolitician: AIPolitician,
    decision: PoliticalAction
  ): Promise<{ success: boolean; outcome: any }> {
    // Simplified execution - in practice would interact with game systems
    const successProbability = decision.expected_effects.success_probability / 100;
    const success = Math.random() < successProbability;

    // Apply effects to politician
    if (success) {
      aiPolitician.politician.approval_rating = Math.max(0, Math.min(100,
        aiPolitician.politician.approval_rating + decision.expected_effects.approval_change
      ));
    }

    return {
      success,
      outcome: {
        approval_change: success ? decision.expected_effects.approval_change : 0,
        public_response: Math.random() * 100
      }
    };
  }

  /**
   * Get recent events for decision context
   */
  private getRecentEvents(): SimulationEvent[] {
    // In practice, would retrieve from event history
    // For now, return empty array
    return [];
  }

  /**
   * Generate initial goals for a politician
   */
  private generateInitialGoals(politician: Politician, archetype: PersonalityArchetype): AIPolitician['goals'] {
    const goals: AIPolitician['goals'] = [];

    // Approval goal
    goals.push({
      type: 'approval',
      target: Math.min(100, politician.approval_rating + 20),
      priority: 8,
      progress: 0
    });

    // Relationship goal based on archetype
    if (archetype.traits.coalition_building > 70) {
      goals.push({
        type: 'relationship',
        target: 'build_coalitions',
        priority: 7,
        progress: 0
      });
    }

    // Power/influence goal for risk-taking politicians
    if (archetype.traits.risk_tolerance > 70) {
      goals.push({
        type: 'power',
        target: 'increase_influence',
        priority: 6,
        progress: 0
      });
    }

    return goals;
  }

  /**
   * Generate new goals when current ones are completed
   */
  private generateNewGoals(aiPolitician: AIPolitician): AIPolitician['goals'] {
    // Simplified goal generation
    return [{
      type: 'approval',
      target: Math.min(100, aiPolitician.politician.approval_rating + 15),
      priority: 5,
      progress: 0
    }];
  }

  /**
   * Create dummy politician for initialization
   */
  private createDummyPolitician(): Politician {
    return {
      id: 'dummy',
      name: 'Dummy Politician',
      role: 'ai_opponent',
      attributes: {
        charisma: 50,
        intelligence: 50,
        integrity: 50,
        ambition: 50
      },
      approval_rating: 50,
      political_stance: 'center',
      personality: {
        risk_tolerance: 50,
        collaboration_preference: 50,
        compromise_willingness: 50,
        populism_tendency: 50,
        reform_preference: 50
      },
      relationships: new Map(),
      policy_positions: [],
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Get AI politician by ID
   */
  public getAIPolitician(id: string): AIPolitician | undefined {
    return this.aiPoliticians.get(id);
  }

  /**
   * Get all AI politicians
   */
  public getAllAIPoliticians(): AIPolitician[] {
    return Array.from(this.aiPoliticians.values());
  }

  /**
   * Get simulation history
   */
  public getSimulationHistory(): SimulationTickResult[] {
    return [...this.simulationHistory];
  }

  /**
   * Get current tick number
   */
  public getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Get relationship manager instance
   */
  public getRelationshipManager(): RelationshipManager {
    return this.relationshipManager;
  }

  /**
   * Get response system instance
   */
  public getResponseSystem(): EventResponseSystem {
    return this.responseSystem;
  }

  /**
   * Get consistency validator instance
   */
  public getConsistencyValidator(): AIConsistencyValidator {
    return this.consistencyValidator;
  }
}