import React, { useState } from 'react';
import { useWindowManager, WindowConfig } from './WindowManager';

interface WindowCreatorProps {
  onWindowCreated?: (label: string) => void;
}

const WindowCreator: React.FC<WindowCreatorProps> = ({ onWindowCreated }) => {
  const { createWindow, monitors } = useWindowManager();

  const [config, setConfig] = useState<WindowConfig>({
    window_type: 'app',
    title: 'New Window',
    width: 800,
    height: 600,
    x: undefined,
    y: undefined,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    always_on_top: false,
    decorations: true,
    transparent: false,
    focus: true,
    fullscreen: false,
    url: undefined,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof WindowConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const label = await createWindow(config.window_type, config);
      onWindowCreated?.(label);

      // Reset form to defaults
      setConfig({
        window_type: 'app',
        title: 'New Window',
        width: 800,
        height: 600,
        x: undefined,
        y: undefined,
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        always_on_top: false,
        decorations: true,
        transparent: false,
        focus: true,
        fullscreen: false,
        url: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create window');
    } finally {
      setIsCreating(false);
    }
  };

  const presetConfigs = {
    'Small Dialog': {
      width: 400,
      height: 300,
      resizable: false,
      maximizable: false,
    },
    'Standard Window': {
      width: 800,
      height: 600,
      resizable: true,
      maximizable: true,
    },
    'Large Window': {
      width: 1200,
      height: 800,
      resizable: true,
      maximizable: true,
    },
    'Utility Panel': {
      width: 300,
      height: 500,
      always_on_top: true,
      decorations: false,
    },
    'Full Screen': {
      width: 1920,
      height: 1080,
      fullscreen: true,
      decorations: false,
    },
  };

  const applyPreset = (presetName: keyof typeof presetConfigs) => {
    const preset = presetConfigs[presetName];
    setConfig(prev => ({
      ...prev,
      ...preset,
      title: `${presetName} - ${Date.now()}`,
    }));
  };

  return (
    <div className="window-creator">
      <h3>Create New Window</h3>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="window-config-form">
        <div className="form-section">
          <h4>Basic Configuration</h4>

          <div className="form-group">
            <label htmlFor="window_type">Window Type:</label>
            <select
              id="window_type"
              value={config.window_type}
              onChange={(e) => handleInputChange('window_type', e.target.value)}
            >
              <option value="app">Application</option>
              <option value="dialog">Dialog</option>
              <option value="utility">Utility</option>
              <option value="panel">Panel</option>
              <option value="tool">Tool</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={config.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">URL (optional):</label>
            <input
              type="text"
              id="url"
              value={config.url || ''}
              onChange={(e) => handleInputChange('url', e.target.value || undefined)}
              placeholder="index.html"
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Size and Position</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="width">Width:</label>
              <input
                type="number"
                id="width"
                value={config.width}
                onChange={(e) => handleInputChange('width', parseInt(e.target.value))}
                min="100"
                max="4000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="height">Height:</label>
              <input
                type="number"
                id="height"
                value={config.height}
                onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                min="100"
                max="4000"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="x">X Position (optional):</label>
              <input
                type="number"
                id="x"
                value={config.x || ''}
                onChange={(e) => handleInputChange('x', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="y">Y Position (optional):</label>
              <input
                type="number"
                id="y"
                value={config.y || ''}
                onChange={(e) => handleInputChange('y', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Window Properties</h4>

          <div className="checkbox-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.resizable}
                onChange={(e) => handleInputChange('resizable', e.target.checked)}
              />
              Resizable
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.minimizable}
                onChange={(e) => handleInputChange('minimizable', e.target.checked)}
              />
              Minimizable
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.maximizable}
                onChange={(e) => handleInputChange('maximizable', e.target.checked)}
              />
              Maximizable
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.closable}
                onChange={(e) => handleInputChange('closable', e.target.checked)}
              />
              Closable
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.always_on_top}
                onChange={(e) => handleInputChange('always_on_top', e.target.checked)}
              />
              Always on Top
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.decorations}
                onChange={(e) => handleInputChange('decorations', e.target.checked)}
              />
              Window Decorations
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.transparent}
                onChange={(e) => handleInputChange('transparent', e.target.checked)}
              />
              Transparent
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.focus}
                onChange={(e) => handleInputChange('focus', e.target.checked)}
              />
              Focus on Creation
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.fullscreen}
                onChange={(e) => handleInputChange('fullscreen', e.target.checked)}
              />
              Fullscreen
            </label>
          </div>
        </div>

        <div className="form-section">
          <h4>Quick Presets</h4>
          <div className="preset-buttons">
            {Object.keys(presetConfigs).map((presetName) => (
              <button
                key={presetName}
                type="button"
                onClick={() => applyPreset(presetName as keyof typeof presetConfigs)}
                className="preset-btn"
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isCreating}
            className="create-btn primary"
          >
            {isCreating ? 'Creating...' : 'Create Window'}
          </button>
        </div>
      </form>

      {monitors.length > 0 && (
        <div className="monitor-info">
          <h4>Available Monitors</h4>
          {monitors.map((monitor) => (
            <div key={monitor.id} className="monitor-item">
              <strong>{monitor.name}</strong> - {monitor.width}×{monitor.height}
              {monitor.is_primary && <span className="primary-badge">Primary</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WindowCreator;