/**
 * Performance Alerts System
 * Real-time alert management and notification system for performance monitoring
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPerformanceAlerts,
  getPerformanceMetrics,
  PerformanceAlert,
  PerformanceMetrics
} from '../../utils/performance';

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  severity: 'info' | 'warning' | 'critical';
  category: 'memory' | 'timing' | 'error' | 'resource';
  message: (metrics: PerformanceMetrics) => string;
  threshold: number;
  enabled: boolean;
  cooldownPeriod: number; // milliseconds
  lastTriggered?: number;
}

interface PerformanceAlertsProps {
  refreshInterval?: number;
  maxAlerts?: number;
  enableNotifications?: boolean;
  customRules?: AlertRule[];
  onAlertTriggered?: (alert: PerformanceAlert) => void;
  onAlertResolved?: (alert: PerformanceAlert) => void;
}

const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({
  refreshInterval = 2000,
  maxAlerts = 50,
  enableNotifications = true,
  customRules = [],
  onAlertTriggered,
  onAlertResolved,
}) => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alertHistory, setAlertHistory] = useState<PerformanceAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const previousAlertsRef = useRef<PerformanceAlert[]>([]);
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  // Default alert rules
  const defaultRules: AlertRule[] = [
    {
      id: 'slow_tick_time',
      name: 'Slow Simulation Tick Time',
      condition: (m) => m.averageTickTime > 100,
      severity: 'warning',
      category: 'timing',
      message: (m) => `Simulation running slowly (${m.averageTickTime.toFixed(2)}ms avg tick time)`,
      threshold: 100,
      enabled: true,
      cooldownPeriod: 30000, // 30 seconds
    },
    {
      id: 'critical_tick_time',
      name: 'Critical Simulation Performance',
      condition: (m) => m.averageTickTime > 200,
      severity: 'critical',
      category: 'timing',
      message: (m) => `Critical performance issue (${m.averageTickTime.toFixed(2)}ms avg tick time)`,
      threshold: 200,
      enabled: true,
      cooldownPeriod: 15000, // 15 seconds
    },
    {
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      condition: (m) => m.currentMemoryUsage > 200 * 1024 * 1024, // 200MB
      severity: 'warning',
      category: 'memory',
      message: (m) => `High memory usage (${(m.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB)`,
      threshold: 200 * 1024 * 1024,
      enabled: true,
      cooldownPeriod: 60000, // 60 seconds
    },
    {
      id: 'critical_memory_usage',
      name: 'Critical Memory Usage',
      condition: (m) => m.currentMemoryUsage > 500 * 1024 * 1024, // 500MB
      severity: 'critical',
      category: 'memory',
      message: (m) => `Critical memory usage (${(m.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB)`,
      threshold: 500 * 1024 * 1024,
      enabled: true,
      cooldownPeriod: 30000, // 30 seconds
    },
    {
      id: 'memory_leak',
      name: 'Memory Leak Detected',
      condition: (m) => m.memoryLeakScore > 70,
      severity: 'critical',
      category: 'memory',
      message: (m) => `Memory leak detected (score: ${m.memoryLeakScore.toFixed(1)}/100)`,
      threshold: 70,
      enabled: true,
      cooldownPeriod: 120000, // 2 minutes
    },
    {
      id: 'system_errors',
      name: 'System Errors',
      condition: (m) => m.errorsPerMinute > 0,
      severity: 'warning',
      category: 'error',
      message: (m) => `System errors detected (${m.errorsPerMinute} errors/minute)`,
      threshold: 0,
      enabled: true,
      cooldownPeriod: 45000, // 45 seconds
    },
    {
      id: 'ai_performance',
      name: 'Slow AI Processing',
      condition: (m) => m.subsystemPerformance.aiDecisionMaking > 150,
      severity: 'warning',
      category: 'timing',
      message: (m) => `AI processing is slow (${m.subsystemPerformance.aiDecisionMaking.toFixed(2)}ms)`,
      threshold: 150,
      enabled: true,
      cooldownPeriod: 60000, // 60 seconds
    },
    {
      id: 'ui_responsiveness',
      name: 'Poor UI Responsiveness',
      condition: (m) => m.uiResponseTime > 100,
      severity: 'info',
      category: 'timing',
      message: (m) => `UI responsiveness degraded (${m.uiResponseTime.toFixed(2)}ms)`,
      threshold: 100,
      enabled: true,
      cooldownPeriod: 30000, // 30 seconds
    },
  ];

  // Initialize alert rules
  useEffect(() => {
    setAlertRules([...defaultRules, ...customRules]);
  }, [customRules]);

  // Request notification permission
  useEffect(() => {
    if (enableNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          notificationPermissionRef.current = permission;
        });
      } else {
        notificationPermissionRef.current = Notification.permission;
      }
    }
  }, [enableNotifications]);

  // Show browser notification
  const showNotification = useCallback((alert: PerformanceAlert) => {
    if (!enableNotifications || notificationPermissionRef.current !== 'granted') return;

    const notification = new Notification(`Performance Alert: ${alert.type.toUpperCase()}`, {
      body: alert.message,
      icon: getAlertIcon(alert.type),
      tag: alert.id,
      requireInteraction: alert.type === 'critical',
    });

    // Auto-close after 10 seconds for non-critical alerts
    if (alert.type !== 'critical') {
      setTimeout(() => notification.close(), 10000);
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, [enableNotifications]);

  // Custom alert evaluation
  const evaluateCustomRules = useCallback((metrics: PerformanceMetrics): PerformanceAlert[] => {
    const now = Date.now();
    const newAlerts: PerformanceAlert[] = [];

    alertRules.forEach(rule => {
      if (!rule.enabled) return;
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldownPeriod) return;

      if (rule.condition(metrics)) {
        const alert: PerformanceAlert = {
          id: `custom_${rule.id}_${now}`,
          type: rule.severity,
          category: rule.category,
          message: rule.message(metrics),
          threshold: rule.threshold,
          currentValue: getCurrentValueForRule(rule, metrics),
          timestamp: now,
          resolved: false,
        };

        newAlerts.push(alert);

        // Update last triggered time
        rule.lastTriggered = now;
      }
    });

    return newAlerts;
  }, [alertRules]);

  // Get current value for a rule
  const getCurrentValueForRule = (rule: AlertRule, metrics: PerformanceMetrics): number => {
    switch (rule.id) {
      case 'slow_tick_time':
      case 'critical_tick_time':
        return metrics.averageTickTime;
      case 'high_memory_usage':
      case 'critical_memory_usage':
        return metrics.currentMemoryUsage;
      case 'memory_leak':
        return metrics.memoryLeakScore;
      case 'system_errors':
        return metrics.errorsPerMinute;
      case 'ai_performance':
        return metrics.subsystemPerformance.aiDecisionMaking;
      case 'ui_responsiveness':
        return metrics.uiResponseTime;
      default:
        return 0;
    }
  };

  // Main monitoring loop
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const currentMetrics = getPerformanceMetrics();
      const systemAlerts = getPerformanceAlerts();

      setMetrics(currentMetrics);

      // Combine system alerts with custom rule alerts
      const customAlerts = evaluateCustomRules(currentMetrics);
      const allAlerts = [...systemAlerts, ...customAlerts];

      // Filter out duplicate alerts
      const uniqueAlerts = allAlerts.filter((alert, index, self) =>
        index === self.findIndex(a => a.message === alert.message && a.category === alert.category)
      );

      // Limit number of alerts
      const limitedAlerts = uniqueAlerts.slice(0, maxAlerts);

      // Check for new alerts
      const previousAlerts = previousAlertsRef.current;
      const newAlerts = limitedAlerts.filter(alert =>
        !previousAlerts.some(prev => prev.id === alert.id)
      );

      // Check for resolved alerts
      const resolvedAlerts = previousAlerts.filter(prev =>
        !limitedAlerts.some(current => current.id === prev.id) && !prev.resolved
      );

      // Update alerts state
      setAlerts(limitedAlerts);

      // Update alert history
      if (newAlerts.length > 0 || resolvedAlerts.length > 0) {
        setAlertHistory(prev => {
          const updated = [...prev];

          // Add new alerts to history
          newAlerts.forEach(alert => {
            updated.push(alert);

            // Trigger notification
            showNotification(alert);

            // Trigger callback
            if (onAlertTriggered) {
              onAlertTriggered(alert);
            }
          });

          // Mark resolved alerts
          resolvedAlerts.forEach(alert => {
            const historyIndex = updated.findIndex(h => h.id === alert.id);
            if (historyIndex !== -1) {
              updated[historyIndex] = { ...alert, resolved: true };
            }

            // Trigger callback
            if (onAlertResolved) {
              onAlertResolved(alert);
            }
          });

          // Keep only recent history (last 100 alerts)
          return updated.slice(-100);
        });
      }

      previousAlertsRef.current = limitedAlerts;
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [
    isEnabled,
    refreshInterval,
    maxAlerts,
    evaluateCustomRules,
    showNotification,
    onAlertTriggered,
    onAlertResolved,
  ]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'memory': return '#8B5CF6';
      case 'timing': return '#06B6D4';
      case 'error': return '#EF4444';
      case 'resource': return '#10B981';
      default: return '#6B7280';
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    selectedFilter === 'all' || alert.type === selectedFilter
  );

  const clearAllAlerts = () => {
    setAlerts([]);
    setAlertHistory([]);
  };

  const toggleRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
  };

  return (
    <div className="performance-alerts">
      <div className="alerts-header">
        <h3>Performance Alerts</h3>
        <div className="alerts-controls">
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={isEnabled ? 'btn-warning' : 'btn-success'}
          >
            {isEnabled ? 'Disable' : 'Enable'} Alerts
          </button>
          <button onClick={clearAllAlerts} className="btn-secondary">
            Clear All
          </button>
        </div>
      </div>

      <div className="alerts-stats">
        <div className="stat-item">
          <div className="stat-value">{alertStats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-item critical">
          <div className="stat-value">{alertStats.critical}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-item warning">
          <div className="stat-value">{alertStats.warning}</div>
          <div className="stat-label">Warning</div>
        </div>
        <div className="stat-item info">
          <div className="stat-value">{alertStats.info}</div>
          <div className="stat-label">Info</div>
        </div>
      </div>

      <div className="alerts-filters">
        {(['all', 'critical', 'warning', 'info'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={selectedFilter === filter ? 'filter-btn active' : 'filter-btn'}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <div className="success-icon">✓</div>
            <p>No {selectedFilter === 'all' ? '' : selectedFilter} alerts</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className="alert-item"
              style={{ borderLeftColor: getSeverityColor(alert.type) }}
            >
              <div className="alert-header">
                <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                <span
                  className="alert-type"
                  style={{ color: getSeverityColor(alert.type) }}
                >
                  {alert.type.toUpperCase()}
                </span>
                <span
                  className="alert-category"
                  style={{ backgroundColor: getCategoryColor(alert.category) }}
                >
                  {alert.category}
                </span>
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="alert-message">{alert.message}</div>
              <div className="alert-details">
                <div>Current: {alert.currentValue.toFixed(2)}</div>
                <div>Threshold: {alert.threshold}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="alert-rules-section">
        <h4>Alert Rules</h4>
        <div className="rules-list">
          {alertRules.map(rule => (
            <div key={rule.id} className="rule-item">
              <div className="rule-info">
                <div className="rule-name">{rule.name}</div>
                <div className="rule-details">
                  <span style={{ color: getSeverityColor(rule.severity) }}>
                    {rule.severity.toUpperCase()}
                  </span>
                  <span style={{ color: getCategoryColor(rule.category) }}>
                    {rule.category}
                  </span>
                  <span>Threshold: {rule.threshold}</span>
                </div>
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={rule.enabled ? 'toggle-btn enabled' : 'toggle-btn disabled'}
              >
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .performance-alerts {
          background: #1a1a1a;
          color: #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }

        .alerts-header h3 {
          margin: 0;
          color: #F59E0B;
        }

        .alerts-controls {
          display: flex;
          gap: 10px;
        }

        .alerts-controls button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .btn-success { background: #22C55E; color: white; }
        .btn-warning { background: #F59E0B; color: white; }
        .btn-secondary { background: #6B7280; color: white; }

        .alerts-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-item {
          background: #2A2A2A;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }

        .stat-item.critical { border-top: 3px solid #EF4444; }
        .stat-item.warning { border-top: 3px solid #F59E0B; }
        .stat-item.info { border-top: 3px solid #3B82F6; }

        .stat-value {
          color: #22C55E;
          font-size: 24px;
          font-weight: bold;
        }

        .stat-item.critical .stat-value { color: #EF4444; }
        .stat-item.warning .stat-value { color: #F59E0B; }
        .stat-item.info .stat-value { color: #3B82F6; }

        .stat-label {
          color: #9CA3AF;
          font-size: 12px;
          margin-top: 5px;
        }

        .alerts-filters {
          display: flex;
          gap: 5px;
          margin-bottom: 20px;
        }

        .filter-btn {
          padding: 8px 16px;
          background: #2A2A2A;
          border: 1px solid #374151;
          border-radius: 4px;
          color: #9CA3AF;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #374151;
          color: #E5E5E5;
        }

        .filter-btn.active {
          background: #3B82F6;
          border-color: #3B82F6;
          color: white;
        }

        .alerts-list {
          margin-bottom: 30px;
        }

        .no-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100px;
          text-align: center;
        }

        .success-icon {
          font-size: 24px;
          color: #22C55E;
          margin-bottom: 10px;
        }

        .no-alerts p {
          color: #6B7280;
          margin: 0;
        }

        .alert-item {
          background: #2A2A2A;
          border-radius: 6px;
          border-left: 4px solid;
          padding: 15px;
          margin-bottom: 10px;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .alert-icon {
          font-size: 16px;
        }

        .alert-type {
          font-weight: bold;
          font-size: 12px;
        }

        .alert-category {
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          text-transform: uppercase;
        }

        .alert-time {
          color: #6B7280;
          font-size: 11px;
          margin-left: auto;
        }

        .alert-message {
          color: #E5E5E5;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .alert-details {
          display: flex;
          gap: 20px;
          color: #9CA3AF;
          font-size: 12px;
        }

        .alert-rules-section h4 {
          color: #E5E5E5;
          margin-bottom: 15px;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #2A2A2A;
          border-radius: 6px;
          padding: 12px 15px;
        }

        .rule-info {
          flex: 1;
        }

        .rule-name {
          color: #E5E5E5;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .rule-details {
          display: flex;
          gap: 15px;
          font-size: 11px;
        }

        .toggle-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
        }

        .toggle-btn.enabled {
          background: #22C55E;
          color: white;
        }

        .toggle-btn.disabled {
          background: #6B7280;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default PerformanceAlerts;