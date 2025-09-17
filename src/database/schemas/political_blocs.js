/**
 * Political Blocs Collection Schema Definition
 * Voter segments and political coalitions with behavior patterns and metrics
 */

import { z } from 'zod';

// Ideology schema for political blocs
export const BlocIdeologySchema = z.object({
  primary: z.enum(['progressive', 'liberal', 'centrist', 'conservative', 'libertarian', 'socialist', 'green', 'populist']),
  secondary: z.array(z.string()).optional(),
  economic_position: z.number().min(-100).max(100), // -100 = far left, 100 = far right
  social_position: z.number().min(-100).max(100),
  environmental_position: z.number().min(-100).max(100),
  foreign_policy_position: z.number().min(-100).max(100),
  immigration_position: z.number().min(-100).max(100),
  fiscal_position: z.number().min(-100).max(100),
  civil_liberties_position: z.number().min(-100).max(100)
});

// Membership demographics schema
export const MembershipDemographicsSchema = z.object({
  total_members: z.number().min(0),
  active_members: z.number().min(0),
  registered_voters: z.number().min(0),
  age_distribution: z.object({
    age_18_29: z.number().min(0).max(100),
    age_30_49: z.number().min(0).max(100),
    age_50_64: z.number().min(0).max(100),
    age_65_plus: z.number().min(0).max(100)
  }),
  gender_distribution: z.object({
    male: z.number().min(0).max(100),
    female: z.number().min(0).max(100),
    non_binary: z.number().min(0).max(100),
    other: z.number().min(0).max(100)
  }),
  education_distribution: z.object({
    high_school_or_less: z.number().min(0).max(100),
    some_college: z.number().min(0).max(100),
    bachelors_degree: z.number().min(0).max(100),
    graduate_degree: z.number().min(0).max(100)
  }),
  income_distribution: z.object({
    under_30k: z.number().min(0).max(100),
    '30k_60k': z.number().min(0).max(100),
    '60k_100k': z.number().min(0).max(100),
    '100k_200k': z.number().min(0).max(100),
    over_200k: z.number().min(0).max(100)
  }),
  geographic_distribution: z.object({
    urban: z.number().min(0).max(100),
    suburban: z.number().min(0).max(100),
    rural: z.number().min(0).max(100)
  }),
  ethnicity_distribution: z.record(z.string(), z.number().min(0).max(100)).optional()
});

// Cohesion metrics schema
export const CohesionMetricsSchema = z.object({
  unity_score: z.number().min(0).max(100), // How unified the bloc is
  discipline_score: z.number().min(0).max(100), // How well members follow bloc positions
  loyalty_score: z.number().min(0).max(100), // Member loyalty to bloc
  internal_conflict_level: z.number().min(0).max(100), // Level of internal disagreement
  leadership_approval: z.number().min(0).max(100), // Approval of bloc leadership
  ideological_consistency: z.number().min(0).max(100), // Consistency with stated ideology
  turnover_rate: z.number().min(0).max(100), // Annual member turnover percentage
  recruitment_effectiveness: z.number().min(0).max(100), // Ability to recruit new members
  last_updated: z.date()
});

// Electoral data schema
export const ElectoralDataSchema = z.object({
  seats_held: z.number().min(0),
  total_seats_available: z.number().min(0),
  vote_share: z.number().min(0).max(100),
  swing_districts: z.number().min(0),
  safe_districts: z.number().min(0),
  competitive_districts: z.number().min(0),
  electoral_trends: z.array(z.object({
    election_date: z.date(),
    seats_won: z.number().min(0),
    vote_percentage: z.number().min(0).max(100),
    voter_turnout: z.number().min(0).max(100),
    campaign_spending: z.number().min(0).optional()
  })).optional(),
  target_districts: z.array(z.string()).optional(),
  stronghold_districts: z.array(z.string()).optional()
});

// Resource allocation schema
export const ResourcesSchema = z.object({
  financial_resources: z.object({
    total_budget: z.number().min(0),
    campaign_funds: z.number().min(0),
    operating_expenses: z.number().min(0),
    reserves: z.number().min(0),
    fundraising_capacity: z.number().min(0).max(100)
  }),
  human_resources: z.object({
    staff_count: z.number().min(0),
    volunteer_count: z.number().min(0),
    organizer_count: z.number().min(0),
    expertise_areas: z.array(z.string()).optional()
  }),
  influence_metrics: z.object({
    media_influence: z.number().min(0).max(100),
    policy_influence: z.number().min(0).max(100),
    grassroots_influence: z.number().min(0).max(100),
    institutional_influence: z.number().min(0).max(100),
    overall_influence_score: z.number().min(0).max(100)
  }),
  technology_resources: z.object({
    digital_presence_score: z.number().min(0).max(100),
    social_media_reach: z.number().min(0),
    data_analytics_capability: z.number().min(0).max(100),
    voter_database_quality: z.number().min(0).max(100)
  }).optional()
});

// Behavior patterns schema
export const BehaviorPatternsSchema = z.object({
  voting_behavior: z.object({
    turnout_rate: z.number().min(0).max(100),
    consistency_score: z.number().min(0).max(100),
    split_ticket_tendency: z.number().min(0).max(100),
    early_voting_preference: z.number().min(0).max(100)
  }),
  engagement_patterns: z.object({
    rally_attendance: z.number().min(0).max(100),
    volunteer_participation: z.number().min(0).max(100),
    donation_frequency: z.number().min(0).max(100),
    social_media_activity: z.number().min(0).max(100),
    advocacy_participation: z.number().min(0).max(100)
  }),
  communication_preferences: z.object({
    preferred_channels: z.array(z.enum(['email', 'phone', 'text', 'social_media', 'direct_mail', 'in_person'])),
    message_responsiveness: z.number().min(0).max(100),
    information_sharing_tendency: z.number().min(0).max(100)
  }),
  policy_responsiveness: z.object({
    issue_prioritization: z.record(z.string(), z.number().min(1).max(10)),
    position_flexibility: z.number().min(0).max(100),
    compromise_acceptance: z.number().min(0).max(100)
  })
});

// Leadership structure schema
export const LeadershipStructureSchema = z.object({
  formal_leaders: z.array(z.object({
    politician_id: z.string(),
    title: z.string(),
    authority_level: z.number().min(1).max(10),
    tenure_start: z.date(),
    approval_rating: z.number().min(0).max(100).optional()
  })),
  informal_influencers: z.array(z.object({
    politician_id: z.string(),
    influence_type: z.enum(['ideological', 'tactical', 'fundraising', 'media', 'grassroots']),
    influence_score: z.number().min(0).max(100)
  })).optional(),
  decision_making_process: z.enum(['hierarchical', 'democratic', 'consensus', 'informal', 'mixed']),
  leadership_succession_plan: z.boolean(),
  internal_factions: z.array(z.object({
    name: z.string(),
    size_percentage: z.number().min(0).max(100),
    ideological_difference: z.string(),
    key_leaders: z.array(z.string()).optional()
  })).optional()
});

// Main political bloc schema
export const PoliticalBlocSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  bloc_type: z.enum([
    'political_party', 'faction', 'coalition', 'interest_group',
    'voter_segment', 'demographic_group', 'issue_advocacy_group',
    'labor_union', 'business_association', 'think_tank'
  ]),
  ideology: BlocIdeologySchema,
  membership: MembershipDemographicsSchema,
  cohesion_metrics: CohesionMetricsSchema,
  electoral_data: ElectoralDataSchema.optional(),
  resources: ResourcesSchema,
  behavior_patterns: BehaviorPatternsSchema.optional(),
  leadership_structure: LeadershipStructureSchema.optional(),
  policy_priorities: z.array(z.object({
    policy_area: z.string(),
    priority_level: z.number().min(1).max(10),
    stance: z.enum(['strongly_support', 'support', 'neutral', 'oppose', 'strongly_oppose']),
    negotiability: z.number().min(0).max(100) // How willing they are to compromise
  })).optional(),
  historical_performance: z.array(z.object({
    metric_name: z.string(),
    value: z.number(),
    date: z.date(),
    context: z.string().optional()
  })).optional(),
  strategic_objectives: z.array(z.object({
    objective: z.string(),
    target_date: z.date().optional(),
    priority: z.number().min(1).max(10),
    progress_status: z.enum(['not_started', 'in_progress', 'on_track', 'behind', 'completed', 'abandoned'])
  })).optional(),
  external_relationships: z.array(z.object({
    bloc_id: z.string(),
    relationship_type: z.enum(['allied', 'neutral', 'competitive', 'hostile', 'coalition_partner']),
    strength: z.number().min(0).max(100),
    last_interaction: z.date().optional(),
    collaboration_history: z.array(z.object({
      event_date: z.date(),
      event_type: z.string(),
      outcome: z.string(),
      impact_score: z.number().min(-100).max(100)
    })).optional()
  })).optional(),
  geographic_presence: z.object({
    primary_regions: z.array(z.string()),
    secondary_regions: z.array(z.string()).optional(),
    growth_regions: z.array(z.string()).optional(),
    regional_strength: z.record(z.string(), z.number().min(0).max(100)).optional()
  }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  is_active: z.boolean().default(true),
  metadata: z.object({
    data_sources: z.array(z.string()).optional(),
    last_verified: z.date().optional(),
    verification_status: z.enum(['verified', 'pending', 'disputed', 'unverified']).default('unverified'),
    tags: z.array(z.string()).optional(),
    analysis_notes: z.string().optional()
  }).optional()
});

// MongoDB collection schema for validation
export const PoliticalBlocsCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'bloc_type', 'ideology', 'membership', 'cohesion_metrics', 'resources'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        bloc_type: {
          bsonType: 'string',
          enum: [
            'political_party', 'faction', 'coalition', 'interest_group',
            'voter_segment', 'demographic_group', 'issue_advocacy_group',
            'labor_union', 'business_association', 'think_tank'
          ]
        },
        ideology: {
          bsonType: 'object',
          required: ['primary', 'economic_position', 'social_position'],
          properties: {
            primary: {
              bsonType: 'string',
              enum: ['progressive', 'liberal', 'centrist', 'conservative', 'libertarian', 'socialist', 'green', 'populist']
            },
            secondary: { bsonType: 'array' },
            economic_position: { bsonType: 'number', minimum: -100, maximum: 100 },
            social_position: { bsonType: 'number', minimum: -100, maximum: 100 },
            environmental_position: { bsonType: 'number', minimum: -100, maximum: 100 },
            foreign_policy_position: { bsonType: 'number', minimum: -100, maximum: 100 },
            immigration_position: { bsonType: 'number', minimum: -100, maximum: 100 },
            fiscal_position: { bsonType: 'number', minimum: -100, maximum: 100 },
            civil_liberties_position: { bsonType: 'number', minimum: -100, maximum: 100 }
          }
        },
        membership: {
          bsonType: 'object',
          required: ['total_members', 'active_members', 'age_distribution', 'gender_distribution'],
          properties: {
            total_members: { bsonType: 'number', minimum: 0 },
            active_members: { bsonType: 'number', minimum: 0 },
            registered_voters: { bsonType: 'number', minimum: 0 },
            age_distribution: { bsonType: 'object' },
            gender_distribution: { bsonType: 'object' },
            education_distribution: { bsonType: 'object' },
            income_distribution: { bsonType: 'object' },
            geographic_distribution: { bsonType: 'object' },
            ethnicity_distribution: { bsonType: 'object' }
          }
        },
        cohesion_metrics: {
          bsonType: 'object',
          required: ['unity_score', 'discipline_score', 'loyalty_score', 'last_updated'],
          properties: {
            unity_score: { bsonType: 'number', minimum: 0, maximum: 100 },
            discipline_score: { bsonType: 'number', minimum: 0, maximum: 100 },
            loyalty_score: { bsonType: 'number', minimum: 0, maximum: 100 },
            internal_conflict_level: { bsonType: 'number', minimum: 0, maximum: 100 },
            leadership_approval: { bsonType: 'number', minimum: 0, maximum: 100 },
            ideological_consistency: { bsonType: 'number', minimum: 0, maximum: 100 },
            turnover_rate: { bsonType: 'number', minimum: 0, maximum: 100 },
            recruitment_effectiveness: { bsonType: 'number', minimum: 0, maximum: 100 },
            last_updated: { bsonType: 'date' }
          }
        },
        electoral_data: { bsonType: 'object' },
        resources: {
          bsonType: 'object',
          required: ['financial_resources', 'human_resources', 'influence_metrics'],
          properties: {
            financial_resources: { bsonType: 'object' },
            human_resources: { bsonType: 'object' },
            influence_metrics: { bsonType: 'object' },
            technology_resources: { bsonType: 'object' }
          }
        },
        behavior_patterns: { bsonType: 'object' },
        leadership_structure: { bsonType: 'object' },
        policy_priorities: { bsonType: 'array' },
        historical_performance: { bsonType: 'array' },
        strategic_objectives: { bsonType: 'array' },
        external_relationships: { bsonType: 'array' },
        geographic_presence: { bsonType: 'object' },
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
export const PoliticalBlocsIndexes = [
  // Unique identifier
  { key: { id: 1 }, options: { unique: true, name: 'idx_blocs_id' } },

  // Ideology and unity queries
  { key: { 'ideology.primary': 1, 'cohesion_metrics.unity_score': -1 }, options: { name: 'idx_blocs_ideology_unity' } },

  // Size-based queries
  { key: { 'membership.total_members': -1 }, options: { name: 'idx_blocs_size' } },

  // Electoral performance
  { key: { 'electoral_data.seats_held': -1 }, options: { name: 'idx_blocs_electoral_performance' } },

  // Influence queries
  { key: { is_active: 1, 'resources.influence_metrics.overall_influence_score': -1 }, options: { name: 'idx_blocs_active_influence' } },

  // Geographic queries
  { key: { 'geographic_presence.primary_regions': 1 }, options: { name: 'idx_blocs_geographic' } },

  // Bloc type queries
  { key: { bloc_type: 1, 'membership.total_members': -1 }, options: { name: 'idx_blocs_type_size' } },

  // Leadership queries
  { key: { 'leadership_structure.formal_leaders.politician_id': 1 }, options: { name: 'idx_blocs_leaders', sparse: true } },

  // Relationship queries
  { key: { 'external_relationships.bloc_id': 1 }, options: { name: 'idx_blocs_relationships', sparse: true } },

  // Performance tracking
  { key: { 'cohesion_metrics.last_updated': -1 }, options: { name: 'idx_blocs_metrics_updated' } },

  // Resource allocation
  { key: { 'resources.financial_resources.total_budget': -1 }, options: { name: 'idx_blocs_budget' } },

  // Time-based queries
  { key: { created_at: 1 }, options: { name: 'idx_blocs_created' } },
  { key: { updated_at: -1 }, options: { name: 'idx_blocs_updated' } },

  // Compound index for dashboard queries
  {
    key: {
      is_active: 1,
      'membership.total_members': -1,
      'cohesion_metrics.unity_score': -1,
      'resources.influence_metrics.overall_influence_score': -1
    },
    options: { name: 'idx_blocs_dashboard' }
  },

  // Ideological positioning
  {
    key: {
      'ideology.economic_position': 1,
      'ideology.social_position': 1,
      'membership.total_members': -1
    },
    options: { name: 'idx_blocs_ideological_positioning' }
  },

  // Text search index
  {
    key: {
      name: 'text',
      description: 'text'
    },
    options: {
      name: 'idx_blocs_text_search',
      weights: { name: 10, description: 1 }
    }
  }
];

export default {
  schema: PoliticalBlocsCollectionSchema,
  indexes: PoliticalBlocsIndexes,
  validator: PoliticalBlocSchema
};