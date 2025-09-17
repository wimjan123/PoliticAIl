/**
 * Decision Subsystem
 *
 * Processes simple political decisions made by politicians and blocs,
 * including policy support changes and basic strategic choices.
 */

import { SimulationSubsystem } from '../../engine/SubsystemCoordinator';
import { SubsystemResult, SubsystemConfig } from '../../engine/types';
import { Politician, Bloc, Policy, PolicyPosition } from '../../types/entities';

interface PoliticalDecision {
  id: string;
  entityId: string;
  entityType: 'politician' | 'bloc';
  type: 'policy_support' | 'relationship_action' | 'strategic_move';
  details: Record<string, any>;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

/**
 * Subsystem for processing political decisions
 */
export class DecisionSubsystem extends SimulationSubsystem {
  private recentDecisions: Map<string, PoliticalDecision> = new Map();
  private decisionIdCounter: number = 0;

  constructor() {
    const config: SubsystemConfig = {
      name: 'DecisionSubsystem',
      priority: 4,
      dependencies: ['PoliticalEntitySubsystem', 'RelationshipSubsystem'],
      timeBudget: 25, // 25ms target
      canRunParallel: false, // Decisions need sequential processing
      scalingFactor: 0.6
    };

    super('DecisionSubsystem', config);
  }

  /**
   * Process decision making for this tick
   */
  async processEntities(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<SubsystemResult> {
    const startTime = performance.now();

    try {
      let decisionsProcessed = 0;

      // Process messages from other subsystems
      const messages = this.getPendingMessages();
      const relationshipUpdates = messages.filter(msg => msg.from === 'RelationshipSubsystem');

      // Process politician decisions
      for (const politician of politicians) {
        const decisions = await this.processPoliticianDecisions(politician, politicians, blocs, policies, tickNumber);
        decisionsProcessed += decisions;
      }

      // Process bloc decisions
      for (const bloc of blocs) {
        const decisions = await this.processBlocDecisions(bloc, politicians, blocs, policies, tickNumber);
        decisionsProcessed += decisions;
      }

      const processingTime = performance.now() - startTime;

      // Send decision outcomes to other subsystems
      if (decisionsProcessed > 0) {
        this.sendMessage({
          to: 'PoliticalEntitySubsystem',
          type: 'data',
          priority: 'normal',
          payload: {
            decisionsProcessed,
            recentDecisions: Array.from(this.recentDecisions.values()).slice(-5),
            tickNumber
          }
        });
      }

      return {
        name: this.name,
        processingTime,
        entitiesProcessed: politicians.length + blocs.length,
        withinBudget: processingTime <= this.config.timeBudget,
        timeBudget: this.config.timeBudget,
        success: true,
        metadata: {
          decisionsProcessed,
          messagesReceived: messages.length,
          relationshipUpdates: relationshipUpdates.length,
          totalPendingDecisions: this.recentDecisions.size
        }
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;

      return {
        name: this.name,
        processingTime,
        entitiesProcessed: 0,
        withinBudget: processingTime <= this.config.timeBudget,
        timeBudget: this.config.timeBudget,
        success: false,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Process decisions for a politician
   */
  private async processPoliticianDecisions(
    politician: Politician,
    allPoliticians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<number> {
    let decisionsProcessed = 0;

    // Decision chance based on personality traits
    const decisionProbability = this.calculateDecisionProbability(politician);

    if (Math.random() < decisionProbability) {
      const decision = await this.generatePoliticianDecision(politician, allPoliticians, blocs, policies);
      if (decision) {
        await this.executeDecision(decision, politician, allPoliticians, blocs, policies);
        this.recentDecisions.set(decision.id, decision);
        decisionsProcessed++;
      }
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2));

    return decisionsProcessed;
  }

  /**
   * Process decisions for a bloc
   */
  private async processBlocDecisions(
    bloc: Bloc,
    politicians: Politician[],
    allBlocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<number> {
    let decisionsProcessed = 0;

    // Blocs make decisions less frequently than individuals
    const decisionProbability = 0.1; // 10% chance per tick

    if (Math.random() < decisionProbability) {
      const decision = await this.generateBlocDecision(bloc, politicians, allBlocs, policies);
      if (decision) {
        await this.executeDecision(decision, undefined, politicians, allBlocs, policies);
        this.recentDecisions.set(decision.id, decision);
        decisionsProcessed++;
      }
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));

    return decisionsProcessed;
  }

  /**
   * Calculate decision probability for a politician
   */
  private calculateDecisionProbability(politician: Politician): number {
    // Base probability
    let probability = 0.15; // 15% base chance

    // Adjust based on ambition
    probability += (politician.attributes.ambition / 100) * 0.1;

    // Adjust based on risk tolerance
    probability += (politician.personality.risk_tolerance / 100) * 0.05;

    // Clamp to reasonable range
    return Math.max(0.05, Math.min(0.3, probability));
  }

  /**
   * Generate a decision for a politician
   */
  private async generatePoliticianDecision(
    politician: Politician,
    allPoliticians: Politician[],
    blocs: Bloc[],
    policies: Policy[]
  ): Promise<PoliticalDecision | null> {
    const decisionTypes = ['policy_support', 'relationship_action', 'strategic_move'];
    const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];

    switch (decisionType) {
      case 'policy_support':
        return this.generatePolicySupportDecision(politician, policies);

      case 'relationship_action':
        return this.generateRelationshipDecision(politician, allPoliticians);

      case 'strategic_move':
        return this.generateStrategicDecision(politician, blocs);

      default:
        return null;
    }
  }

  /**
   * Generate a decision for a bloc
   */
  private async generateBlocDecision(
    bloc: Bloc,
    politicians: Politician[],
    allBlocs: Bloc[],
    policies: Policy[]
  ): Promise<PoliticalDecision | null> {
    // Blocs primarily make policy and strategic decisions
    const decisionTypes = ['policy_support', 'strategic_move'];
    const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];

    const decision: PoliticalDecision = {
      id: `decision_${++this.decisionIdCounter}`,
      entityId: bloc.id,
      entityType: 'bloc',
      type: decisionType as any,
      details: {},
      reasoning: '',
      confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
      timestamp: new Date()
    };

    if (decisionType === 'policy_support' && policies.length > 0) {
      const targetPolicy = policies[Math.floor(Math.random() * policies.length)];
      const stance = Math.random() > 0.5 ? 'support' : 'oppose';

      decision.details = {
        policyId: targetPolicy.id,
        stance,
        strength: Math.random() * 40 + 30 // 30-70 strength
      };
      decision.reasoning = `Bloc ${bloc.name} decides to ${stance} ${targetPolicy.title} based on platform alignment`;
    }

    return decision;
  }

  /**
   * Generate policy support decision
   */
  private generatePolicySupportDecision(
    politician: Politician,
    policies: Policy[]
  ): PoliticalDecision | null {
    if (policies.length === 0) {
      return null;
    }

    const targetPolicy = policies[Math.floor(Math.random() * policies.length)];

    // Check if politician already has a position on this policy
    const existingPosition = politician.policy_positions.find(p => p.policy_id === targetPolicy.id);

    if (existingPosition && Math.random() < 0.7) {
      // 30% chance to change existing position
      return null;
    }

    const stance = this.calculatePolicyStance(politician, targetPolicy);
    const strength = Math.random() * 50 + 25; // 25-75 strength

    return {
      id: `decision_${++this.decisionIdCounter}`,
      entityId: politician.id,
      entityType: 'politician',
      type: 'policy_support',
      details: {
        policyId: targetPolicy.id,
        stance,
        strength,
        changeExisting: !!existingPosition
      },
      reasoning: `${politician.name} decides to ${stance} ${targetPolicy.title} based on political stance and values`,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      timestamp: new Date()
    };
  }

  /**
   * Generate relationship action decision
   */
  private generateRelationshipDecision(
    politician: Politician,
    allPoliticians: Politician[]
  ): PoliticalDecision | null {
    const otherPoliticians = allPoliticians.filter(p => p.id !== politician.id);
    if (otherPoliticians.length === 0) {
      return null;
    }

    const target = otherPoliticians[Math.floor(Math.random() * otherPoliticians.length)];
    const currentRelationship = politician.relationships.get(target.id) || 0;

    const actionType = Math.random() > 0.5 ? 'improve' : 'distance';
    const intensity = Math.random() * 10 + 5; // 5-15 point change

    return {
      id: `decision_${++this.decisionIdCounter}`,
      entityId: politician.id,
      entityType: 'politician',
      type: 'relationship_action',
      details: {
        targetId: target.id,
        actionType,
        intensity,
        currentRelationship
      },
      reasoning: `${politician.name} decides to ${actionType} relationship with ${target.name}`,
      confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
      timestamp: new Date()
    };
  }

  /**
   * Generate strategic decision
   */
  private generateStrategicDecision(
    politician: Politician,
    blocs: Bloc[]
  ): PoliticalDecision | null {
    const actions = ['seek_alliance', 'increase_visibility', 'build_coalition'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    return {
      id: `decision_${++this.decisionIdCounter}`,
      entityId: politician.id,
      entityType: 'politician',
      type: 'strategic_move',
      details: {
        action,
        intensity: Math.random() * 20 + 10 // 10-30 intensity
      },
      reasoning: `${politician.name} decides to ${action} to improve political position`,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      timestamp: new Date()
    };
  }

  /**
   * Calculate appropriate policy stance for politician
   */
  private calculatePolicyStance(politician: Politician, policy: Policy): 'support' | 'oppose' | 'neutral' {
    // Simple stance calculation based on political alignment
    const stanceValues = { 'left': -1, 'center': 0, 'right': 1 };
    const politicianValue = stanceValues[politician.political_stance as keyof typeof stanceValues] || 0;

    // Add some randomness based on personality
    const randomFactor = (Math.random() - 0.5) * (politician.personality.compromise_willingness / 100);
    const finalValue = politicianValue + randomFactor;

    if (finalValue > 0.3) return 'support';
    if (finalValue < -0.3) return 'oppose';
    return 'neutral';
  }

  /**
   * Execute a decision and apply its effects
   */
  private async executeDecision(
    decision: PoliticalDecision,
    politician: Politician | undefined,
    allPoliticians: Politician[],
    blocs: Bloc[],
    policies: Policy[]
  ): Promise<void> {
    switch (decision.type) {
      case 'policy_support':
        await this.executePolicySupportDecision(decision, politician, policies);
        break;

      case 'relationship_action':
        await this.executeRelationshipDecision(decision, politician, allPoliticians);
        break;

      case 'strategic_move':
        await this.executeStrategicDecision(decision, politician);
        break;
    }

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1));
  }

  /**
   * Execute policy support decision
   */
  private async executePolicySupportDecision(
    decision: PoliticalDecision,
    politician: Politician | undefined,
    policies: Policy[]
  ): Promise<void> {
    if (!politician) return;

    const { policyId, stance, strength, changeExisting } = decision.details;

    if (changeExisting) {
      // Update existing position
      const existingIndex = politician.policy_positions.findIndex(p => p.policy_id === policyId);
      if (existingIndex !== -1) {
        politician.policy_positions[existingIndex] = {
          ...politician.policy_positions[existingIndex],
          stance,
          strength,
          declared_at: new Date()
        };
      }
    } else {
      // Add new position
      const newPosition: PolicyPosition = {
        policy_id: policyId,
        stance,
        strength,
        reasoning: decision.reasoning,
        declared_at: new Date()
      };

      politician.policy_positions.push(newPosition);
    }
  }

  /**
   * Execute relationship decision
   */
  private async executeRelationshipDecision(
    decision: PoliticalDecision,
    politician: Politician | undefined,
    allPoliticians: Politician[]
  ): Promise<void> {
    if (!politician) return;

    const { targetId, actionType, intensity } = decision.details;
    const currentRelationship = politician.relationships.get(targetId) || 0;

    let newRelationship = currentRelationship;
    if (actionType === 'improve') {
      newRelationship += intensity;
    } else {
      newRelationship -= intensity;
    }

    // Clamp to valid range
    newRelationship = Math.max(-100, Math.min(100, newRelationship));
    politician.relationships.set(targetId, newRelationship);
  }

  /**
   * Execute strategic decision
   */
  private async executeStrategicDecision(
    decision: PoliticalDecision,
    politician: Politician | undefined
  ): Promise<void> {
    if (!politician) return;

    const { action, intensity } = decision.details;

    // Simple strategic effects
    switch (action) {
      case 'seek_alliance':
        // Small boost to collaboration preference
        politician.personality.collaboration_preference = Math.min(100,
          politician.personality.collaboration_preference + intensity * 0.5);
        break;

      case 'increase_visibility':
        // Small boost to approval rating
        politician.approval_rating = Math.min(100,
          politician.approval_rating + intensity * 0.3);
        break;

      case 'build_coalition':
        // Small boost to compromise willingness
        politician.personality.compromise_willingness = Math.min(100,
          politician.personality.compromise_willingness + intensity * 0.4);
        break;
    }
  }

  /**
   * Get recent decisions for monitoring
   */
  public getRecentDecisions(): PoliticalDecision[] {
    return Array.from(this.recentDecisions.values());
  }

  /**
   * Clear old decisions (older than 10 ticks)
   */
  public cleanupOldDecisions(): void {
    const cutoffTime = new Date(Date.now() - 10000); // 10 seconds ago

    for (const [id, decision] of this.recentDecisions.entries()) {
      if (decision.timestamp < cutoffTime) {
        this.recentDecisions.delete(id);
      }
    }
  }
}