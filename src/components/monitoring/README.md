# Performance Monitoring Dashboard

A comprehensive real-time performance monitoring system for the Political Simulation application, designed to track, analyze, and optimize system performance.

## Overview

This performance monitoring system provides:

- **Real-time performance tracking** with sub-100ms target tick times
- **Memory usage monitoring** and leak detection (baseline <200MB, peak <500MB)
- **Automated performance alerts** with configurable thresholds
- **Historical performance trends** and pattern analysis
- **Comprehensive reporting** and data export capabilities

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Performance Dashboard                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Monitor   │ │   Alerts    │ │   Trends    │ │ Memory  │ │
│  │ Component   │ │ Component   │ │ Component   │ │Detector │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│           usePerformanceMonitoring Hook                     │
├─────────────────────────────────────────────────────────────┤
│              Performance Utilities                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Metrics   │ │   Alerts    │ │   Trends    │ │Reports  │ │
│  │ Collection  │ │ Management  │ │  Analysis   │ │Generator│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. PerformanceDashboard
The main dashboard component that provides a unified interface for all monitoring features.

**Features:**
- Overview panel with system status
- Tabbed interface for different monitoring aspects
- Real-time notifications
- Full-screen mode support
- Export functionality

**Usage:**
```typescript
import { PerformanceDashboard } from './components/monitoring';

<PerformanceDashboard
  autoStart={true}
  showAdvanced={true}
  enableNotifications={true}
  refreshInterval={1000}
/>
```

### 2. PerformanceMonitor
Real-time performance metrics display with charts and breakdowns.

**Metrics Tracked:**
- Simulation tick time (current, average, min/max)
- Memory usage (current, peak, leak score)
- Error rates and warnings
- Subsystem performance breakdown
- Entity processing metrics

### 3. PerformanceAlerts
Configurable alert system with multiple severity levels.

**Alert Types:**
- **Critical**: Requires immediate attention (tick time >200ms, memory >500MB)
- **Warning**: Performance degradation (tick time >100ms, memory >200MB)
- **Info**: General performance information

**Features:**
- Browser notifications
- Customizable alert rules
- Alert history tracking
- Cooldown periods to prevent spam

### 4. PerformanceTrends
Historical performance analysis with pattern detection.

**Analysis Features:**
- Linear regression trend analysis
- Performance pattern detection (spikes, dips, cyclical patterns)
- Growth pattern identification
- Correlation analysis
- Automated recommendations

### 5. MemoryLeakDetector
Advanced memory leak detection and analysis.

**Detection Methods:**
- Gradual memory increase monitoring
- Sudden memory spike detection
- DOM node leak tracking
- Event listener leak detection
- React fiber leak monitoring

### 6. usePerformanceMonitoring Hook
React hook for integrating performance monitoring into components.

**Features:**
- Automatic simulation tick tracking
- Subsystem performance monitoring
- Error tracking and reporting
- Performance status analysis
- HOC and decorator support

## Performance Targets

### Timing Metrics
- **Target Tick Time**: <50ms (ideal)
- **Warning Threshold**: >100ms
- **Critical Threshold**: >200ms
- **UI Response Time**: <100ms

### Memory Metrics
- **Baseline Memory**: <200MB
- **Peak Memory**: <500MB
- **Memory Leak Score**: <30/100 (good)
- **Growth Rate**: <10% per minute

### System Metrics
- **Entity Processing**: <10ms per politician
- **AI Decision Latency**: <150ms
- **Error Rate**: 0 errors/minute (target)
- **Subsystem Balance**: No single subsystem >40% of total time

## Installation and Setup

1. **Import the monitoring system:**
```typescript
import {
  PerformanceDashboard,
  usePerformanceMonitoring,
  startPerformanceMonitoring
} from './components/monitoring';
```

2. **Basic setup:**
```typescript
// Start monitoring when app initializes
useEffect(() => {
  startPerformanceMonitoring();
}, []);

// Use the dashboard component
<PerformanceDashboard />
```

3. **Hook integration:**
```typescript
const MyComponent = () => {
  const {
    metrics,
    alerts,
    isMonitoring,
    startTick,
    endTick,
    trackSubsystem
  } = usePerformanceMonitoring({
    autoStart: true,
    trackSimulationTicks: true
  });

  // Your component logic...
};
```

## Configuration Options

### Dashboard Configuration
```typescript
interface PerformanceDashboardProps {
  autoStart?: boolean;           // Start monitoring automatically
  showAdvanced?: boolean;        // Show advanced features
  enableNotifications?: boolean; // Browser notifications
  refreshInterval?: number;      // Update frequency (ms)
}
```

### Monitoring Configuration
```typescript
interface PerformanceConfig {
  maxTickTime: number;           // 100ms default
  memoryWarningThreshold: number; // 200MB default
  memoryCriticalThreshold: number; // 500MB default
  measurementInterval: number;    // 1000ms default
  trendRetentionPeriod: number;   // 5 minutes default
  maxHistorySize: number;         // 300 data points default
  targetTickTime: number;         // 50ms ideal
  targetMemoryUsage: number;      // 100MB ideal
}
```

## Integration with Simulation

### Automatic Tick Tracking
The monitoring system automatically detects simulation state changes and tracks performance:

```typescript
// Automatically tracked when simulation state changes:
// - Game time updates
// - Player approval changes
// - Event list modifications
// - Policy updates
```

### Manual Subsystem Tracking
For fine-grained performance monitoring:

```typescript
const handlePolicyProposal = async (policy) => {
  const startTime = performance.now();

  try {
    await processPolicy(policy);
    trackSubsystemPerformance('policyProcessing', performance.now() - startTime);
  } catch (error) {
    recordPerformanceError(error);
    throw error;
  }
};
```

### Decorator Support
Use the performance timing decorator for automatic tracking:

```typescript
class GameEngine {
  @performanceTimed('aiDecisionMaking')
  async makeAIDecision(politician) {
    // AI logic here
    // Performance automatically tracked
  }
}
```

## Alert Rules and Thresholds

### Default Alert Rules

1. **Slow Simulation Tick Time**
   - Condition: Average tick time >100ms
   - Severity: Warning
   - Cooldown: 30 seconds

2. **Critical Performance**
   - Condition: Average tick time >200ms
   - Severity: Critical
   - Cooldown: 15 seconds

3. **High Memory Usage**
   - Condition: Memory usage >200MB
   - Severity: Warning
   - Cooldown: 60 seconds

4. **Memory Leak Detection**
   - Condition: Memory leak score >70/100
   - Severity: Critical
   - Cooldown: 2 minutes

### Custom Alert Rules
Add custom alert rules for specific monitoring needs:

```typescript
const customRules = [
  {
    id: 'custom_rule',
    name: 'Custom Performance Rule',
    condition: (metrics) => metrics.entityProcessingTime > 50,
    severity: 'warning',
    category: 'timing',
    message: (metrics) => `Entity processing too slow: ${metrics.entityProcessingTime}ms`,
    threshold: 50,
    enabled: true,
    cooldownPeriod: 30000,
  }
];
```

## Performance Reports

### Automated Report Generation
The system generates comprehensive performance reports including:

- **System Summary**: Overall status, uptime, efficiency metrics
- **Timing Analysis**: Tick time statistics, subsystem breakdown
- **Memory Analysis**: Usage patterns, leak detection results
- **Alert History**: Recent alerts and resolutions
- **Recommendations**: Automated performance improvement suggestions

### Export Formats
- **Text Reports**: Human-readable performance summaries
- **JSON Data**: Raw metrics for external analysis
- **CSV Data**: Time-series data for spreadsheet analysis

## Testing and Validation

### PerformanceMonitoringTest Component
Comprehensive test component for validating the monitoring system:

```typescript
<PerformanceMonitoringTest
  enableStressTest={true}
  simulationSpeed={2}
/>
```

**Test Modes:**
- **Dashboard View**: Interactive dashboard testing
- **Integration Test**: Simulation integration validation
- **Stress Test**: High-load performance testing

### Stress Testing
The stress test simulates high-load conditions:
- Rapid memory allocation/deallocation
- High-frequency subsystem calls
- Artificial computation load
- Error simulation
- Performance degradation scenarios

## Browser Compatibility

### Required Features
- **Performance API**: For accurate timing measurements
- **Memory API**: For memory usage tracking (Chrome/Edge)
- **Notification API**: For browser notifications
- **Modern JavaScript**: ES2017+ features

### Fallback Behavior
- Graceful degradation when APIs unavailable
- Mock data for unsupported browsers
- Alternative timing methods for older browsers

## Best Practices

### Performance Monitoring
1. **Start monitoring early** in the application lifecycle
2. **Use appropriate refresh intervals** (1-5 seconds for real-time)
3. **Monitor subsystems selectively** to avoid overhead
4. **Set realistic thresholds** based on your hardware
5. **Review reports regularly** for optimization opportunities

### Memory Management
1. **Monitor for gradual increases** in memory usage
2. **Clean up event listeners** and timers properly
3. **Avoid creating large objects** in hot code paths
4. **Use object pooling** for frequently created objects
5. **Profile memory usage** during development

### Alert Configuration
1. **Start with default thresholds** and adjust based on experience
2. **Use cooldown periods** to prevent alert spam
3. **Prioritize critical alerts** over warnings
4. **Test alert rules** with known performance issues
5. **Document custom rules** for team understanding

## Troubleshooting

### Common Issues

**High Memory Usage:**
- Check for event listener leaks
- Review data structure growth patterns
- Monitor React component lifecycle issues
- Validate cleanup in useEffect hooks

**Slow Performance:**
- Profile code with browser dev tools
- Check for blocking synchronous operations
- Review algorithm complexity
- Monitor network request patterns

**Missing Metrics:**
- Verify browser API support
- Check console for JavaScript errors
- Ensure proper component integration
- Validate hook usage patterns

**False Alerts:**
- Adjust threshold values
- Increase cooldown periods
- Review alert rule conditions
- Monitor during different usage patterns

## Development Workflow

### Adding New Metrics
1. Extend `PerformanceMetrics` interface
2. Update metrics collection in `PerformanceMonitor`
3. Add visualization components
4. Update report generation
5. Test with various scenarios

### Creating Custom Components
1. Use existing monitoring hooks
2. Follow established component patterns
3. Implement proper error boundaries
4. Add comprehensive TypeScript types
5. Include unit tests

### Performance Optimization
1. Use React.memo for expensive components
2. Implement proper dependency arrays
3. Avoid unnecessary re-renders
4. Use callback optimization
5. Monitor component render performance

## Future Enhancements

### Planned Features
- **Real-time collaboration** performance metrics
- **Advanced ML-based** anomaly detection
- **Performance regression** testing integration
- **Cloud-based reporting** and analysis
- **Mobile device** performance monitoring

### Extensibility
The system is designed for easy extension:
- Plugin architecture for custom metrics
- Configurable alert systems
- Modular component design
- Flexible data export formats
- Integration-ready APIs

---

## Support

For questions, issues, or contributions:
1. Check the component documentation
2. Review test cases for usage examples
3. Examine the PerformanceMonitoringTest component
4. Create issues with detailed reproduction steps
5. Follow the established code patterns

This performance monitoring system provides enterprise-grade monitoring capabilities specifically tailored for political simulation applications, ensuring optimal user experience and system reliability.