/**
 * Relationship Subsystem
 *
 * Manages relationships between political entities, including trust scores,
 * alliance formations, and relationship decay over time.
 */

import { SimulationSubsystem } from '../../engine/SubsystemCoordinator';
import { SubsystemResult, SubsystemConfig } from '../../engine/types';
import { Politician, Bloc, Policy } from '../../types/entities';

/**
 * Subsystem for managing entity relationships
 */
export class RelationshipSubsystem extends SimulationSubsystem {
  private relationshipDecayRate: number = 0.02; // 2% per tick

  constructor() {
    const config: SubsystemConfig = {
      name: 'RelationshipSubsystem',
      priority: 2,
      dependencies: ['PoliticalEntitySubsystem'],
      timeBudget: 10, // 10ms target
      canRunParallel: true,
      scalingFactor: 0.9
    };

    super('RelationshipSubsystem', config);
  }

  /**
   * Process relationship updates
   */
  async processEntities(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<SubsystemResult> {
    const startTime = performance.now();

    try {
      let relationshipsProcessed = 0;

      // Process messages from other subsystems
      const messages = this.getPendingMessages();
      const entityUpdates = messages.filter(msg => msg.type === 'data');

      // Update politician relationships
      for (const politician of politicians) {
        const processed = await this.updatePoliticianRelationships(politician, politicians, tickNumber);
        relationshipsProcessed += processed;
      }

      // Update bloc relationships
      for (const bloc of blocs) {
        const processed = await this.updateBlocRelationships(bloc, blocs, tickNumber);
        relationshipsProcessed += processed;
      }

      const processingTime = performance.now() - startTime;

      // Send relationship update messages
      this.sendMessage({
        to: 'DecisionSubsystem',
        type: 'data',
        priority: 'normal',
        payload: {
          relationshipUpdates: relationshipsProcessed,
          tickNumber
        }
      });

      return {
        name: this.name,
        processingTime,
        entitiesProcessed: politicians.length + blocs.length,
        withinBudget: processingTime <= this.config.timeBudget,
        timeBudget: this.config.timeBudget,
        success: true,
        metadata: {
          relationshipsProcessed,
          messagesReceived: messages.length,
          entityUpdatesProcessed: entityUpdates.length
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
   * Update relationships for a politician
   */
  private async updatePoliticianRelationships(
    politician: Politician,
    allPoliticians: Politician[],
    tickNumber: number
  ): Promise<number> {
    let relationshipsProcessed = 0;

    // Apply natural relationship decay
    for (const [otherId, relationship] of politician.relationships.entries()) {
      const decayAmount = relationship * this.relationshipDecayRate;
      const newValue = relationship - decayAmount;

      // Keep relationships from going to exactly zero due to decay
      politician.relationships.set(otherId, Math.max(-100, Math.min(100, newValue)));
      relationshipsProcessed++;
    }

    // Check for new relationship opportunities
    for (const other of allPoliticians) {
      if (other.id !== politician.id && !politician.relationships.has(other.id)) {
        // Small chance of establishing new relationship
        if (Math.random() < 0.1) { // 10% chance per tick
          const initialRelationship = this.calculateInitialRelationship(politician, other);
          politician.relationships.set(other.id, initialRelationship);
          relationshipsProcessed++;
        }
      }
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 0.5));

    return relationshipsProcessed;
  }

  /**
   * Update relationships for a bloc
   */
  private async updateBlocRelationships(
    bloc: Bloc,
    allBlocs: Bloc[],
    tickNumber: number
  ): Promise<number> {
    let relationshipsProcessed = 0;

    // Apply natural relationship decay
    for (const [otherId, relationship] of bloc.bloc_relationships.entries()) {
      const decayAmount = relationship * this.relationshipDecayRate * 0.5; // Slower decay for blocs
      const newValue = relationship - decayAmount;

      bloc.bloc_relationships.set(otherId, Math.max(-100, Math.min(100, newValue)));
      relationshipsProcessed++;
    }

    // Check for new bloc relationship opportunities
    for (const other of allBlocs) {
      if (other.id !== bloc.id && !bloc.bloc_relationships.has(other.id)) {
        // Small chance of establishing new relationship
        if (Math.random() < 0.05) { // 5% chance per tick (lower than individuals)
          const initialRelationship = this.calculateInitialBlocRelationship(bloc, other);
          bloc.bloc_relationships.set(other.id, initialRelationship);
          relationshipsProcessed++;
        }
      }
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 0.5));

    return relationshipsProcessed;
  }

  /**
   * Calculate initial relationship between politicians
   */
  private calculateInitialRelationship(politician1: Politician, politician2: Politician): number {
    // Base relationship on political stance compatibility
    const stanceCompatibility = this.getStanceCompatibility(
      politician1.political_stance,
      politician2.political_stance
    );

    // Factor in personality compatibility
    const personalityCompatibility = this.getPersonalityCompatibility(
      politician1.personality,
      politician2.personality
    );

    // Combine factors with some randomness
    const baseRelationship = (stanceCompatibility + personalityCompatibility) / 2;
    const randomFactor = (Math.random() - 0.5) * 20; // ±10 random variation

    return Math.max(-100, Math.min(100, baseRelationship + randomFactor));
  }

  /**
   * Calculate initial relationship between blocs
   */
  private calculateInitialBlocRelationship(bloc1: Bloc, bloc2: Bloc): number {
    // Base relationship on political stance and type compatibility
    const stanceCompatibility = this.getStanceCompatibility(
      bloc1.political_stance,
      bloc2.political_stance
    );

    // Factor in bloc type compatibility
    const typeCompatibility = this.getBlocTypeCompatibility(bloc1.type, bloc2.type);

    // Combine factors
    const baseRelationship = (stanceCompatibility + typeCompatibility) / 2;
    const randomFactor = (Math.random() - 0.5) * 30; // ±15 random variation

    return Math.max(-100, Math.min(100, baseRelationship + randomFactor));
  }

  /**
   * Get compatibility score based on political stance
   */
  private getStanceCompatibility(stance1: string, stance2: string): number {
    if (stance1 === stance2) {
      return 60; // Same stance = moderately positive
    }

    if ((stance1 === 'left' && stance2 === 'center') ||
        (stance1 === 'center' && stance2 === 'left') ||
        (stance1 === 'right' && stance2 === 'center') ||
        (stance1 === 'center' && stance2 === 'right')) {
      return 10; // Adjacent stances = slightly positive
    }

    return -30; // Opposite stances = negative
  }

  /**
   * Get compatibility score based on personality traits
   */
  private getPersonalityCompatibility(personality1: any, personality2: any): number {
    // Simple compatibility based on collaboration preference
    const collaborationDiff = Math.abs(
      personality1.collaboration_preference - personality2.collaboration_preference
    );

    const compromiseDiff = Math.abs(
      personality1.compromise_willingness - personality2.compromise_willingness
    );

    // Higher compatibility for similar collaboration and compromise styles
    const avgDiff = (collaborationDiff + compromiseDiff) / 2;
    return 50 - avgDiff; // 0-100 difference maps to 50 to -50 compatibility
  }

  /**
   * Get compatibility score based on bloc types
   */
  private getBlocTypeCompatibility(type1: string, type2: string): number {
    // Simple compatibility matrix
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      'party': { 'party': -20, 'coalition': 30, 'faction': 10, 'interest_group': 20 },
      'coalition': { 'party': 30, 'coalition': 40, 'faction': 25, 'interest_group': 35 },
      'faction': { 'party': 10, 'coalition': 25, 'faction': 20, 'interest_group': 15 },
      'interest_group': { 'party': 20, 'coalition': 35, 'faction': 15, 'interest_group': 10 }
    };

    return compatibilityMatrix[type1]?.[type2] || 0;
  }
}