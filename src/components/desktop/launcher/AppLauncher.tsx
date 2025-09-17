import React, { useState, useRef, useEffect } from 'react';
import { useDesktop } from '../../../contexts/DesktopContext';
import '../../../styles/components/app-launcher.css';

export function AppLauncher() {
  const { state, actions } = useDesktop();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { apps, theme } = state;

  // Focus search input when launcher opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter apps based on search term
  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group apps by category
  const groupedApps = filteredApps.reduce((groups, app) => {
    const category = app.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(app);
    return groups;
  }, {} as Record<string, typeof apps>);

  const categoryLabels: Record<string, string> = {
    analytics: 'Analytics & Metrics',
    social: 'Social Media',
    monitoring: 'Monitoring & News',
    management: 'Management Tools',
  };

  const handleAppLaunch = (appId: string) => {
    actions.launchApp(appId);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && filteredApps.length > 0) {
      const firstApp = filteredApps[0];
      if (firstApp) {
        handleAppLaunch(firstApp.id);
      }
    }
  };

  return (
    <div
      className="app-launcher-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          actions.toggleLauncher();
        }
      }}
    >
      <div
        className="app-launcher"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.secondary,
          color: theme.colors.text,
        }}
      >
        {/* Header */}
        <div className="launcher-header">
          <div className="launcher-title">
            <span className="launcher-icon">🏛️</span>
            <h2>PoliticAIl Applications</h2>
          </div>
          <button
            className="close-button"
            onClick={actions.toggleLauncher}
            style={{ color: theme.colors.text }}
            title="Close Launcher (Esc)"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="launcher-search">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                backgroundColor: theme.colors.taskbar,
                color: theme.colors.text,
                borderColor: theme.colors.secondary,
              }}
            />
          </div>
        </div>

        {/* Applications Grid */}
        <div className="launcher-content">
          {Object.keys(groupedApps).length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No applications found</p>
              <p className="no-results-hint">Try adjusting your search terms</p>
            </div>
          ) : (
            Object.entries(groupedApps).map(([category, categoryApps]) => (
              <div key={category} className="app-category">
                <h3
                  className="category-title"
                  style={{ color: theme.colors.accent }}
                >
                  {categoryLabels[category] || category}
                </h3>
                <div className="apps-grid">
                  {categoryApps.map(app => (
                    <button
                      key={app.id}
                      className={`app-tile ${app.isRunning ? 'running' : ''}`}
                      onClick={() => handleAppLaunch(app.id)}
                      style={{
                        backgroundColor: theme.colors.taskbar,
                        borderColor: theme.colors.secondary,
                        color: theme.colors.text,
                      }}
                      title={app.description}
                    >
                      <div className="app-tile-icon">{app.icon}</div>
                      <div className="app-tile-name">{app.name}</div>
                      <div className="app-tile-description">{app.description}</div>
                      {app.isRunning && (
                        <div
                          className="running-indicator"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Application is running"
                        >
                          ●
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="launcher-footer">
          <div className="launcher-stats">
            <span>{filteredApps.length} applications available</span>
            <span>•</span>
            <span>{apps.filter(app => app.isRunning).length} running</span>
          </div>
          <div className="launcher-shortcuts">
            <span className="shortcut">
              <kbd>Enter</kbd> Launch first result
            </span>
            <span className="shortcut">
              <kbd>Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}