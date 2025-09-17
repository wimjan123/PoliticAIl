/**
 * Political Events Collection Schema Definition
 * Simulation events affecting political entities and dynamics
 */

import { z } from 'zod';

// Event severity levels
export const EventSeveritySchema = z.enum([
  'minor', 'moderate', 'major', 'crisis', 'historic'
]);

// Event categories
export const EventCategorySchema = z.enum([
  'electoral', 'legislative', 'executive', 'judicial', 'diplomatic',
  'economic', 'social', 'environmental', 'security', 'scandal',
  'media', 'protest', 'emergency', 'appointment', 'resignation',
  'death', 'investigation', 'treaty', 'trade', 'military', 'technology'
]);

// Geographic scope
export const GeographicScopeSchema = z.enum([
  'local', 'state', 'regional', 'national', 'international', 'global'
]);

// Media attention levels
export const MediaAttentionLevelSchema = z.enum([
  'none', 'minimal', 'moderate', 'high', 'intense', 'dominant'
]);

// Event participants schema
export const EventParticipantsSchema = z.object({
  primary_actors: z.array(z.object({
    actor_id: z.string(),
    actor_type: z.enum(['politician', 'bloc', 'organization', 'country', 'institution']),
    role: z.enum(['initiator', 'target', 'mediator', 'observer', 'victim', 'beneficiary']),
    influence_level: z.number().min(0).max(100)
  })),
  secondary_actors: z.array(z.object({
    actor_id: z.string(),
    actor_type: z.enum(['politician', 'bloc', 'organization', 'country', 'institution']),
    role: z.string(),
    involvement_level: z.number().min(0).max(100)
  })).optional(),
  affected_parties: z.array(z.object({
    party_id: z.string(),
    party_type: z.enum(['politician', 'bloc', 'demographic', 'industry', 'region']),
    impact_type: z.enum(['positive', 'negative', 'neutral', 'mixed']),
    impact_magnitude: z.number().min(0).max(100)
  })).optional()
});

// Policy implications schema
export const PolicyImplicationsSchema = z.object({
  affected_policies: z.array(z.object({
    policy_id: z.string(),
    impact_type: z.enum(['accelerates', 'delays', 'modifies', 'blocks', 'creates_need_for']),
    impact_magnitude: z.number().min(0).max(100),
    description: z.string().optional()
  })).optional(),
  new_policy_needs: z.array(z.object({
    policy_area: z.string(),
    urgency: z.number().min(1).max(10),
    description: z.string(),
    expected_timeline: z.string().optional()
  })).optional(),
  regulatory_changes: z.array(z.object({
    agency: z.string(),
    change_type: z.enum(['new_regulation', 'modification', 'repeal', 'enforcement_change']),
    description: z.string(),
    timeline: z.string().optional()
  })).optional()
});

// Economic impact schema
export const EconomicImpactSchema = z.object({
  market_reaction: z.object({
    stock_market_change: z.number().optional(), // percentage change
    currency_impact: z.number().optional(),
    commodity_impacts: z.record(z.string(), z.number()).optional(),
    sector_impacts: z.record(z.string(), z.number()).optional()
  }).optional(),
  fiscal_implications: z.object({
    budget_impact: z.number().optional(), // in dollars
    tax_implications: z.string().optional(),
    spending_changes: z.record(z.string(), z.number()).optional()
  }).optional(),
  long_term_effects: z.object({
    gdp_impact_estimate: z.number().optional(),
    employment_impact: z.number().optional(),
    inflation_impact: z.number().optional(),
    confidence_indicators: z.record(z.string(), z.number()).optional()
  }).optional()
});

// Public reaction schema
export const PublicReactionSchema = z.object({
  polling_impact: z.object({
    approval_changes: z.array(z.object({
      politician_id: z.string(),
      pre_event_approval: z.number().min(0).max(100),
      post_event_approval: z.number().min(0).max(100),
      change_magnitude: z.number(),
      poll_date: z.date()
    })).optional(),
    party_support_changes: z.array(z.object({
      party_id: z.string(),
      pre_event_support: z.number().min(0).max(100),
      post_event_support: z.number().min(0).max(100),
      change_magnitude: z.number(),
      demographic_breakdown: z.record(z.string(), z.number()).optional()
    })).optional()
  }).optional(),
  social_media_reaction: z.object({
    sentiment_score: z.number().min(-100).max(100),
    engagement_level: z.number().min(0).max(100),
    viral_content: z.array(z.object({
      platform: z.string(),
      content_type: z.enum(['post', 'video', 'image', 'hashtag', 'meme']),
      engagement_metrics: z.object({
        likes: z.number().min(0),
        shares: z.number().min(0),
        comments: z.number().min(0),
        views: z.number().min(0).optional()
      }),
      sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed'])
    })).optional(),
    trending_topics: z.array(z.string()).optional()
  }).optional(),
  traditional_media_reaction: z.object({
    coverage_volume: z.number().min(0).max(100),
    coverage_sentiment: z.number().min(-100).max(100),
    editorial_positions: z.array(z.object({
      outlet_id: z.string(),
      position: z.enum(['supportive', 'critical', 'neutral', 'mixed']),
      headline_sentiment: z.number().min(-100).max(100)
    })).optional()
  }).optional(),
  protest_activity: z.array(z.object({
    location: z.string(),
    participants_estimate: z.number().min(0),
    protest_type: z.enum(['support', 'opposition', 'mixed']),
    organization: z.string().optional(),
    violence_level: z.enum(['none', 'minimal', 'moderate', 'significant', 'severe']).optional()
  })).optional()
});

// Event cascades schema (events that trigger other events)
export const EventCascadesSchema = z.object({
  trigger_events: z.array(z.string()).optional(), // IDs of events that triggered this one
  triggered_events: z.array(z.object({
    event_id: z.string(),
    trigger_probability: z.number().min(0).max(100),
    trigger_delay: z.string(), // time delay description
    trigger_conditions: z.array(z.string()).optional()
  })).optional(),
  cascade_potential: z.number().min(0).max(100), // likelihood of triggering more events
  containment_efforts: z.array(z.object({
    actor_id: z.string(),
    action_type: z.string(),
    effectiveness: z.number().min(0).max(100),
    description: z.string()
  })).optional()
});

// Resolution tracking schema
export const ResolutionTrackingSchema = z.object({
  resolution_status: z.enum([
    'ongoing', 'resolved', 'partially_resolved', 'escalated',
    'contained', 'unresolved', 'recurring', 'dormant'
  ]),
  resolution_timeline: z.array(z.object({
    date: z.date(),
    milestone: z.string(),
    description: z.string(),
    actors_involved: z.array(z.string()).optional()
  })).optional(),
  resolution_mechanisms: z.array(z.object({
    mechanism_type: z.enum([
      'negotiation', 'legislation', 'executive_action', 'judicial_ruling',
      'public_pressure', 'economic_measures', 'diplomatic_intervention',
      'media_campaign', 'investigation', 'resignation', 'election'
    ]),
    effectiveness: z.number().min(0).max(100),
    time_to_effect: z.string().optional(),
    actors_responsible: z.array(z.string()).optional()
  })).optional(),
  lessons_learned: z.array(z.string()).optional(),
  precedent_value: z.number().min(0).max(100) // how much this sets precedent for future events
});

// Simulation effects schema
export const SimulationEffectsSchema = z.object({
  relationship_changes: z.array(z.object({
    politician_1_id: z.string(),
    politician_2_id: z.string(),
    relationship_change: z.number().min(-100).max(100),
    new_relationship_type: z.string().optional(),
    change_reason: z.string()
  })).optional(),
  attribute_changes: z.array(z.object({
    politician_id: z.string(),
    attribute_name: z.string(),
    change_value: z.number(),
    temporary_duration: z.string().optional(), // if the change is temporary
    change_reason: z.string()
  })).optional(),
  bloc_effects: z.array(z.object({
    bloc_id: z.string(),
    effect_type: z.enum(['cohesion_change', 'membership_change', 'influence_change', 'resource_change']),
    effect_magnitude: z.number(),
    duration: z.string().optional()
  })).optional(),
  institutional_effects: z.array(z.object({
    institution: z.string(),
    effect_type: z.string(),
    effect_magnitude: z.number().min(-100).max(100),
    description: z.string()
  })).optional(),
  policy_momentum_changes: z.array(z.object({
    policy_id: z.string(),
    momentum_change: z.number().min(-100).max(100),
    reason: z.string()
  })).optional()
});

// Main political event schema
export const PoliticalEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  summary: z.string(),
  event_type: z.string(),
  category: EventCategorySchema,
  subcategory: z.string().optional(),
  severity: EventSeveritySchema,
  occurrence_time: z.date(),
  duration: z.object({
    start_time: z.date(),
    end_time: z.date().optional(),
    is_ongoing: z.boolean(),
    expected_duration: z.string().optional()
  }),
  geographic_scope: GeographicScopeSchema,
  affected_regions: z.array(z.string()),
  media_attention_level: MediaAttentionLevelSchema,
  participants: EventParticipantsSchema,
  background_context: z.object({
    preceding_events: z.array(z.string()).optional(),
    contributing_factors: z.array(z.string()),
    historical_precedents: z.array(z.string()).optional(),
    current_political_climate: z.string().optional()
  }),
  immediate_consequences: z.array(z.object({
    consequence_type: z.string(),
    description: z.string(),
    affected_parties: z.array(z.string()),
    timeline: z.string()
  })),
  long_term_implications: z.array(z.object({
    implication_type: z.string(),
    description: z.string(),
    probability: z.number().min(0).max(100),
    timeline: z.string(),
    affected_areas: z.array(z.string())
  })).optional(),
  policy_implications: PolicyImplicationsSchema.optional(),
  economic_impact: EconomicImpactSchema.optional(),
  public_reaction: PublicReactionSchema.optional(),
  event_cascades: EventCascadesSchema.optional(),
  resolution_tracking: ResolutionTrackingSchema,
  simulation_effects: SimulationEffectsSchema.optional(),
  data_sources: z.array(z.object({
    source_type: z.enum(['news_media', 'government_official', 'social_media', 'academic', 'eyewitness', 'simulation']),
    source_name: z.string(),
    credibility_score: z.number().min(0).max(100),
    bias_score: z.number().min(-100).max(100),
    timestamp: z.date(),
    url: z.string().optional()
  })).optional(),
  verification_status: z.enum(['verified', 'partially_verified', 'unverified', 'disputed', 'false']),
  confidence_level: z.number().min(0).max(100),
  simulation_metadata: z.object({
    event_generator: z.string().optional(), // AI system or manual
    realism_score: z.number().min(0).max(100).optional(),
    player_influence: z.boolean().optional(), // whether player actions influenced this event
    scripted_event: z.boolean().optional()
  }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    analysis_notes: z.string().optional(),
    research_citations: z.array(z.string()).optional(),
    data_quality_score: z.number().min(0).max(100).optional()
  }).optional()
});

// MongoDB collection schema for validation
export const PoliticalEventsCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'title', 'description', 'event_type', 'category', 'severity', 'occurrence_time', 'participants', 'resolution_tracking'],
      properties: {
        id: { bsonType: 'string' },
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        summary: { bsonType: 'string' },
        event_type: { bsonType: 'string' },
        category: {
          bsonType: 'string',
          enum: [
            'electoral', 'legislative', 'executive', 'judicial', 'diplomatic',
            'economic', 'social', 'environmental', 'security', 'scandal',
            'media', 'protest', 'emergency', 'appointment', 'resignation',
            'death', 'investigation', 'treaty', 'trade', 'military', 'technology'
          ]
        },
        subcategory: { bsonType: 'string' },
        severity: {
          bsonType: 'string',
          enum: ['minor', 'moderate', 'major', 'crisis', 'historic']
        },
        occurrence_time: { bsonType: 'date' },
        duration: {
          bsonType: 'object',
          required: ['start_time', 'is_ongoing'],
          properties: {
            start_time: { bsonType: 'date' },
            end_time: { bsonType: 'date' },
            is_ongoing: { bsonType: 'bool' },
            expected_duration: { bsonType: 'string' }
          }
        },
        geographic_scope: {
          bsonType: 'string',
          enum: ['local', 'state', 'regional', 'national', 'international', 'global']
        },
        affected_regions: { bsonType: 'array' },
        media_attention_level: {
          bsonType: 'string',
          enum: ['none', 'minimal', 'moderate', 'high', 'intense', 'dominant']
        },
        participants: {
          bsonType: 'object',
          required: ['primary_actors'],
          properties: {
            primary_actors: { bsonType: 'array' },
            secondary_actors: { bsonType: 'array' },
            affected_parties: { bsonType: 'array' }
          }
        },
        background_context: { bsonType: 'object' },
        immediate_consequences: { bsonType: 'array' },
        long_term_implications: { bsonType: 'array' },
        policy_implications: { bsonType: 'object' },
        economic_impact: { bsonType: 'object' },
        public_reaction: { bsonType: 'object' },
        event_cascades: { bsonType: 'object' },
        resolution_tracking: {
          bsonType: 'object',
          required: ['resolution_status'],
          properties: {
            resolution_status: {
              bsonType: 'string',
              enum: [
                'ongoing', 'resolved', 'partially_resolved', 'escalated',
                'contained', 'unresolved', 'recurring', 'dormant'
              ]
            },
            resolution_timeline: { bsonType: 'array' },
            resolution_mechanisms: { bsonType: 'array' },
            lessons_learned: { bsonType: 'array' },
            precedent_value: { bsonType: 'number', minimum: 0, maximum: 100 }
          }
        },
        simulation_effects: { bsonType: 'object' },
        data_sources: { bsonType: 'array' },
        verification_status: {
          bsonType: 'string',
          enum: ['verified', 'partially_verified', 'unverified', 'disputed', 'false']
        },
        confidence_level: { bsonType: 'number', minimum: 0, maximum: 100 },
        simulation_metadata: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        metadata: { bsonType: 'object' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
};

// Index definitions for optimal query performance
export const PoliticalEventsIndexes = [
  // Unique identifier
  { key: { id: 1 }, options: { unique: true, name: 'idx_events_id' } },

  // Time-based queries
  { key: { occurrence_time: -1 }, options: { name: 'idx_events_time' } },

  // Severity and attention queries
  { key: { severity: 1, media_attention_level: -1 }, options: { name: 'idx_events_severity_attention' } },

  // Category and type queries
  { key: { category: 1, event_type: 1 }, options: { name: 'idx_events_category_type' } },

  // Geographic queries
  { key: { geographic_scope: 1, affected_regions: 1 }, options: { name: 'idx_events_geographic' } },

  // Participant queries
  { key: { 'participants.primary_actors.actor_id': 1 }, options: { name: 'idx_events_primary_actors' } },
  { key: { 'participants.affected_parties.party_id': 1 }, options: { name: 'idx_events_affected_parties', sparse: true } },

  // Resolution tracking
  { key: { 'resolution_tracking.resolution_status': 1, occurrence_time: -1 }, options: { name: 'idx_events_resolution_time' } },

  // Event cascades
  { key: { 'event_cascades.trigger_events': 1 }, options: { name: 'idx_events_triggers', sparse: true } },
  { key: { 'event_cascades.triggered_events.event_id': 1 }, options: { name: 'idx_events_triggered', sparse: true } },

  // Policy implications
  { key: { 'policy_implications.affected_policies.policy_id': 1 }, options: { name: 'idx_events_policy_impact', sparse: true } },

  // Simulation effects
  { key: { 'simulation_effects.relationship_changes.politician_1_id': 1 }, options: { name: 'idx_events_relationship_effects', sparse: true } },

  // Verification and confidence
  { key: { verification_status: 1, confidence_level: -1 }, options: { name: 'idx_events_verification' } },

  // Simulation metadata
  { key: { 'simulation_metadata.player_influence': 1 }, options: { name: 'idx_events_player_influence', sparse: true } },

  // Time-based queries
  { key: { created_at: 1 }, options: { name: 'idx_events_created' } },
  { key: { updated_at: -1 }, options: { name: 'idx_events_updated' } },

  // Compound index for timeline queries
  {
    key: {
      occurrence_time: -1,
      severity: 1,
      media_attention_level: -1,
      'resolution_tracking.resolution_status': 1
    },
    options: { name: 'idx_events_timeline' }
  },

  // Compound index for active/ongoing events
  {
    key: {
      'resolution_tracking.resolution_status': 1,
      occurrence_time: -1,
      severity: 1
    },
    options: { name: 'idx_events_active_recent_severe' }
  },

  // Dashboard queries
  {
    key: {
      'duration.is_ongoing': 1,
      severity: -1,
      media_attention_level: -1,
      occurrence_time: -1
    },
    options: { name: 'idx_events_dashboard' }
  },

  // Text search index
  {
    key: {
      title: 'text',
      description: 'text',
      summary: 'text'
    },
    options: {
      name: 'idx_events_text_search',
      weights: { title: 10, summary: 5, description: 1 }
    }
  }
];

export default {
  schema: PoliticalEventsCollectionSchema,
  indexes: PoliticalEventsIndexes,
  validator: PoliticalEventSchema
};