# Political AI Desktop Foundation - API Reference

## Overview

This document provides comprehensive API documentation for all implemented systems in the Political AI Desktop Foundation. The foundation includes window management, simulation engine, data persistence, performance monitoring, and integration points between systems.

## Table of Contents

1. [Window Management APIs](#window-management-apis)
2. [Simulation Engine Interfaces](#simulation-engine-interfaces)
3. [Data Persistence Methods](#data-persistence-methods)
4. [Performance Monitoring Tools](#performance-monitoring-tools)
5. [Integration Points](#integration-points)

---

## Window Management APIs

The window management system provides a desktop OS metaphor with multi-window support, built on Tauri's backend architecture.

### Core Types

#### WindowConfig

Defines the configuration for creating new windows.

```typescript
interface WindowConfig {
  window_type: string;          // Application type identifier
  title: string;                // Window title
  width: number;                // Initial width in pixels
  height: number;               // Initial height in pixels
  x?: number;                   // Initial X position (optional)
  y?: number;                   // Initial Y position (optional)
  resizable: boolean;           // Allow window resizing
  minimizable: boolean;         // Show minimize button
  maximizable: boolean;         // Show maximize button
  closable: boolean;            // Show close button
  always_on_top: boolean;       // Keep window above others
  decorations: boolean;         // Show title bar and borders
  transparent: boolean;         // Transparent background
  focus: boolean;               // Focus window on creation
  fullscreen: boolean;          // Start in fullscreen mode
  url?: string;                 // Content URL (optional)
}
```

#### WindowState

Represents the current state of a managed window.

```typescript
interface WindowState {
  label: string;                // Unique window identifier
  config: WindowConfig;         // Window configuration
  z_order: number;              // Stacking order
  is_focused: boolean;          // Has focus
  is_minimized: boolean;        // Minimized state
  is_maximized: boolean;        // Maximized state
  monitor_id?: string;          // Current monitor
  created_at: number;           // Creation timestamp
  last_focused_at: number;      // Last focus timestamp
}
```

#### MonitorInfo

Information about available display monitors.

```typescript
interface MonitorInfo {
  id: string;                   // Unique monitor identifier
  name: string;                 // Display name
  width: number;                // Resolution width
  height: number;               // Resolution height
  x: number;                    // Position X offset
  y: number;                    // Position Y offset
  scale_factor: number;         // DPI scale factor
  is_primary: boolean;          // Primary monitor flag
}
```

### Window Management Context

The `WindowManagerProvider` provides a React context for managing windows throughout the application.

```typescript
interface WindowManagerContextType {
  windows: WindowState[];                                           // All managed windows
  focusedWindow: WindowState | null;                              // Currently focused window
  monitors: MonitorInfo[];                                         // Available monitors

  // Window lifecycle operations
  createWindow: (windowType: string, config: WindowConfig) => Promise<string>;
  closeWindow: (label: string) => Promise<void>;

  // Window state operations
  focusWindow: (label: string) => Promise<void>;
  minimizeWindow: (label: string) => Promise<void>;
  maximizeWindow: (label: string) => Promise<void>;
  unmaximizeWindow: (label: string) => Promise<void>;

  // Window positioning and sizing
  resizeWindow: (label: string, width: number, height: number) => Promise<void>;
  moveWindow: (label: string, x: number, y: number) => Promise<void>;
  snapWindow: (label: string, position: SnapPosition) => Promise<void>;

  // Advanced operations
  cycleWindows: (forward: boolean) => Promise<void>;
  saveWindowState: () => Promise<void>;
  loadWindowState: () => Promise<string[]>;
  refreshWindowList: () => Promise<void>;
}
```

### Usage Examples

#### Creating a New Window

```typescript
import { useWindowManager } from '@/components/windows';

const MyComponent = () => {
  const { createWindow } = useWindowManager();

  const handleCreateCampaignWindow = async () => {
    const config: WindowConfig = {
      window_type: 'campaign_manager',
      title: 'Campaign Manager',
      width: 800,
      height: 600,
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      always_on_top: false,
      decorations: true,
      transparent: false,
      focus: true,
      fullscreen: false
    };

    try {
      const windowLabel = await createWindow('campaign_manager', config);
      console.log(`Created window: ${windowLabel}`);
    } catch (error) {
      console.error('Failed to create window:', error);
    }
  };

  return (
    <button onClick={handleCreateCampaignWindow}>
      Open Campaign Manager
    </button>
  );
};
```

#### Window Snapping

```typescript
const { snapWindow, focusedWindow } = useWindowManager();

// Snap the focused window to the left half of the screen
if (focusedWindow) {
  await snapWindow(focusedWindow.label, 'Left');
}
```

### Snap Positions

Available snap positions for window management:

```typescript
type SnapPosition =
  | 'Left'        // Left half of screen
  | 'Right'       // Right half of screen
  | 'Top'         // Top half of screen
  | 'Bottom'      // Bottom half of screen
  | 'TopLeft'     // Top-left quarter
  | 'TopRight'    // Top-right quarter
  | 'BottomLeft'  // Bottom-left quarter
  | 'BottomRight' // Bottom-right quarter
  | 'Center'      // Center of screen
  | 'Maximize';   // Full screen
```

---

## Simulation Engine Interfaces

The simulation engine provides real-time political strategy simulation with performance monitoring and subsystem coordination.

### Core Engine Types

#### TickResult

Result of a simulation tick with performance metrics.

```typescript
interface TickResult {
  tickNumber: number;               // Current tick number
  tickTime: number;                 // Processing time in milliseconds
  entitiesProcessed: number;        // Number of entities processed
  passed: boolean;                  // Met performance targets
  subsystemResults: SubsystemResult[];  // Individual subsystem results
  issues: TickIssue[];              // Errors and warnings
  completedAt: Date;                // Completion timestamp
}
```

#### SubsystemResult

Performance result for individual subsystem processing.

```typescript
interface SubsystemResult {
  name: string;                     // Subsystem identifier
  processingTime: number;           // Time taken in milliseconds
  entitiesProcessed: number;        // Entities processed
  withinBudget: boolean;            // Met time budget
  timeBudget: number;               // Allocated time budget
  success: boolean;                 // Processing success
  metadata?: Record<string, any>;   // Subsystem-specific data
}
```

#### SimulationState

Current state of the simulation engine.

```typescript
interface SimulationState {
  currentTick: number;              // Current tick number
  startTime: Date;                  // Simulation start time
  isRunning: boolean;               // Running state
  isPaused: boolean;                // Paused state
  totalEntities: number;            // Total entities in simulation
  landscape: PoliticalLandscape;    // Current political landscape
  performanceHistory: TickResult[]; // Performance history
  performanceStatus: 'optimal' | 'degraded' | 'critical';
}
```

### Performance Configuration

#### PerformanceConfig

Configuration for simulation performance monitoring.

```typescript
interface PerformanceConfig {
  maxTickTime: number;              // Maximum tick time in ms
  subsystemBudgets: Map<string, number>;  // Time budgets per subsystem
  degradationThresholds: {
    warning: number;                // Warning threshold percentage
    critical: number;               // Critical threshold percentage
  };
  monitoringWindow: number;         // Performance monitoring window size
}
```

### Engine Events

The simulation engine emits events for lifecycle management and monitoring.

```typescript
type EngineEvent =
  | { type: 'TICK_START'; payload: { tickNumber: number } }
  | { type: 'TICK_COMPLETE'; payload: TickResult }
  | { type: 'PERFORMANCE_WARNING'; payload: { subsystem: string; time: number } }
  | { type: 'PERFORMANCE_CRITICAL'; payload: { subsystem: string; time: number } }
  | { type: 'DEGRADATION_ACTIVATED'; payload: DegradationSettings }
  | { type: 'SIMULATION_PAUSED'; payload: { reason: string } }
  | { type: 'SIMULATION_RESUMED'; payload: {} }
  | { type: 'ERROR'; payload: { error: Error; subsystem?: string } };
```

### Usage Examples

#### Subscribing to Engine Events

```typescript
import { useEffect } from 'react';
import { simulationEngine } from '@/engine';

const PerformanceMonitor = () => {
  useEffect(() => {
    const handleEngineEvent = (event: EngineEvent) => {
      switch (event.type) {
        case 'TICK_COMPLETE':
          console.log(`Tick ${event.payload.tickNumber} completed in ${event.payload.tickTime}ms`);
          break;
        case 'PERFORMANCE_WARNING':
          console.warn(`Performance warning in ${event.payload.subsystem}: ${event.payload.time}ms`);
          break;
        case 'PERFORMANCE_CRITICAL':
          console.error(`Critical performance issue in ${event.payload.subsystem}`);
          break;
      }
    };

    simulationEngine.addEventListener(handleEngineEvent);

    return () => {
      simulationEngine.removeEventListener(handleEngineEvent);
    };
  }, []);

  return <div>Monitoring simulation performance...</div>;
};
```

---

## Data Persistence Methods

The foundation includes comprehensive data persistence for political entities, relationships, and simulation state using MongoDB.

### Entity Schemas

#### Politician Schema

```javascript
const PoliticianSchema = {
  _id: ObjectId,
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['Leader', 'Senator', 'Representative', 'LocalOfficial', 'Advisor'],
    required: true
  },
  party_affiliation: { type: String, required: true },
  political_stance: {
    economic: { type: Number, min: -1, max: 1, required: true },
    social: { type: Number, min: -1, max: 1, required: true },
    environmental: { type: Number, min: -1, max: 1, required: true },
    foreign_policy: { type: Number, min: -1, max: 1, required: true }
  },
  attributes: {
    charisma: { type: Number, min: 0, max: 100, required: true },
    intelligence: { type: Number, min: 0, max: 100, required: true },
    integrity: { type: Number, min: 0, max: 100, required: true },
    experience: { type: Number, min: 0, max: 100, required: true },
    influence: { type: Number, min: 0, max: 100, required: true }
  },
  relationships: [{
    target_id: { type: ObjectId, required: true },
    relationship_type: {
      type: String,
      enum: ['Ally', 'Rival', 'Neutral', 'Mentor', 'Protege'],
      required: true
    },
    strength: { type: Number, min: -1, max: 1, required: true },
    last_updated: { type: Date, default: Date.now }
  }],
  voting_record: [{
    policy_id: { type: ObjectId, required: true },
    vote: { type: String, enum: ['For', 'Against', 'Abstain'], required: true },
    date: { type: Date, required: true }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};
```

#### Political Bloc Schema

```javascript
const PoliticalBlocSchema = {
  _id: ObjectId,
  name: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['Party', 'Coalition', 'Faction', 'PressureGroup'],
    required: true
  },
  description: String,
  ideology: {
    economic: { type: Number, min: -1, max: 1, required: true },
    social: { type: Number, min: -1, max: 1, required: true },
    environmental: { type: Number, min: -1, max: 1, required: true },
    foreign_policy: { type: Number, min: -1, max: 1, required: true }
  },
  members: [{
    politician_id: { type: ObjectId, required: true },
    role: {
      type: String,
      enum: ['Leader', 'Deputy', 'Spokesperson', 'Member'],
      default: 'Member'
    },
    joined_date: { type: Date, default: Date.now },
    influence_score: { type: Number, min: 0, max: 100, default: 50 }
  }],
  policies: [{
    policy_id: { type: ObjectId, required: true },
    support_level: {
      type: String,
      enum: ['Strongly Support', 'Support', 'Neutral', 'Oppose', 'Strongly Oppose'],
      required: true
    },
    priority: { type: Number, min: 1, max: 10, default: 5 }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
};
```

### Database Operations

#### Connection Management

```javascript
import { MongoClient } from 'mongodb';

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(process.env.DATABASE_NAME);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  getCollection(name) {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }
}
```

#### Entity Repository Pattern

```javascript
class PoliticianRepository {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.collection = this.db.getCollection('politicians');
  }

  async create(politician) {
    const result = await this.collection.insertOne({
      ...politician,
      created_at: new Date(),
      updated_at: new Date()
    });
    return result.insertedId;
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByRole(role) {
    return await this.collection.find({ role }).toArray();
  }

  async updateAttributes(id, attributes) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          attributes,
          updated_at: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  async addRelationship(politicianId, relationship) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(politicianId) },
      {
        $push: { relationships: relationship },
        $set: { updated_at: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  async recordVote(politicianId, vote) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(politicianId) },
      {
        $push: { voting_record: vote },
        $set: { updated_at: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }
}
```

---

## Performance Monitoring Tools

The performance monitoring system provides real-time metrics, alerts, and trend analysis for the simulation engine.

### Performance Metrics

#### PerformanceMetrics Interface

```typescript
interface PerformanceMetrics {
  tickTime: number;                 // Current tick processing time
  averageTickTime: number;          // Average over monitoring window
  maxTickTime: number;              // Maximum recorded tick time
  minTickTime: number;              // Minimum recorded tick time
  ticksPerSecond: number;           // Processing rate
  entitiesProcessed: number;        // Total entities processed
  subsystemMetrics: Map<string, SubsystemMetrics>;  // Per-subsystem metrics
  memoryUsage: MemoryMetrics;       // Memory usage statistics
  performanceScore: number;         // Overall performance score (0-100)
  degradationLevel: 'none' | 'low' | 'medium' | 'high';
}
```

#### PerformanceAlert Interface

```typescript
interface PerformanceAlert {
  id: string;                       // Unique alert identifier
  level: 'info' | 'warning' | 'error' | 'critical';  // Alert severity
  subsystem: string;                // Affected subsystem
  message: string;                  // Alert description
  timestamp: Date;                  // Alert timestamp
  value: number;                    // Metric value that triggered alert
  threshold: number;                // Threshold that was exceeded
  acknowledged: boolean;            // Has been acknowledged
  resolved: boolean;                // Has been resolved
}
```

### Performance Monitoring Hook

```typescript
import usePerformanceMonitoring from '@/components/monitoring/usePerformanceMonitoring';

const PerformanceComponent = () => {
  const {
    metrics,
    alerts,
    trends,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    acknowledgeAlert,
    getPerformanceReport
  } = usePerformanceMonitoring();

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  return (
    <div>
      <h2>Performance Status</h2>
      <p>Current Tick Time: {metrics.tickTime}ms</p>
      <p>Performance Score: {metrics.performanceScore}/100</p>
      <p>Active Alerts: {alerts.filter(a => !a.acknowledged).length}</p>
    </div>
  );
};
```

### Performance Utilities

#### Timing Decorators

```typescript
import { performanceTimed } from '@/components/monitoring/usePerformanceMonitoring';

class SimulationSubsystem {
  @performanceTimed('politics_subsystem')
  async processPoliticalInteractions(entities: PoliticalEntity[]) {
    // Subsystem processing logic
    // Performance timing is automatically recorded
  }

  @performanceTimed('relationship_subsystem')
  async updateRelationships(politicians: Politician[]) {
    // Relationship processing logic
  }
}
```

#### Manual Performance Tracking

```typescript
import {
  markTickStart,
  markTickEnd,
  trackSubsystemPerformance
} from '@/utils/performance';

class SimulationEngine {
  async runTick(tickNumber: number) {
    markTickStart(tickNumber);

    try {
      // Process politics subsystem
      const politicsStart = performance.now();
      await this.processPolitics();
      const politicsEnd = performance.now();
      trackSubsystemPerformance('politics', politicsEnd - politicsStart);

      // Process relationships subsystem
      const relationshipsStart = performance.now();
      await this.processRelationships();
      const relationshipsEnd = performance.now();
      trackSubsystemPerformance('relationships', relationshipsEnd - relationshipsStart);

      markTickEnd(tickNumber, true);
    } catch (error) {
      markTickEnd(tickNumber, false, error);
      throw error;
    }
  }
}
```

---

## Integration Points

### System Integration Architecture

The foundation provides several integration points for connecting different systems and extending functionality.

#### Event Bus System

```typescript
interface EventBus {
  subscribe<T>(eventType: string, handler: (data: T) => void): () => void;
  publish<T>(eventType: string, data: T): void;
  unsubscribe(eventType: string, handler: Function): void;
}

// Usage example
const eventBus = getEventBus();

// Subscribe to window events
const unsubscribe = eventBus.subscribe('window.created', (windowData) => {
  console.log('New window created:', windowData);
});

// Publish simulation events
eventBus.publish('simulation.tick.complete', {
  tickNumber: 42,
  tickTime: 85,
  entitiesProcessed: 150
});
```

#### State Synchronization

```typescript
interface StateSyncManager {
  syncWindowState(): Promise<void>;
  syncSimulationState(): Promise<void>;
  syncPerformanceMetrics(): Promise<void>;
  registerStateProvider(provider: StateProvider): void;
  unregisterStateProvider(providerId: string): void;
}

interface StateProvider {
  id: string;
  getState(): any;
  setState(state: any): void;
  onStateChange(callback: (state: any) => void): void;
}
```

#### Plugin Architecture

```typescript
interface PluginInterface {
  id: string;
  name: string;
  version: string;
  dependencies: string[];

  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;
}

interface PluginContext {
  windowManager: WindowManagerContextType;
  simulationEngine: SimulationEngine;
  performanceMonitor: PerformanceMonitor;
  eventBus: EventBus;
  database: DatabaseManager;
}
```

---

## Error Handling and Validation

### Validation Framework

The foundation includes comprehensive validation using Zod schemas for type safety and runtime validation.

```typescript
import { z } from 'zod';

// Political entity validation
export const PoliticianSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: z.enum(['Leader', 'Senator', 'Representative', 'LocalOfficial', 'Advisor']),
  attributes: z.object({
    charisma: z.number().min(0).max(100),
    intelligence: z.number().min(0).max(100),
    integrity: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    influence: z.number().min(0).max(100)
  })
});

// Window configuration validation
export const WindowConfigSchema = z.object({
  window_type: z.string().min(1),
  title: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  resizable: z.boolean(),
  minimizable: z.boolean(),
  maximizable: z.boolean(),
  closable: z.boolean()
});
```

### Error Types

```typescript
class PoliticalValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public constraint: string
  ) {
    super(message);
    this.name = 'PoliticalValidationError';
  }
}

class WindowManagementError extends Error {
  constructor(
    message: string,
    public operation: string,
    public windowLabel?: string
  ) {
    super(message);
    this.name = 'WindowManagementError';
  }
}

class PerformanceError extends Error {
  constructor(
    message: string,
    public subsystem: string,
    public metrics: PerformanceMetrics
  ) {
    super(message);
    this.name = 'PerformanceError';
  }
}
```

---

## Configuration and Environment

### Environment Variables

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=political_simulation
REDIS_URL=redis://localhost:6379

# Performance Monitoring
MAX_TICK_TIME=100
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_HISTORY_SIZE=1000

# Window Management
DEFAULT_WINDOW_WIDTH=800
DEFAULT_WINDOW_HEIGHT=600
ENABLE_WINDOW_SNAPPING=true

# Development
NODE_ENV=development
LOG_LEVEL=info
ENABLE_DEVTOOLS=true
```

### Configuration Types

```typescript
interface ApplicationConfig {
  database: {
    uri: string;
    name: string;
    options: MongoClientOptions;
  };
  performance: {
    maxTickTime: number;
    monitoringEnabled: boolean;
    historySize: number;
    degradationThresholds: {
      warning: number;
      critical: number;
    };
  };
  windows: {
    defaultWidth: number;
    defaultHeight: number;
    enableSnapping: boolean;
    multiMonitorSupport: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
}
```

---

## Testing Support

### Test Utilities

```typescript
import { createTestWindowManager } from '@/test/utils/window-manager';
import { createMockSimulationEngine } from '@/test/utils/simulation-engine';
import { createTestPerformanceMonitor } from '@/test/utils/performance-monitor';

describe('Window Management Integration', () => {
  let windowManager: WindowManagerContextType;

  beforeEach(() => {
    windowManager = createTestWindowManager();
  });

  it('should create and manage windows', async () => {
    const config: WindowConfig = {
      window_type: 'test',
      title: 'Test Window',
      width: 400,
      height: 300,
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      always_on_top: false,
      decorations: true,
      transparent: false,
      focus: true,
      fullscreen: false
    };

    const windowLabel = await windowManager.createWindow('test', config);
    expect(windowLabel).toBeDefined();
    expect(windowManager.windows).toHaveLength(1);
  });
});
```

### Mock Implementations

```typescript
export const mockWindowManager: WindowManagerContextType = {
  windows: [],
  focusedWindow: null,
  monitors: [
    {
      id: 'primary',
      name: 'Primary Monitor',
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      scale_factor: 1.0,
      is_primary: true
    }
  ],
  createWindow: jest.fn().mockResolvedValue('test-window-1'),
  closeWindow: jest.fn().mockResolvedValue(undefined),
  focusWindow: jest.fn().mockResolvedValue(undefined),
  // ... other mock implementations
};
```

---

This API reference provides comprehensive documentation for all implemented systems in the Political AI Desktop Foundation. Each API includes type definitions, usage examples, and integration guidance to support extension and customization of the foundation.