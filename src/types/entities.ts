/**
 * Core Political Entity Interfaces
 *
 * This file defines the TypeScript interfaces for the core political entities
 * in the PoliticAIl simulation game, including Politicians, Blocs, and Policies.
 *
 * Design Principles:
 * - Type safety with comprehensive interface contracts
 * - Clear relationship structures between entities
 * - Essential properties for prototype validation
 * - Extensible design for future enhancements
 */

// =====================================================
// Core Types and Enums
// =====================================================

export type EntityRole = 'player' | 'ai_opponent' | 'npc';
export type PoliticalStance = 'left' | 'center' | 'right';
export type PolicyCategory = 'economic' | 'social' | 'environmental' | 'foreign' | 'healthcare' | 'education';
export type BlocType = 'party' | 'coalition' | 'faction' | 'interest_group';

// =====================================================
// Political Personality and Traits
// =====================================================

/**
 * Political personality traits that influence behavior and decision-making
 */
export interface PoliticalPersonality {
  /** Risk tolerance in political decisions (0-100) */
  risk_tolerance: number;

  /** Preference for collaborative vs competitive approaches (0-100) */
  collaboration_preference: number;

  /** Tendency to compromise on positions (0-100) */
  compromise_willingness: number;

  /** Focus on public opinion vs personal conviction (0-100) */
  populism_tendency: number;

  /** Preference for gradual vs radical change (0-100) */
  reform_preference: number;
}

/**
 * Core attributes that define a politician's capabilities
 */
export interface PoliticianAttributes {
  /** Public appeal and speaking ability (1-100) */
  charisma: number;

  /** Policy understanding and strategic thinking (1-100) */
  intelligence: number;

  /** Ethical behavior and trustworthiness (1-100) */
  integrity: number;

  /** Power seeking and career advancement drive (1-100) */
  ambition: number;
}

// =====================================================
// Core Entity Interfaces
// =====================================================

/**
 * Core politician entity representing players, AI opponents, and NPCs
 *
 * Expected behaviors:
 * - Maintains approval ratings based on actions and public perception
 * - Builds and manages relationships with other politicians
 * - Makes policy decisions influenced by personality and attributes
 * - Responds to political events and public opinion changes
 */
export interface Politician {
  /** Unique identifier for the politician */
  id: string;

  /** Display name of the politician */
  name: string;

  /** Role type determining AI behavior and player interaction */
  role: EntityRole;

  /** Core capability attributes */
  attributes: PoliticianAttributes;

  /** Current public approval rating (0-100) */
  approval_rating: number;

  /** Overall political ideology position */
  political_stance: PoliticalStance;

  /** Behavioral and decision-making traits */
  personality: PoliticalPersonality;

  /** Relationship network with trust scores (-100 to 100) */
  relationships: Map<string, number>;

  /** Current political position or office */
  position?: string | undefined;

  /** Biography and background information */
  biography?: string | undefined;

  /** Active policy positions and priorities */
  policy_positions: PolicyPosition[];

  /** Timestamp of entity creation */
  created_at: Date;

  /** Timestamp of last update */
  updated_at: Date;
}

/**
 * Political bloc representing parties, coalitions, and interest groups
 *
 * Expected behaviors:
 * - Manages member politicians and their roles
 * - Coordinates policy positions and strategies
 * - Influences member decisions and voting patterns
 * - Responds to political events as a unified entity
 */
export interface Bloc {
  /** Unique identifier for the bloc */
  id: string;

  /** Display name of the bloc */
  name: string;

  /** Type of political organization */
  type: BlocType;

  /** Overall political ideology position */
  political_stance: PoliticalStance;

  /** Member politicians and their roles within the bloc */
  members: BlocMember[];

  /** Core policy platform and positions */
  platform: PolicyPosition[];

  /** Current public support level (0-100) */
  support_level: number;

  /** Available resources for political activities */
  resources: {
    /** Financial resources for campaigns and activities */
    funding: number;

    /** Media influence and access */
    media_influence: number;

    /** Grassroots organizing capacity */
    grassroots_strength: number;
  };

  /** Relationships with other blocs (-100 to 100) */
  bloc_relationships: Map<string, number>;

  /** Description of the bloc's mission and values */
  description?: string | undefined;

  /** Timestamp of entity creation */
  created_at: Date;

  /** Timestamp of last update */
  updated_at: Date;
}

/**
 * Policy entity representing legislative proposals and political issues
 *
 * Expected behaviors:
 * - Tracks support and opposition from politicians and blocs
 * - Evolves through political process stages
 * - Influences politician relationships and approval ratings
 * - Responds to public opinion and lobbying efforts
 */
export interface Policy {
  /** Unique identifier for the policy */
  id: string;

  /** Policy title or name */
  title: string;

  /** Detailed description of the policy */
  description: string;

  /** Policy category for organization and filtering */
  category: PolicyCategory;

  /** Current status in the political process */
  status: PolicyStatus;

  /** Politician who introduced or champions the policy */
  sponsor_id: string;

  /** Politicians and blocs supporting the policy */
  supporters: PolicySupport[];

  /** Politicians and blocs opposing the policy */
  opponents: PolicySupport[];

  /** Current public opinion on the policy (0-100) */
  public_support: number;

  /** Economic impact assessment */
  economic_impact: {
    /** Estimated cost in millions */
    cost: number;

    /** Expected economic benefit */
    benefit: number;

    /** Time frame for implementation */
    implementation_timeframe: string;
  };

  /** Expected voting behavior and outcomes */
  voting_predictions: {
    /** Predicted support percentage */
    support_percentage: number;

    /** Confidence in prediction (0-100) */
    confidence: number;

    /** Key swing votes identified */
    swing_votes: string[];
  };

  /** Timestamp of policy introduction */
  introduced_at: Date;

  /** Timestamp of last update */
  updated_at: Date;
}

// =====================================================
// Supporting Types and Interfaces
// =====================================================

/**
 * Bloc membership information including role and influence
 */
export interface BlocMember {
  /** Politician ID */
  politician_id: string;

  /** Role within the bloc */
  role: 'leader' | 'deputy' | 'member' | 'advisor';

  /** Influence level within the bloc (0-100) */
  influence: number;

  /** Date joined the bloc */
  joined_at: Date;
}

/**
 * Policy position held by politicians or blocs
 */
export interface PolicyPosition {
  /** Policy ID being referenced */
  policy_id: string;

  /** Position taken ('support', 'oppose', 'neutral') */
  stance: 'support' | 'oppose' | 'neutral';

  /** Strength of the position (0-100) */
  strength: number;

  /** Public statements or reasoning */
  reasoning?: string | undefined;

  /** Timestamp of position declaration */
  declared_at: Date;
}

/**
 * Support or opposition record for policies
 */
export interface PolicySupport {
  /** Entity ID (politician or bloc) */
  entity_id: string;

  /** Type of entity */
  entity_type: 'politician' | 'bloc';

  /** Strength of support/opposition (0-100) */
  strength: number;

  /** Public or private support */
  public: boolean;

  /** Timestamp of support declaration */
  declared_at: Date;
}

/**
 * Policy status enumeration for tracking progress
 */
export type PolicyStatus =
  | 'draft'           // Being developed
  | 'proposed'        // Formally introduced
  | 'committee'       // Under committee review
  | 'debate'          // In active debate
  | 'voting'          // Currently being voted on
  | 'passed'          // Successfully passed
  | 'failed'          // Failed to pass
  | 'vetoed'          // Vetoed by executive
  | 'implemented'     // Enacted into law
  | 'suspended';      // Temporarily suspended

// =====================================================
// Entity Collections and Aggregates
// =====================================================

/**
 * Complete political landscape containing all entities and their relationships
 */
export interface PoliticalLandscape {
  /** All politicians in the simulation */
  politicians: Politician[];

  /** All political blocs and organizations */
  blocs: Bloc[];

  /** All policies under consideration */
  policies: Policy[];

  /** Current political climate and events */
  climate: PoliticalClimate;

  /** Simulation timestamp */
  timestamp: Date;
}

/**
 * Current political climate affecting all entities
 */
export interface PoliticalClimate {
  /** Overall public trust in government (0-100) */
  public_trust: number;

  /** Economic conditions affecting policy preferences */
  economic_conditions: 'excellent' | 'good' | 'fair' | 'poor' | 'crisis';

  /** Current major issues dominating political discourse */
  dominant_issues: PolicyCategory[];

  /** General political stability (0-100) */
  stability: number;
}