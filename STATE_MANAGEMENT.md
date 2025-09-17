# State Management Architecture

This document describes the state management architecture implemented for the Political Simulation application using React Query (TanStack Query) and React Context.

## Overview

The state management system is designed to handle both **server state** (data from APIs) and **client state** (UI and simulation logic) efficiently with optimistic updates and persistence.

### Architecture Components

1. **React Query (TanStack Query)** - Server state management
2. **React Context** - Global simulation state
3. **Custom Hooks** - Convenient state access
4. **Local Storage** - State persistence
5. **Optimistic Updates** - Better UX

## Files Structure

```
src/
├── contexts/
│   └── SimulationContext.tsx      # Main context provider
├── hooks/
│   └── useSimulation.ts           # Custom hooks for state access
├── services/
│   └── queryClient.ts             # React Query configuration
├── utils/
│   └── stateStorage.ts            # LocalStorage utilities
├── types/
│   └── simulation.ts              # TypeScript definitions
├── examples/
│   └── StateManagementExample.tsx # Usage example
└── test/
    └── stateManagement.test.tsx   # Integration tests
```

## Key Features

### ✅ React Query for Server State Management
- Configured with retry logic and error handling
- Automatic background refetching
- Cache management with 5-minute stale time
- Development tools integration

### ✅ Global Simulation Context
- Centralized state for political simulation
- Actions for all game operations
- Reducer pattern for predictable state updates
- TypeScript support for type safety

### ✅ Optimistic Updates
- Immediate UI updates for better UX
- Automatic rollback on errors
- Support for all political actions

### ✅ State Persistence
- Automatic localStorage saving
- State hydration on app start
- Version checking for migration
- Configurable save intervals

## Usage Examples

### Basic Hook Usage

```tsx
import { useSimulation, usePlayer, useEvents } from '../hooks/useSimulation';

function MyComponent() {
  const { state, actions } = useSimulation();
  const { player, stats } = usePlayer();
  const { activeEvents } = useEvents();

  return (
    <div>
      <h1>{player.name} - Approval: {player.approval}%</h1>
      <button onClick={() => actions.updateApproval(5)}>
        Increase Approval
      </button>
    </div>
  );
}
```

### Provider Setup

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { SimulationProvider } from './contexts/SimulationContext';
import queryClient from './services/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        <YourApp />
      </SimulationProvider>
    </QueryClientProvider>
  );
}
```

### Available Hooks

#### `useSimulation()`
Main hook providing access to the full simulation state and actions.

#### `usePlayer()`
Player-specific data and actions:
- Player stats and resources
- Political position
- Resource management actions

#### `useEvents()`
Event management:
- Active and resolved events
- Event choice handling
- Event requirements checking

#### `useGameState()`
Game state management:
- Pause/resume functionality
- Game settings
- Performance metrics

#### `useServerSync(gameId)`
Server synchronization:
- Real-time state syncing
- Conflict resolution
- Network status

## State Shape

```typescript
interface SimulationState {
  gameId: string;
  player: Player;
  opponents: Player[];
  currentEvents: SimulationEvent[];
  gameSettings: GameSettings;
  gameTime: GameTime;
  gameStats: GameStats;
  lastSaved: number;
}
```

## Political Actions

The system supports various political actions with optimistic updates:

- **Resource Management**: `updatePlayerResources()`
- **Approval Changes**: `updateApproval()`
- **Policy Actions**: `proposePolicy()`, `voteOnPolicy()`
- **Relationship Building**: `buildRelationship()`
- **Event Handling**: `handleEvent()`, `makeEventChoice()`
- **Game Control**: `pauseGame()`, `resumeGame()`, `saveGame()`

## Optimistic Updates

All political actions support optimistic updates:

1. **Immediate UI Update** - State changes immediately
2. **Server Sync** - Changes sent to server in background
3. **Automatic Rollback** - Reverts on server errors
4. **Conflict Resolution** - Handles concurrent changes

Example:
```tsx
// This will update the UI immediately, then sync with server
playerActions.updateApproval(10);
```

## State Persistence

### LocalStorage Integration
- **Automatic Saving**: State saved on every change (debounced)
- **Version Control**: Migration support for state schema changes
- **Expiration**: Old states are automatically cleaned up
- **Error Handling**: Graceful fallback when storage fails

### Configuration
```typescript
const STORAGE_KEY = 'politicAIl_simulation_state';
const STORAGE_VERSION = '1.0.0';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
```

## Server Synchronization

### Query Configuration
- **Stale Time**: 5 minutes
- **Cache Time**: 10 minutes
- **Retry Logic**: 3 attempts with exponential backoff
- **Background Refetch**: On reconnect

### Conflict Resolution
When server and local state conflict:
1. Server state takes precedence
2. Local changes are preserved when possible
3. Conflicts are logged for debugging
4. Users can manually resolve conflicts

## Error Handling

### Query Errors
- Network errors trigger automatic retries
- Authentication errors redirect to login
- Server errors show user-friendly messages

### Mutation Errors
- Optimistic updates are rolled back
- Error details are logged
- Users are notified of failures

## Performance Optimizations

### Memory Management
- Automatic cache cleanup
- Configurable cache sizes
- Garbage collection for old queries

### Network Efficiency
- Request deduplication
- Background updates
- Compressed payloads

## Testing

### Unit Tests
- Hook functionality
- State reducers
- Storage utilities

### Integration Tests
- Provider setup
- Optimistic updates
- Error scenarios

### Example Test
```tsx
it('should handle optimistic updates correctly', async () => {
  const { result } = renderHook(() => usePlayer(), {
    wrapper: TestWrapper,
  });

  act(() => {
    result.current.actions.updateApproval(10);
  });

  expect(result.current.player.approval).toBe(60);
});
```

## Development Tools

### React Query Devtools
- Query inspection
- Cache visualization
- Network status
- Performance metrics

### Configuration
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
```

## Best Practices

### Hook Usage
1. Use specific hooks (`usePlayer`, `useEvents`) over generic `useSimulation`
2. Destructure only needed values to avoid unnecessary re-renders
3. Use `useMemo` and `useCallback` for expensive computations

### State Updates
1. Always use provided actions for state changes
2. Don't mutate state directly
3. Use optimistic updates for better UX

### Error Handling
1. Handle loading and error states in components
2. Provide fallbacks for network failures
3. Show meaningful error messages to users

### Performance
1. Keep component trees shallow
2. Use React.memo for expensive components
3. Minimize state subscription scope

## Troubleshooting

### Common Issues

#### State Not Persisting
- Check localStorage availability
- Verify browser privacy settings
- Check for quota limits

#### Optimistic Updates Not Working
- Ensure actions are used correctly
- Check network connectivity
- Verify server endpoints

#### Performance Issues
- Monitor React Query devtools
- Check for unnecessary re-renders
- Optimize component structure

### Debug Tools
- React Query Devtools
- Browser Developer Tools
- Console logging
- State inspection utilities

## Future Enhancements

### Planned Features
- Real-time multiplayer synchronization
- Advanced conflict resolution
- State compression
- Analytics integration

### Migration Path
- State schema versioning
- Backward compatibility
- Automated migrations

This state management architecture provides a robust foundation for the political simulation game with excellent developer experience and user performance.