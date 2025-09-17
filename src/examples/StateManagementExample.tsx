/**
 * State Management Example Component
 * Demonstrates how to use the political simulation state management
 */

import React from 'react';
import { useSimulation, usePlayer, useEvents, useGameState } from '../hooks/useSimulation';

const StateManagementExample: React.FC = () => {
  const { state, isLoading, error } = useSimulation();
  const { player, actions: playerActions, stats } = usePlayer();
  const { activeEvents, eventCount, actions: eventActions } = useEvents();
  const { gameStatus, actions: gameActions } = useGameState();

  if (isLoading) {
    return <div>Loading simulation...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Political Simulation Dashboard</h1>

      {/* Player Stats Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Player Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>Name:</strong> {player.name}
          </div>
          <div>
            <strong>Party:</strong> {player.party}
          </div>
          <div>
            <strong>Approval Rating:</strong> {player.approval}%
          </div>
          <div>
            <strong>Total Resources:</strong> {stats.totalResources}
          </div>
          <div>
            <strong>Active Policies:</strong> {stats.activePolicies}
          </div>
          <div>
            <strong>Total Policies:</strong> {stats.totalPolicies}
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <h3>Resources</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div>Money: ${player.resources.money}</div>
            <div>Influence: {player.resources.influence}</div>
            <div>Media: {player.resources.media}</div>
            <div>Grassroots: {player.resources.grassroots}</div>
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <h3>Political Position</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div>Economic: {player.position.economic}</div>
            <div>Social: {player.position.social}</div>
            <div>Foreign: {player.position.foreign}</div>
          </div>
        </div>
      </section>

      {/* Game Status Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Game Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>Status:</strong> {gameStatus.isRunning ? 'Running' : 'Paused'}
          </div>
          <div>
            <strong>Day:</strong> {gameStatus.currentDay}
          </div>
          <div>
            <strong>Progress:</strong> {Math.round(gameStatus.gameProgress * 100)}%
          </div>
          <div>
            <strong>Policies Passed:</strong> {gameStatus.performance.policiesPassed}
          </div>
          <div>
            <strong>Events Handled:</strong> {gameStatus.performance.eventsHandled}
          </div>
          <div>
            <strong>Elections Won:</strong> {gameStatus.performance.electionsWon}
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button
            onClick={gameStatus.isRunning ? gameActions.pause : gameActions.resume}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            {gameStatus.isRunning ? 'Pause Game' : 'Resume Game'}
          </button>
          <button
            onClick={gameActions.save}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Save Game
          </button>
          <button
            onClick={gameActions.reset}
            style={{ padding: '8px 16px', backgroundColor: '#ff6b6b', color: 'white', border: 'none' }}
          >
            Reset Game
          </button>
        </div>
      </section>

      {/* Events Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Current Events ({eventCount.active} active)</h2>

        {activeEvents.length === 0 ? (
          <p>No active events at the moment.</p>
        ) : (
          <div>
            {activeEvents.map(event => (
              <div key={event.id} style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px'
              }}>
                <h4>{event.title}</h4>
                <p>{event.description}</p>
                <div style={{ marginTop: '10px' }}>
                  {event.choices?.map(choice => (
                    <button
                      key={choice.id}
                      onClick={() => eventActions.makeChoice(event.id, choice.id, choice.impact)}
                      style={{
                        marginRight: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px'
                      }}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => playerActions.updateApproval(5)}
            style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none' }}
          >
            Increase Approval (+5)
          </button>
          <button
            onClick={() => playerActions.updateApproval(-5)}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
          >
            Decrease Approval (-5)
          </button>
          <button
            onClick={() => playerActions.updateResources({ money: 100 })}
            style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none' }}
          >
            Add Money (+100)
          </button>
          <button
            onClick={() => playerActions.updateResources({ influence: 10 })}
            style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none' }}
          >
            Add Influence (+10)
          </button>
          <button
            onClick={() => playerActions.proposePolicy({
              id: `policy_${Date.now()}`,
              name: 'Test Policy',
              category: 'economic',
              impact: { approval: 5, economy: 10, social: 0, environment: 0 },
              supportLevel: 60
            })}
            style={{ padding: '8px 16px', backgroundColor: '#6f42c1', color: 'white', border: 'none' }}
          >
            Propose Test Policy
          </button>
        </div>
      </section>

      {/* Debug Info */}
      <section style={{ padding: '15px', border: '1px solid #ccc', backgroundColor: '#f8f9fa' }}>
        <h2>Debug Information</h2>
        <details>
          <summary>View Full State</summary>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(state, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
};

export default StateManagementExample;