/**
 * Relationships Repository
 * Specialized repository for political relationship entities
 */

import { BaseRepository } from './base_repository.js';
import { v4 as uuidv4 } from 'uuid';

export class RelationshipsRepository extends BaseRepository {
  constructor() {
    super('relationships');
  }

  /**
   * Create relationship with auto-generated ID
   */
  async createRelationship(relationshipData) {
    const relationship = {
      id: uuidv4(),
      ...relationshipData,
      temporal_data: {
        relationship_start_date: new Date(),
        relationship_duration_days: 0,
        ...relationshipData.temporal_data
      }
    };

    return this.create(relationship);
  }

  /**
   * Find relationships for a specific entity
   */
  async findByEntity(entityId, entityType = null, options = {}) {
    const filter = {
      $or: [
        { 'entity_1.entity_id': entityId },
        { 'entity_2.entity_id': entityId }
      ],
      is_active: true
    };

    if (entityType) {
      filter.$or[0]['entity_1.entity_type'] = entityType;
      filter.$or[1]['entity_2.entity_type'] = entityType;
    }

    return this.find(filter, {
      sort: { 'relationship_strength.overall_strength': -1 },
      ...options
    });
  }

  /**
   * Find relationship between two specific entities
   */
  async findBetweenEntities(entity1Id, entity2Id) {
    const filter = {
      $or: [
        {
          'entity_1.entity_id': entity1Id,
          'entity_2.entity_id': entity2Id
        },
        {
          'entity_1.entity_id': entity2Id,
          'entity_2.entity_id': entity1Id
        }
      ],
      is_active: true
    };

    return this.findOne(filter);
  }

  /**
   * Find relationships by type
   */
  async findByType(relationshipType, options = {}) {
    const filter = {
      relationship_type: relationshipType,
      is_active: true
    };

    return this.find(filter, {
      sort: { 'relationship_strength.overall_strength': -1 },
      ...options
    });
  }

  /**
   * Find strong relationships (high trust/strength)
   */
  async findStrongRelationships(minTrust = 70, minStrength = 70, options = {}) {
    const filter = {
      'relationship_strength.trust_level': { $gte: minTrust },
      'relationship_strength.overall_strength': { $gte: minStrength },
      is_active: true
    };

    return this.find(filter, {
      sort: {
        'relationship_strength.trust_level': -1,
        'relationship_strength.overall_strength': -1
      },
      ...options
    });
  }

  /**
   * Find relationships with high coalition potential
   */
  async findCoalitionOpportunities(minPotential = 70, options = {}) {
    const filter = {
      'political_implications.coalition_potential': { $gte: minPotential },
      is_active: true
    };

    return this.find(filter, {
      sort: { 'political_implications.coalition_potential': -1 },
      ...options
    });
  }

  /**
   * Find relationships with high opposition potential
   */
  async findOppositionRisks(minPotential = 70, options = {}) {
    const filter = {
      'political_implications.opposition_potential': { $gte: minPotential },
      is_active: true
    };

    return this.find(filter, {
      sort: { 'political_implications.opposition_potential': -1 },
      ...options
    });
  }

  /**
   * Update relationship strength metrics
   */
  async updateRelationshipStrength(relationshipId, strengthData) {
    const updateData = {
      'relationship_strength': {
        ...strengthData,
        last_updated: new Date()
      }
    };

    return this.updateById(relationshipId, updateData);
  }

  /**
   * Add interaction to relationship history
   */
  async addInteraction(relationshipId, interactionData) {
    const relationship = await this.findById(relationshipId);
    if (!relationship.success) {
      return relationship;
    }

    const interactionHistory = relationship.data.interaction_history || {};
    const recentInteractions = interactionHistory.recent_interactions || [];

    recentInteractions.unshift({
      ...interactionData,
      interaction_date: new Date()
    });

    // Keep only last 50 interactions
    const limitedInteractions = recentInteractions.slice(0, 50);

    const updatedHistory = {
      ...interactionHistory,
      recent_interactions: limitedInteractions,
      total_interactions: (interactionHistory.total_interactions || 0) + 1
    };

    // Update relationship strength based on interaction
    const currentStrength = relationship.data.relationship_strength || {};
    const impactScore = interactionData.impact_score || 0;

    const updatedStrength = {
      ...currentStrength,
      overall_strength: Math.max(0, Math.min(100,
        (currentStrength.overall_strength || 50) + impactScore
      ))
    };

    return this.updateById(relationshipId, {
      interaction_history: updatedHistory,
      relationship_strength: updatedStrength
    });
  }

  /**
   * Get relationship network for an entity
   */
  async getEntityNetwork(entityId, maxDegrees = 2) {
    const startTime = Date.now();

    try {
      // First degree relationships
      const directRelationships = await this.findByEntity(entityId);

      if (!directRelationships.success) {
        return directRelationships;
      }

      const network = {
        center_entity: entityId,
        direct_relationships: directRelationships.data,
        indirect_relationships: []
      };

      if (maxDegrees > 1) {
        // Find second degree relationships
        const connectedEntities = directRelationships.data.map(rel =>
          rel.entity_1.entity_id === entityId ? rel.entity_2.entity_id : rel.entity_1.entity_id
        );

        for (const connectedId of connectedEntities) {
          const indirectRels = await this.findByEntity(connectedId);
          if (indirectRels.success) {
            network.indirect_relationships.push({
              through_entity: connectedId,
              relationships: indirectRels.data.filter(rel =>
                rel.entity_1.entity_id !== entityId && rel.entity_2.entity_id !== entityId
              )
            });
          }
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: network,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Get entity network failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Analyze relationship patterns
   */
  async analyzeRelationshipPatterns() {
    const startTime = Date.now();

    try {
      const pipeline = [
        { $match: { is_active: true } },
        {
          $group: {
            _id: '$relationship_type',
            count: { $sum: 1 },
            avg_trust: { $avg: '$relationship_strength.trust_level' },
            avg_strength: { $avg: '$relationship_strength.overall_strength' },
            avg_coalition_potential: { $avg: '$political_implications.coalition_potential' },
            avg_opposition_potential: { $avg: '$political_implications.opposition_potential' }
          }
        },
        { $sort: { count: -1 } }
      ];

      const typeAnalysis = await this.aggregate(pipeline);

      // Entity type analysis
      const entityTypePipeline = [
        { $match: { is_active: true } },
        {
          $group: {
            _id: {
              type1: '$entity_1.entity_type',
              type2: '$entity_2.entity_type'
            },
            count: { $sum: 1 },
            avg_strength: { $avg: '$relationship_strength.overall_strength' }
          }
        },
        { $sort: { count: -1 } }
      ];

      const entityTypeAnalysis = await this.aggregate(entityTypePipeline);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          relationship_type_analysis: typeAnalysis.data,
          entity_type_analysis: entityTypeAnalysis.data,
          analysis_timestamp: new Date()
        },
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Analyze relationship patterns failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Find deteriorating relationships
   */
  async findDeterioratingRelationships(options = {}) {
    const filter = {
      'relationship_evolution.evolution_trajectory': 'declining',
      is_active: true
    };

    return this.find(filter, {
      sort: { 'relationship_strength.trust_level': 1 },
      ...options
    });
  }

  /**
   * Find improving relationships
   */
  async findImprovingRelationships(options = {}) {
    const filter = {
      'relationship_evolution.evolution_trajectory': 'improving',
      is_active: true
    };

    return this.find(filter, {
      sort: { 'relationship_strength.overall_strength': -1 },
      ...options
    });
  }

  /**
   * Get relationship insights for dashboard
   */
  async getRelationshipInsights() {
    const startTime = Date.now();

    try {
      const [
        totalCount,
        strongRelationships,
        coalitionOpportunities,
        oppositionRisks,
        deterioratingCount,
        improvingCount
      ] = await Promise.all([
        this.count({ is_active: true }),
        this.count({
          'relationship_strength.overall_strength': { $gte: 70 },
          is_active: true
        }),
        this.count({
          'political_implications.coalition_potential': { $gte: 70 },
          is_active: true
        }),
        this.count({
          'political_implications.opposition_potential': { $gte: 70 },
          is_active: true
        }),
        this.count({
          'relationship_evolution.evolution_trajectory': 'declining',
          is_active: true
        }),
        this.count({
          'relationship_evolution.evolution_trajectory': 'improving',
          is_active: true
        })
      ]);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          total_relationships: totalCount.count,
          strong_relationships: strongRelationships.count,
          coalition_opportunities: coalitionOpportunities.count,
          opposition_risks: oppositionRisks.count,
          deteriorating_relationships: deterioratingCount.count,
          improving_relationships: improvingCount.count,
          relationship_health_score: Math.round(
            ((strongRelationships.count + improvingCount.count) / totalCount.count) * 100
          )
        },
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Get relationship insights failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Bulk update relationship evolution
   */
  async bulkUpdateEvolution(updates) {
    const startTime = Date.now();

    try {
      const bulkOps = updates.map(update => ({
        updateOne: {
          filter: { id: update.relationship_id },
          update: {
            $set: {
              'relationship_evolution.evolution_trajectory': update.trajectory,
              'relationship_evolution.last_updated': new Date(),
              updated_at: new Date()
            }
          }
        }
      }));

      const result = await this.collection.bulkWrite(bulkOps);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Bulk updated ${result.modifiedCount} relationship evolutions (${executionTime}ms)`);

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Bulk update evolution failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Search relationships by entity names
   */
  async searchRelationships(query, options = {}) {
    const startTime = Date.now();

    try {
      const filter = {
        $or: [
          { 'entity_1.entity_name': { $regex: query, $options: 'i' } },
          { 'entity_2.entity_name': { $regex: query, $options: 'i' } }
        ],
        is_active: true
      };

      const result = await this.find(filter, {
        sort: { 'relationship_strength.overall_strength': -1 },
        limit: 20,
        ...options
      });

      const executionTime = Date.now() - startTime;

      return {
        ...result,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Search relationships failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }
}

export default RelationshipsRepository;