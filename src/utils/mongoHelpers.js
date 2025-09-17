// MongoDB Helper Utilities for Political Desktop OS Simulation
// Specialized database operations for political entities and game data

import { mongoConfig } from '../config/database.js';
import { ObjectId } from 'mongodb';

/**
 * Base Repository Class for MongoDB Operations
 */
class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * Get the MongoDB collection
   */
  getCollection() {
    const db = mongoConfig.getDatabase();
    return db.collection(this.collectionName);
  }

  /**
   * Create a new document
   */
  async create(document) {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const documentWithTimestamps = {
        ...document,
        created_at: now,
        updated_at: now,
        version: 1
      };

      const result = await collection.insertOne(documentWithTimestamps);
      return { ...documentWithTimestamps, _id: result.insertedId };
    } catch (error) {
      throw new Error(`Failed to create ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Find document by ID
   */
  async findById(id) {
    try {
      const collection = this.getCollection();
      const query = typeof id === 'string' ? { id } : { _id: new ObjectId(id) };
      return await collection.findOne(query);
    } catch (error) {
      throw new Error(`Failed to find ${this.collectionName} by ID: ${error.message}`);
    }
  }

  /**
   * Find documents with query and options
   */
  async find(query = {}, options = {}) {
    try {
      const collection = this.getCollection();
      const cursor = collection.find(query, options);

      if (options.limit) cursor.limit(options.limit);
      if (options.skip) cursor.skip(options.skip);
      if (options.sort) cursor.sort(options.sort);

      return await cursor.toArray();
    } catch (error) {
      throw new Error(`Failed to find ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Update document by ID
   */
  async updateById(id, updateData) {
    try {
      const collection = this.getCollection();
      const query = typeof id === 'string' ? { id } : { _id: new ObjectId(id) };

      const update = {
        $set: {
          ...updateData,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      };

      const result = await collection.findOneAndUpdate(
        query,
        update,
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      throw new Error(`Failed to update ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Delete document by ID
   */
  async deleteById(id) {
    try {
      const collection = this.getCollection();
      const query = typeof id === 'string' ? { id } : { _id: new ObjectId(id) };
      const result = await collection.deleteOne(query);
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Count documents matching query
   */
  async count(query = {}) {
    try {
      const collection = this.getCollection();
      return await collection.countDocuments(query);
    } catch (error) {
      throw new Error(`Failed to count ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Perform aggregation pipeline
   */
  async aggregate(pipeline) {
    try {
      const collection = this.getCollection();
      return await collection.aggregate(pipeline).toArray();
    } catch (error) {
      throw new Error(`Failed to aggregate ${this.collectionName}: ${error.message}`);
    }
  }
}

/**
 * Politicians Repository
 */
class PoliticiansRepository extends BaseRepository {
  constructor() {
    super('politicians');
  }

  /**
   * Find politicians by party
   */
  async findByParty(partyId, options = {}) {
    return this.find(
      { 'party.id': partyId, is_active: true },
      { sort: { 'approval_rating.overall': -1 }, ...options }
    );
  }

  /**
   * Find politicians by approval rating range
   */
  async findByApprovalRange(minApproval, maxApproval, options = {}) {
    return this.find(
      {
        'approval_rating.overall': { $gte: minApproval, $lte: maxApproval },
        is_active: true
      },
      { sort: { 'approval_rating.overall': -1 }, ...options }
    );
  }

  /**
   * Find top politicians by attributes
   */
  async findTopByAttributes(attributeName, limit = 10) {
    const sortField = `attributes.${attributeName}`;
    return this.find(
      { is_active: true },
      { sort: { [sortField]: -1 }, limit }
    );
  }

  /**
   * Update politician approval rating
   */
  async updateApprovalRating(politicianId, newRating, demographicBreakdown = {}) {
    const updateData = {
      'approval_rating.overall': newRating,
      'approval_rating.demographic_breakdown': demographicBreakdown,
      'approval_rating.last_updated': new Date(),
      'approval_rating.trend': this.calculateTrend(newRating) // Implementation needed
    };

    return this.updateById(politicianId, updateData);
  }

  /**
   * Update relationship between politicians
   */
  async updateRelationship(politicianId, targetPoliticianId, relationshipData) {
    const updateField = `relationships.${targetPoliticianId}`;
    const updateData = {
      [updateField]: {
        ...relationshipData,
        last_interaction: new Date()
      }
    };

    return this.updateById(politicianId, updateData);
  }

  /**
   * Find politicians by position
   */
  async findByPosition(position, jurisdiction = null) {
    const query = {
      'current_position.title': position,
      is_active: true
    };

    if (jurisdiction) {
      query['current_position.jurisdiction'] = jurisdiction;
    }

    return this.find(query, { sort: { 'attributes.experience': -1 } });
  }

  /**
   * Search politicians by text
   */
  async searchByText(searchText, options = {}) {
    return this.find(
      { $text: { $search: searchText }, is_active: true },
      { sort: { score: { $meta: 'textScore' } }, ...options }
    );
  }
}

/**
 * Policies Repository
 */
class PoliciesRepository extends BaseRepository {
  constructor() {
    super('policies');
  }

  /**
   * Find policies by status
   */
  async findByStatus(status, options = {}) {
    return this.find(
      { 'legislative_history.current_status': status, is_active: true },
      { sort: { 'timeline.introduction_date': -1 }, ...options }
    );
  }

  /**
   * Find policies by category
   */
  async findByCategory(category, options = {}) {
    return this.find(
      { category, is_active: true },
      { sort: { 'political_feasibility': -1, 'timeline.introduction_date': -1 }, ...options }
    );
  }

  /**
   * Find policies by cost range
   */
  async findByCostRange(minCost, maxCost, options = {}) {
    return this.find(
      {
        'fiscal_impact.estimated_cost': { $gte: minCost, $lte: maxCost },
        is_active: true
      },
      { sort: { 'fiscal_impact.estimated_cost': -1 }, ...options }
    );
  }

  /**
   * Find policies supported by politician/bloc
   */
  async findSupportedBy(stakeholderId, supportLevel = 'support', options = {}) {
    const supportQuery = {};
    supportQuery[`stakeholder_positions.${stakeholderId}.position`] = supportLevel;

    return this.find(
      { ...supportQuery, is_active: true },
      { sort: { 'timeline.introduction_date': -1 }, ...options }
    );
  }

  /**
   * Update policy support levels
   */
  async updateStakeholderPosition(policyId, stakeholderId, position) {
    const updateField = `stakeholder_positions.${stakeholderId}`;
    const updateData = {
      [updateField]: {
        ...position,
        last_updated: new Date()
      }
    };

    return this.updateById(policyId, updateData);
  }

  /**
   * Update policy status
   */
  async updateStatus(policyId, newStatus, statusNote = '') {
    const statusChange = {
      status: newStatus,
      timestamp: new Date(),
      note: statusNote
    };

    const updateData = {
      'legislative_history.current_status': newStatus,
      $push: {
        'legislative_history.status_history': statusChange
      }
    };

    return this.updateById(policyId, updateData);
  }
}

/**
 * Game Events Repository
 */
class GameEventsRepository extends BaseRepository {
  constructor() {
    super('game_events');
  }

  /**
   * Find recent events
   */
  async findRecent(limit = 50, severity = null) {
    const query = {};
    if (severity) {
      query.severity = severity;
    }

    return this.find(
      query,
      { sort: { occurrence_time: -1 }, limit }
    );
  }

  /**
   * Find ongoing events
   */
  async findOngoing() {
    return this.find(
      { resolution_status: 'ongoing' },
      { sort: { occurrence_time: -1 } }
    );
  }

  /**
   * Find events by type
   */
  async findByType(eventType, options = {}) {
    return this.find(
      { event_type: eventType },
      { sort: { occurrence_time: -1 }, ...options }
    );
  }

  /**
   * Find events affecting politician
   */
  async findAffectingPolitician(politicianId, options = {}) {
    return this.find(
      { [`direct_effects.politician_effects.${politicianId}`]: { $exists: true } },
      { sort: { occurrence_time: -1 }, ...options }
    );
  }

  /**
   * Update event resolution
   */
  async resolveEvent(eventId, resolution) {
    const updateData = {
      resolution_status: 'resolved',
      resolution_description: resolution.description,
      'final_outcomes.winners': resolution.winners || [],
      'final_outcomes.losers': resolution.losers || [],
      'final_outcomes.neutral_parties': resolution.neutral_parties || [],
      'final_outcomes.long_term_implications': resolution.implications || []
    };

    return this.updateById(eventId, updateData);
  }
}

/**
 * Social Media Posts Repository
 */
class SocialMediaPostsRepository extends BaseRepository {
  constructor() {
    super('social_media_posts');
  }

  /**
   * Find posts by platform
   */
  async findByPlatform(platform, options = {}) {
    return this.find(
      { platform, is_active: true },
      { sort: { 'publication.actual_publish_time': -1 }, ...options }
    );
  }

  /**
   * Find posts by persona
   */
  async findByPersona(personaId, options = {}) {
    return this.find(
      { persona_id: personaId, is_active: true },
      { sort: { 'publication.actual_publish_time': -1 }, ...options }
    );
  }

  /**
   * Find viral posts
   */
  async findViral(viralThreshold = 5.0, options = {}) {
    return this.find(
      {
        'virality_metrics.viral_coefficient': { $gte: viralThreshold },
        is_active: true
      },
      { sort: { 'virality_metrics.viral_coefficient': -1 }, ...options }
    );
  }

  /**
   * Find posts by sentiment
   */
  async findBySentiment(minSentiment, maxSentiment, options = {}) {
    return this.find(
      {
        'political_analysis.sentiment.overall': { $gte: minSentiment, $lte: maxSentiment },
        is_active: true
      },
      { sort: { 'publication.actual_publish_time': -1 }, ...options }
    );
  }

  /**
   * Find trending posts
   */
  async findTrending(hours = 24, options = {}) {
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.find(
      {
        'publication.actual_publish_time': { $gte: timeThreshold },
        is_active: true
      },
      {
        sort: {
          'engagement.likes': -1,
          'engagement.shares': -1,
          'virality_metrics.viral_coefficient': -1
        },
        ...options
      }
    );
  }
}

/**
 * News Articles Repository
 */
class NewsArticlesRepository extends BaseRepository {
  constructor() {
    super('news_articles');
  }

  /**
   * Find articles by relevance
   */
  async findByRelevance(minRelevance = 0.6, options = {}) {
    return this.find(
      { 'content_analysis.political_relevance.score': { $gte: minRelevance } },
      {
        sort: {
          'content_analysis.political_relevance.score': -1,
          'publication.published_at': -1
        },
        ...options
      }
    );
  }

  /**
   * Find articles by source
   */
  async findBySource(sourceName, options = {}) {
    return this.find(
      { 'source.name': sourceName },
      { sort: { 'publication.published_at': -1 }, ...options }
    );
  }

  /**
   * Find articles mentioning politician
   */
  async findMentioningPolitician(politicianId, options = {}) {
    return this.find(
      { 'content_analysis.entities.politicians.politician_id': politicianId },
      { sort: { 'publication.published_at': -1 }, ...options }
    );
  }

  /**
   * Find articles by bias rating
   */
  async findByBias(biasRating, options = {}) {
    return this.find(
      { 'source.credibility_metrics.bias_rating': biasRating },
      { sort: { 'publication.published_at': -1 }, ...options }
    );
  }

  /**
   * Find recent high-impact articles
   */
  async findHighImpact(hours = 24, impactThreshold = 0.8, options = {}) {
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.find(
      {
        'publication.published_at': { $gte: timeThreshold },
        'content_analysis.political_relevance.score': { $gte: impactThreshold }
      },
      {
        sort: {
          'content_analysis.political_relevance.score': -1,
          'publication.published_at': -1
        },
        ...options
      }
    );
  }
}

// Export repository instances
export const politiciansRepo = new PoliticiansRepository();
export const policiesRepo = new PoliciesRepository();
export const gameEventsRepo = new GameEventsRepository();
export const socialMediaPostsRepo = new SocialMediaPostsRepository();
export const newsArticlesRepo = new NewsArticlesRepository();

// Export base repository for custom repositories
export { BaseRepository };

// Default export with all repositories
export default {
  politicians: politiciansRepo,
  policies: policiesRepo,
  gameEvents: gameEventsRepo,
  socialMediaPosts: socialMediaPostsRepo,
  newsArticles: newsArticlesRepo,
  BaseRepository
};