/**
 * State Storage Utilities
 * Handles persistence and hydration of simulation state using localStorage
 */

import { SimulationState } from '../types/simulation';

const STORAGE_KEY = 'politicAIl_simulation_state';
const STORAGE_VERSION = '1.0.0';

interface StoredState {
  version: string;
  timestamp: number;
  data: SimulationState;
}

/**
 * Save simulation state to localStorage
 */
export const saveSimulationState = (state: SimulationState): void => {
  try {
    const storedState: StoredState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data: state,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
  } catch (error) {
    console.warn('Failed to save simulation state to localStorage:', error);
  }
};

/**
 * Load simulation state from localStorage
 */
export const loadSimulationState = (): SimulationState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsedState: StoredState = JSON.parse(stored);

    // Version check - migrate or reset if version mismatch
    if (parsedState.version !== STORAGE_VERSION) {
      console.warn('State version mismatch, clearing stored state');
      clearSimulationState();
      return null;
    }

    // Check if state is not too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - parsedState.timestamp > maxAge) {
      console.warn('Stored state is too old, clearing');
      clearSimulationState();
      return null;
    }

    return parsedState.data;
  } catch (error) {
    console.warn('Failed to load simulation state from localStorage:', error);
    clearSimulationState();
    return null;
  }
};

/**
 * Clear simulation state from localStorage
 */
export const clearSimulationState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear simulation state from localStorage:', error);
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get storage usage info
 */
export const getStorageInfo = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return {
      hasStoredState: !!stored,
      sizeInBytes: stored ? new Blob([stored]).size : 0,
      lastUpdated: stored ? JSON.parse(stored).timestamp : null,
    };
  } catch {
    return {
      hasStoredState: false,
      sizeInBytes: 0,
      lastUpdated: null,
    };
  }
};

/**
 * Debounced save function to prevent excessive storage writes
 */
let saveTimeout: NodeJS.Timeout | null = null;

export const debouncedSaveSimulationState = (
  state: SimulationState,
  delay: number = 1000
): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveSimulationState(state);
    saveTimeout = null;
  }, delay);
};