/**
 * useSimulation Hook
 * Custom hook that provides convenient access to simulation state and actions
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSimulationContext } from '../contexts/SimulationContext';
import {
  SimulationState,
  Policy,
  EventChoice,
  QUERY_KEYS,
} from '../types/simulation';
import { cacheHelpers } from '../services/queryClient';

/**
 * Main simulation hook
 */
export const useSimulation = () => {
  const context = useSimulationContext();

  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }

  return context;
};

/**
 * Hook for player-specific data and actions
 */
const usePlayer = () => {
  const { state, actions } = useSimulation();

  const player = state.player;

  const playerActions = useMemo(
    () => ({
      updateResources: actions.updatePlayerResources,
      updateApproval: actions.updateApproval,
      proposePolicy: actions.proposePolicy,
      buildRelationship: actions.buildRelationship,
    }),
    [actions]
  );

  const playerStats = useMemo(
    () => ({
      totalPolicies: player.policies.length,
      activePolicies: player.policies.filter(p => p.status === 'implemented').length,
      averageApproval: player.approval,
      strongestRelationship: player.relationships.reduce(
        (strongest, rel) => (rel.strength > strongest.strength ? rel : strongest),
        { strength: -100, targetId: '', type: 'neutral' as const }
      ),
      totalResources: Object.values(player.resources).reduce((sum, val) => sum + val, 0),
    }),
    [player]
  );

  return {
    player,
    actions: playerActions,
    stats: playerStats,
  };
};

/**
 * Hook for game events management
 */
const useEvents = () => {
  const { state, actions } = useSimulation();

  const currentEvents = state.currentEvents;
  const activeEvents = currentEvents.filter(event => !event.resolved);
  const resolvedEvents = currentEvents.filter(event => event.resolved);

  const eventActions = useMemo(
    () => ({
      handleEvent: actions.handleEvent,
      makeChoice: actions.makeEventChoice,
    }),
    [actions]
  );

  const getEventById = useCallback(
    (eventId: string) => currentEvents.find(event => event.id === eventId),
    [currentEvents]
  );

  const getEventChoices = useCallback(
    (eventId: string): EventChoice[] => {
      const event = getEventById(eventId);
      return event?.choices || [];
    },
    [getEventById]
  );

  const canMakeChoice = useCallback(
    (eventId: string, choiceId: string): boolean => {
      const event = getEventById(eventId);
      if (!event || event.resolved) return false;

      const choice = event.choices?.find(c => c.id === choiceId);
      if (!choice || !choice.requirements) return true;

      const { player } = state;
      const requirements = choice.requirements;

      // Check resource requirements
      if (requirements.resources) {
        for (const [resource, required] of Object.entries(requirements.resources)) {
          if ((player.resources as any)[resource] < (required || 0)) {
            return false;
          }
        }
      }

      // Check approval requirement
      if (requirements.approval && player.approval < requirements.approval) {
        return false;
      }

      // Check policy requirements
      if (requirements.policies) {
        const playerPolicyIds = player.policies.map(p => p.id);
        for (const policyId of requirements.policies) {
          if (!playerPolicyIds.includes(policyId)) {
            return false;
          }
        }
      }

      return true;
    },
    [getEventById, state]
  );

  return {
    allEvents: currentEvents,
    activeEvents,
    resolvedEvents,
    actions: eventActions,
    getEventById,
    getEventChoices,
    canMakeChoice,
    hasActiveEvents: activeEvents.length > 0,
    eventCount: {
      total: currentEvents.length,
      active: activeEvents.length,
      resolved: resolvedEvents.length,
    },
  };
};

/**
 * Hook for policy management
 */
const usePolicies = () => {
  const { state, actions } = useSimulation();

  const playerPolicies = state.player.policies;

  const policyStats = useMemo(() => {
    const stats = {
      total: playerPolicies.length,
      proposed: 0,
      debated: 0,
      passed: 0,
      failed: 0,
      implemented: 0,
    };

    playerPolicies.forEach(policy => {
      stats[policy.status]++;
    });

    return stats;
  }, [playerPolicies]);

  const policyActions = useMemo(
    () => ({
      propose: actions.proposePolicy,
      vote: actions.voteOnPolicy,
    }),
    [actions]
  );

  const getPoliciesByCategory = useCallback(
    (category: Policy['category']) => playerPolicies.filter(p => p.category === category),
    [playerPolicies]
  );

  const getPoliciesByStatus = useCallback(
    (status: Policy['status']) => playerPolicies.filter(p => p.status === status),
    [playerPolicies]
  );

  const canProposePolicy = useCallback(
    () => {
      // Check if player has enough resources
      const resourceCost = 100; // Base cost for proposing a policy
      return state.player.resources.influence >= resourceCost;
    },
    [state.player.resources.influence]
  );

  return {
    policies: playerPolicies,
    stats: policyStats,
    actions: policyActions,
    getPoliciesByCategory,
    getPoliciesByStatus,
    canProposePolicy,
  };
};

/**
 * Hook for game state management
 */
const useGameState = () => {
  const { state, actions } = useSimulation();

  const gameActions = useMemo(
    () => ({
      pause: actions.pauseGame,
      resume: actions.resumeGame,
      save: actions.saveGame,
      load: actions.loadGame,
      reset: actions.resetGame,
      updateSettings: actions.updateGameSettings,
    }),
    [actions]
  );

  const gameStatus = useMemo(() => {
    const { gameTime, gameStats } = state;
    const elapsedTime = Date.now() - gameTime.startTime;
    const gameProgress = Math.min(elapsedTime / (24 * 60 * 60 * 1000), 1); // Progress as percentage of 1 day

    return {
      isRunning: !gameTime.paused,
      elapsedTime,
      gameProgress,
      currentDay: Math.floor(elapsedTime / (24 * 60 * 60 * 1000)) + 1,
      performance: {
        approval: state.player.approval,
        policiesPassed: gameStats.totalPoliciesPassed,
        eventsHandled: gameStats.totalEventsHandled,
        electionsWon: gameStats.electionsWon,
      },
    };
  }, [state]);

  return {
    gameTime: state.gameTime,
    gameSettings: state.gameSettings,
    gameStats: state.gameStats,
    gameStatus,
    actions: gameActions,
  };
};

/**
 * Hook for server synchronization
 */
const useServerSync = (gameId?: string) => {
  const { state } = useSimulation();

  // Query for server state
  const serverQuery = useQuery({
    queryKey: [...QUERY_KEYS.SIMULATION, gameId],
    queryFn: () =>
      fetch(`/api/simulation/${gameId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch server state');
        return res.json();
      }),
    enabled: !!gameId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutation for syncing to server
  const syncMutation = useMutation({
    mutationFn: (gameState: SimulationState) =>
      fetch(`/api/simulation/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState),
      }),
    onSuccess: () => {
      cacheHelpers.invalidateSimulationData('state');
    },
  });

  const syncToServer = useCallback(() => {
    if (gameId) {
      syncMutation.mutate(state);
    }
  }, [gameId, state, syncMutation]);

  const forceRefresh = useCallback(() => {
    if (gameId) {
      cacheHelpers.invalidateSimulationData('state');
    }
  }, [gameId]);

  return {
    serverState: serverQuery.data,
    isLoading: serverQuery.isLoading || syncMutation.isLoading,
    error: serverQuery.error || syncMutation.error,
    lastSync: null, // Will be updated when mutation completes
    syncToServer,
    forceRefresh,
    isSyncing: syncMutation.isLoading,
  };
};

/**
 * Hook for performance monitoring
 */
const useSimulationPerformance = () => {
  const { state } = useSimulation();

  const performance = useMemo(() => {
    const { player, gameStats, gameTime } = state;
    const elapsedDays = Math.max(1, Math.floor((Date.now() - gameTime.startTime) / (24 * 60 * 60 * 1000)));

    return {
      overallScore: Math.round(
        (player.approval * 0.4 +
          (gameStats.totalPoliciesPassed / elapsedDays) * 20 +
          (gameStats.electionsWon * 30)) /
          3
      ),
      efficiency: {
        policiesPerDay: gameStats.totalPoliciesPassed / elapsedDays,
        eventsPerDay: gameStats.totalEventsHandled / elapsedDays,
        approvalTrend: player.approval - 50, // Relative to starting approval
      },
      rankings: {
        approval: player.approval,
        productivity: gameStats.totalPoliciesPassed,
        responsiveness: gameStats.totalEventsHandled,
        consistency: gameStats.currentStreak,
      },
    };
  }, [state]);

  return performance;
};

/**
 * Export all hooks
 */
export {
  usePlayer,
  useEvents,
  usePolicies,
  useGameState,
  useServerSync,
  useSimulationPerformance,
};

export default useSimulation;