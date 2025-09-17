/**
 * Political Simulation Types
 * Defines the core types for the political simulation state management
 */

export interface Player {
  id: string;
  name: string;
  party: string;
  position: PoliticalPosition;
  approval: number;
  resources: Resources;
  policies: Policy[];
  relationships: Relationship[];
}

export interface PoliticalPosition {
  economic: number; // -100 to 100 (left to right)
  social: number; // -100 to 100 (conservative to progressive)
  foreign: number; // -100 to 100 (isolationist to interventionist)
}

export interface Resources {
  money: number;
  influence: number;
  media: number;
  grassroots: number;
}

export interface Policy {
  id: string;
  name: string;
  category: PolicyCategory;
  impact: PolicyImpact;
  status: PolicyStatus;
  supportLevel: number;
  implementedAt?: number;
}

export type PolicyCategory =
  | 'economic'
  | 'social'
  | 'foreign'
  | 'environmental'
  | 'healthcare'
  | 'education'
  | 'defense';

export interface PolicyImpact {
  approval: number;
  economy: number;
  social: number;
  environment: number;
}

export type PolicyStatus = 'proposed' | 'debated' | 'passed' | 'failed' | 'implemented';

export interface Relationship {
  targetId: string;
  type: RelationshipType;
  strength: number; // -100 to 100
  lastInteraction?: number;
}

export type RelationshipType = 'ally' | 'rival' | 'neutral' | 'coalition' | 'opposition';

export interface SimulationEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: number;
  duration?: number;
  impact: EventImpact;
  choices?: EventChoice[];
  resolved: boolean;
}

export type EventType =
  | 'crisis'
  | 'opportunity'
  | 'election'
  | 'scandal'
  | 'policy_result'
  | 'international'
  | 'economic'
  | 'social';

export interface EventImpact {
  approval?: number;
  resources?: Partial<Resources>;
  relationships?: { targetId: string; change: number }[];
  policies?: { policyId: string; statusChange: PolicyStatus }[];
}

export interface EventChoice {
  id: string;
  text: string;
  impact: EventImpact;
  requirements?: {
    resources?: Partial<Resources>;
    approval?: number;
    policies?: string[];
  };
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  gameSpeed: number; // Multiplier for event frequency
  aiAggressiveness: number; // 1-10 scale
  randomEvents: boolean;
  realTimeEvents: boolean;
}

export interface SimulationState {
  gameId: string;
  player: Player;
  opponents: Player[];
  currentEvents: SimulationEvent[];
  gameSettings: GameSettings;
  gameTime: {
    current: number; // Current game timestamp
    startTime: number; // When the game started
    speed: number; // Time multiplier
    paused: boolean;
  };
  gameStats: {
    totalPoliciesPassed: number;
    totalEventsHandled: number;
    highestApproval: number;
    currentStreak: number;
    electionsWon: number;
  };
  lastSaved: number;
}

// Action types for optimistic updates
export interface SimulationAction {
  type: SimulationActionType;
  payload: any;
  optimistic?: boolean;
  timestamp: number;
}

export type SimulationActionType =
  | 'UPDATE_PLAYER_RESOURCES'
  | 'UPDATE_APPROVAL'
  | 'PROPOSE_POLICY'
  | 'VOTE_ON_POLICY'
  | 'BUILD_RELATIONSHIP'
  | 'HANDLE_EVENT'
  | 'MAKE_EVENT_CHOICE'
  | 'UPDATE_GAME_SETTINGS'
  | 'PAUSE_GAME'
  | 'RESUME_GAME'
  | 'SAVE_GAME'
  | 'LOAD_GAME'
  | 'RESET_GAME';

// Server state types for React Query
export interface ServerSyncState {
  lastSyncTime: number;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  conflicts: StateConflict[];
  pendingActions: SimulationAction[];
}

export interface StateConflict {
  field: string;
  localValue: any;
  serverValue: any;
  timestamp: number;
}

// Query keys for React Query
export const QUERY_KEYS = {
  SIMULATION: ['simulation'],
  PLAYER: ['simulation', 'player'],
  OPPONENTS: ['simulation', 'opponents'],
  EVENTS: ['simulation', 'events'],
  POLICIES: ['simulation', 'policies'],
  LEADERBOARD: ['leaderboard'],
  GAME_STATS: ['game_stats'],
} as const;