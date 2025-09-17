/**
 * AI Political Personality Types
 *
 * Defines the five main political personality archetypes that drive AI decision-making:
 * - Progressive Activist: High social justice focus, reform-oriented
 * - Conservative Traditionalist: Stability and order, gradual change
 * - Pragmatic Centrist: Compromise and efficiency focused
 * - Populist Outsider: Anti-establishment stance, public appeal
 * - Technocratic Expert: Data-driven decisions, expertise-based
 */

import { PoliticalPersonality } from '../types/entities';

export interface AIPersonalityTraits extends PoliticalPersonality {
  /** Unpredictability factor for decision randomness (0-100) */
  unpredictability: number;

  /** Focus on social justice issues (0-100) */
  social_justice_focus: number;

  /** Preference for stability over change (0-100) */
  stability_preference: number;

  /** Reliance on data vs intuition (0-100) */
  data_reliance: number;

  /** Anti-establishment sentiment (0-100) */
  anti_establishment: number;

  /** Focus on public opinion vs expert advice (0-100) */
  public_opinion_weight: number;

  /** Preference for coalition building (0-100) */
  coalition_building: number;

  /** Tendency to take media-friendly positions (0-100) */
  media_savviness: number;
}

export interface PersonalityArchetype {
  name: string;
  description: string;
  traits: AIPersonalityTraits;
  decision_modifiers: {
    /** Multiplier for economic policy weight (0.5-2.0) */
    economic_policy_weight: number;
    /** Multiplier for social policy weight (0.5-2.0) */
    social_policy_weight: number;
    /** Multiplier for foreign policy weight (0.5-2.0) */
    foreign_policy_weight: number;
    /** Base relationship change when agreeing with others (-10 to +10) */
    agreement_relationship_bonus: number;
    /** Base relationship change when disagreeing with others (-10 to +10) */
    disagreement_relationship_penalty: number;
  };
  preferred_actions: string[];
  response_patterns: {
    crisis: string[];
    opportunity: string[];
    scandal: string[];
    election: string[];
  };
}

/**
 * Progressive Activist Archetype
 * Champions social justice, environmental protection, and progressive reform
 */
export const PROGRESSIVE_ACTIVIST: PersonalityArchetype = {
  name: 'Progressive Activist',
  description: 'Champions social justice, environmental protection, and systemic reform. Driven by idealistic vision of societal transformation.',
  traits: {
    risk_tolerance: 75,
    collaboration_preference: 80,
    compromise_willingness: 40,
    populism_tendency: 70,
    reform_preference: 90,
    unpredictability: 30,
    social_justice_focus: 95,
    stability_preference: 20,
    data_reliance: 60,
    anti_establishment: 80,
    public_opinion_weight: 75,
    coalition_building: 85,
    media_savviness: 70
  },
  decision_modifiers: {
    economic_policy_weight: 1.0,
    social_policy_weight: 1.8,
    foreign_policy_weight: 0.7,
    agreement_relationship_bonus: 8,
    disagreement_relationship_penalty: -12
  },
  preferred_actions: [
    'propose_progressive_policy',
    'organize_coalition',
    'public_advocacy',
    'grassroots_mobilization',
    'media_campaign'
  ],
  response_patterns: {
    crisis: ['call_for_reform', 'organize_response', 'blame_system'],
    opportunity: ['push_progressive_agenda', 'build_coalition', 'mobilize_base'],
    scandal: ['demand_accountability', 'call_for_investigation', 'distance_if_corrupt'],
    election: ['grassroots_campaign', 'progressive_messaging', 'youth_outreach']
  }
};

/**
 * Conservative Traditionalist Archetype
 * Values stability, tradition, and gradual change through established institutions
 */
export const CONSERVATIVE_TRADITIONALIST: PersonalityArchetype = {
  name: 'Conservative Traditionalist',
  description: 'Values stability, tradition, and gradual change. Believes in established institutions and cautious governance.',
  traits: {
    risk_tolerance: 25,
    collaboration_preference: 60,
    compromise_willingness: 50,
    populism_tendency: 40,
    reform_preference: 20,
    unpredictability: 15,
    social_justice_focus: 30,
    stability_preference: 90,
    data_reliance: 70,
    anti_establishment: 20,
    public_opinion_weight: 55,
    coalition_building: 65,
    media_savviness: 60
  },
  decision_modifiers: {
    economic_policy_weight: 1.4,
    social_policy_weight: 0.6,
    foreign_policy_weight: 1.2,
    agreement_relationship_bonus: 6,
    disagreement_relationship_penalty: -8
  },
  preferred_actions: [
    'incremental_reform',
    'maintain_status_quo',
    'fiscal_responsibility',
    'institutional_strengthening',
    'traditional_outreach'
  ],
  response_patterns: {
    crisis: ['restore_order', 'use_institutions', 'gradual_response'],
    opportunity: ['careful_advancement', 'institutional_approach', 'measured_response'],
    scandal: ['due_process', 'institutional_investigation', 'measured_judgment'],
    election: ['traditional_campaign', 'established_networks', 'proven_record']
  }
};

/**
 * Pragmatic Centrist Archetype
 * Seeks compromise, evidence-based solutions, and practical governance
 */
export const PRAGMATIC_CENTRIST: PersonalityArchetype = {
  name: 'Pragmatic Centrist',
  description: 'Seeks compromise and practical solutions. Values evidence-based policy and cross-party collaboration.',
  traits: {
    risk_tolerance: 50,
    collaboration_preference: 90,
    compromise_willingness: 85,
    populism_tendency: 45,
    reform_preference: 55,
    unpredictability: 20,
    social_justice_focus: 60,
    stability_preference: 65,
    data_reliance: 85,
    anti_establishment: 30,
    public_opinion_weight: 65,
    coalition_building: 95,
    media_savviness: 75
  },
  decision_modifiers: {
    economic_policy_weight: 1.2,
    social_policy_weight: 1.0,
    foreign_policy_weight: 1.0,
    agreement_relationship_bonus: 10,
    disagreement_relationship_penalty: -5
  },
  preferred_actions: [
    'seek_compromise',
    'bipartisan_coalition',
    'evidence_based_policy',
    'moderate_reform',
    'cross_party_dialogue'
  ],
  response_patterns: {
    crisis: ['bipartisan_solution', 'expert_consultation', 'measured_response'],
    opportunity: ['inclusive_approach', 'broad_coalition', 'practical_advancement'],
    scandal: ['fair_investigation', 'due_process', 'institutional_response'],
    election: ['moderate_campaign', 'broad_appeal', 'practical_solutions']
  }
};

/**
 * Populist Outsider Archetype
 * Anti-establishment stance, appeals directly to "the people" against elite interests
 */
export const POPULIST_OUTSIDER: PersonalityArchetype = {
  name: 'Populist Outsider',
  description: 'Champions the common people against elite interests. Anti-establishment with direct public appeal.',
  traits: {
    risk_tolerance: 80,
    collaboration_preference: 40,
    compromise_willingness: 30,
    populism_tendency: 95,
    reform_preference: 85,
    unpredictability: 60,
    social_justice_focus: 70,
    stability_preference: 30,
    data_reliance: 40,
    anti_establishment: 95,
    public_opinion_weight: 90,
    coalition_building: 50,
    media_savviness: 85
  },
  decision_modifiers: {
    economic_policy_weight: 1.3,
    social_policy_weight: 1.1,
    foreign_policy_weight: 0.8,
    agreement_relationship_bonus: 5,
    disagreement_relationship_penalty: -15
  },
  preferred_actions: [
    'direct_public_appeal',
    'anti_elite_messaging',
    'disruptive_tactics',
    'media_spectacle',
    'grassroots_revolt'
  ],
  response_patterns: {
    crisis: ['blame_establishment', 'direct_action', 'public_mobilization'],
    opportunity: ['populist_messaging', 'anti_elite_narrative', 'public_rallies'],
    scandal: ['expose_corruption', 'anti_establishment_angle', 'public_outrage'],
    election: ['populist_campaign', 'anti_elite_messaging', 'direct_democracy']
  }
};

/**
 * Technocratic Expert Archetype
 * Data-driven decisions, expertise-based governance, systematic approach
 */
export const TECHNOCRATIC_EXPERT: PersonalityArchetype = {
  name: 'Technocratic Expert',
  description: 'Believes in expertise, data-driven decisions, and systematic approaches to governance challenges.',
  traits: {
    risk_tolerance: 40,
    collaboration_preference: 70,
    compromise_willingness: 60,
    populism_tendency: 20,
    reform_preference: 60,
    unpredictability: 10,
    social_justice_focus: 50,
    stability_preference: 75,
    data_reliance: 95,
    anti_establishment: 25,
    public_opinion_weight: 35,
    coalition_building: 70,
    media_savviness: 50
  },
  decision_modifiers: {
    economic_policy_weight: 1.3,
    social_policy_weight: 0.8,
    foreign_policy_weight: 1.1,
    agreement_relationship_bonus: 7,
    disagreement_relationship_penalty: -6
  },
  preferred_actions: [
    'expert_consultation',
    'data_analysis',
    'systematic_reform',
    'evidence_based_policy',
    'technocratic_solution'
  ],
  response_patterns: {
    crisis: ['expert_analysis', 'systematic_response', 'data_driven_solution'],
    opportunity: ['expert_guidance', 'measured_advancement', 'systematic_approach'],
    scandal: ['thorough_investigation', 'fact_based_judgment', 'systematic_review'],
    election: ['expertise_campaign', 'policy_focused', 'competence_messaging']
  }
};

/**
 * Collection of all available personality archetypes
 */
export const PERSONALITY_ARCHETYPES: Record<string, PersonalityArchetype> = {
  progressive: PROGRESSIVE_ACTIVIST,
  conservative: CONSERVATIVE_TRADITIONALIST,
  pragmatic: PRAGMATIC_CENTRIST,
  populist: POPULIST_OUTSIDER,
  technocratic: TECHNOCRATIC_EXPERT
};

/**
 * Generate a random personality with slight variations from archetype
 * @param archetypeName - Base archetype to modify
 * @param variation - Amount of random variation (0-20)
 * @returns Personality traits with random variations
 */
export function generatePersonalityVariation(
  archetypeName: keyof typeof PERSONALITY_ARCHETYPES,
  variation: number = 10
): AIPersonalityTraits {
  const baseTraits = PERSONALITY_ARCHETYPES[archetypeName].traits;
  const variedTraits: AIPersonalityTraits = { ...baseTraits };

  // Apply random variations to each trait
  Object.keys(variedTraits).forEach(key => {
    const traitKey = key as keyof AIPersonalityTraits;
    const baseValue = baseTraits[traitKey];
    const randomVariation = (Math.random() - 0.5) * 2 * variation;

    // Ensure values stay within bounds
    variedTraits[traitKey] = Math.max(0, Math.min(100, baseValue + randomVariation));
  });

  return variedTraits;
}

/**
 * Calculate personality compatibility between two AI politicians
 * @param traits1 - First politician's personality traits
 * @param traits2 - Second politician's personality traits
 * @returns Compatibility score (-100 to 100)
 */
export function calculatePersonalityCompatibility(
  traits1: AIPersonalityTraits,
  traits2: AIPersonalityTraits
): number {
  // Key compatibility factors
  const factors = [
    // Ideological alignment
    Math.abs(traits1.social_justice_focus - traits2.social_justice_focus),
    Math.abs(traits1.anti_establishment - traits2.anti_establishment),
    Math.abs(traits1.reform_preference - traits2.reform_preference),

    // Working style compatibility
    Math.abs(traits1.collaboration_preference - traits2.collaboration_preference),
    Math.abs(traits1.compromise_willingness - traits2.compromise_willingness),
    Math.abs(traits1.data_reliance - traits2.data_reliance)
  ];

  // Calculate average difference (lower is more compatible)
  const averageDifference = factors.reduce((sum, diff) => sum + diff, 0) / factors.length;

  // Convert to compatibility score (-100 to 100)
  return Math.round(100 - (averageDifference * 2));
}