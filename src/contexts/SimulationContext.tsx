/**
 * Simulation Context
 * Global state management for political simulation using React Context
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SimulationState,
  SimulationAction,
  Player,
  Policy,
  QUERY_KEYS,
} from '../types/simulation';
import {
  loadSimulationState,
  saveSimulationState,
  debouncedSaveSimulationState,
  isStorageAvailable,
} from '../utils/stateStorage';
import { optimisticUpdateHelpers } from '../services/queryClient';

/**
 * Default initial state
 */
const createInitialState = (): SimulationState => ({
  gameId: `game_${Date.now()}`,
  player: {
    id: 'player_1',
    name: 'Player',
    party: 'Independent',
    position: { economic: 0, social: 0, foreign: 0 },
    approval: 50,
    resources: { money: 1000, influence: 50, media: 25, grassroots: 30 },
    policies: [],
    relationships: [],
  },
  opponents: [],
  currentEvents: [],
  gameSettings: {
    difficulty: 'medium',
    gameSpeed: 1,
    aiAggressiveness: 5,
    randomEvents: true,
    realTimeEvents: false,
  },
  gameTime: {
    current: 0,
    startTime: Date.now(),
    speed: 1,
    paused: false,
  },
  gameStats: {
    totalPoliciesPassed: 0,
    totalEventsHandled: 0,
    highestApproval: 50,
    currentStreak: 0,
    electionsWon: 0,
  },
  lastSaved: Date.now(),
});

/**
 * Simulation reducer for local state management
 */
const simulationReducer = (state: SimulationState, action: SimulationAction): SimulationState => {
  switch (action.type) {
    case 'UPDATE_PLAYER_RESOURCES': {
      const { resources } = action.payload;
      return {
        ...state,
        player: {
          ...state.player,
          resources: {
            ...state.player.resources,
            ...resources,
          },
        },
      };
    }

    case 'UPDATE_APPROVAL': {
      const { change } = action.payload;
      const newApproval = Math.max(0, Math.min(100, state.player.approval + change));
      return {
        ...state,
        player: {
          ...state.player,
          approval: newApproval,
        },
        gameStats: {
          ...state.gameStats,
          highestApproval: Math.max(state.gameStats.highestApproval, newApproval),
        },
      };
    }

    case 'PROPOSE_POLICY': {
      const { policy } = action.payload;
      return {
        ...state,
        player: {
          ...state.player,
          policies: [...state.player.policies, { ...policy, status: 'proposed' }],
        },
      };
    }

    case 'VOTE_ON_POLICY': {
      const { policyId, status } = action.payload;
      return {
        ...state,
        player: {
          ...state.player,
          policies: state.player.policies.map(policy =>
            policy.id === policyId ? { ...policy, status } : policy
          ),
        },
        gameStats: {
          ...state.gameStats,
          totalPoliciesPassed:
            status === 'passed'
              ? state.gameStats.totalPoliciesPassed + 1
              : state.gameStats.totalPoliciesPassed,
        },
      };
    }

    case 'BUILD_RELATIONSHIP': {
      const { targetId, type, strengthChange } = action.payload;
      const existingRelationship = state.player.relationships.find(rel => rel.targetId === targetId);

      if (existingRelationship) {
        return {
          ...state,
          player: {
            ...state.player,
            relationships: state.player.relationships.map(rel =>
              rel.targetId === targetId
                ? {
                    ...rel,
                    type,
                    strength: Math.max(-100, Math.min(100, rel.strength + strengthChange)),
                    lastInteraction: Date.now(),
                  }
                : rel
            ),
          },
        };
      } else {
        return {
          ...state,
          player: {
            ...state.player,
            relationships: [
              ...state.player.relationships,
              {
                targetId,
                type,
                strength: strengthChange,
                lastInteraction: Date.now(),
              },
            ],
          },
        };
      }
    }

    case 'HANDLE_EVENT': {
      const { eventId } = action.payload;
      return {
        ...state,
        currentEvents: state.currentEvents.map(event =>
          event.id === eventId ? { ...event, resolved: true } : event
        ),
        gameStats: {
          ...state.gameStats,
          totalEventsHandled: state.gameStats.totalEventsHandled + 1,
        },
      };
    }

    case 'MAKE_EVENT_CHOICE': {
      const { eventId, impact } = action.payload;

      let newState = { ...state };

      // Apply choice impact
      if (impact.approval) {
        newState.player.approval = Math.max(0, Math.min(100, newState.player.approval + impact.approval));
      }

      if (impact.resources) {
        newState.player.resources = {
          ...newState.player.resources,
          ...Object.fromEntries(
            Object.entries(impact.resources).map(([key, value]) => [
              key,
              Math.max(0, (newState.player.resources as any)[key] + (value || 0)),
            ])
          ),
        };
      }

      // Mark event as resolved
      newState.currentEvents = newState.currentEvents.map(event =>
        event.id === eventId ? { ...event, resolved: true } : event
      );

      return newState;
    }

    case 'UPDATE_GAME_SETTINGS': {
      const { settings } = action.payload;
      return {
        ...state,
        gameSettings: {
          ...state.gameSettings,
          ...settings,
        },
      };
    }

    case 'PAUSE_GAME': {
      return {
        ...state,
        gameTime: {
          ...state.gameTime,
          paused: true,
        },
      };
    }

    case 'RESUME_GAME': {
      return {
        ...state,
        gameTime: {
          ...state.gameTime,
          paused: false,
        },
      };
    }

    case 'LOAD_GAME': {
      const { gameState } = action.payload;
      return gameState;
    }

    case 'RESET_GAME': {
      return createInitialState();
    }

    default:
      return state;
  }
};

/**
 * Context type definition
 */
export interface SimulationContextType {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
  actions: {
    updatePlayerResources: (resources: Partial<Player['resources']>) => void;
    updateApproval: (change: number) => void;
    proposePolicy: (policy: Omit<Policy, 'status'>) => void;
    voteOnPolicy: (policyId: string, status: Policy['status']) => void;
    buildRelationship: (targetId: string, type: any, strengthChange: number) => void;
    handleEvent: (eventId: string) => void;
    makeEventChoice: (eventId: string, choiceId: string, impact: any) => void;
    updateGameSettings: (settings: Partial<SimulationState['gameSettings']>) => void;
    pauseGame: () => void;
    resumeGame: () => void;
    saveGame: () => void;
    loadGame: (gameState: SimulationState) => void;
    resetGame: () => void;
  };
  isLoading: boolean;
  error: Error | null;
}

/**
 * Create the context
 */
const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

/**
 * Context provider component
 */
interface SimulationProviderProps {
  children: ReactNode;
  gameId?: string;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({ children, gameId }) => {
  const queryClient = useQueryClient();

  // Initialize state with loaded data or default
  const [state, dispatch] = useReducer(simulationReducer, createInitialState(), (initial) => {
    if (isStorageAvailable()) {
      const loadedState = loadSimulationState();
      return loadedState || initial;
    }
    return initial;
  });

  // Server state query (if gameId provided)
  const {
    data: serverState,
    isLoading,
    error,
  } = useQuery({
    queryKey: [...QUERY_KEYS.SIMULATION, gameId],
    queryFn: () =>
      fetch(`/api/simulation/${gameId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch simulation');
        return res.json();
      }),
    enabled: !!gameId,
  });

  // Sync mutation for server updates
  const syncMutation = useMutation({
    mutationFn: (newState: SimulationState) =>
      fetch(`/api/simulation/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries([...QUERY_KEYS.SIMULATION, gameId]);
    },
  });

  // Auto-save effect
  useEffect(() => {
    if (isStorageAvailable()) {
      debouncedSaveSimulationState(state);
    }
  }, [state]);

  // Sync with server if enabled
  useEffect(() => {
    if (gameId && state.lastSaved < Date.now() - 30000) { // Sync every 30 seconds
      syncMutation.mutate(state);
    }
  }, [state, gameId, syncMutation]);

  // Sync server state with local state when available
  useEffect(() => {
    if (serverState && !isLoading) {
      const action: SimulationAction = {
        type: 'LOAD_GAME',
        payload: { gameState: serverState },
        optimistic: false,
        timestamp: Date.now(),
      };
      dispatch(action);
    }
  }, [serverState, isLoading]);

  // Action creators with optimistic updates
  const actions = {
    updatePlayerResources: (resources: Partial<Player['resources']>) => {
      const action: SimulationAction = {
        type: 'UPDATE_PLAYER_RESOURCES',
        payload: { resources },
        optimistic: true,
        timestamp: Date.now(),
      };

      // Optimistic update
      dispatch(action);

      // Server sync if needed
      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    updateApproval: (change: number) => {
      const action: SimulationAction = {
        type: 'UPDATE_APPROVAL',
        payload: { change },
        optimistic: true,
        timestamp: Date.now(),
      };

      dispatch(action);

      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    proposePolicy: (policy: Omit<Policy, 'status'>) => {
      const action: SimulationAction = {
        type: 'PROPOSE_POLICY',
        payload: { policy },
        optimistic: true,
        timestamp: Date.now(),
      };

      dispatch(action);

      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    voteOnPolicy: (policyId: string, status: Policy['status']) => {
      const action: SimulationAction = {
        type: 'VOTE_ON_POLICY',
        payload: { policyId, status },
        optimistic: true,
        timestamp: Date.now(),
      };

      dispatch(action);

      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    buildRelationship: (targetId: string, type: any, strengthChange: number) => {
      const action: SimulationAction = {
        type: 'BUILD_RELATIONSHIP',
        payload: { targetId, type, strengthChange },
        optimistic: true,
        timestamp: Date.now(),
      };

      dispatch(action);

      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    handleEvent: (eventId: string) => {
      const action: SimulationAction = {
        type: 'HANDLE_EVENT',
        payload: { eventId },
        optimistic: true,
        timestamp: Date.now(),
      };

      dispatch(action);

      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    makeEventChoice: (eventId: string, _choiceId: string, impact: any) => {
      const action: SimulationAction = {
        type: 'MAKE_EVENT_CHOICE',
        payload: { eventId, choiceId: _choiceId, impact },
        optimistic: true,
        timestamp: Date.now(),
      };

      dispatch(action);

      if (gameId) {
        optimisticUpdateHelpers.updateSimulationOptimistically(action, (oldState) =>
          simulationReducer(oldState, action)
        );
      }
    },

    updateGameSettings: (settings: Partial<SimulationState['gameSettings']>) => {
      const action: SimulationAction = {
        type: 'UPDATE_GAME_SETTINGS',
        payload: { settings },
        optimistic: false,
        timestamp: Date.now(),
      };

      dispatch(action);
    },

    pauseGame: () => {
      const action: SimulationAction = {
        type: 'PAUSE_GAME',
        payload: {},
        optimistic: false,
        timestamp: Date.now(),
      };

      dispatch(action);
    },

    resumeGame: () => {
      const action: SimulationAction = {
        type: 'RESUME_GAME',
        payload: {},
        optimistic: false,
        timestamp: Date.now(),
      };

      dispatch(action);
    },

    saveGame: () => {
      if (isStorageAvailable()) {
        saveSimulationState(state);
      }
      if (gameId) {
        syncMutation.mutate(state);
      }
    },

    loadGame: (gameState: SimulationState) => {
      const action: SimulationAction = {
        type: 'LOAD_GAME',
        payload: { gameState },
        optimistic: false,
        timestamp: Date.now(),
      };

      dispatch(action);
    },

    resetGame: () => {
      const action: SimulationAction = {
        type: 'RESET_GAME',
        payload: {},
        optimistic: false,
        timestamp: Date.now(),
      };

      dispatch(action);
    },
  };

  const contextValue: SimulationContextType = {
    state,
    dispatch,
    actions,
    isLoading: isLoading || syncMutation.isLoading,
    error: error as Error | null || syncMutation.error as Error | null,
  };

  return <SimulationContext.Provider value={contextValue}>{children}</SimulationContext.Provider>;
};

/**
 * Hook to use the simulation context
 */
export const useSimulationContext = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
};

export default SimulationContext;