/**
 * Performance Dashboard
 * Comprehensive performance monitoring dashboard combining all monitoring components
 */

import React, { useState, useEffect, useCallback } from 'react';
import PerformanceMonitor from './PerformanceMonitor';
import PerformanceAlerts from './PerformanceAlerts';
import PerformanceTrends from './PerformanceTrends';
import MemoryLeakDetector from './MemoryLeakDetector';
import usePerformanceMonitoring from './usePerformanceMonitoring';
import {
  generatePerformanceReport,
  getPerformanceSummary,
  PerformanceAlert,
} from '../../utils/performance';

interface PerformanceDashboardProps {
  autoStart?: boolean;
  showAdvanced?: boolean;
  enableNotifications?: boolean;
  refreshInterval?: number;
}

type DashboardView = 'overview' | 'monitor' | 'alerts' | 'trends' | 'memory' | 'reports';

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  autoStart = true,
  showAdvanced = true,
  enableNotifications = true,
  refreshInterval = 1000,
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [alertCount, setAlertCount] = useState(0);
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState<PerformanceAlert[]>([]);

  // Use the performance monitoring hook
  const {
    metrics,
    alerts,
    isMonitoring,
    start,
    stop,
    reset,
    getPerformanceStatus,
    getRecommendations,
  } = usePerformanceMonitoring({
    autoStart,
    trackSimulationTicks: true,
    trackSubsystems: showAdvanced,
    refreshInterval,
    alertCallback: handleAlertTriggered,
  });

  // Handle alert notifications
  function handleAlertTriggered(alert: PerformanceAlert) {
    setNotifications(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 notifications

    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== alert.id));
    }, 10000);
  }

  // Update alert count and summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAlertCount(alerts.length);
      setPerformanceSummary(getPerformanceSummary());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [alerts.length, refreshInterval]);

  const handleExportFullReport = useCallback(async () => {
    const report = generatePerformanceReport();
    const recommendations = getRecommendations();

    const fullReport = `
${report}

=== ADDITIONAL ANALYSIS ===
Performance Status: ${getPerformanceStatus().toUpperCase()}
Active Monitoring: ${isMonitoring ? 'ENABLED' : 'DISABLED'}

=== RECOMMENDATIONS ===
${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

=== DASHBOARD STATE ===
Current View: ${currentView}
Alert Count: ${alertCount}
Notifications: ${notifications.length} active

=== EXPORT INFO ===
Exported: ${new Date().toISOString()}
System: ${navigator.userAgent}
    `.trim();

    const blob = new Blob([fullReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [
    getRecommendations,
    getPerformanceStatus,
    isMonitoring,
    currentView,
    alertCount,
    notifications.length,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getViewIcon = (view: DashboardView) => {
    switch (view) {
      case 'overview': return '📊';
      case 'monitor': return '🖥️';
      case 'alerts': return '🚨';
      case 'trends': return '📈';
      case 'memory': return '💾';
      case 'reports': return '📋';
      default: return '📊';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`performance-dashboard ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Floating notifications */}
      {notifications.length > 0 && (
        <div className="floating-notifications">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className="notification-item"
              style={{ borderLeftColor: getStatusColor(notification.type) }}
            >
              <div className="notification-header">
                <span className="notification-type">
                  {notification.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="close-notification"
                >
                  ×
                </button>
              </div>
              <div className="notification-message">{notification.message}</div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-left">
          <h1>Performance Dashboard</h1>
          <div className="status-indicator">
            <div
              className="status-dot"
              style={{ backgroundColor: getStatusColor(getPerformanceStatus()) }}
            />
            <span className="status-text">
              {getPerformanceStatus().toUpperCase()}
            </span>
            {performanceSummary && (
              <span className="status-details">
                • {performanceSummary.averageTickTime?.toFixed(1)}ms avg
                • {formatBytes(metrics?.currentMemoryUsage || 0)} memory
              </span>
            )}
          </div>
        </div>

        <div className="header-controls">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
          <button onClick={handleExportFullReport} className="btn-primary">
            📊 Export Report
          </button>
          {isMonitoring ? (
            <button onClick={stop} className="btn-warning">
              ⏹ Stop Monitoring
            </button>
          ) : (
            <button onClick={start} className="btn-success">
              ▶️ Start Monitoring
            </button>
          )}
          <button onClick={reset} className="btn-secondary">
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="dashboard-navigation">
        {(['overview', 'monitor', 'alerts', 'trends', 'memory', 'reports'] as DashboardView[]).map(view => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={currentView === view ? 'nav-btn active' : 'nav-btn'}
          >
            <span className="nav-icon">{getViewIcon(view)}</span>
            <span className="nav-label">
              {view.charAt(0).toUpperCase() + view.slice(1)}
              {view === 'alerts' && alertCount > 0 && (
                <span className="nav-badge">{alertCount}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {currentView === 'overview' && (
          <OverviewPanel
            metrics={metrics}
            alerts={alerts}
            isMonitoring={isMonitoring}
            summary={performanceSummary}
            recommendations={getRecommendations()}
            onViewChange={setCurrentView}
          />
        )}

        {currentView === 'monitor' && (
          <PerformanceMonitor
            refreshInterval={refreshInterval}
            showAdvancedMetrics={showAdvanced}
            autoStart={false} // Controlled by dashboard
          />
        )}

        {currentView === 'alerts' && (
          <PerformanceAlerts
            refreshInterval={refreshInterval * 2} // Less frequent for alerts
            enableNotifications={enableNotifications}
            onAlertTriggered={handleAlertTriggered}
          />
        )}

        {currentView === 'trends' && (
          <PerformanceTrends
            refreshInterval={refreshInterval * 5} // Less frequent for trends
            showPredictions={showAdvanced}
            enablePatternDetection={showAdvanced}
          />
        )}

        {currentView === 'memory' && showAdvanced && (
          <MemoryLeakDetector
            enabled={isMonitoring}
            checkInterval={refreshInterval * 5}
            onLeakDetected={handleAlertTriggered}
          />
        )}

        {currentView === 'reports' && (
          <ReportsPanel onExportReport={handleExportFullReport} />
        )}
      </div>

      <style jsx>{`
        .performance-dashboard {
          background: #0F172A;
          color: #E2E8F0;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
        }

        .fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }

        .floating-notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }

        .notification-item {
          background: #1E293B;
          border: 1px solid #334155;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .notification-type {
          font-size: 11px;
          font-weight: bold;
          color: #9CA3AF;
        }

        .close-notification {
          background: none;
          border: none;
          color: #6B7280;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-notification:hover {
          color: #EF4444;
        }

        .notification-message {
          font-size: 13px;
          line-height: 1.4;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #334155;
          background: #1E293B;
        }

        .header-left h1 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #F1F5F9;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          font-weight: 500;
        }

        .status-details {
          color: #94A3B8;
          font-size: 12px;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-controls button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
          transition: all 0.2s;
        }

        .btn-primary { background: #3B82F6; color: white; }
        .btn-primary:hover { background: #2563EB; }
        .btn-success { background: #10B981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-warning { background: #F59E0B; color: white; }
        .btn-warning:hover { background: #D97706; }
        .btn-secondary { background: #6B7280; color: white; }
        .btn-secondary:hover { background: #4B5563; }

        .dashboard-navigation {
          display: flex;
          background: #1E293B;
          border-bottom: 1px solid #334155;
          overflow-x: auto;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
        }

        .nav-btn:hover {
          background: #334155;
          color: #F1F5F9;
        }

        .nav-btn.active {
          color: #3B82F6;
          border-bottom-color: #3B82F6;
          background: #0F172A;
        }

        .nav-icon {
          font-size: 16px;
        }

        .nav-label {
          font-size: 13px;
          font-weight: 500;
          position: relative;
        }

        .nav-badge {
          position: absolute;
          top: -8px;
          right: -12px;
          background: #EF4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: bold;
          min-width: 16px;
          text-align: center;
        }

        .dashboard-content {
          padding: 30px;
          min-height: calc(100vh - 140px);
        }
      `}</style>
    </div>
  );
};

// Overview Panel Component
const OverviewPanel: React.FC<{
  metrics: any;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  summary: any;
  recommendations: string[];
  onViewChange: (view: DashboardView) => void;
}> = ({ metrics, alerts, isMonitoring, summary, recommendations, onViewChange }) => {
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <div className="overview-panel">
      <div className="overview-grid">
        <div className="overview-card status-card">
          <h3>System Status</h3>
          <div className="status-content">
            <div className="status-badge">
              {isMonitoring ? '🟢 MONITORING' : '🔴 STOPPED'}
            </div>
            {summary && (
              <div className="status-metrics">
                <div>Uptime: {Math.floor(summary.sessionDuration / 3600000)}h {Math.floor((summary.sessionDuration % 3600000) / 60000)}m</div>
                <div>Memory Efficiency: {summary.memoryEfficiency}%</div>
              </div>
            )}
          </div>
        </div>

        <div className="overview-card alerts-card" onClick={() => onViewChange('alerts')}>
          <h3>Active Alerts</h3>
          <div className="alerts-summary">
            <div className="alert-count total">{alerts.length}</div>
            <div className="alert-breakdown">
              <div className="alert-item critical">
                <span className="count">{criticalAlerts.length}</span>
                <span className="label">Critical</span>
              </div>
              <div className="alert-item warning">
                <span className="count">{warningAlerts.length}</span>
                <span className="label">Warning</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card performance-card" onClick={() => onViewChange('monitor')}>
          <h3>Performance</h3>
          {metrics && (
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-value">{metrics.averageTickTime?.toFixed(1)}ms</div>
                <div className="metric-label">Avg Tick Time</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{(metrics.currentMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                <div className="metric-label">Memory Usage</div>
              </div>
            </div>
          )}
        </div>

        <div className="overview-card trends-card" onClick={() => onViewChange('trends')}>
          <h3>Trends</h3>
          <div className="trends-summary">
            <div className="trend-indicator">📈 Analyzing...</div>
            <div className="trend-note">Click to view detailed analysis</div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>Performance Recommendations</h3>
          <div className="recommendations-list">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div key={index} className="recommendation-item">
                <span className="rec-number">{index + 1}</span>
                <span className="rec-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .overview-panel {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .overview-card {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .overview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border-color: #475569;
        }

        .overview-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #F1F5F9;
        }

        .status-badge {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 12px;
        }

        .status-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #94A3B8;
        }

        .alerts-summary {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .alert-count.total {
          font-size: 32px;
          font-weight: bold;
          color: #3B82F6;
        }

        .alert-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-item .count {
          font-weight: bold;
          font-size: 14px;
        }

        .alert-item .label {
          font-size: 12px;
          color: #94A3B8;
        }

        .alert-item.critical .count { color: #EF4444; }
        .alert-item.warning .count { color: #F59E0B; }

        .performance-metrics {
          display: flex;
          gap: 20px;
        }

        .metric-item {
          text-align: center;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #10B981;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #94A3B8;
        }

        .trends-summary {
          text-align: center;
        }

        .trend-indicator {
          font-size: 20px;
          margin-bottom: 8px;
        }

        .trend-note {
          font-size: 12px;
          color: #94A3B8;
        }

        .recommendations-section {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
        }

        .recommendations-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #F1F5F9;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #0F172A;
          border-radius: 8px;
        }

        .rec-number {
          background: #3B82F6;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .rec-text {
          line-height: 1.5;
          color: #E2E8F0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

// Reports Panel Component
const ReportsPanel: React.FC<{
  onExportReport: () => void;
}> = ({ onExportReport }) => {
  return (
    <div className="reports-panel">
      <div className="reports-header">
        <h3>Performance Reports</h3>
        <p>Generate comprehensive performance reports for analysis and documentation.</p>
      </div>

      <div className="report-options">
        <div className="report-option" onClick={onExportReport}>
          <div className="report-icon">📊</div>
          <div className="report-content">
            <h4>Full Performance Report</h4>
            <p>Complete system analysis including metrics, trends, alerts, and recommendations.</p>
          </div>
          <div className="report-action">Export</div>
        </div>
      </div>

      <style jsx>{`
        .reports-panel {
          max-width: 800px;
        }

        .reports-header {
          margin-bottom: 30px;
        }

        .reports-header h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #F1F5F9;
        }

        .reports-header p {
          color: #94A3B8;
          margin: 0;
        }

        .report-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .report-option {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .report-option:hover {
          background: #334155;
          border-color: #475569;
        }

        .report-icon {
          font-size: 32px;
        }

        .report-content {
          flex: 1;
        }

        .report-content h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #F1F5F9;
        }

        .report-content p {
          margin: 0;
          color: #94A3B8;
          font-size: 14px;
        }

        .report-action {
          background: #3B82F6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default PerformanceDashboard;