/**
 * Zod Validation Schemas for Political Entities
 *
 * This file provides comprehensive runtime validation schemas using Zod
 * for all political entity interfaces, with data integrity checks and
 * political constraint validation.
 *
 * Features:
 * - Runtime type validation with detailed error messages
 * - Political constraint enforcement (e.g., approval ratings 0-100)
 * - Data integrity checks for relationships and references
 * - Comprehensive error handling with user-friendly feedback
 */

import { z } from 'zod';
import type {
  EntityRole,
  PoliticalStance,
  PolicyCategory,
  BlocType,
  PolicyStatus,
  PoliticalPersonality,
  PoliticianAttributes,
  Politician,
  Bloc,
  Policy,
  BlocMember,
  PolicyPosition,
  PolicySupport,
  PoliticalLandscape,
  PoliticalClimate
} from './entities';

// =====================================================
// Base Validation Schemas
// =====================================================

/**
 * Entity role validation with specific role constraints
 */
export const EntityRoleSchema = z.enum(['player', 'ai_opponent', 'npc'], {
  message: 'Role must be player, ai_opponent, or npc'
});

/**
 * Political stance validation
 */
export const PoliticalStanceSchema = z.enum(['left', 'center', 'right'], {
  message: 'Political stance must be left, center, or right'
});

/**
 * Policy category validation
 */
export const PolicyCategorySchema = z.enum([
  'economic', 'social', 'environmental', 'foreign', 'healthcare', 'education'
], {
  message: 'Invalid policy category'
});

/**
 * Bloc type validation
 */
export const BlocTypeSchema = z.enum(['party', 'coalition', 'faction', 'interest_group'], {
  message: 'Bloc type must be party, coalition, faction, or interest_group'
});

/**
 * Policy status validation
 */
export const PolicyStatusSchema = z.enum([
  'draft', 'proposed', 'committee', 'debate', 'voting',
  'passed', 'failed', 'vetoed', 'implemented', 'suspended'
], {
  message: 'Invalid policy status'
});

// =====================================================
// Percentage and Rating Validators
// =====================================================

/**
 * Validates percentages (0-100) with political context
 */
export const PercentageSchema = z.number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100')
  .finite('Percentage must be a finite number');

/**
 * Validates attribute scores (1-100) for politician capabilities
 */
export const AttributeScoreSchema = z.number()
  .min(1, 'Attribute score must be at least 1')
  .max(100, 'Attribute score must be at most 100')
  .int('Attribute score must be a whole number');

/**
 * Validates trust/relationship scores (-100 to 100)
 */
export const RelationshipScoreSchema = z.number()
  .min(-100, 'Relationship score must be at least -100')
  .max(100, 'Relationship score must be at most 100')
  .finite('Relationship score must be a finite number');

/**
 * Validates UUID strings
 */
export const UUIDSchema = z.string()
  .uuid('Must be a valid UUID')
  .describe('Unique identifier');

/**
 * Validates non-empty strings
 */
export const NonEmptyStringSchema = z.string()
  .min(1, 'String cannot be empty')
  .trim();

// =====================================================
// Complex Object Schemas
// =====================================================

/**
 * Political personality validation schema
 */
export const PoliticalPersonalitySchema = z.object({
  risk_tolerance: PercentageSchema
    .describe('Risk tolerance in political decisions'),
  collaboration_preference: PercentageSchema
    .describe('Preference for collaborative approaches'),
  compromise_willingness: PercentageSchema
    .describe('Tendency to compromise on positions'),
  populism_tendency: PercentageSchema
    .describe('Focus on public opinion vs personal conviction'),
  reform_preference: PercentageSchema
    .describe('Preference for gradual vs radical change')
}).strict();

/**
 * Politician attributes validation schema
 */
export const PoliticianAttributesSchema = z.object({
  charisma: AttributeScoreSchema
    .describe('Public appeal and speaking ability'),
  intelligence: AttributeScoreSchema
    .describe('Policy understanding and strategic thinking'),
  integrity: AttributeScoreSchema
    .describe('Ethical behavior and trustworthiness'),
  ambition: AttributeScoreSchema
    .describe('Power seeking and career advancement drive')
}).strict();

/**
 * Bloc member validation schema
 */
export const BlocMemberSchema = z.object({
  politician_id: UUIDSchema
    .describe('Politician ID'),
  role: z.enum(['leader', 'deputy', 'member', 'advisor'], {
    message: 'Bloc role must be leader, deputy, member, or advisor'
  }),
  influence: PercentageSchema
    .describe('Influence level within the bloc'),
  joined_at: z.date()
    .describe('Date joined the bloc')
}).strict();

/**
 * Policy position validation schema
 */
export const PolicyPositionSchema = z.object({
  policy_id: UUIDSchema
    .describe('Policy ID being referenced'),
  stance: z.enum(['support', 'oppose', 'neutral'], {
    message: 'Stance must be support, oppose, or neutral'
  }),
  strength: PercentageSchema
    .describe('Strength of the position'),
  reasoning: z.string().optional()
    .describe('Public statements or reasoning'),
  declared_at: z.date()
    .describe('Timestamp of position declaration')
}).strict();

/**
 * Policy support validation schema
 */
export const PolicySupportSchema = z.object({
  entity_id: UUIDSchema
    .describe('Entity ID (politician or bloc)'),
  entity_type: z.enum(['politician', 'bloc'], {
    message: 'Entity type must be politician or bloc'
  }),
  strength: PercentageSchema
    .describe('Strength of support/opposition'),
  public: z.boolean()
    .describe('Public or private support'),
  declared_at: z.date()
    .describe('Timestamp of support declaration')
}).strict();

// =====================================================
// Core Entity Validation Schemas
// =====================================================

/**
 * Politician validation schema with comprehensive constraints
 */
export const PoliticianSchema = z.object({
  id: UUIDSchema,
  name: NonEmptyStringSchema
    .max(100, 'Name must be 100 characters or less'),
  role: EntityRoleSchema,
  attributes: PoliticianAttributesSchema,
  approval_rating: PercentageSchema
    .describe('Current public approval rating'),
  political_stance: PoliticalStanceSchema,
  personality: PoliticalPersonalitySchema,
  relationships: z.map(
    UUIDSchema,
    RelationshipScoreSchema
  ).describe('Relationship network with trust scores'),
  position: z.string().optional()
    .describe('Current political position or office'),
  biography: z.string().optional()
    .describe('Biography and background information'),
  policy_positions: z.array(PolicyPositionSchema)
    .describe('Active policy positions and priorities'),
  created_at: z.date(),
  updated_at: z.date()
}).strict()
.refine((data) => data.updated_at >= data.created_at, {
  message: 'Updated timestamp must be after created timestamp',
  path: ['updated_at']
})
.refine((data) => {
  // Ensure personality traits are internally consistent
  const { personality } = data;
  if (personality.risk_tolerance < 20 && personality.reform_preference > 80) {
    return false; // Low risk tolerance with high reform preference is inconsistent
  }
  return true;
}, {
  message: 'Personality traits must be internally consistent',
  path: ['personality']
});

/**
 * Bloc validation schema with member and resource constraints
 */
export const BlocSchema = z.object({
  id: UUIDSchema,
  name: NonEmptyStringSchema
    .max(100, 'Name must be 100 characters or less'),
  type: BlocTypeSchema,
  political_stance: PoliticalStanceSchema,
  members: z.array(BlocMemberSchema)
    .min(1, 'Bloc must have at least one member')
    .max(1000, 'Bloc cannot have more than 1000 members'),
  platform: z.array(PolicyPositionSchema)
    .describe('Core policy platform and positions'),
  support_level: PercentageSchema
    .describe('Current public support level'),
  resources: z.object({
    funding: z.number()
      .min(0, 'Funding must be non-negative')
      .finite('Funding must be a finite number'),
    media_influence: PercentageSchema
      .describe('Media influence and access'),
    grassroots_strength: PercentageSchema
      .describe('Grassroots organizing capacity')
  }).strict(),
  bloc_relationships: z.map(
    UUIDSchema,
    RelationshipScoreSchema
  ).describe('Relationships with other blocs'),
  description: z.string().optional()
    .describe('Description of the bloc\'s mission and values'),
  created_at: z.date(),
  updated_at: z.date()
}).strict()
.refine((data) => data.updated_at >= data.created_at, {
  message: 'Updated timestamp must be after created timestamp',
  path: ['updated_at']
})
.refine((data) => {
  // Ensure only one leader per bloc
  const leaders = data.members.filter(member => member.role === 'leader');
  return leaders.length <= 1;
}, {
  message: 'Bloc can have at most one leader',
  path: ['members']
})
.refine((data) => {
  // Ensure member IDs are unique
  const memberIds = data.members.map(member => member.politician_id);
  return new Set(memberIds).size === memberIds.length;
}, {
  message: 'All bloc members must have unique IDs',
  path: ['members']
});

/**
 * Policy validation schema with economic and voting constraints
 */
export const PolicySchema = z.object({
  id: UUIDSchema,
  title: NonEmptyStringSchema
    .max(200, 'Title must be 200 characters or less'),
  description: NonEmptyStringSchema
    .max(2000, 'Description must be 2000 characters or less'),
  category: PolicyCategorySchema,
  status: PolicyStatusSchema,
  sponsor_id: UUIDSchema
    .describe('Politician who introduced or champions the policy'),
  supporters: z.array(PolicySupportSchema)
    .describe('Politicians and blocs supporting the policy'),
  opponents: z.array(PolicySupportSchema)
    .describe('Politicians and blocs opposing the policy'),
  public_support: PercentageSchema
    .describe('Current public opinion on the policy'),
  economic_impact: z.object({
    cost: z.number()
      .min(0, 'Cost must be non-negative')
      .finite('Cost must be a finite number'),
    benefit: z.number()
      .finite('Benefit must be a finite number'),
    implementation_timeframe: NonEmptyStringSchema
      .max(100, 'Implementation timeframe must be 100 characters or less')
  }).strict(),
  voting_predictions: z.object({
    support_percentage: PercentageSchema
      .describe('Predicted support percentage'),
    confidence: PercentageSchema
      .describe('Confidence in prediction'),
    swing_votes: z.array(UUIDSchema)
      .describe('Key swing votes identified')
  }).strict(),
  introduced_at: z.date(),
  updated_at: z.date()
}).strict()
.refine((data) => data.updated_at >= data.introduced_at, {
  message: 'Updated timestamp must be after introduced timestamp',
  path: ['updated_at']
})
.refine((data) => {
  // Ensure no entity supports and opposes the same policy
  const supporterIds = data.supporters.map(s => s.entity_id);
  const opponentIds = data.opponents.map(o => o.entity_id);
  const intersection = supporterIds.filter(id => opponentIds.includes(id));
  return intersection.length === 0;
}, {
  message: 'Entity cannot both support and oppose the same policy',
  path: ['supporters', 'opponents']
});

/**
 * Political climate validation schema
 */
export const PoliticalClimateSchema = z.object({
  public_trust: PercentageSchema
    .describe('Overall public trust in government'),
  economic_conditions: z.enum(['excellent', 'good', 'fair', 'poor', 'crisis'], {
    message: 'Invalid economic condition'
  }),
  dominant_issues: z.array(PolicyCategorySchema)
    .min(1, 'Must have at least one dominant issue')
    .max(3, 'Cannot have more than 3 dominant issues'),
  stability: PercentageSchema
    .describe('General political stability')
}).strict();

/**
 * Complete political landscape validation schema
 */
export const PoliticalLandscapeSchema = z.object({
  politicians: z.array(PoliticianSchema)
    .min(1, 'Must have at least one politician'),
  blocs: z.array(BlocSchema),
  policies: z.array(PolicySchema),
  climate: PoliticalClimateSchema,
  timestamp: z.date()
}).strict()
.refine((data) => {
  // Validate that all politician relationships reference existing politicians
  const politicianIds = new Set(data.politicians.map(p => p.id));
  for (const politician of data.politicians) {
    for (const [relationshipId] of politician.relationships) {
      if (!politicianIds.has(relationshipId)) {
        return false;
      }
    }
  }
  return true;
}, {
  message: 'All politician relationships must reference existing politicians',
  path: ['politicians']
})
.refine((data) => {
  // Validate that all bloc members reference existing politicians
  const politicianIds = new Set(data.politicians.map(p => p.id));
  for (const bloc of data.blocs) {
    for (const member of bloc.members) {
      if (!politicianIds.has(member.politician_id)) {
        return false;
      }
    }
  }
  return true;
}, {
  message: 'All bloc members must reference existing politicians',
  path: ['blocs']
})
.refine((data) => {
  // Validate that policy sponsors and supporters reference existing entities
  const politicianIds = new Set(data.politicians.map(p => p.id));
  const blocIds = new Set(data.blocs.map(b => b.id));

  for (const policy of data.policies) {
    // Check sponsor
    if (!politicianIds.has(policy.sponsor_id)) {
      return false;
    }

    // Check supporters and opponents
    const allSupport = [...policy.supporters, ...policy.opponents];
    for (const support of allSupport) {
      const entityExists = support.entity_type === 'politician'
        ? politicianIds.has(support.entity_id)
        : blocIds.has(support.entity_id);
      if (!entityExists) {
        return false;
      }
    }
  }
  return true;
}, {
  message: 'All policy references must point to existing entities',
  path: ['policies']
});

// =====================================================
// Validation Helper Functions
// =====================================================

/**
 * Validates a politician with detailed error reporting
 */
export function validatePolitician(data: unknown): {
  success: boolean;
  data?: Politician;
  errors?: string[];
} {
  try {
    const result = PoliticianSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validates a bloc with detailed error reporting
 */
export function validateBloc(data: unknown): {
  success: boolean;
  data?: Bloc;
  errors?: string[];
} {
  try {
    const result = BlocSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validates a policy with detailed error reporting
 */
export function validatePolicy(data: unknown): {
  success: boolean;
  data?: Policy;
  errors?: string[];
} {
  try {
    const result = PolicySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validates the complete political landscape with cross-entity validation
 */
export function validatePoliticalLandscape(data: unknown): {
  success: boolean;
  data?: PoliticalLandscape;
  errors?: string[];
} {
  try {
    const result = PoliticalLandscapeSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Custom validation error class for political constraints
 */
export class PoliticalValidationError extends Error {
  constructor(
    message: string,
    public entityType: string,
    public entityId?: string,
    public validationErrors?: string[]
  ) {
    super(message);
    this.name = 'PoliticalValidationError';
  }
}

// Type exports for runtime validation results
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};