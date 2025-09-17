/**
 * Policies Collection Schema Definition
 * Government policies with impact calculations and legislative tracking
 */

import { z } from 'zod';

// Policy status schema
export const PolicyStatusSchema = z.enum([
  'draft', 'introduced', 'committee_review', 'markup', 'committee_vote',
  'floor_consideration', 'passed_chamber', 'cross_chamber', 'conference',
  'enrolled', 'signed', 'vetoed', 'overridden', 'withdrawn', 'failed',
  'in_effect', 'challenged', 'repealed', 'expired'
]);

// Legislative history schema
export const LegislativeHistorySchema = z.object({
  current_status: PolicyStatusSchema,
  status_history: z.array(z.object({
    status: PolicyStatusSchema,
    date: z.date(),
    chamber: z.enum(['house', 'senate', 'executive', 'judicial', 'commission']).optional(),
    vote_count: z.object({
      yes: z.number().min(0),
      no: z.number().min(0),
      abstain: z.number().min(0),
      present: z.number().min(0),
      absent: z.number().min(0)
    }).optional(),
    margin: z.number().optional(), // vote margin percentage
    notes: z.string().optional()
  })),
  sponsor_id: z.string(), // politician who sponsored/introduced
  co_sponsors: z.array(z.string()).optional(),
  committee_assignments: z.array(z.object({
    committee_name: z.string(),
    committee_id: z.string(),
    assignment_date: z.date(),
    status: z.enum(['assigned', 'markup', 'reported', 'tabled', 'discharged'])
  })).optional(),
  amendments: z.array(z.object({
    amendment_id: z.string(),
    sponsor_id: z.string(),
    description: z.string(),
    status: z.enum(['proposed', 'adopted', 'rejected', 'withdrawn']),
    vote_date: z.date().optional()
  })).optional()
});

// Timeline schema
export const TimelineSchema = z.object({
  introduction_date: z.date(),
  committee_deadline: z.date().optional(),
  floor_vote_date: z.date().optional(),
  expected_completion: z.date().optional(),
  effective_date: z.date().optional(),
  sunset_date: z.date().optional(), // when policy expires
  review_dates: z.array(z.date()).optional(),
  milestone_dates: z.array(z.object({
    milestone: z.string(),
    target_date: z.date(),
    actual_date: z.date().optional(),
    status: z.enum(['pending', 'completed', 'delayed', 'cancelled'])
  })).optional()
});

// Fiscal impact schema
export const FiscalImpactSchema = z.object({
  estimated_cost: z.number(), // in dollars
  cost_breakdown: z.object({
    initial_cost: z.number(),
    annual_cost: z.number(),
    implementation_cost: z.number(),
    enforcement_cost: z.number().optional(),
    administrative_cost: z.number().optional()
  }),
  revenue_impact: z.number().optional(), // positive for revenue generation
  budget_category: z.enum([
    'defense', 'education', 'healthcare', 'infrastructure', 'social_programs',
    'law_enforcement', 'environment', 'agriculture', 'technology', 'other'
  ]),
  funding_source: z.array(z.object({
    source: z.string(),
    amount: z.number(),
    funding_type: z.enum(['federal', 'state', 'local', 'private', 'mixed'])
  })).optional(),
  economic_impact: z.object({
    gdp_impact: z.number().optional(),
    job_creation: z.number().optional(), // net jobs created/lost
    sector_impacts: z.record(z.string(), z.number()).optional(), // impact by economic sector
    regional_impacts: z.record(z.string(), z.number()).optional()
  }).optional(),
  cost_benefit_ratio: z.number().optional(),
  payback_period: z.number().optional() // years
});

// Stakeholder positions schema
export const StakeholderPositionsSchema = z.array(z.object({
  stakeholder_type: z.enum([
    'political_party', 'interest_group', 'industry_association', 'labor_union',
    'think_tank', 'advocacy_group', 'government_agency', 'academic_institution',
    'media_outlet', 'international_organization', 'public_figure'
  ]),
  stakeholder_id: z.string(),
  stakeholder_name: z.string(),
  position: z.enum(['strongly_support', 'support', 'neutral', 'oppose', 'strongly_oppose']),
  influence_level: z.number().min(0).max(100), // how much influence they have on this policy
  lobbying_expenditure: z.number().min(0).optional(),
  position_rationale: z.string().optional(),
  key_concerns: z.array(z.string()).optional(),
  proposed_amendments: z.array(z.string()).optional(),
  public_statements: z.array(z.object({
    date: z.date(),
    statement: z.string(),
    platform: z.string()
  })).optional()
});

// Impact assessment schema
export const ImpactAssessmentSchema = z.object({
  social_impact: z.object({
    affected_populations: z.array(z.string()),
    demographic_impacts: z.record(z.string(), z.number()),
    equity_score: z.number().min(-100).max(100), // negative = increases inequality
    civil_rights_impact: z.number().min(-100).max(100)
  }).optional(),
  environmental_impact: z.object({
    carbon_footprint_change: z.number().optional(),
    environmental_score: z.number().min(-100).max(100),
    affected_ecosystems: z.array(z.string()).optional(),
    sustainability_rating: z.number().min(0).max(100)
  }).optional(),
  economic_impact: z.object({
    gdp_effect: z.number().optional(),
    employment_effect: z.number().optional(),
    inflation_effect: z.number().optional(),
    competitiveness_effect: z.number().min(-100).max(100)
  }).optional(),
  institutional_impact: z.object({
    regulatory_burden_change: z.number().min(-100).max(100),
    government_efficiency_impact: z.number().min(-100).max(100),
    federalism_impact: z.number().min(-100).max(100) // centralization vs. decentralization
  }).optional(),
  international_impact: z.object({
    diplomatic_implications: z.array(z.string()).optional(),
    trade_effects: z.number().min(-100).max(100).optional(),
    alliance_impact: z.number().min(-100).max(100).optional()
  }).optional()
});

// Implementation details schema
export const ImplementationDetailsSchema = z.object({
  implementing_agencies: z.array(z.object({
    agency_name: z.string(),
    agency_id: z.string(),
    role: z.enum(['primary', 'secondary', 'oversight', 'enforcement', 'advisory']),
    capacity_score: z.number().min(0).max(100), // agency's capacity to implement
    required_resources: z.object({
      budget: z.number(),
      staff: z.number(),
      technology: z.array(z.string()).optional()
    }).optional()
  })),
  implementation_phases: z.array(z.object({
    phase_name: z.string(),
    description: z.string(),
    start_date: z.date(),
    end_date: z.date(),
    milestones: z.array(z.string()),
    dependencies: z.array(z.string()).optional(),
    risks: z.array(z.object({
      risk_description: z.string(),
      probability: z.number().min(0).max(100),
      impact: z.number().min(0).max(100),
      mitigation_strategy: z.string().optional()
    })).optional()
  })).optional(),
  success_metrics: z.array(z.object({
    metric_name: z.string(),
    target_value: z.number(),
    measurement_method: z.string(),
    reporting_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually'])
  })).optional(),
  compliance_requirements: z.array(z.object({
    requirement: z.string(),
    enforcement_mechanism: z.string(),
    penalties: z.string().optional()
  })).optional()
});

// Public opinion schema
export const PublicOpinionSchema = z.object({
  overall_support: z.number().min(0).max(100),
  support_by_party: z.object({
    democratic: z.number().min(0).max(100),
    republican: z.number().min(0).max(100),
    independent: z.number().min(0).max(100),
    other: z.number().min(0).max(100).optional()
  }),
  support_by_demographic: z.object({
    age_18_29: z.number().min(0).max(100).optional(),
    age_30_49: z.number().min(0).max(100).optional(),
    age_50_64: z.number().min(0).max(100).optional(),
    age_65_plus: z.number().min(0).max(100).optional(),
    urban: z.number().min(0).max(100).optional(),
    suburban: z.number().min(0).max(100).optional(),
    rural: z.number().min(0).max(100).optional(),
    college_educated: z.number().min(0).max(100).optional(),
    non_college_educated: z.number().min(0).max(100).optional()
  }).optional(),
  polling_data: z.array(z.object({
    poll_date: z.date(),
    pollster: z.string(),
    sample_size: z.number(),
    margin_of_error: z.number(),
    support_percentage: z.number().min(0).max(100),
    oppose_percentage: z.number().min(0).max(100),
    undecided_percentage: z.number().min(0).max(100)
  })).optional(),
  media_coverage_sentiment: z.number().min(-100).max(100), // overall media sentiment
  social_media_sentiment: z.number().min(-100).max(100),
  last_updated: z.date()
});

// Main policy schema
export const PolicySchema = z.object({
  id: z.string(),
  title: z.string(),
  short_title: z.string().optional(),
  description: z.string(),
  summary: z.string(),
  category: z.enum([
    'healthcare', 'education', 'defense', 'economics', 'environment',
    'infrastructure', 'social_welfare', 'immigration', 'criminal_justice',
    'civil_rights', 'foreign_policy', 'technology', 'agriculture',
    'energy', 'housing', 'transportation', 'taxation', 'trade', 'other'
  ]),
  subcategory: z.string().optional(),
  policy_type: z.enum([
    'bill', 'resolution', 'amendment', 'executive_order', 'regulation',
    'judicial_ruling', 'international_agreement', 'ballot_initiative',
    'local_ordinance', 'administrative_action'
  ]),
  scope: z.enum(['federal', 'state', 'local', 'international', 'mixed']),
  jurisdiction: z.string(), // specific geographic or institutional scope
  complexity_score: z.number().min(1).max(10),
  controversy_level: z.number().min(1).max(10),
  urgency_level: z.number().min(1).max(10),
  political_feasibility: z.number().min(0).max(100),
  legislative_history: LegislativeHistorySchema,
  timeline: TimelineSchema,
  fiscal_impact: FiscalImpactSchema.optional(),
  stakeholder_positions: StakeholderPositionsSchema.optional(),
  impact_assessment: ImpactAssessmentSchema.optional(),
  implementation_details: ImplementationDetailsSchema.optional(),
  public_opinion: PublicOpinionSchema.optional(),
  related_policies: z.array(z.object({
    policy_id: z.string(),
    relationship_type: z.enum(['prerequisite', 'complementary', 'conflicting', 'superseding', 'related']),
    description: z.string().optional()
  })).optional(),
  legal_challenges: z.array(z.object({
    case_name: z.string(),
    court: z.string(),
    filing_date: z.date(),
    status: z.enum(['filed', 'pending', 'decided', 'appealed', 'settled']),
    outcome: z.string().optional(),
    constitutional_issues: z.array(z.string()).optional()
  })).optional(),
  international_comparisons: z.array(z.object({
    country: z.string(),
    similar_policy: z.string(),
    implementation_date: z.date().optional(),
    effectiveness_rating: z.number().min(0).max(100).optional(),
    lessons_learned: z.string().optional()
  })).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  is_active: z.boolean().default(true),
  metadata: z.object({
    data_sources: z.array(z.string()).optional(),
    last_verified: z.date().optional(),
    verification_status: z.enum(['verified', 'pending', 'disputed', 'unverified']).default('unverified'),
    tags: z.array(z.string()).optional(),
    analysis_notes: z.string().optional(),
    research_citations: z.array(z.string()).optional()
  }).optional()
});

// MongoDB collection schema for validation
export const PoliciesCollectionSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'title', 'description', 'summary', 'category', 'policy_type', 'scope', 'legislative_history', 'timeline'],
      properties: {
        id: { bsonType: 'string' },
        title: { bsonType: 'string' },
        short_title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        summary: { bsonType: 'string' },
        category: {
          bsonType: 'string',
          enum: [
            'healthcare', 'education', 'defense', 'economics', 'environment',
            'infrastructure', 'social_welfare', 'immigration', 'criminal_justice',
            'civil_rights', 'foreign_policy', 'technology', 'agriculture',
            'energy', 'housing', 'transportation', 'taxation', 'trade', 'other'
          ]
        },
        subcategory: { bsonType: 'string' },
        policy_type: {
          bsonType: 'string',
          enum: [
            'bill', 'resolution', 'amendment', 'executive_order', 'regulation',
            'judicial_ruling', 'international_agreement', 'ballot_initiative',
            'local_ordinance', 'administrative_action'
          ]
        },
        scope: {
          bsonType: 'string',
          enum: ['federal', 'state', 'local', 'international', 'mixed']
        },
        jurisdiction: { bsonType: 'string' },
        complexity_score: { bsonType: 'number', minimum: 1, maximum: 10 },
        controversy_level: { bsonType: 'number', minimum: 1, maximum: 10 },
        urgency_level: { bsonType: 'number', minimum: 1, maximum: 10 },
        political_feasibility: { bsonType: 'number', minimum: 0, maximum: 100 },
        legislative_history: {
          bsonType: 'object',
          required: ['current_status', 'status_history', 'sponsor_id'],
          properties: {
            current_status: { bsonType: 'string' },
            status_history: { bsonType: 'array' },
            sponsor_id: { bsonType: 'string' },
            co_sponsors: { bsonType: 'array' },
            committee_assignments: { bsonType: 'array' },
            amendments: { bsonType: 'array' }
          }
        },
        timeline: {
          bsonType: 'object',
          required: ['introduction_date'],
          properties: {
            introduction_date: { bsonType: 'date' },
            committee_deadline: { bsonType: 'date' },
            floor_vote_date: { bsonType: 'date' },
            expected_completion: { bsonType: 'date' },
            effective_date: { bsonType: 'date' },
            sunset_date: { bsonType: 'date' },
            review_dates: { bsonType: 'array' },
            milestone_dates: { bsonType: 'array' }
          }
        },
        fiscal_impact: { bsonType: 'object' },
        stakeholder_positions: { bsonType: 'array' },
        impact_assessment: { bsonType: 'object' },
        implementation_details: { bsonType: 'object' },
        public_opinion: { bsonType: 'object' },
        related_policies: { bsonType: 'array' },
        legal_challenges: { bsonType: 'array' },
        international_comparisons: { bsonType: 'array' },
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
export const PoliciesIndexes = [
  // Unique identifier
  { key: { id: 1 }, options: { unique: true, name: 'idx_policies_id' } },

  // Status and timeline queries
  { key: { 'legislative_history.current_status': 1, 'timeline.introduction_date': -1 }, options: { name: 'idx_policies_status_date' } },

  // Classification queries
  { key: { category: 1, urgency_level: -1, complexity_score: 1 }, options: { name: 'idx_policies_classification' } },

  // Cost analysis
  { key: { 'fiscal_impact.estimated_cost': -1 }, options: { name: 'idx_policies_cost' } },

  // Stakeholder queries
  { key: { 'stakeholder_positions.stakeholder_id': 1 }, options: { name: 'idx_policies_stakeholders', sparse: true } },

  // Feasibility and scope
  { key: { scope: 1, political_feasibility: -1 }, options: { name: 'idx_policies_scope_feasibility' } },

  // Active and recent policies
  { key: { is_active: 1, 'timeline.introduction_date': -1 }, options: { name: 'idx_policies_active_recent' } },

  // Sponsor tracking
  { key: { 'legislative_history.sponsor_id': 1, 'timeline.introduction_date': -1 }, options: { name: 'idx_policies_sponsor_date' } },

  // Policy type and jurisdiction
  { key: { policy_type: 1, jurisdiction: 1 }, options: { name: 'idx_policies_type_jurisdiction' } },

  // Public opinion tracking
  { key: { 'public_opinion.overall_support': -1 }, options: { name: 'idx_policies_public_support', sparse: true } },

  // Implementation timeline
  { key: { 'timeline.effective_date': 1 }, options: { name: 'idx_policies_effective_date', sparse: true } },

  // Related policies
  { key: { 'related_policies.policy_id': 1 }, options: { name: 'idx_policies_related', sparse: true } },

  // Time-based queries
  { key: { created_at: 1 }, options: { name: 'idx_policies_created' } },
  { key: { updated_at: -1 }, options: { name: 'idx_policies_updated' } },

  // Controversy and urgency
  { key: { controversy_level: -1, urgency_level: -1 }, options: { name: 'idx_policies_priority' } },

  // Compound index for dashboard queries
  {
    key: {
      is_active: 1,
      'legislative_history.current_status': 1,
      urgency_level: -1,
      'timeline.introduction_date': -1
    },
    options: { name: 'idx_policies_dashboard' }
  },

  // Impact assessment
  {
    key: {
      'impact_assessment.economic_impact.gdp_effect': -1,
      'impact_assessment.social_impact.equity_score': -1
    },
    options: { name: 'idx_policies_impact', sparse: true }
  },

  // Text search index
  {
    key: {
      title: 'text',
      description: 'text',
      summary: 'text'
    },
    options: {
      name: 'idx_policies_text_search',
      weights: { title: 10, summary: 5, description: 1 }
    }
  }
];

export default {
  schema: PoliciesCollectionSchema,
  indexes: PoliciesIndexes,
  validator: PolicySchema
};