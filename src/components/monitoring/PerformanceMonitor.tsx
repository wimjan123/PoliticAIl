/**
 * Performance Monitor React Component
 * Real-time performance monitoring dashboard
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getPerformanceMetrics,
  getPerformanceAlerts,
  getPerformanceTrends,
  getPerformanceSummary,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  generatePerformanceReport,
  resetPerformanceMonitor,
  PerformanceMetrics,
  PerformanceAlert,
  PerformanceTrend,
} from '../../utils/performance';

interface PerformanceMonitorProps {
  refreshInterval?: number;
  showAdvancedMetrics?: boolean;
  autoStart?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  refreshInterval = 1000,
  showAdvancedMetrics = true,
  autoStart = true,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(autoStart);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'trends' | 'subsystems' | 'reports'>('overview');

  // Update metrics periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
      setAlerts(getPerformanceAlerts());
      setTrends(getPerformanceTrends());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval]);

  // Auto-start monitoring if requested
  useEffect(() => {
    if (autoStart) {
      startPerformanceMonitoring();
    }
  }, [autoStart]);

  const handleStartMonitoring = useCallback(() => {
    startPerformanceMonitoring();
    setIsMonitoring(true);
  }, []);

  const handleStopMonitoring = useCallback(() => {
    stopPerformanceMonitoring();
    setIsMonitoring(false);
  }, []);

  const handleReset = useCallback(() => {
    resetPerformanceMonitor();
    setMetrics(null);
    setAlerts([]);
    setTrends([]);
  }, []);

  const handleExportReport = useCallback(() => {
    const report = generatePerformanceReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const summary = useMemo(() => getPerformanceSummary(), [metrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  if (!metrics && isMonitoring) {
    return (
      <div className="performance-monitor loading">
        <div className="loading-spinner"></div>
        <p>Initializing performance monitoring...</p>
      </div>
    );
  }

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>Performance Monitor</h2>
        <div className="monitor-controls">
          {isMonitoring ? (
            <button onClick={handleStopMonitoring} className="btn-warning">
              Stop Monitoring
            </button>
          ) : (
            <button onClick={handleStartMonitoring} className="btn-success">
              Start Monitoring
            </button>
          )}
          <button onClick={handleReset} className="btn-secondary">
            Reset
          </button>
          <button onClick={handleExportReport} className="btn-primary">
            Export Report
          </button>
        </div>
      </div>

      <div className="monitor-tabs">
        <button
          className={selectedTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={selectedTab === 'alerts' ? 'tab active' : 'tab'}
          onClick={() => setSelectedTab('alerts')}
        >
          Alerts {alerts.length > 0 && <span className="alert-badge">{alerts.length}</span>}
        </button>
        <button
          className={selectedTab === 'trends' ? 'tab active' : 'tab'}
          onClick={() => setSelectedTab('trends')}
        >
          Trends
        </button>
        {showAdvancedMetrics && (
          <button
            className={selectedTab === 'subsystems' ? 'tab active' : 'tab'}
            onClick={() => setSelectedTab('subsystems')}
          >
            Subsystems
          </button>
        )}
        <button
          className={selectedTab === 'reports' ? 'tab active' : 'tab'}
          onClick={() => setSelectedTab('reports')}
        >
          Reports
        </button>
      </div>

      <div className="monitor-content">
        {selectedTab === 'overview' && (
          <OverviewTab metrics={metrics} summary={summary} getStatusColor={getStatusColor} formatBytes={formatBytes} formatDuration={formatDuration} />
        )}
        {selectedTab === 'alerts' && (
          <AlertsTab alerts={alerts} getStatusColor={getStatusColor} />
        )}
        {selectedTab === 'trends' && (
          <TrendsTab trends={trends} formatBytes={formatBytes} />
        )}
        {selectedTab === 'subsystems' && showAdvancedMetrics && (
          <SubsystemsTab metrics={metrics} formatDuration={formatDuration} />
        )}
        {selectedTab === 'reports' && (
          <ReportsTab onExportReport={handleExportReport} />
        )}
      </div>

      <style jsx>{`
        .performance-monitor {
          background: #1a1a1a;
          color: #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          font-family: 'Monaco', 'Menlo', monospace;
          min-height: 600px;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #333;
          border-top: 4px solid #22C55E;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }

        .monitor-header h2 {
          margin: 0;
          color: #22C55E;
          font-size: 24px;
        }

        .monitor-controls {
          display: flex;
          gap: 10px;
        }

        .monitor-controls button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary { background: #3B82F6; color: white; }
        .btn-primary:hover { background: #2563EB; }
        .btn-success { background: #22C55E; color: white; }
        .btn-success:hover { background: #16A34A; }
        .btn-warning { background: #F59E0B; color: white; }
        .btn-warning:hover { background: #D97706; }
        .btn-secondary { background: #6B7280; color: white; }
        .btn-secondary:hover { background: #4B5563; }

        .monitor-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
        }

        .tab {
          padding: 10px 20px;
          background: transparent;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          position: relative;
        }

        .tab:hover {
          color: #E5E5E5;
          background: #2A2A2A;
        }

        .tab.active {
          color: #22C55E;
          border-bottom-color: #22C55E;
        }

        .alert-badge {
          background: #EF4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 12px;
          margin-left: 5px;
        }

        .monitor-content {
          min-height: 400px;
        }
      `}</style>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  metrics: PerformanceMetrics | null;
  summary: any;
  getStatusColor: (status: string) => string;
  formatBytes: (bytes: number) => string;
  formatDuration: (ms: number) => string;
}> = ({ metrics, summary, getStatusColor, formatBytes, formatDuration }) => {
  if (!metrics) {
    return <div className="no-data">No performance data available. Start monitoring to see metrics.</div>;
  }

  return (
    <div className="overview-content">
      <div className="status-card">
        <h3>System Status</h3>
        <div className="status-indicator" style={{ color: getStatusColor(summary.status) }}>
          {summary.status.toUpperCase()}
        </div>
        <div className="status-details">
          <div>Uptime: {formatDuration(summary.sessionDuration)}</div>
          <div>Alerts: {summary.alertCount}</div>
          <div>Memory Efficiency: {summary.memoryEfficiency}%</div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Simulation Performance</h4>
          <div className="metric-value">{metrics.averageTickTime.toFixed(2)}ms</div>
          <div className="metric-label">Average Tick Time</div>
          <div className="metric-details">
            <div>Current: {metrics.simulationTickTime.toFixed(2)}ms</div>
            <div>Max: {metrics.maxTickTime.toFixed(2)}ms</div>
            <div>Total Ticks: {metrics.totalTicks}</div>
          </div>
        </div>

        <div className="metric-card">
          <h4>Memory Usage</h4>
          <div className="metric-value">{formatBytes(metrics.currentMemoryUsage)}</div>
          <div className="metric-label">Current Usage</div>
          <div className="metric-details">
            <div>Peak: {formatBytes(metrics.peakMemoryUsage)}</div>
            <div>Leak Score: {metrics.memoryLeakScore.toFixed(1)}/100</div>
          </div>
        </div>

        <div className="metric-card">
          <h4>Error Rate</h4>
          <div className="metric-value">{metrics.errorsPerMinute}</div>
          <div className="metric-label">Errors per Minute</div>
          <div className="metric-details">
            <div>Warnings: {metrics.warningsPerMinute}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overview-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #6B7280;
          font-style: italic;
        }

        .status-card {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .status-card h3 {
          margin: 0 0 10px 0;
          color: #E5E5E5;
        }

        .status-indicator {
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0;
        }

        .status-details {
          display: flex;
          justify-content: space-around;
          margin-top: 15px;
          color: #9CA3AF;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .metric-card h4 {
          margin: 0 0 15px 0;
          color: #E5E5E5;
          font-size: 14px;
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: #22C55E;
          margin: 10px 0;
        }

        .metric-label {
          color: #9CA3AF;
          margin-bottom: 15px;
        }

        .metric-details {
          font-size: 12px;
          color: #6B7280;
        }

        .metric-details div {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

// Alerts Tab Component
const AlertsTab: React.FC<{
  alerts: PerformanceAlert[];
  getStatusColor: (status: string) => string;
}> = ({ alerts, getStatusColor }) => {
  if (alerts.length === 0) {
    return (
      <div className="no-alerts">
        <div className="success-icon">✓</div>
        <h3>No Active Alerts</h3>
        <p>System is running within normal parameters</p>
      </div>
    );
  }

  return (
    <div className="alerts-content">
      <div className="alerts-summary">
        <div>Total Alerts: {alerts.length}</div>
        <div>Critical: {alerts.filter(a => a.type === 'critical').length}</div>
        <div>Warnings: {alerts.filter(a => a.type === 'warning').length}</div>
      </div>

      <div className="alerts-list">
        {alerts.map(alert => (
          <div key={alert.id} className="alert-card" style={{ borderLeftColor: getStatusColor(alert.type) }}>
            <div className="alert-header">
              <span className="alert-type" style={{ color: getStatusColor(alert.type) }}>
                {alert.type.toUpperCase()}
              </span>
              <span className="alert-category">{alert.category}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="alert-message">{alert.message}</div>
            <div className="alert-details">
              Current: {alert.currentValue.toFixed(2)} | Threshold: {alert.threshold}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .no-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          text-align: center;
        }

        .success-icon {
          font-size: 48px;
          color: #22C55E;
          margin-bottom: 20px;
        }

        .no-alerts h3 {
          color: #22C55E;
          margin: 0 0 10px 0;
        }

        .no-alerts p {
          color: #6B7280;
        }

        .alerts-summary {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          padding: 15px;
          background: #2A2A2A;
          border-radius: 8px;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .alert-card {
          background: #2A2A2A;
          border-radius: 8px;
          border-left: 4px solid;
          padding: 15px;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .alert-type {
          font-weight: bold;
          font-size: 12px;
        }

        .alert-category {
          background: #374151;
          color: #E5E5E5;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .alert-time {
          color: #6B7280;
          font-size: 12px;
        }

        .alert-message {
          margin-bottom: 10px;
          color: #E5E5E5;
        }

        .alert-details {
          color: #9CA3AF;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

// Trends Tab Component
const TrendsTab: React.FC<{
  trends: PerformanceTrend[];
  formatBytes: (bytes: number) => string;
}> = ({ trends, formatBytes }) => {
  if (trends.length === 0) {
    return <div className="no-data">No trend data available yet. Monitoring needs to run for a few minutes to collect trends.</div>;
  }

  const maxTickTime = Math.max(...trends.map(t => t.tickTime));
  const maxMemory = Math.max(...trends.map(t => t.memoryUsage));

  return (
    <div className="trends-content">
      <div className="chart-container">
        <h4>Tick Time Trend</h4>
        <svg className="trend-chart" viewBox="0 0 400 100">
          <polyline
            fill="none"
            stroke="#22C55E"
            strokeWidth="2"
            points={trends
              .map((trend, index) =>
                `${(index / (trends.length - 1)) * 390 + 5},${95 - (trend.tickTime / maxTickTime) * 85}`
              )
              .join(' ')}
          />
        </svg>
        <div className="chart-legend">
          <div>Max: {maxTickTime.toFixed(2)}ms</div>
          <div>Current: {trends[trends.length - 1]?.tickTime.toFixed(2)}ms</div>
        </div>
      </div>

      <div className="chart-container">
        <h4>Memory Usage Trend</h4>
        <svg className="trend-chart" viewBox="0 0 400 100">
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={trends
              .map((trend, index) =>
                `${(index / (trends.length - 1)) * 390 + 5},${95 - (trend.memoryUsage / maxMemory) * 85}`
              )
              .join(' ')}
          />
        </svg>
        <div className="chart-legend">
          <div>Peak: {formatBytes(maxMemory)}</div>
          <div>Current: {formatBytes(trends[trends.length - 1]?.memoryUsage || 0)}</div>
        </div>
      </div>

      <div className="trends-stats">
        <div className="stat-item">
          <div className="stat-value">{trends.length}</div>
          <div className="stat-label">Data Points</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{((Date.now() - trends[0]?.timestamp) / 60000).toFixed(1)}m</div>
          <div className="stat-label">Time Range</div>
        </div>
      </div>

      <style jsx>{`
        .trends-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #6B7280;
          font-style: italic;
          text-align: center;
        }

        .chart-container {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 20px;
        }

        .chart-container h4 {
          margin: 0 0 15px 0;
          color: #E5E5E5;
        }

        .trend-chart {
          width: 100%;
          height: 120px;
          background: #1A1A1A;
          border-radius: 4px;
        }

        .chart-legend {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 12px;
          color: #9CA3AF;
        }

        .trends-stats {
          display: flex;
          gap: 30px;
          padding: 20px;
          background: #2A2A2A;
          border-radius: 8px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #22C55E;
        }

        .stat-label {
          color: #9CA3AF;
          font-size: 12px;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
};

// Subsystems Tab Component
const SubsystemsTab: React.FC<{
  metrics: PerformanceMetrics | null;
  formatDuration: (ms: number) => string;
}> = ({ metrics, formatDuration }) => {
  if (!metrics) {
    return <div className="no-data">No subsystem data available.</div>;
  }

  const subsystems = Object.entries(metrics.subsystemPerformance);
  const maxTime = Math.max(...subsystems.map(([, time]) => time));

  return (
    <div className="subsystems-content">
      <h3>Subsystem Performance Breakdown</h3>

      <div className="subsystem-list">
        {subsystems.map(([name, time]) => (
          <div key={name} className="subsystem-item">
            <div className="subsystem-info">
              <div className="subsystem-name">{name.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="subsystem-time">{formatDuration(time)}</div>
            </div>
            <div className="subsystem-bar">
              <div
                className="subsystem-fill"
                style={{ width: `${maxTime > 0 ? (time / maxTime) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="subsystem-summary">
        <div className="summary-item">
          <div className="summary-value">{formatDuration(subsystems.reduce((sum, [, time]) => sum + time, 0))}</div>
          <div className="summary-label">Total Processing Time</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{subsystems.find(([, time]) => time === maxTime)?.[0] || 'N/A'}</div>
          <div className="summary-label">Slowest Subsystem</div>
        </div>
      </div>

      <style jsx>{`
        .subsystems-content h3 {
          margin: 0 0 20px 0;
          color: #E5E5E5;
        }

        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #6B7280;
          font-style: italic;
        }

        .subsystem-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }

        .subsystem-item {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 15px;
        }

        .subsystem-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .subsystem-name {
          color: #E5E5E5;
          font-weight: 500;
          text-transform: capitalize;
        }

        .subsystem-time {
          color: #22C55E;
          font-family: monospace;
        }

        .subsystem-bar {
          height: 8px;
          background: #1A1A1A;
          border-radius: 4px;
          overflow: hidden;
        }

        .subsystem-fill {
          height: 100%;
          background: linear-gradient(90deg, #22C55E, #16A34A);
          transition: width 0.3s ease;
        }

        .subsystem-summary {
          display: flex;
          gap: 40px;
          padding: 20px;
          background: #2A2A2A;
          border-radius: 8px;
        }

        .summary-item {
          text-align: center;
        }

        .summary-value {
          font-size: 20px;
          font-weight: bold;
          color: #22C55E;
        }

        .summary-label {
          color: #9CA3AF;
          font-size: 12px;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
};

// Reports Tab Component
const ReportsTab: React.FC<{
  onExportReport: () => void;
}> = ({ onExportReport }) => {
  return (
    <div className="reports-content">
      <h3>Performance Reports</h3>

      <div className="report-section">
        <h4>Export Options</h4>
        <p>Generate comprehensive performance reports for analysis and archival.</p>

        <button onClick={onExportReport} className="export-button">
          <span className="export-icon">📊</span>
          Export Full Performance Report
        </button>

        <div className="report-info">
          <h5>Report Contents:</h5>
          <ul>
            <li>Performance summary and status</li>
            <li>Detailed timing metrics</li>
            <li>Memory usage analysis</li>
            <li>Subsystem performance breakdown</li>
            <li>Active alerts and warnings</li>
            <li>Performance recommendations</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .reports-content h3 {
          margin: 0 0 30px 0;
          color: #E5E5E5;
        }

        .report-section {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 30px;
        }

        .report-section h4 {
          margin: 0 0 10px 0;
          color: #E5E5E5;
        }

        .report-section p {
          color: #9CA3AF;
          margin-bottom: 25px;
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 25px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 30px;
        }

        .export-button:hover {
          background: #2563EB;
        }

        .export-icon {
          font-size: 20px;
        }

        .report-info h5 {
          color: #E5E5E5;
          margin: 0 0 15px 0;
        }

        .report-info ul {
          color: #9CA3AF;
          margin: 0;
          padding-left: 20px;
        }

        .report-info li {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default PerformanceMonitor;