/**
 * Relationships Collection Schema Definition
 * Dynamic political relationships and trust scores between entities
 */

import { z } from 'zod';

// Relationship types schema
export const RelationshipTypeSchema = z.enum([
  'ally', 'rival', 'mentor', 'protege', 'neutral', 'coalition_partner',
  'ideological_opponent', 'personal_friend', 'enemy', 'family_member',
  'business_partner', 'former_colleague', 'political_opponent',
  'strategic_partner', 'competitive_rival', 'dependent', 'influential'
]);

// Relationship strength indicators
export const RelationshipStrengthSchema = z.object({
  overall_strength: z.number().min(0).max(100),
  trust_level: z.number().min(-100).max(100), // -100 = complete distrust, 100 = complete trust
  influence_level: z.number().min(0).max(100), // how much one influences the other
  dependency_level: z.number().min(0).max(100), // how much one depends on the other
  cooperation_frequency: z.number().min(0).max(100), // how often they work together
  conflict_frequency: z.number().min(0).max(100), // how often they are in conflict
  communication_frequency: z.number().min(0).max(100) // how often they communicate
});

// Relationship context schema
export const RelationshipContextSchema = z.object({
  relationship_origin: z.object({
    origin_type: z.enum([
      'political', 'personal', 'professional', 'ideological', 'circumstantial',
      'family', 'educational', 'military', 'business', 'regional'
    ]),
    origin_date: z.date().optional(),
    origin_description: z.string().optional(),
    origin_location: z.string().optional()
  }),
  shared_experiences: z.array(z.object({
    experience_type: z.enum([
      'campaign', 'legislation', 'crisis', 'scandal', 'victory', 'defeat',
      'collaboration', 'conflict', 'negotiation', 'public_event', 'private_meeting'
    ]),
    experience_date: z.date(),
    description: z.string(),
    impact_on_relationship: z.number().min(-50).max(50), // how it affected the relationship
    public_visibility: z.enum(['public', 'semi_public', 'private', 'secret'])
  })).optional(),
  common_interests: z.array(z.object({
    interest_area: z.string(),
    alignment_strength: z.number().min(-100).max(100), // how aligned they are on this interest
    importance_level: z.number().min(1).max(10)
  })).optional(),
  ideological_alignment: z.object({
    overall_alignment: z.number().min(-100).max(100),
    policy_area_alignments: z.record(z.string(), z.number().min(-100).max(100)).optional(),
    core_value_alignment: z.number().min(-100).max(100).optional()
  }).optional()
});

// Interaction history schema
export const InteractionHistorySchema = z.object({
  total_interactions: z.number().min(0),
  recent_interactions: z.array(z.object({
    interaction_date: z.date(),
    interaction_type: z.enum([
      'meeting', 'phone_call', 'public_event', 'vote', 'statement',
      'collaboration', 'negotiation', 'debate', 'social_media', 'media_interview'
    ]),
    context: z.string(),
    outcome: z.enum(['positive', 'negative', 'neutral', 'mixed']),
    public_visibility: z.enum(['public', 'semi_public', 'private', 'confidential']),
    impact_score: z.number().min(-10).max(10), // impact on relationship
    description: z.string().optional(),
    witnesses: z.array(z.string()).optional(), // other politicians present
    media_coverage: z.boolean().optional()
  })),
  interaction_patterns: z.object({
    preferred_interaction_types: z.array(z.string()).optional(),
    interaction_frequency_trend: z.enum(['increasing', 'decreasing', 'stable', 'irregular']),
    seasonal_patterns: z.string().optional(),
    formal_vs_informal_ratio: z.number().min(0).max(100).optional()
  }).optional(),
  last_positive_interaction: z.date().optional(),
  last_negative_interaction: z.date().optional(),
  longest_period_without_contact: z.number().optional() // days
});

// Public perception schema
export const PublicPerceptionSchema = z.object({
  media_portrayal: z.enum(['allies', 'rivals', 'neutral', 'complex', 'unknown']),
  public_awareness: z.number().min(0).max(100), // how aware the public is of this relationship
  public_sentiment: z.number().min(-100).max(100), // how the public views this relationship
  media_attention_level: z.enum(['none', 'minimal', 'moderate', 'high', 'intense']),
  controversy_level: z.number().min(0).max(100),
  symbolic_value: z.number().min(0).max(100), // how much this relationship symbolizes broader dynamics
  recent_media_coverage: z.array(z.object({
    date: z.date(),
    outlet: z.string(),
    headline: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    prominence: z.enum(['front_page', 'major_story', 'minor_mention', 'brief_reference'])
  })).optional()
});

// Political implications schema
export const PoliticalImplicationsSchema = z.object({
  coalition_potential: z.number().min(0).max(100), // likelihood of forming coalitions
  opposition_potential: z.number().min(0).max(100), // likelihood of opposing each other
  influence_dynamics: z.object({
    who_influences_whom: z.enum(['entity_1_influences_2', 'entity_2_influences_1', 'mutual', 'neither']),
    influence_mechanisms: z.array(z.enum([
      'personal_persuasion', 'resource_sharing', 'threat', 'favor_trading',
      'ideological_appeal', 'public_pressure', 'private_leverage'
    ])).optional(),
    power_balance: z.enum(['balanced', 'entity_1_dominant', 'entity_2_dominant', 'shifting'])
  }),
  strategic_value: z.object({
    value_to_entity_1: z.number().min(0).max(100),
    value_to_entity_2: z.number().min(0).max(100),
    mutual_benefit_potential: z.number().min(0).max(100),
    competitive_threat_level: z.number().min(0).max(100)
  }),
  policy_collaboration_likelihood: z.record(z.string(), z.number().min(0).max(100)).optional(),
  electoral_implications: z.object({
    endorsement_likelihood: z.number().min(0).max(100).optional(),
    campaign_collaboration_potential: z.number().min(0).max(100).optional(),
    mutual_fundraising_potential: z.number().min(0).max(100).optional(),
    voter_base_overlap: z.number().min(0).max(100).optional()
  }).optional()
});

// Relationship evolution schema
export const RelationshipEvolutionSchema = z.object({
  evolution_stage: z.enum([
    'initial_contact', 'developing', 'established', 'deepening',
    'stable', 'straining', 'deteriorating', 'hostile', 'dormant', 'ended'
  ]),
  evolution_trajectory: z.enum(['improving', 'declining', 'stable', 'volatile', 'cyclical']),
  key_turning_points: z.array(z.object({
    date: z.date(),
    event: z.string(),
    impact_type: z.enum(['strengthening', 'weakening', 'neutral', 'transformative']),
    magnitude: z.number().min(0).max(100),
    description: z.string()
  })).optional(),
  stability_indicators: z.object({
    relationship_volatility: z.number().min(0).max(100), // how much the relationship changes
    predictability_score: z.number().min(0).max(100), // how predictable the relationship is
    resilience_score: z.number().min(0).max(100) // how well it withstands challenges
  }),
  future_projections: z.object({
    projected_trajectory: z.enum(['strengthening', 'weakening', 'stable', 'uncertain']),
    key_risk_factors: z.array(z.string()).optional(),
    key_opportunity_factors: z.array(z.string()).optional(),
    external_influence_factors: z.array(z.string()).optional()
  }).optional()
});

// Network effects schema
export const NetworkEffectsSchema = z.object({
  mutual_connections: z.array(z.object({
    connection_id: z.string(),
    connection_type: z.enum(['shared_ally', 'shared_rival', 'mutual_friend', 'common_enemy']),
    influence_on_relationship: z.number().min(-50).max(50),
    triangulation_potential: z.number().min(0).max(100) // potential for complex dynamics
  })).optional(),
  network_position_impact: z.object({
    centrality_effect: z.number().min(-100).max(100), // how network position affects relationship
    brokerage_opportunities: z.array(z.string()).optional(),
    structural_constraints: z.array(z.string()).optional()
  }).optional(),
  coalition_memberships: z.array(z.object({
    coalition_name: z.string(),
    both_members: z.boolean(),
    coalition_role_similarity: z.number().min(0).max(100),
    coalition_impact_on_relationship: z.number().min(-50).max(50)
  })).optional()
});

// Main relationship schema
export const RelationshipSchema = z.object({
  id: z.string(),
  entity_1: z.object({
    entity_id: z.string(),
    entity_type: z.enum(['politician', 'political_bloc', 'organization', 'institution']),
    entity_name: z.string()
  }),
  entity_2: z.object({
    entity_id: z.string(),
    entity_type: z.enum(['politician', 'political_bloc', 'organization', 'institution']),
    entity_name: z.string()
  }),
  relationship_type: RelationshipTypeSchema,
  relationship_strength: RelationshipStrengthSchema,
  relationship_context: RelationshipContextSchema,
  interaction_history: InteractionHistorySchema,
  public_perception: PublicPerceptionSchema.optional(),
  political_implications: PoliticalImplicationsSchema,
  relationship_evolution: RelationshipEvolutionSchema,
  network_effects: NetworkEffectsSchema.optional(),
  temporal_data: z.object({
    relationship_start_date: z.date(),
    relationship_end_date: z.date().optional(),
    last_significant_change: z.date().optional(),
    next_expected_interaction: z.date().optional(),
    relationship_duration_days: z.number().min(0)
  }),
  data_quality: z.object({
    confidence_level: z.number().min(0).max(100),
    data_sources: z.array(z.object({
      source_type: z.enum(['direct_observation', 'media_report', 'insider_information', 'public_record', 'inference']),
      source_reliability: z.number().min(0).max(100),
      last_updated: z.date()
    })),
    verification_status: z.enum(['verified', 'partially_verified', 'unverified', 'disputed']),
    missing_data_indicators: z.array(z.string()).optional()
  }),
  simulation_metadata: z.object({
    ai_generated: z.boolean(),
    player_influenced: z.boolean(),
    dynamic_updates_enabled: z.boolean(),
    last_ai_analysis: z.date().optional(),
    relationship_volatility_setting: z.enum(['low', 'medium', 'high', 'realistic']).optional()
  }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  is_active: z.boolean().default(true),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    analysis_notes: z.string().optional(),
    researcher_comments: z.string().optional(),
    external_references: z.array(z.string()).optional()
  }).optional()
});

// MongoDB collection schema for validation
export const RelationshipsCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'entity_1', 'entity_2', 'relationship_type', 'relationship_strength', 'interaction_history', 'political_implications', 'temporal_data'],
      properties: {
        id: { bsonType: 'string' },
        entity_1: {
          bsonType: 'object',
          required: ['entity_id', 'entity_type', 'entity_name'],
          properties: {
            entity_id: { bsonType: 'string' },
            entity_type: {
              bsonType: 'string',
              enum: ['politician', 'political_bloc', 'organization', 'institution']
            },
            entity_name: { bsonType: 'string' }
          }
        },
        entity_2: {
          bsonType: 'object',
          required: ['entity_id', 'entity_type', 'entity_name'],
          properties: {
            entity_id: { bsonType: 'string' },
            entity_type: {
              bsonType: 'string',
              enum: ['politician', 'political_bloc', 'organization', 'institution']
            },
            entity_name: { bsonType: 'string' }
          }
        },
        relationship_type: {
          bsonType: 'string',
          enum: [
            'ally', 'rival', 'mentor', 'protege', 'neutral', 'coalition_partner',
            'ideological_opponent', 'personal_friend', 'enemy', 'family_member',
            'business_partner', 'former_colleague', 'political_opponent',
            'strategic_partner', 'competitive_rival', 'dependent', 'influential'
          ]
        },
        relationship_strength: {
          bsonType: 'object',
          required: ['overall_strength', 'trust_level', 'influence_level'],
          properties: {
            overall_strength: { bsonType: 'number', minimum: 0, maximum: 100 },
            trust_level: { bsonType: 'number', minimum: -100, maximum: 100 },
            influence_level: { bsonType: 'number', minimum: 0, maximum: 100 },
            dependency_level: { bsonType: 'number', minimum: 0, maximum: 100 },
            cooperation_frequency: { bsonType: 'number', minimum: 0, maximum: 100 },
            conflict_frequency: { bsonType: 'number', minimum: 0, maximum: 100 },
            communication_frequency: { bsonType: 'number', minimum: 0, maximum: 100 }
          }
        },
        relationship_context: { bsonType: 'object' },
        interaction_history: {
          bsonType: 'object',
          required: ['total_interactions', 'recent_interactions'],
          properties: {
            total_interactions: { bsonType: 'number', minimum: 0 },
            recent_interactions: { bsonType: 'array' },
            interaction_patterns: { bsonType: 'object' },
            last_positive_interaction: { bsonType: 'date' },
            last_negative_interaction: { bsonType: 'date' },
            longest_period_without_contact: { bsonType: 'number' }
          }
        },
        public_perception: { bsonType: 'object' },
        political_implications: {
          bsonType: 'object',
          required: ['coalition_potential', 'opposition_potential', 'influence_dynamics', 'strategic_value'],
          properties: {
            coalition_potential: { bsonType: 'number', minimum: 0, maximum: 100 },
            opposition_potential: { bsonType: 'number', minimum: 0, maximum: 100 },
            influence_dynamics: { bsonType: 'object' },
            strategic_value: { bsonType: 'object' },
            policy_collaboration_likelihood: { bsonType: 'object' },
            electoral_implications: { bsonType: 'object' }
          }
        },
        relationship_evolution: {
          bsonType: 'object',
          required: ['evolution_stage', 'evolution_trajectory', 'stability_indicators'],
          properties: {
            evolution_stage: { bsonType: 'string' },
            evolution_trajectory: { bsonType: 'string' },
            key_turning_points: { bsonType: 'array' },
            stability_indicators: { bsonType: 'object' },
            future_projections: { bsonType: 'object' }
          }
        },
        network_effects: { bsonType: 'object' },
        temporal_data: {
          bsonType: 'object',
          required: ['relationship_start_date', 'relationship_duration_days'],
          properties: {
            relationship_start_date: { bsonType: 'date' },
            relationship_end_date: { bsonType: 'date' },
            last_significant_change: { bsonType: 'date' },
            next_expected_interaction: { bsonType: 'date' },
            relationship_duration_days: { bsonType: 'number', minimum: 0 }
          }
        },
        data_quality: { bsonType: 'object' },
        simulation_metadata: { bsonType: 'object' },
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
export const RelationshipsIndexes = [
  // Unique identifier
  { key: { id: 1 }, options: { unique: true, name: 'idx_relationships_id' } },

  // Entity-based queries
  { key: { 'entity_1.entity_id': 1 }, options: { name: 'idx_relationships_entity1' } },
  { key: { 'entity_2.entity_id': 1 }, options: { name: 'idx_relationships_entity2' } },

  // Bidirectional entity queries (compound index for finding relationships between any two entities)
  {
    key: { 'entity_1.entity_id': 1, 'entity_2.entity_id': 1 },
    options: { name: 'idx_relationships_entities_pair', unique: true }
  },

  // Relationship type queries
  { key: { relationship_type: 1, 'relationship_strength.overall_strength': -1 }, options: { name: 'idx_relationships_type_strength' } },

  // Trust and influence queries
  { key: { 'relationship_strength.trust_level': -1 }, options: { name: 'idx_relationships_trust' } },
  { key: { 'relationship_strength.influence_level': -1 }, options: { name: 'idx_relationships_influence' } },

  // Coalition and opposition potential
  { key: { 'political_implications.coalition_potential': -1 }, options: { name: 'idx_relationships_coalition_potential' } },
  { key: { 'political_implications.opposition_potential': -1 }, options: { name: 'idx_relationships_opposition_potential' } },

  // Evolution and stability
  { key: { 'relationship_evolution.evolution_stage': 1 }, options: { name: 'idx_relationships_evolution_stage' } },
  { key: { 'relationship_evolution.evolution_trajectory': 1 }, options: { name: 'idx_relationships_trajectory' } },

  // Temporal queries
  { key: { 'temporal_data.relationship_start_date': -1 }, options: { name: 'idx_relationships_start_date' } },
  { key: { 'temporal_data.last_significant_change': -1 }, options: { name: 'idx_relationships_last_change' } },

  // Network analysis queries
  { key: { 'network_effects.mutual_connections.connection_id': 1 }, options: { name: 'idx_relationships_mutual_connections', sparse: true } },

  // Public perception queries
  { key: { 'public_perception.public_awareness': -1 }, options: { name: 'idx_relationships_public_awareness', sparse: true } },
  { key: { 'public_perception.controversy_level': -1 }, options: { name: 'idx_relationships_controversy', sparse: true } },

  // Interaction frequency
  { key: { 'interaction_history.total_interactions': -1 }, options: { name: 'idx_relationships_interaction_count' } },
  { key: { 'interaction_history.last_positive_interaction': -1 }, options: { name: 'idx_relationships_last_positive', sparse: true } },
  { key: { 'interaction_history.last_negative_interaction': -1 }, options: { name: 'idx_relationships_last_negative', sparse: true } },

  // Data quality queries
  { key: { 'data_quality.confidence_level': -1 }, options: { name: 'idx_relationships_confidence' } },
  { key: { 'data_quality.verification_status': 1 }, options: { name: 'idx_relationships_verification' } },

  // Active relationships
  { key: { is_active: 1, 'relationship_strength.overall_strength': -1 }, options: { name: 'idx_relationships_active_strong' } },

  // Time-based queries
  { key: { created_at: 1 }, options: { name: 'idx_relationships_created' } },
  { key: { updated_at: -1 }, options: { name: 'idx_relationships_updated' } },

  // Compound index for relationship analysis
  {
    key: {
      'entity_1.entity_type': 1,
      'entity_2.entity_type': 1,
      relationship_type: 1,
      'relationship_strength.overall_strength': -1
    },
    options: { name: 'idx_relationships_analysis' }
  },

  // Compound index for network queries
  {
    key: {
      'entity_1.entity_id': 1,
      relationship_type: 1,
      'relationship_strength.trust_level': -1,
      is_active: 1
    },
    options: { name: 'idx_relationships_network_analysis' }
  },

  // Strategic value index
  {
    key: {
      'political_implications.strategic_value.mutual_benefit_potential': -1,
      'relationship_strength.overall_strength': -1,
      is_active: 1
    },
    options: { name: 'idx_relationships_strategic_value' }
  },

  // Dashboard queries
  {
    key: {
      is_active: 1,
      'relationship_evolution.evolution_trajectory': 1,
      'relationship_strength.overall_strength': -1,
      'temporal_data.last_significant_change': -1
    },
    options: { name: 'idx_relationships_dashboard' }
  }
];

export default {
  schema: RelationshipsCollectionSchema,
  indexes: RelationshipsIndexes,
  validator: RelationshipSchema
};