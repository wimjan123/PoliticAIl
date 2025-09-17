/**
 * Politicians Repository
 * Specialized repository for politician entities with political-specific operations
 */

import { BaseRepository } from './base_repository.js';
import { v4 as uuidv4 } from 'uuid';

export class PoliticiansRepository extends BaseRepository {
  constructor() {
    super('politicians');
  }

  /**
   * Create politician with auto-generated ID
   */
  async createPolitician(politicianData) {
    const politician = {
      id: uuidv4(),
      ...politicianData
    };

    return this.create(politician);
  }

  /**
   * Find politicians by party
   */
  async findByParty(partyId, options = {}) {
    const filter = { 'party.id': partyId, is_active: true };
    return this.find(filter, {
      sort: { 'approval_rating.overall': -1 },
      ...options
    });
  }

  /**
   * Find politicians by position
   */
  async findByPosition(positionTitle, jurisdiction = null, options = {}) {
    const filter = {
      'current_position.title': positionTitle,
      is_active: true
    };

    if (jurisdiction) {
      filter['current_position.jurisdiction'] = jurisdiction;
    }

    return this.find(filter, {
      sort: { 'approval_rating.overall': -1 },
      ...options
    });
  }

  /**
   * Find top performers by attributes
   */
  async findTopPerformers(attribute = 'charisma', limit = 10) {
    const sort = {};
    sort[`attributes.${attribute}`] = -1;

    return this.find(
      { is_active: true },
      {
        sort,
        limit,
        projection: {
          id: 1,
          name: 1,
          'current_position.title': 1,
          'party.name': 1,
          attributes: 1,
          'approval_rating.overall': 1
        }
      }
    );
  }

  /**
   * Find politicians with high approval ratings
   */
  async findHighApprovalRating(minRating = 70, options = {}) {
    const filter = {
      'approval_rating.overall': { $gte: minRating },
      is_active: true
    };

    return this.find(filter, {
      sort: { 'approval_rating.overall': -1 },
      ...options
    });
  }

  /**
   * Find politicians by demographic criteria
   */
  async findByDemographics(criteria = {}, options = {}) {
    const filter = { is_active: true };

    if (criteria.ageRange) {
      filter['demographics.age'] = {
        $gte: criteria.ageRange.min || 0,
        $lte: criteria.ageRange.max || 120
      };
    }

    if (criteria.gender) {
      filter['demographics.gender'] = criteria.gender;
    }

    if (criteria.education) {
      filter['demographics.education.highest_degree'] = criteria.education;
    }

    return this.find(filter, options);
  }

  /**
   * Update approval rating
   */
  async updateApprovalRating(politicianId, approvalData) {
    const updateData = {
      approval_rating: {
        ...approvalData,
        last_updated: new Date()
      }
    };

    return this.updateById(politicianId, updateData);
  }

  /**
   * Update politician attributes
   */
  async updateAttributes(politicianId, attributes) {
    // Validate attribute values are within range
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof value === 'number' && (value < 1 || value > 100)) {
        throw new Error(`Attribute ${key} must be between 1 and 100`);
      }
    }

    return this.updateById(politicianId, { attributes });
  }

  /**
   * Add relationship to politician
   */
  async addRelationship(politicianId, relationshipData) {
    const politician = await this.findById(politicianId);
    if (!politician.success) {
      return politician;
    }

    const relationships = politician.data.relationships || [];
    relationships.push({
      ...relationshipData,
      created_at: new Date()
    });

    return this.updateById(politicianId, { relationships });
  }

  /**
   * Update relationship
   */
  async updateRelationship(politicianId, targetPoliticianId, updateData) {
    const politician = await this.findById(politicianId);
    if (!politician.success) {
      return politician;
    }

    const relationships = politician.data.relationships || [];
    const relationshipIndex = relationships.findIndex(
      rel => rel.politician_id === targetPoliticianId
    );

    if (relationshipIndex === -1) {
      return {
        success: false,
        error: 'Relationship not found'
      };
    }

    relationships[relationshipIndex] = {
      ...relationships[relationshipIndex],
      ...updateData,
      last_updated: new Date()
    };

    return this.updateById(politicianId, { relationships });
  }

  /**
   * Find politicians with relationships to a specific politician
   */
  async findWithRelationshipTo(targetPoliticianId, relationshipType = null) {
    const filter = {
      'relationships.politician_id': targetPoliticianId,
      is_active: true
    };

    if (relationshipType) {
      filter['relationships.relationship_type'] = relationshipType;
    }

    return this.find(filter, {
      sort: { 'relationships.trust_score': -1 }
    });
  }

  /**
   * Get politician network (relationships)
   */
  async getPoliticianNetwork(politicianId) {
    const startTime = Date.now();

    try {
      const pipeline = [
        { $match: { id: politicianId } },
        { $unwind: '$relationships' },
        {
          $lookup: {
            from: 'politicians',
            localField: 'relationships.politician_id',
            foreignField: 'id',
            as: 'related_politician'
          }
        },
        { $unwind: '$related_politician' },
        {
          $project: {
            'relationships.relationship_type': 1,
            'relationships.trust_score': 1,
            'relationships.influence_level': 1,
            'related_politician.id': 1,
            'related_politician.name': 1,
            'related_politician.current_position.title': 1,
            'related_politician.party.name': 1
          }
        }
      ];

      const result = await this.aggregate(pipeline);

      const executionTime = Date.now() - startTime;

      return {
        ...result,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Get politician network failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Get party members
   */
  async getPartyMembers(partyId, options = {}) {
    return this.findByParty(partyId, {
      sort: { 'approval_rating.overall': -1 },
      projection: {
        id: 1,
        name: 1,
        'current_position.title': 1,
        'approval_rating.overall': 1,
        attributes: 1
      },
      ...options
    });
  }

  /**
   * Search politicians by name or position
   */
  async searchPoliticians(query, options = {}) {
    if (!query || query.trim().length === 0) {
      return this.find({ is_active: true }, options);
    }

    return this.textSearch(query, {
      limit: 20,
      ...options
    });
  }

  /**
   * Get politicians dashboard data
   */
  async getDashboardData() {
    const startTime = Date.now();

    try {
      const pipeline = [
        { $match: { is_active: true } },
        {
          $group: {
            _id: '$party.id',
            party_name: { $first: '$party.name' },
            member_count: { $sum: 1 },
            avg_approval: { $avg: '$approval_rating.overall' },
            avg_charisma: { $avg: '$attributes.charisma' },
            avg_intelligence: { $avg: '$attributes.intelligence' },
            top_performer: {
              $first: {
                $cond: [
                  { $eq: ['$approval_rating.overall', { $max: '$approval_rating.overall' }] },
                  { name: '$name.display_name', approval: '$approval_rating.overall' },
                  null
                ]
              }
            }
          }
        },
        { $sort: { avg_approval: -1 } }
      ];

      const result = await this.aggregate(pipeline);

      const executionTime = Date.now() - startTime;

      return {
        ...result,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Get dashboard data failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Bulk update approval ratings
   */
  async bulkUpdateApprovalRatings(updates) {
    const startTime = Date.now();

    try {
      const bulkOps = updates.map(update => ({
        updateOne: {
          filter: { id: update.politician_id },
          update: {
            $set: {
              'approval_rating.overall': update.approval_rating,
              'approval_rating.last_updated': new Date(),
              updated_at: new Date()
            }
          }
        }
      }));

      const result = await this.collection.bulkWrite(bulkOps);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Bulk updated ${result.modifiedCount} approval ratings (${executionTime}ms)`);

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Bulk update approval ratings failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(politicianId) {
    const startTime = Date.now();

    try {
      const politician = await this.findById(politicianId);
      if (!politician.success) {
        return politician;
      }

      const data = politician.data;

      // Calculate performance scores
      const attributeAvg = Object.values(data.attributes || {})
        .reduce((sum, val) => sum + val, 0) / Object.keys(data.attributes || {}).length;

      const skillAvg = Object.values(data.skills || {})
        .reduce((sum, val) => sum + val, 0) / Object.keys(data.skills || {}).length;

      const performanceMetrics = data.performance_metrics || {};

      const analytics = {
        politician_id: politicianId,
        overall_score: Math.round((attributeAvg + skillAvg + (data.approval_rating?.overall || 0)) / 3),
        attribute_average: Math.round(attributeAvg),
        skill_average: Math.round(skillAvg),
        approval_rating: data.approval_rating?.overall || 0,
        legislative_effectiveness: performanceMetrics.legislative_effectiveness || 0,
        media_sentiment: performanceMetrics.media_coverage_sentiment || 0,
        relationship_count: data.relationships?.length || 0,
        strong_relationships: data.relationships?.filter(r => r.trust_score > 70).length || 0
      };

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: analytics,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Get performance analytics failed (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }
}

export default PoliticiansRepository;