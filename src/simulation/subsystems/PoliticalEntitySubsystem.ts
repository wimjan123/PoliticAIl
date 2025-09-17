/**
 * Political Entity Subsystem
 *
 * Manages updates to political entities including approval ratings,
 * relationship changes, and basic behavioral updates.
 */

import { SimulationSubsystem } from '../../engine/SubsystemCoordinator';
import { SubsystemResult, SubsystemConfig } from '../../engine/types';
import { Politician, Bloc, Policy } from '../../types/entities';

/**
 * Subsystem for updating political entity states
 */
export class PoliticalEntitySubsystem extends SimulationSubsystem {
  constructor() {
    const config: SubsystemConfig = {
      name: 'PoliticalEntitySubsystem',
      priority: 1,
      dependencies: [],
      timeBudget: 20, // 20ms target
      canRunParallel: true,
      scalingFactor: 0.8
    };

    super('PoliticalEntitySubsystem', config);
  }

  /**
   * Process political entity updates
   */
  async processEntities(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<SubsystemResult> {
    const startTime = performance.now();

    try {
      let entitiesProcessed = 0;

      // Update politicians
      for (const politician of politicians) {
        await this.updatePolitician(politician, tickNumber);
        entitiesProcessed++;
      }

      // Update blocs
      for (const bloc of blocs) {
        await this.updateBloc(bloc, tickNumber);
        entitiesProcessed++;
      }

      const processingTime = performance.now() - startTime;

      // Send update message to other subsystems
      this.sendMessage({
        to: 'RelationshipSubsystem',
        type: 'data',
        priority: 'normal',
        payload: {
          updatedPoliticians: politicians.map(p => p.id),
          updatedBlocs: blocs.map(b => b.id),
          tickNumber
        }
      });

      return {
        name: this.name,
        processingTime,
        entitiesProcessed,
        withinBudget: processingTime <= this.config.timeBudget,
        timeBudget: this.config.timeBudget,
        success: true,
        metadata: {
          politiciansUpdated: politicians.length,
          blocsUpdated: blocs.length,
          averageTimePerEntity: entitiesProcessed > 0 ? processingTime / entitiesProcessed : 0
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
   * Update individual politician state
   */
  private async updatePolitician(politician: Politician, tickNumber: number): Promise<void> {
    // Simulate natural approval rating fluctuation
    const baseChange = (Math.random() - 0.5) * 2; // -1 to +1
    politician.approval_rating = Math.max(0, Math.min(100, politician.approval_rating + baseChange));

    // Update timestamp
    politician.updated_at = new Date();

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
  }

  /**
   * Update individual bloc state
   */
  private async updateBloc(bloc: Bloc, tickNumber: number): Promise<void> {
    // Simulate natural support level fluctuation
    const baseChange = (Math.random() - 0.5) * 1.5; // -0.75 to +0.75
    bloc.support_level = Math.max(0, Math.min(100, bloc.support_level + baseChange));

    // Update resources slightly
    const resourceChange = (Math.random() - 0.5) * 0.1;
    bloc.resources.funding = Math.max(0, bloc.resources.funding + resourceChange);

    // Update timestamp
    bloc.updated_at = new Date();

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2));
  }
}