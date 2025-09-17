/**
 * Event Subsystem
 *
 * Processes basic political events that affect entities,
 * generates random events, and manages event chains.
 */

import { SimulationSubsystem } from '../../engine/SubsystemCoordinator';
import { SubsystemResult, SubsystemConfig } from '../../engine/types';
import { Politician, Bloc, Policy } from '../../types/entities';

interface SimulationEvent {
  id: string;
  type: 'scandal' | 'achievement' | 'crisis' | 'opportunity' | 'announcement';
  title: string;
  description: string;
  targetEntityId?: string;
  targetEntityType?: 'politician' | 'bloc' | 'policy';
  impact: {
    approvalChange?: number;
    supportChange?: number;
    relationshipChanges?: Array<{ targetId: string; change: number }>;
  };
  probability: number;
  duration: number; // ticks
  createdAt: Date;
}

/**
 * Subsystem for processing political events
 */
export class EventSubsystem extends SimulationSubsystem {
  private activeEvents: Map<string, SimulationEvent> = new Map();
  private eventIdCounter: number = 0;

  constructor() {
    const config: SubsystemConfig = {
      name: 'EventSubsystem',
      priority: 3,
      dependencies: [],
      timeBudget: 15, // 15ms target
      canRunParallel: true,
      scalingFactor: 0.7
    };

    super('EventSubsystem', config);
  }

  /**
   * Process events for this tick
   */
  async processEntities(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<SubsystemResult> {
    const startTime = performance.now();

    try {
      let eventsProcessed = 0;

      // Process existing active events
      eventsProcessed += await this.processActiveEvents(politicians, blocs, policies, tickNumber);

      // Generate new random events
      eventsProcessed += await this.generateRandomEvents(politicians, blocs, policies, tickNumber);

      // Clean up expired events
      this.cleanupExpiredEvents(tickNumber);

      const processingTime = performance.now() - startTime;

      // Send event notifications to other subsystems
      if (eventsProcessed > 0) {
        this.sendMessage({
          to: 'PoliticalEntitySubsystem',
          type: 'event',
          priority: 'high',
          payload: {
            eventsTriggered: eventsProcessed,
            activeEventCount: this.activeEvents.size,
            tickNumber
          }
        });
      }

      return {
        name: this.name,
        processingTime,
        entitiesProcessed: politicians.length + blocs.length + policies.length,
        withinBudget: processingTime <= this.config.timeBudget,
        timeBudget: this.config.timeBudget,
        success: true,
        metadata: {
          eventsProcessed,
          activeEvents: this.activeEvents.size,
          newEventsGenerated: eventsProcessed
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
   * Process currently active events
   */
  private async processActiveEvents(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<number> {
    let processed = 0;

    for (const [eventId, event] of this.activeEvents.entries()) {
      await this.applyEventEffects(event, politicians, blocs, policies);
      processed++;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1));
    }

    return processed;
  }

  /**
   * Generate new random events
   */
  private async generateRandomEvents(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[],
    tickNumber: number
  ): Promise<number> {
    let generated = 0;

    // Base event generation rate (one event per 5 ticks on average)
    const baseEventChance = 0.2;

    if (Math.random() < baseEventChance) {
      const newEvent = this.generateRandomEvent(politicians, blocs, policies);
      if (newEvent) {
        this.activeEvents.set(newEvent.id, newEvent);
        generated++;

        console.log(`[EventSubsystem] Generated event: ${newEvent.title}`);
      }
    }

    return generated;
  }

  /**
   * Generate a single random event
   */
  private generateRandomEvent(
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[]
  ): SimulationEvent | null {
    if (politicians.length === 0) {
      return null;
    }

    const eventTypes = ['scandal', 'achievement', 'crisis', 'opportunity', 'announcement'] as const;
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const targetPolitician = politicians[Math.floor(Math.random() * politicians.length)];

    const event: SimulationEvent = {
      id: `event_${++this.eventIdCounter}`,
      type: eventType,
      title: this.generateEventTitle(eventType, targetPolitician),
      description: this.generateEventDescription(eventType, targetPolitician),
      targetEntityId: targetPolitician.id,
      targetEntityType: 'politician',
      impact: this.generateEventImpact(eventType),
      probability: 1.0, // Already selected
      duration: Math.floor(Math.random() * 3) + 1, // 1-3 ticks
      createdAt: new Date()
    };

    return event;
  }

  /**
   * Generate event title based on type and target
   */
  private generateEventTitle(type: string, politician: Politician): string {
    const titles = {
      scandal: [
        `${politician.name} Faces Ethics Investigation`,
        `Controversial Statements by ${politician.name}`,
        `${politician.name} in Financial Dispute`
      ],
      achievement: [
        `${politician.name} Receives Public Recognition`,
        `${politician.name} Announces Major Success`,
        `${politician.name} Lauded for Recent Work`
      ],
      crisis: [
        `Emergency Response Needed from ${politician.name}`,
        `${politician.name} Faces Difficult Decision`,
        `Crisis Tests ${politician.name}'s Leadership`
      ],
      opportunity: [
        `New Alliance Opportunity for ${politician.name}`,
        `${politician.name} Positioned for Major Deal`,
        `${politician.name} Could Gain Significant Influence`
      ],
      announcement: [
        `${politician.name} Makes Policy Announcement`,
        `${politician.name} Declares Future Plans`,
        `${politician.name} Issues Public Statement`
      ]
    };

    const typeTitle = titles[type as keyof typeof titles] || titles.announcement;
    return typeTitle[Math.floor(Math.random() * typeTitle.length)];
  }

  /**
   * Generate event description
   */
  private generateEventDescription(type: string, politician: Politician): string {
    const descriptions = {
      scandal: `A controversy has emerged involving ${politician.name}, potentially damaging their public standing.`,
      achievement: `${politician.name} has achieved a significant milestone, improving their public image.`,
      crisis: `A crisis situation requires immediate attention from ${politician.name} and their team.`,
      opportunity: `An opportunity has presented itself that could benefit ${politician.name}'s political position.`,
      announcement: `${politician.name} has made an important announcement affecting their political stance.`
    };

    return descriptions[type as keyof typeof descriptions] || descriptions.announcement;
  }

  /**
   * Generate event impact based on type
   */
  private generateEventImpact(type: string): SimulationEvent['impact'] {
    const baseImpact = {
      scandal: { approvalChange: -(Math.random() * 10 + 5) }, // -5 to -15
      achievement: { approvalChange: Math.random() * 8 + 3 }, // +3 to +11
      crisis: { approvalChange: -(Math.random() * 6 + 2) }, // -2 to -8
      opportunity: { approvalChange: Math.random() * 6 + 2 }, // +2 to +8
      announcement: { approvalChange: (Math.random() - 0.5) * 4 } // -2 to +2
    };

    return baseImpact[type as keyof typeof baseImpact] || { approvalChange: 0 };
  }

  /**
   * Apply effects of an event to entities
   */
  private async applyEventEffects(
    event: SimulationEvent,
    politicians: Politician[],
    blocs: Bloc[],
    policies: Policy[]
  ): Promise<void> {
    // Apply to target politician
    if (event.targetEntityType === 'politician' && event.targetEntityId) {
      const politician = politicians.find(p => p.id === event.targetEntityId);
      if (politician && event.impact.approvalChange) {
        politician.approval_rating = Math.max(0, Math.min(100,
          politician.approval_rating + event.impact.approvalChange
        ));
      }
    }

    // Apply to target bloc
    if (event.targetEntityType === 'bloc' && event.targetEntityId) {
      const bloc = blocs.find(b => b.id === event.targetEntityId);
      if (bloc && event.impact.supportChange) {
        bloc.support_level = Math.max(0, Math.min(100,
          bloc.support_level + event.impact.supportChange
        ));
      }
    }

    // Apply relationship changes
    if (event.impact.relationshipChanges && event.targetEntityId) {
      const politician = politicians.find(p => p.id === event.targetEntityId);
      if (politician) {
        event.impact.relationshipChanges.forEach(change => {
          const currentRelation = politician.relationships.get(change.targetId) || 0;
          const newRelation = Math.max(-100, Math.min(100, currentRelation + change.change));
          politician.relationships.set(change.targetId, newRelation);
        });
      }
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 0.5));
  }

  /**
   * Clean up events that have expired
   */
  private cleanupExpiredEvents(tickNumber: number): void {
    for (const [eventId, event] of this.activeEvents.entries()) {
      const ticksElapsed = tickNumber - Math.floor((Date.now() - event.createdAt.getTime()) / 1000);

      if (ticksElapsed >= event.duration) {
        this.activeEvents.delete(eventId);
        console.log(`[EventSubsystem] Expired event: ${event.title}`);
      }
    }
  }

  /**
   * Get active events for monitoring
   */
  public getActiveEvents(): SimulationEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * Manually trigger an event
   */
  public triggerEvent(event: Omit<SimulationEvent, 'id' | 'createdAt'>): string {
    const fullEvent: SimulationEvent = {
      ...event,
      id: `manual_event_${++this.eventIdCounter}`,
      createdAt: new Date()
    };

    this.activeEvents.set(fullEvent.id, fullEvent);
    return fullEvent.id;
  }
}