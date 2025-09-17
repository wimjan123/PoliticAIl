/**
 * Window Persistence Demo Component
 * Demonstrates window state persistence functionality
 */

import React, { useState, useEffect } from 'react';
import {
  WorkspaceLayout,
  useWindowPersistence,
  createWorkspace,
  restoreWorkspace,
  loadAllWorkspaces,
  deleteWorkspace,
  getMonitorInfo,
  getStorageStats,
  clearAllWindowData,
} from '../utils/windowPersistence';
import { runWindowPersistenceTests, TestResult } from '../utils/windowPersistenceTest';
import { invoke } from '@tauri-apps/api/core';

interface WindowPersistenceDemoProps {
  windowLabel?: string;
}

export const WindowPersistenceDemo: React.FC<WindowPersistenceDemoProps> = ({
  windowLabel = 'main_window',
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceLayout[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // Use window persistence hook
  const { windowState, saveState, isLoading: windowLoading } = useWindowPersistence({
    windowLabel,
    autoSave: true,
    saveDelay: 500,
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workspaceList, monitorList, stats] = await Promise.all([
        Promise.resolve(loadAllWorkspaces()),
        getMonitorInfo(),
        Promise.resolve(getStorageStats()),
      ]);

      setWorkspaces(workspaceList);
      setMonitors(monitorList);
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load window persistence data:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsLoading(true);
    try {
      const workspace = await createWorkspace(
        newWorkspaceName,
        `Created at ${new Date().toLocaleString()}`
      );

      setWorkspaces(prev => [workspace, ...prev]);
      setNewWorkspaceName('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const success = await restoreWorkspace(workspaceId);
      if (success) {
        await loadData(); // Refresh data after restoration
        console.log('Workspace restored successfully');
      } else {
        console.error('Failed to restore workspace');
      }
    } catch (error) {
      console.error('Error restoring workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;

    try {
      deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const handleRunTests = async () => {
    setIsLoading(true);
    try {
      const results = await runWindowPersistenceTests();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all window persistence data?')) return;

    try {
      clearAllWindowData();
      await loadData();
      console.log('All window persistence data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const handleManualSave = () => {
    if (windowState) {
      saveState();
      console.log('Window state saved manually');
    }
  };

  const handleTestWindowOperations = async () => {
    setIsLoading(true);
    try {
      // Test window movement
      await invoke('move_window', {
        label: windowLabel,
        x: 200,
        y: 200,
      });

      // Test window resizing
      await invoke('resize_app_window', {
        label: windowLabel,
        width: 1000,
        height: 700,
      });

      console.log('Window operations test completed');
    } catch (error) {
      console.error('Window operations test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="window-persistence-demo" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🖼️ Window Persistence Demo</h2>

      {/* Current Window State */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Current Window State</h3>
        {windowLoading ? (
          <p>Loading window state...</p>
        ) : windowState ? (
          <div>
            <p><strong>Position:</strong> ({windowState.position.x}, {windowState.position.y})</p>
            <p><strong>Size:</strong> {windowState.size.width} × {windowState.size.height}</p>
            <p><strong>Monitor:</strong> {windowState.monitor} ({windowState.monitorName})</p>
            <p><strong>Maximized:</strong> {windowState.isMaximized ? 'Yes' : 'No'}</p>
            <p><strong>Minimized:</strong> {windowState.isMinimized ? 'Yes' : 'No'}</p>
            <button onClick={handleManualSave} style={{ marginTop: '10px' }}>
              💾 Save State Manually
            </button>
          </div>
        ) : (
          <p>No window state available</p>
        )}
      </div>

      {/* Workspace Management */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Workspace Management</h3>

        {/* Create Workspace */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Enter workspace name"
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleCreateWorkspace} disabled={isLoading}>
            ➕ Create Workspace
          </button>
        </div>

        {/* Workspace List */}
        {workspaces.length > 0 ? (
          <div>
            <h4>Saved Workspaces ({workspaces.length})</h4>
            {workspaces.map((workspace) => (
              <div key={workspace.id} style={{
                padding: '10px',
                margin: '5px 0',
                border: '1px solid #ddd',
                borderRadius: '3px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{workspace.name}</strong>
                  {workspace.description && <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    {workspace.description}
                  </p>}
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                    Created: {new Date(workspace.createdAt).toLocaleString()}<br />
                    Last used: {new Date(workspace.lastUsed).toLocaleString()}<br />
                    Windows: {Object.keys(workspace.windows).length}, Monitors: {workspace.monitors.length}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => handleRestoreWorkspace(workspace.id)}
                    disabled={isLoading}
                    style={{ marginRight: '5px' }}
                  >
                    🔄 Restore
                  </button>
                  <button
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    style={{ backgroundColor: '#ff6b6b', color: 'white' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No saved workspaces</p>
        )}
      </div>

      {/* Monitor Information */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Monitor Information</h3>
        {monitors.length > 0 ? (
          monitors.map((monitor, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <strong>Monitor {monitor.index}</strong> ({monitor.name})
              <ul style={{ margin: '5px 0' }}>
                <li>Size: {monitor.size.width} × {monitor.size.height}</li>
                <li>Position: ({monitor.position.x}, {monitor.position.y})</li>
                <li>Scale: {monitor.scaleFactor}</li>
                <li>Primary: {monitor.isPrimary ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          ))
        ) : (
          <p>No monitor information available</p>
        )}
      </div>

      {/* Storage Statistics */}
      {storageStats && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>Storage Statistics</h3>
          <p><strong>Has Window States:</strong> {storageStats.hasWindowStates ? 'Yes' : 'No'}</p>
          <p><strong>Has Workspaces:</strong> {storageStats.hasWorkspaces ? 'Yes' : 'No'}</p>
          <p><strong>Window States Size:</strong> {(storageStats.windowStatesSize / 1024).toFixed(2)} KB</p>
          <p><strong>Workspaces Size:</strong> {(storageStats.workspacesSize / 1024).toFixed(2)} KB</p>
          <p><strong>Total Size:</strong> {(storageStats.totalSize / 1024).toFixed(2)} KB</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleRunTests} disabled={isLoading}>
            🧪 Run Tests
          </button>
          <button onClick={handleTestWindowOperations} disabled={isLoading}>
            🪟 Test Window Operations
          </button>
          <button onClick={loadData} disabled={isLoading}>
            🔄 Refresh Data
          </button>
          <button
            onClick={handleClearAllData}
            style={{ backgroundColor: '#ff6b6b', color: 'white' }}
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>Test Results</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Summary:</strong>{' '}
            {testResults.filter(r => r.passed).length}/{testResults.length} tests passed{' '}
            ({(testResults.filter(r => r.passed).length / testResults.length * 100).toFixed(1)}%)
          </div>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                margin: '5px 0',
                border: `1px solid ${result.passed ? '#4caf50' : '#f44336'}`,
                borderRadius: '3px',
                backgroundColor: result.passed ? '#f1f8e9' : '#ffebee'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {result.passed ? '✅' : '❌'} {result.testName}
              </div>
              {result.error && (
                <div style={{ color: '#f44336', fontSize: '14px', marginTop: '5px' }}>
                  Error: {result.error}
                </div>
              )}
              {result.details && (
                <details style={{ marginTop: '5px' }}>
                  <summary>Details</summary>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '5px'
        }}>
          Loading...
        </div>
      )}
    </div>
  );
};