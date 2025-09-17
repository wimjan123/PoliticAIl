/**
 * Hooks Index
 * Re-exports all simulation hooks for easy importing
 */

export {
  useSimulation,
  usePlayer,
  useEvents,
  usePolicies,
  useGameState,
  useServerSync,
  useSimulationPerformance,
} from './useSimulation';

export { useSimulationContext } from '../contexts/SimulationContext';

// Default export for convenience
export { default } from './useSimulation';