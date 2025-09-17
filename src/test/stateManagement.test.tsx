/**
 * State Management Integration Tests
 * Tests the React Query + Context state management architecture
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SimulationProvider, useSimulationContext } from '../contexts/SimulationContext';
import { useSimulation, usePlayer, useEvents } from '../hooks/useSimulation';

// Test component that uses the simulation context
const TestComponent: React.FC = () => {
  const { state, actions } = useSimulation();
  const { player, actions: playerActions } = usePlayer();
  const { hasActiveEvents } = useEvents();

  return (
    <div>
      <div data-testid="player-name">{player.name}</div>
      <div data-testid="player-approval">{player.approval}</div>
      <div data-testid="has-events">{hasActiveEvents ? 'yes' : 'no'}</div>
      <button
        data-testid="update-approval"
        onClick={() => playerActions.updateApproval(10)}
      >
        Increase Approval
      </button>
      <button
        data-testid="pause-game"
        onClick={() => actions.pauseGame()}
      >
        Pause Game
      </button>
      <div data-testid="game-paused">{state.gameTime.paused ? 'paused' : 'running'}</div>
    </div>
  );
};

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>{children}</SimulationProvider>
    </QueryClientProvider>
  );
};

describe('State Management Architecture', () => {
  it('should provide simulation context correctly', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Check initial state
    expect(screen.getByTestId('player-name')).toHaveTextContent('Player');
    expect(screen.getByTestId('player-approval')).toHaveTextContent('50');
    expect(screen.getByTestId('has-events')).toHaveTextContent('no');
    expect(screen.getByTestId('game-paused')).toHaveTextContent('running');
  });

  it('should handle optimistic updates correctly', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initial approval should be 50
    expect(screen.getByTestId('player-approval')).toHaveTextContent('50');

    // Click to increase approval
    const updateButton = screen.getByTestId('update-approval');

    await act(async () => {
      updateButton.click();
    });

    // Approval should be updated optimistically
    expect(screen.getByTestId('player-approval')).toHaveTextContent('60');
  });

  it('should handle game state changes', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Game should be running initially
    expect(screen.getByTestId('game-paused')).toHaveTextContent('running');

    // Pause the game
    const pauseButton = screen.getByTestId('pause-game');

    await act(async () => {
      pauseButton.click();
    });

    // Game should be paused
    expect(screen.getByTestId('game-paused')).toHaveTextContent('paused');
  });
});

describe('State Persistence', () => {
  it('should save and load state from localStorage', () => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // The component should attempt to load from localStorage on mount
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('politicAIl_simulation_state');
  });
});

describe('Hooks Integration', () => {
  const HookTestComponent: React.FC = () => {
    const { state } = useSimulation();
    const { player, stats } = usePlayer();
    const { eventCount } = useEvents();

    return (
      <div>
        <div data-testid="total-policies">{stats.totalPolicies}</div>
        <div data-testid="total-resources">{stats.totalResources}</div>
        <div data-testid="event-count">{eventCount.total}</div>
        <div data-testid="game-id">{state.gameId}</div>
      </div>
    );
  };

  it('should provide correct hook data', () => {
    render(
      <TestWrapper>
        <HookTestComponent />
      </TestWrapper>
    );

    // Check computed values from hooks
    expect(screen.getByTestId('total-policies')).toHaveTextContent('0');
    expect(screen.getByTestId('event-count')).toHaveTextContent('0');
    expect(screen.getByTestId('game-id')).toContain('game_');
  });

  it('should calculate total resources correctly', () => {
    render(
      <TestWrapper>
        <HookTestComponent />
      </TestWrapper>
    );

    // Initial resources: money: 1000, influence: 50, media: 25, grassroots: 30
    // Total should be 1105
    expect(screen.getByTestId('total-resources')).toHaveTextContent('1105');
  });
});