/**
 * Performance Trends Component
 * Historical performance data analysis and visualization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getPerformanceTrends,
  getPerformanceMetrics,
  PerformanceTrend,
  PerformanceMetrics
} from '../../utils/performance';

interface TrendAnalysis {
  metric: keyof Pick<PerformanceTrend, 'tickTime' | 'memoryUsage' | 'entityCount'>;
  direction: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  slope: number; // rate of change
  correlation: number; // correlation with time
  recommendation: string;
}

interface PerformancePattern {
  id: string;
  type: 'spike' | 'dip' | 'cyclical' | 'linear_growth' | 'exponential_growth';
  startTime: number;
  endTime: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedMetrics: string[];
}

interface PerformanceTrendsProps {
  refreshInterval?: number;
  retentionPeriod?: number; // minutes
  showPredictions?: boolean;
  enablePatternDetection?: boolean;
}

const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({
  refreshInterval = 5000,
  retentionPeriod = 30, // 30 minutes
  showPredictions = true,
  enablePatternDetection = true,
}) => {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'5m' | '15m' | '30m' | '1h'>('15m');
  const [selectedMetric, setSelectedMetric] = useState<'tickTime' | 'memoryUsage' | 'entityCount'>('tickTime');
  const [analysis, setAnalysis] = useState<TrendAnalysis[]>([]);
  const [patterns, setPatterns] = useState<PerformancePattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Update data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTrends = getPerformanceTrends();
      const metrics = getPerformanceMetrics();

      setTrends(currentTrends);
      setCurrentMetrics(metrics);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Filter trends by time range
  const filteredTrends = useMemo(() => {
    if (trends.length === 0) return [];

    const now = Date.now();
    const timeRangeMs = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
    }[selectedTimeRange];

    const cutoff = now - timeRangeMs;
    return trends.filter(trend => trend.timestamp >= cutoff);
  }, [trends, selectedTimeRange]);

  // Calculate trend analysis
  const calculateTrendAnalysis = useCallback((data: PerformanceTrend[]): TrendAnalysis[] => {
    if (data.length < 5) return [];

    const analyses: TrendAnalysis[] = [];
    const metrics: (keyof Pick<PerformanceTrend, 'tickTime' | 'memoryUsage' | 'entityCount'>)[] = [
      'tickTime',
      'memoryUsage',
      'entityCount'
    ];

    metrics.forEach(metric => {
      const values = data.map(d => d[metric]);
      const times = data.map(d => d.timestamp);

      if (values.length < 3) return;

      // Calculate linear regression
      const { slope, correlation } = calculateLinearRegression(times, values);

      // Calculate change percentage
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const changePercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

      // Determine direction
      let direction: 'improving' | 'degrading' | 'stable';
      if (Math.abs(changePercent) < 5) {
        direction = 'stable';
      } else if (metric === 'tickTime') {
        direction = changePercent > 0 ? 'degrading' : 'improving';
      } else {
        direction = changePercent > 10 ? 'degrading' : changePercent < -10 ? 'improving' : 'stable';
      }

      // Generate recommendation
      const recommendation = generateRecommendation(metric, direction, changePercent, slope);

      analyses.push({
        metric,
        direction,
        changePercent,
        slope,
        correlation,
        recommendation,
      });
    });

    return analyses;
  }, []);

  // Linear regression calculation
  const calculateLinearRegression = (x: number[], y: number[]) => {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0, correlation: 0 };

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;

    return { slope, intercept, correlation };
  };

  // Generate recommendation based on trend analysis
  const generateRecommendation = (
    metric: string,
    direction: string,
    changePercent: number,
    slope: number
  ): string => {
    if (direction === 'stable') {
      return `${metric} is stable. Monitor for changes.`;
    }

    switch (metric) {
      case 'tickTime':
        if (direction === 'degrading') {
          if (changePercent > 50) {
            return 'Critical: Simulation performance severely degraded. Immediate optimization required.';
          } else if (changePercent > 20) {
            return 'Warning: Simulation performance declining. Review recent changes and optimize algorithms.';
          } else {
            return 'Caution: Slight performance decline detected. Monitor closely.';
          }
        } else {
          return 'Good: Simulation performance improving. Continue current optimizations.';
        }

      case 'memoryUsage':
        if (direction === 'degrading') {
          if (changePercent > 100) {
            return 'Critical: Memory usage doubled. Check for memory leaks immediately.';
          } else if (changePercent > 50) {
            return 'Warning: Significant memory growth. Investigate data structures and garbage collection.';
          } else {
            return 'Caution: Memory usage increasing. Review memory management practices.';
          }
        } else {
          return 'Good: Memory usage optimized or stable. Continue monitoring.';
        }

      case 'entityCount':
        if (direction === 'degrading' && changePercent > 50) {
          return 'Info: Entity count growing rapidly. Ensure performance scales with entity growth.';
        } else {
          return `Entity count ${direction}. Normal simulation progression.`;
        }

      default:
        return 'Monitor for changes.';
    }
  };

  // Detect performance patterns
  const detectPatterns = useCallback((data: PerformanceTrend[]): PerformancePattern[] => {
    if (data.length < 10) return [];

    const patterns: PerformancePattern[] = [];

    // Detect spikes and dips
    const tickTimes = data.map(d => d.tickTime);
    const memoryUsages = data.map(d => d.memoryUsage);

    // Calculate moving averages and standard deviations
    const windowSize = Math.min(5, Math.floor(data.length / 3));
    const tickTimeSpikes = detectSpikes(tickTimes, data, windowSize, 'tickTime');
    const memorySpikes = detectSpikes(memoryUsages, data, windowSize, 'memoryUsage');

    patterns.push(...tickTimeSpikes, ...memorySpikes);

    // Detect cyclical patterns (simplified)
    const cyclicalPatterns = detectCyclicalPatterns(data);
    patterns.push(...cyclicalPatterns);

    // Detect growth patterns
    const growthPatterns = detectGrowthPatterns(data);
    patterns.push(...growthPatterns);

    return patterns.slice(0, 10); // Limit to 10 most recent patterns
  }, []);

  // Detect spikes in data
  const detectSpikes = (
    values: number[],
    data: PerformanceTrend[],
    windowSize: number,
    metric: string
  ): PerformancePattern[] => {
    if (values.length < windowSize * 2) return [];

    const patterns: PerformancePattern[] = [];
    const threshold = 2; // Standard deviations

    for (let i = windowSize; i < values.length - windowSize; i++) {
      const window = values.slice(i - windowSize, i + windowSize);
      const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);

      const currentValue = values[i];
      const zScore = stdDev > 0 ? Math.abs(currentValue - mean) / stdDev : 0;

      if (zScore > threshold) {
        const severity = zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low';
        const type = currentValue > mean ? 'spike' : 'dip';

        patterns.push({
          id: `${type}_${metric}_${data[i].timestamp}`,
          type,
          startTime: data[Math.max(0, i - 2)].timestamp,
          endTime: data[Math.min(data.length - 1, i + 2)].timestamp,
          severity,
          description: `${type} in ${metric} detected (${zScore.toFixed(1)}σ deviation)`,
          affectedMetrics: [metric],
        });
      }
    }

    return patterns;
  };

  // Detect cyclical patterns (simplified)
  const detectCyclicalPatterns = (data: PerformanceTrend[]): PerformancePattern[] => {
    // This is a simplified cyclical detection
    // In a real implementation, you might use FFT or autocorrelation
    if (data.length < 20) return [];

    const patterns: PerformancePattern[] = [];

    // Look for recurring patterns in tick time
    const tickTimes = data.map(d => d.tickTime);
    const periods = [5, 10, 15]; // Check for these period lengths

    periods.forEach(period => {
      let cyclicalScore = 0;
      const comparisons = Math.floor(tickTimes.length / period) - 1;

      for (let i = 0; i < comparisons; i++) {
        const start1 = i * period;
        const start2 = (i + 1) * period;

        let similarity = 0;
        for (let j = 0; j < period; j++) {
          if (start2 + j < tickTimes.length) {
            const val1 = tickTimes[start1 + j];
            const val2 = tickTimes[start2 + j];
            const diff = Math.abs(val1 - val2) / Math.max(val1, val2);
            similarity += 1 - Math.min(diff, 1);
          }
        }
        cyclicalScore += similarity / period;
      }

      cyclicalScore /= comparisons;

      if (cyclicalScore > 0.7) { // High similarity score
        patterns.push({
          id: `cyclical_${period}_${data[0].timestamp}`,
          type: 'cyclical',
          startTime: data[0].timestamp,
          endTime: data[data.length - 1].timestamp,
          severity: 'low',
          description: `Cyclical pattern detected with period of ~${period} measurements`,
          affectedMetrics: ['tickTime'],
        });
      }
    });

    return patterns;
  };

  // Detect growth patterns
  const detectGrowthPatterns = (data: PerformanceTrend[]): PerformancePattern[] => {
    if (data.length < 10) return [];

    const patterns: PerformancePattern[] = [];
    const metrics = ['memoryUsage', 'entityCount'] as const;

    metrics.forEach(metric => {
      const values = data.map(d => d[metric]);
      const times = data.map(d => d.timestamp);

      // Test for exponential growth
      const logValues = values.map(v => Math.log(Math.max(v, 1)));
      const { correlation: expCorrelation } = calculateLinearRegression(times, logValues);

      // Test for linear growth
      const { correlation: linCorrelation } = calculateLinearRegression(times, values);

      if (expCorrelation > 0.8) {
        patterns.push({
          id: `exp_growth_${metric}_${data[0].timestamp}`,
          type: 'exponential_growth',
          startTime: data[0].timestamp,
          endTime: data[data.length - 1].timestamp,
          severity: 'high',
          description: `Exponential growth detected in ${metric}`,
          affectedMetrics: [metric],
        });
      } else if (linCorrelation > 0.7) {
        patterns.push({
          id: `linear_growth_${metric}_${data[0].timestamp}`,
          type: 'linear_growth',
          startTime: data[0].timestamp,
          endTime: data[data.length - 1].timestamp,
          severity: 'medium',
          description: `Linear growth detected in ${metric}`,
          affectedMetrics: [metric],
        });
      }
    });

    return patterns;
  };

  // Run analysis when data changes
  useEffect(() => {
    if (filteredTrends.length > 0) {
      setIsAnalyzing(true);

      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        const newAnalysis = calculateTrendAnalysis(filteredTrends);
        setAnalysis(newAnalysis);

        if (enablePatternDetection) {
          const newPatterns = detectPatterns(filteredTrends);
          setPatterns(newPatterns);
        }

        setIsAnalyzing(false);
      }, 100);
    }
  }, [filteredTrends, calculateTrendAnalysis, detectPatterns, enablePatternDetection]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return '📈';
      case 'degrading': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'improving': return '#22C55E';
      case 'degrading': return '#EF4444';
      case 'stable': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPatternIcon = (type: PerformancePattern['type']) => {
    switch (type) {
      case 'spike': return '📊';
      case 'dip': return '📉';
      case 'cyclical': return '🔄';
      case 'linear_growth': return '📈';
      case 'exponential_growth': return '🚀';
      default: return '📋';
    }
  };

  const getPatternColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  };

  // Generate chart points for SVG
  const generateChartPoints = () => {
    if (filteredTrends.length === 0) return '';

    const values = filteredTrends.map(d => d[selectedMetric]);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    return filteredTrends
      .map((trend, index) => {
        const x = (index / (filteredTrends.length - 1)) * 390 + 5;
        const y = 95 - ((trend[selectedMetric] - minValue) / range) * 85;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="performance-trends">
      <div className="trends-header">
        <h3>Performance Trends Analysis</h3>
        <div className="trends-controls">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="time-range-select"
          >
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="30m">Last 30 minutes</option>
            <option value="1h">Last 1 hour</option>
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="metric-select"
          >
            <option value="tickTime">Tick Time</option>
            <option value="memoryUsage">Memory Usage</option>
            <option value="entityCount">Entity Count</option>
          </select>
        </div>
      </div>

      {isAnalyzing && (
        <div className="analyzing-indicator">
          <div className="spinner"></div>
          <span>Analyzing trends...</span>
        </div>
      )}

      <div className="chart-section">
        <h4>
          {selectedMetric === 'tickTime' && 'Tick Time Trend'}
          {selectedMetric === 'memoryUsage' && 'Memory Usage Trend'}
          {selectedMetric === 'entityCount' && 'Entity Count Trend'}
        </h4>
        <div className="chart-container">
          <svg className="trend-chart" viewBox="0 0 400 100">
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            {filteredTrends.length > 1 && (
              <>
                <polyline
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2"
                  points={generateChartPoints()}
                />
                <polygon
                  fill="url(#trendGradient)"
                  points={`${generateChartPoints()},390,95 5,95`}
                />
              </>
            )}
          </svg>
          <div className="chart-info">
            {filteredTrends.length > 0 && (
              <>
                <div>Data Points: {filteredTrends.length}</div>
                <div>
                  Current: {' '}
                  {selectedMetric === 'tickTime' && formatDuration(filteredTrends[filteredTrends.length - 1]?.tickTime || 0)}
                  {selectedMetric === 'memoryUsage' && formatBytes(filteredTrends[filteredTrends.length - 1]?.memoryUsage || 0)}
                  {selectedMetric === 'entityCount' && filteredTrends[filteredTrends.length - 1]?.entityCount.toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="analysis-section">
        <h4>Trend Analysis</h4>
        {analysis.length === 0 ? (
          <div className="no-analysis">
            <p>Insufficient data for trend analysis. Need at least 5 data points.</p>
          </div>
        ) : (
          <div className="analysis-list">
            {analysis.map(item => (
              <div key={item.metric} className="analysis-item">
                <div className="analysis-header">
                  <span className="metric-name">
                    {item.metric === 'tickTime' && 'Tick Time'}
                    {item.metric === 'memoryUsage' && 'Memory Usage'}
                    {item.metric === 'entityCount' && 'Entity Count'}
                  </span>
                  <span
                    className="direction-indicator"
                    style={{ color: getDirectionColor(item.direction) }}
                  >
                    {getDirectionIcon(item.direction)} {item.direction.toUpperCase()}
                  </span>
                  <span className="change-percent">
                    {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="analysis-details">
                  <div>Correlation: {Math.abs(item.correlation).toFixed(3)}</div>
                  <div>Slope: {item.slope.toExponential(2)}</div>
                </div>
                <div className="recommendation">
                  {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {enablePatternDetection && patterns.length > 0 && (
        <div className="patterns-section">
          <h4>Detected Patterns ({patterns.length})</h4>
          <div className="patterns-list">
            {patterns.map(pattern => (
              <div key={pattern.id} className="pattern-item">
                <div className="pattern-header">
                  <span className="pattern-icon">{getPatternIcon(pattern.type)}</span>
                  <span className="pattern-type">
                    {pattern.type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span
                    className="pattern-severity"
                    style={{ color: getPatternColor(pattern.severity) }}
                  >
                    {pattern.severity.toUpperCase()}
                  </span>
                  <span className="pattern-duration">
                    {formatDuration(pattern.endTime - pattern.startTime)}
                  </span>
                </div>
                <div className="pattern-description">
                  {pattern.description}
                </div>
                <div className="pattern-metrics">
                  Affected: {pattern.affectedMetrics.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-trends {
          background: #1a1a1a;
          color: #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .trends-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }

        .trends-header h3 {
          margin: 0;
          color: #06B6D4;
        }

        .trends-controls {
          display: flex;
          gap: 10px;
        }

        .time-range-select, .metric-select {
          padding: 6px 12px;
          background: #2A2A2A;
          border: 1px solid #374151;
          border-radius: 4px;
          color: #E5E5E5;
          font-size: 12px;
        }

        .analyzing-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: #2A2A2A;
          border-radius: 6px;
          color: #9CA3AF;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #333;
          border-top: 2px solid #06B6D4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .chart-section h4, .analysis-section h4, .patterns-section h4 {
          color: #E5E5E5;
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .chart-container {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .trend-chart {
          width: 100%;
          height: 120px;
          background: #1A1A1A;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .chart-info {
          display: flex;
          justify-content: space-between;
          color: #9CA3AF;
          font-size: 12px;
        }

        .no-analysis {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          color: #6B7280;
          margin-bottom: 30px;
        }

        .analysis-list, .patterns-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }

        .analysis-item, .pattern-item {
          background: #2A2A2A;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #06B6D4;
        }

        .analysis-header, .pattern-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .metric-name, .pattern-type {
          font-weight: bold;
          color: #E5E5E5;
        }

        .direction-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: bold;
        }

        .change-percent {
          color: #9CA3AF;
          font-family: monospace;
          font-size: 12px;
        }

        .analysis-details {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
          color: #9CA3AF;
          font-size: 12px;
        }

        .recommendation, .pattern-description {
          color: #E5E5E5;
          font-size: 13px;
          line-height: 1.4;
        }

        .pattern-icon {
          font-size: 16px;
        }

        .pattern-severity {
          font-size: 11px;
          font-weight: bold;
        }

        .pattern-duration {
          color: #9CA3AF;
          font-size: 11px;
        }

        .pattern-metrics {
          color: #9CA3AF;
          font-size: 11px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default PerformanceTrends;