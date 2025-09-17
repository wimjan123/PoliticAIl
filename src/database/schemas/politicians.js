/**
 * Politicians Collection Schema Definition
 * Core political actors with attributes, relationships, and performance metrics
 */

import { z } from 'zod';

// Validation schema for politician attributes
export const PoliticianAttributesSchema = z.object({
  charisma: z.number().min(1).max(100),
  intelligence: z.number().min(1).max(100),
  integrity: z.number().min(1).max(100),
  ambition: z.number().min(1).max(100),
  experience: z.number().min(1).max(100),
  leadership: z.number().min(1).max(100),
  empathy: z.number().min(1).max(100),
  strategic_thinking: z.number().min(1).max(100),
  public_speaking: z.number().min(1).max(100),
  negotiation: z.number().min(1).max(100)
});

// Validation schema for political skills
export const PoliticianSkillsSchema = z.object({
  debate_performance: z.number().min(1).max(100),
  media_savvy: z.number().min(1).max(100),
  coalition_building: z.number().min(1).max(100),
  policy_expertise: z.number().min(1).max(100),
  crisis_management: z.number().min(1).max(100),
  fundraising: z.number().min(1).max(100),
  constituent_outreach: z.number().min(1).max(100),
  legislative_strategy: z.number().min(1).max(100)
});

// Party affiliation schema
export const PartySchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string().optional(),
  ideology: z.object({
    primary: z.enum(['progressive', 'liberal', 'centrist', 'conservative', 'libertarian', 'socialist', 'green']),
    secondary: z.array(z.string()).optional(),
    economic: z.number().min(-100).max(100), // -100 = far left, 100 = far right
    social: z.number().min(-100).max(100)
  }),
  membership_since: z.date(),
  party_role: z.string().optional(),
  leadership_position: z.string().optional()
});

// Current position schema
export const CurrentPositionSchema = z.object({
  title: z.string(),
  jurisdiction: z.string(),
  district: z.string().optional(),
  term_start: z.date(),
  term_end: z.date().optional(),
  election_margin: z.number().optional(), // Percentage margin of victory
  is_elected: z.boolean(),
  appointment_details: z.object({
    appointing_authority: z.string(),
    confirmation_required: z.boolean(),
    confirmation_date: z.date().optional()
  }).optional()
});

// Approval rating schema
export const ApprovalRatingSchema = z.object({
  overall: z.number().min(0).max(100),
  by_party: z.object({
    own_party: z.number().min(0).max(100),
    opposition: z.number().min(0).max(100),
    independent: z.number().min(0).max(100)
  }),
  by_demographic: z.object({
    age_18_29: z.number().min(0).max(100).optional(),
    age_30_49: z.number().min(0).max(100).optional(),
    age_50_64: z.number().min(0).max(100).optional(),
    age_65_plus: z.number().min(0).max(100).optional(),
    urban: z.number().min(0).max(100).optional(),
    suburban: z.number().min(0).max(100).optional(),
    rural: z.number().min(0).max(100).optional()
  }).optional(),
  last_updated: z.date(),
  sample_size: z.number().optional(),
  margin_of_error: z.number().optional()
});

// Political relationship schema
export const PoliticalRelationshipSchema = z.object({
  politician_id: z.string(),
  relationship_type: z.enum([
    'ally', 'rival', 'mentor', 'protege', 'neutral',
    'coalition_partner', 'ideological_opponent', 'personal_friend', 'enemy'
  ]),
  trust_score: z.number().min(-100).max(100), // -100 = complete distrust, 100 = complete trust
  influence_level: z.number().min(0).max(100),
  relationship_strength: z.number().min(0).max(100),
  relationship_history: z.array(z.object({
    event_date: z.date(),
    event_type: z.string(),
    impact_on_relationship: z.number().min(-50).max(50),
    description: z.string()
  })).optional(),
  last_interaction: z.date().optional(),
  public_perception: z.enum(['positive', 'negative', 'neutral', 'unknown']).optional()
});

// Performance metrics schema
export const PerformanceMetricsSchema = z.object({
  legislative_effectiveness: z.number().min(0).max(100),
  bills_sponsored: z.number().min(0),
  bills_passed: z.number().min(0),
  committee_participation: z.number().min(0).max(100),
  voting_record_consistency: z.number().min(0).max(100),
  media_coverage_sentiment: z.number().min(-100).max(100),
  social_media_engagement: z.object({
    followers_count: z.number().min(0),
    engagement_rate: z.number().min(0).max(100),
    sentiment_score: z.number().min(-100).max(100)
  }).optional(),
  scandal_score: z.number().min(0).max(100), // 0 = no scandals, 100 = major scandal
  corruption_risk: z.number().min(0).max(100)
});

// Main politician schema
export const PoliticianSchema = z.object({
  id: z.string(),
  name: z.object({
    first: z.string(),
    middle: z.string().optional(),
    last: z.string(),
    nickname: z.string().optional(),
    display_name: z.string()
  }),
  demographics: z.object({
    age: z.number().min(18).max(120),
    gender: z.enum(['male', 'female', 'non-binary', 'other', 'prefer_not_to_say']),
    ethnicity: z.string().optional(),
    education: z.object({
      highest_degree: z.string(),
      institution: z.string(),
      graduation_year: z.number().optional(),
      field_of_study: z.string().optional()
    }).optional(),
    background: z.object({
      previous_career: z.string(),
      military_service: z.boolean(),
      family_political_history: z.boolean()
    }).optional()
  }),
  party: PartySchema,
  current_position: CurrentPositionSchema,
  attributes: PoliticianAttributesSchema,
  skills: PoliticianSkillsSchema,
  approval_rating: ApprovalRatingSchema,
  relationships: z.array(PoliticalRelationshipSchema).optional(),
  performance_metrics: PerformanceMetricsSchema,
  biography: z.string().optional(),
  key_achievements: z.array(z.string()).optional(),
  policy_positions: z.array(z.object({
    policy_area: z.string(),
    stance: z.enum(['strongly_support', 'support', 'neutral', 'oppose', 'strongly_oppose']),
    priority_level: z.number().min(1).max(10),
    voting_record: z.array(z.object({
      vote_date: z.date(),
      bill_id: z.string(),
      vote: z.enum(['yes', 'no', 'abstain', 'present', 'absent']),
      explanation: z.string().optional()
    })).optional()
  })).optional(),
  financial_disclosure: z.object({
    net_worth: z.number().optional(),
    income_sources: z.array(z.string()).optional(),
    investments: z.array(z.string()).optional(),
    conflicts_of_interest: z.array(z.string()).optional(),
    last_updated: z.date()
  }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  is_active: z.boolean().default(true),
  metadata: z.object({
    data_sources: z.array(z.string()).optional(),
    last_verified: z.date().optional(),
    verification_status: z.enum(['verified', 'pending', 'disputed', 'unverified']).default('unverified'),
    tags: z.array(z.string()).optional()
  }).optional()
});

// MongoDB collection schema for validation
export const PoliticiansCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'party', 'current_position', 'attributes', 'skills', 'approval_rating'],
      properties: {
        id: { bsonType: 'string' },
        name: {
          bsonType: 'object',
          required: ['first', 'last', 'display_name'],
          properties: {
            first: { bsonType: 'string' },
            middle: { bsonType: 'string' },
            last: { bsonType: 'string' },
            nickname: { bsonType: 'string' },
            display_name: { bsonType: 'string' }
          }
        },
        demographics: {
          bsonType: 'object',
          required: ['age', 'gender'],
          properties: {
            age: { bsonType: 'number', minimum: 18, maximum: 120 },
            gender: { bsonType: 'string', enum: ['male', 'female', 'non-binary', 'other', 'prefer_not_to_say'] },
            ethnicity: { bsonType: 'string' },
            education: { bsonType: 'object' },
            background: { bsonType: 'object' }
          }
        },
        party: {
          bsonType: 'object',
          required: ['id', 'name', 'ideology', 'membership_since'],
          properties: {
            id: { bsonType: 'string' },
            name: { bsonType: 'string' },
            abbreviation: { bsonType: 'string' },
            ideology: {
              bsonType: 'object',
              required: ['primary', 'economic', 'social'],
              properties: {
                primary: { bsonType: 'string', enum: ['progressive', 'liberal', 'centrist', 'conservative', 'libertarian', 'socialist', 'green'] },
                secondary: { bsonType: 'array' },
                economic: { bsonType: 'number', minimum: -100, maximum: 100 },
                social: { bsonType: 'number', minimum: -100, maximum: 100 }
              }
            },
            membership_since: { bsonType: 'date' },
            party_role: { bsonType: 'string' },
            leadership_position: { bsonType: 'string' }
          }
        },
        current_position: {
          bsonType: 'object',
          required: ['title', 'jurisdiction', 'term_start', 'is_elected'],
          properties: {
            title: { bsonType: 'string' },
            jurisdiction: { bsonType: 'string' },
            district: { bsonType: 'string' },
            term_start: { bsonType: 'date' },
            term_end: { bsonType: 'date' },
            election_margin: { bsonType: 'number' },
            is_elected: { bsonType: 'bool' },
            appointment_details: { bsonType: 'object' }
          }
        },
        attributes: {
          bsonType: 'object',
          required: ['charisma', 'intelligence', 'integrity', 'ambition', 'experience'],
          properties: {
            charisma: { bsonType: 'number', minimum: 1, maximum: 100 },
            intelligence: { bsonType: 'number', minimum: 1, maximum: 100 },
            integrity: { bsonType: 'number', minimum: 1, maximum: 100 },
            ambition: { bsonType: 'number', minimum: 1, maximum: 100 },
            experience: { bsonType: 'number', minimum: 1, maximum: 100 },
            leadership: { bsonType: 'number', minimum: 1, maximum: 100 },
            empathy: { bsonType: 'number', minimum: 1, maximum: 100 },
            strategic_thinking: { bsonType: 'number', minimum: 1, maximum: 100 },
            public_speaking: { bsonType: 'number', minimum: 1, maximum: 100 },
            negotiation: { bsonType: 'number', minimum: 1, maximum: 100 }
          }
        },
        skills: {
          bsonType: 'object',
          required: ['debate_performance', 'media_savvy', 'coalition_building', 'policy_expertise'],
          properties: {
            debate_performance: { bsonType: 'number', minimum: 1, maximum: 100 },
            media_savvy: { bsonType: 'number', minimum: 1, maximum: 100 },
            coalition_building: { bsonType: 'number', minimum: 1, maximum: 100 },
            policy_expertise: { bsonType: 'number', minimum: 1, maximum: 100 },
            crisis_management: { bsonType: 'number', minimum: 1, maximum: 100 },
            fundraising: { bsonType: 'number', minimum: 1, maximum: 100 },
            constituent_outreach: { bsonType: 'number', minimum: 1, maximum: 100 },
            legislative_strategy: { bsonType: 'number', minimum: 1, maximum: 100 }
          }
        },
        approval_rating: {
          bsonType: 'object',
          required: ['overall', 'by_party', 'last_updated'],
          properties: {
            overall: { bsonType: 'number', minimum: 0, maximum: 100 },
            by_party: {
              bsonType: 'object',
              required: ['own_party', 'opposition', 'independent'],
              properties: {
                own_party: { bsonType: 'number', minimum: 0, maximum: 100 },
                opposition: { bsonType: 'number', minimum: 0, maximum: 100 },
                independent: { bsonType: 'number', minimum: 0, maximum: 100 }
              }
            },
            by_demographic: { bsonType: 'object' },
            last_updated: { bsonType: 'date' },
            sample_size: { bsonType: 'number' },
            margin_of_error: { bsonType: 'number' }
          }
        },
        relationships: { bsonType: 'array' },
        performance_metrics: { bsonType: 'object' },
        biography: { bsonType: 'string' },
        key_achievements: { bsonType: 'array' },
        policy_positions: { bsonType: 'array' },
        financial_disclosure: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        is_active: { bsonType: 'bool' },
        metadata: { bsonType: 'object' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
};

// Index definitions for optimal query performance
export const PoliticiansIndexes = [
  // Unique identifier
  { key: { id: 1 }, options: { unique: true, name: 'idx_politicians_id' } },

  // Party and approval queries
  { key: { 'party.id': 1, 'approval_rating.overall': -1 }, options: { name: 'idx_politicians_party_approval' } },

  // Performance-based queries
  { key: { 'attributes.charisma': -1, 'attributes.intelligence': -1 }, options: { name: 'idx_politicians_top_performers' } },

  // Position-based queries
  { key: { 'current_position.title': 1, 'current_position.jurisdiction': 1 }, options: { name: 'idx_politicians_position' } },

  // Relationship queries
  { key: { 'relationships.politician_id': 1 }, options: { name: 'idx_politicians_relationships', sparse: true } },

  // Time-based queries
  { key: { created_at: 1 }, options: { name: 'idx_politicians_created' } },
  { key: { updated_at: -1 }, options: { name: 'idx_politicians_updated' } },

  // Active politician queries
  { key: { is_active: 1, 'approval_rating.overall': -1 }, options: { name: 'idx_politicians_active_approval' } },

  // Dashboard queries
  {
    key: {
      'party.id': 1,
      is_active: 1,
      'approval_rating.overall': -1,
      'attributes.charisma': -1
    },
    options: { name: 'idx_politicians_dashboard' }
  },

  // Demographics queries
  { key: { 'demographics.age': 1, 'demographics.gender': 1 }, options: { name: 'idx_politicians_demographics' } },

  // Performance metrics
  { key: { 'performance_metrics.legislative_effectiveness': -1 }, options: { name: 'idx_politicians_performance' } },

  // Financial disclosure queries
  { key: { 'financial_disclosure.net_worth': -1 }, options: { name: 'idx_politicians_wealth', sparse: true } },

  // Text search index
  {
    key: {
      'name.display_name': 'text',
      biography: 'text',
      'current_position.title': 'text'
    },
    options: {
      name: 'idx_politicians_text_search',
      weights: { 'name.display_name': 10, 'current_position.title': 5, biography: 1 }
    }
  }
];

export default {
  schema: PoliticiansCollectionSchema,
  indexes: PoliticiansIndexes,
  validator: PoliticianSchema
};