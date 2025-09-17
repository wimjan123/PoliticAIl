/**
 * Political Entity Types and Validation - Main Export
 *
 * This file provides a centralized export for all political entity
 * interfaces, types, and validation functions implemented for the
 * PoliticAIl simulation game.
 */

// Core entity interfaces and types
export type {
  // Core entity interfaces
  Politician,
  Bloc,
  Policy,
  PoliticalLandscape,
  PoliticalClimate,

  // Supporting interfaces
  PoliticalPersonality,
  PoliticianAttributes,
  BlocMember,
  PolicyPosition,
  PolicySupport,

  // Enum types
  EntityRole,
  PoliticalStance,
  PolicyCategory,
  BlocType,
  PolicyStatus
} from './entities';

// Validation schemas and functions
export {
  // Core validation schemas
  PoliticianSchema,
  BlocSchema,
  PolicySchema,
  PoliticalLandscapeSchema,

  // Supporting schemas
  PoliticalPersonalitySchema,
  PoliticianAttributesSchema,
  BlocMemberSchema,
  PolicyPositionSchema,
  PolicySupportSchema,
  PoliticalClimateSchema,

  // Enum schemas
  EntityRoleSchema,
  PoliticalStanceSchema,
  PolicyCategorySchema,
  BlocTypeSchema,
  PolicyStatusSchema,

  // Utility schemas
  PercentageSchema,
  AttributeScoreSchema,
  RelationshipScoreSchema,
  UUIDSchema,
  NonEmptyStringSchema,

  // Validation functions
  validatePolitician,
  validateBloc,
  validatePolicy,
  validatePoliticalLandscape,

  // Error handling
  PoliticalValidationError
} from './validation';

// Desktop shell types
export type {
  PoliticalApp,
  WindowState,
  NotificationItem,
  NotificationAction,
  KeyboardShortcut,
  DesktopTheme,
  ContextMenuItem,
  DesktopState
} from './desktop';

// AI system types
export type {
  AIPersonalityTraits,
  PersonalityArchetype,
  DecisionContext,
  PoliticalAction,
  SituationAssessment,
  WeightedAction,
  EventResponse,
  EventResponseTemplate,
  ResponsePattern,
  PoliticalRelationship,
  RelationshipEvent,
  ConsistencyTestResult,
  AIBehaviorAssessment,
  AIPolitician,
  SimulationTickResult
} from '../ai';

// AI system classes and utilities
export {
  AIOrchestrater,
  AIDecisionEngine,
  RelationshipManager,
  EventResponseSystem,
  AIConsistencyValidator,
  PERSONALITY_ARCHETYPES,
  generatePersonalityVariation,
  calculatePersonalityCompatibility,
  createAISystem,
  ARCHETYPE_NAMES,
  DEFAULT_AI_CONFIG,
  AIUtils
} from '../ai';

// Re-export everything for convenience
export * from './entities';
export * from './validation';
export * from './desktop';