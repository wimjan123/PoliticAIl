# Political AI Desktop Foundation - Developer Guide

## Overview

This guide provides comprehensive instructions for extending and customizing the Political AI Desktop Foundation. It covers project structure, development workflow, best practices, and detailed instructions for adding new features.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Workflow](#development-workflow)
3. [Adding New Political Applications](#adding-new-political-applications)
4. [Extending Simulation Capabilities](#extending-simulation-capabilities)
5. [Performance Optimization](#performance-optimization)
6. [Testing Strategy](#testing-strategy)
7. [Debugging and Troubleshooting](#debugging-and-troubleshooting)

---

## Project Structure

### High-Level Architecture

```
politicail/
├── src/                          # React TypeScript frontend
│   ├── components/               # UI components
│   │   ├── desktop/             # Desktop shell components
│   │   ├── windows/             # Window management system
│   │   └── monitoring/          # Performance monitoring
│   ├── engine/                  # Simulation engine
│   ├── services/                # External service integrations
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   └── hooks/                   # Custom React hooks
├── src-tauri/                   # Tauri backend (Rust)
│   ├── src/                     # Rust source code
│   └── Cargo.toml               # Rust dependencies
├── scripts/                     # Database and utility scripts
├── docs/                        # Documentation
└── coverage/                    # Test coverage reports
```

### Core Systems Overview

#### 1. Desktop Shell (`src/components/desktop/`)
- **DesktopShell.tsx**: Main desktop container
- **taskbar/**: Application launcher and window management
- **notifications/**: System-wide notification center
- **background/**: Desktop background and wallpaper management
- **ContextMenu.tsx**: Right-click context menu system

#### 2. Window Management (`src/components/windows/`)
- **WindowManager.tsx**: Core window management logic
- **WindowControls.tsx**: Window title bar and controls
- **WindowList.tsx**: Active window list display
- **WindowCreator.tsx**: Window creation utilities

#### 3. Simulation Engine (`src/engine/`)
- **types.ts**: Engine type definitions
- **subsystems/**: Individual simulation subsystems
- Core tick-based simulation loop

#### 4. Performance Monitoring (`src/components/monitoring/`)
- **PerformanceMonitor.tsx**: Real-time performance tracking
- **PerformanceDashboard.tsx**: Performance visualization
- **MemoryLeakDetector.tsx**: Memory usage monitoring
- **usePerformanceMonitoring.tsx**: Performance hooks

#### 5. Data Layer (`src/database/`)
- **schemas/**: MongoDB collection schemas
- **models/**: Data model definitions
- Repository pattern for data access

---

## Development Workflow

### Setting Up Development Environment

#### 1. Prerequisites
```bash
# Install required tools
node --version    # ≥18.0.0
npm --version     # ≥8.0.0
rustc --version   # Latest stable
docker --version  # For database services
```

#### 2. Clone and Install
```bash
git clone https://github.com/your-org/politicail.git
cd politicail
npm install
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.development

# Configure development settings
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=political_simulation_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
ENABLE_DEVTOOLS=true
```

#### 4. Start Development Services
```bash
# Start database services
npm run docker:up:dev

# Start backend server (new terminal)
npm run dev:backend

# Start frontend development server (new terminal)
npm run dev

# Start Tauri desktop app (new terminal)
npm run tauri:dev
```

### Code Standards and Best Practices

#### TypeScript Configuration
- **Strict mode enabled**: All types must be explicit
- **Path mapping**: Use `@/` for absolute imports
- **Interface over type**: Prefer interfaces for object types
- **Explicit return types**: All functions must declare return types

```typescript
// Good: Explicit types and interfaces
interface WindowCreationParams {
  windowType: string;
  config: WindowConfig;
}

const createWindow = async (params: WindowCreationParams): Promise<string> => {
  // Implementation
};

// Bad: Implicit types
const createWindow = async (windowType, config) => {
  // Implementation
};
```

#### Component Structure
```typescript
// Standard component template
import React, { useState, useEffect, useCallback } from 'react';
import { SomeType } from '@/types';
import { useSomeHook } from '@/hooks';
import styles from './Component.module.css';

interface ComponentProps {
  // Props with explicit types
  title: string;
  onAction?: (data: SomeType) => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // State management
  const [state, setState] = useState<SomeType | null>(null);

  // Custom hooks
  const { data, loading } = useSomeHook();

  // Event handlers
  const handleAction = useCallback((data: SomeType) => {
    onAction?.(data);
  }, [onAction]);

  // Effects
  useEffect(() => {
    // Initialization logic
  }, []);

  // Render
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
};

export default Component;
```

#### Performance Considerations
- **Use React.memo()** for expensive components
- **Implement useCallback()** for event handlers
- **Leverage useMemo()** for expensive calculations
- **Monitor rendering** with React DevTools

---

## Adding New Political Applications

### Application Architecture

Political applications are self-contained modules that run within the desktop environment. Each application includes:

1. **Application Definition**: Metadata and configuration
2. **Window Configuration**: Default window settings
3. **Component Implementation**: React components
4. **State Management**: Application-specific state
5. **Data Integration**: Database connections and API calls

### Step-by-Step Guide

#### 1. Define Application Metadata

Create a new application definition in `src/data/applications.ts`:

```typescript
export const campaignManagerApp: PoliticalApp = {
  id: 'campaign_manager',
  name: 'Campaign Manager',
  icon: '/icons/campaign-manager.svg',
  description: 'Manage political campaigns, strategies, and messaging',
  category: 'management',
  isRunning: false,
  isMinimized: false,
  isFocused: false,
  windowId: undefined
};
```

#### 2. Create Window Configuration

Define default window settings:

```typescript
export const campaignManagerWindowConfig: WindowConfig = {
  window_type: 'campaign_manager',
  title: 'Campaign Manager',
  width: 1000,
  height: 700,
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
```

#### 3. Implement Main Component

Create the application component in `src/components/apps/campaign-manager/`:

```typescript
// CampaignManager.tsx
import React, { useState, useEffect } from 'react';
import { useWindowManager } from '@/components/windows';
import { useCampaignData } from '@/hooks/useCampaignData';
import { CampaignList } from './CampaignList';
import { CampaignDetails } from './CampaignDetails';
import { CampaignCreator } from './CampaignCreator';
import styles from './CampaignManager.module.css';

interface CampaignManagerProps {
  windowId?: string;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ windowId }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  const { campaigns, loading, createCampaign, updateCampaign } = useCampaignData();

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
  };

  const handleCreateCampaign = () => {
    setShowCreator(true);
  };

  const handleCampaignCreated = (campaign: Campaign) => {
    createCampaign(campaign);
    setShowCreator(false);
    setSelectedCampaign(campaign.id);
  };

  if (loading) {
    return <div className={styles.loading}>Loading campaigns...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.toolbar}>
          <button onClick={handleCreateCampaign}>New Campaign</button>
        </div>
        <CampaignList
          campaigns={campaigns}
          selectedId={selectedCampaign}
          onSelect={handleCampaignSelect}
        />
      </div>

      <div className={styles.content}>
        {showCreator && (
          <CampaignCreator
            onCancel={() => setShowCreator(false)}
            onCreate={handleCampaignCreated}
          />
        )}

        {selectedCampaign && !showCreator && (
          <CampaignDetails
            campaignId={selectedCampaign}
            onUpdate={updateCampaign}
          />
        )}

        {!selectedCampaign && !showCreator && (
          <div className={styles.placeholder}>
            Select a campaign or create a new one
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignManager;
```

#### 4. Create Data Hooks

Implement data management hooks in `src/hooks/`:

```typescript
// useCampaignData.ts
import { useState, useEffect, useCallback } from 'react';
import { campaignService } from '@/services/campaignService';
import { Campaign } from '@/types/campaign';

export const useCampaignData = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await campaignService.getAllCampaigns();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (campaign: Omit<Campaign, 'id'>) => {
    try {
      const newCampaign = await campaignService.createCampaign(campaign);
      setCampaigns(prev => [...prev, newCampaign]);
      return newCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      throw err;
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    try {
      const updatedCampaign = await campaignService.updateCampaign(id, updates);
      setCampaigns(prev => prev.map(c => c.id === id ? updatedCampaign : c));
      return updatedCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    reload: loadCampaigns
  };
};
```

#### 5. Implement Service Layer

Create service classes in `src/services/`:

```typescript
// campaignService.ts
import { BaseService } from './baseService';
import { Campaign } from '@/types/campaign';

class CampaignService extends BaseService {
  private readonly endpoint = '/api/campaigns';

  async getAllCampaigns(): Promise<Campaign[]> {
    const response = await this.get<Campaign[]>(this.endpoint);
    return response.data;
  }

  async getCampaignById(id: string): Promise<Campaign> {
    const response = await this.get<Campaign>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    const response = await this.post<Campaign>(this.endpoint, campaign);
    return response.data;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const response = await this.patch<Campaign>(`${this.endpoint}/${id}`, updates);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`);
  }
}

export const campaignService = new CampaignService();
```

#### 6. Register Application

Add the new application to the application registry:

```typescript
// src/data/applications.ts
import { campaignManagerApp } from './apps/campaignManager';

export const applications: PoliticalApp[] = [
  campaignManagerApp,
  // ... other applications
];

export const applicationConfigs: Record<string, WindowConfig> = {
  campaign_manager: campaignManagerWindowConfig,
  // ... other configurations
};
```

#### 7. Add Application Launcher

Update the desktop launcher to include the new application:

```typescript
// src/components/desktop/launcher/AppLauncher.tsx
const handleLaunchApp = async (app: PoliticalApp) => {
  try {
    const config = applicationConfigs[app.id];
    if (!config) {
      throw new Error(`No configuration found for app: ${app.id}`);
    }

    const windowLabel = await createWindow(app.id, config);
    console.log(`Launched ${app.name} in window: ${windowLabel}`);
  } catch (error) {
    console.error('Failed to launch application:', error);
  }
};
```

---

## Extending Simulation Capabilities

### Simulation Architecture

The simulation engine uses a tick-based architecture with subsystems that process different aspects of the political simulation:

1. **Political Interaction Subsystem**: Handles politician relationships and interactions
2. **Policy Subsystem**: Manages policy creation, voting, and implementation
3. **Event Subsystem**: Processes political events and news
4. **AI Behavior Subsystem**: Controls AI politician decision-making

### Creating New Subsystems

#### 1. Define Subsystem Interface

Create a new subsystem in `src/simulation/subsystems/`:

```typescript
// MediaSubsystem.ts
import { SubsystemBase } from './SubsystemBase';
import { TickResult, SubsystemResult } from '@/engine/types';
import { PoliticalLandscape } from '@/types/entities';

interface MediaEvent {
  id: string;
  type: 'scandal' | 'endorsement' | 'interview' | 'debate';
  politician_ids: string[];
  impact_score: number;
  timestamp: Date;
}

export class MediaSubsystem extends SubsystemBase {
  protected readonly name = 'media';
  protected readonly timeBudget = 15; // 15ms budget

  private mediaEvents: MediaEvent[] = [];
  private mediaInfluence: Map<string, number> = new Map();

  async processTick(
    landscape: PoliticalLandscape,
    tickNumber: number
  ): Promise<SubsystemResult> {
    const startTime = performance.now();

    try {
      // Generate random media events
      await this.generateMediaEvents(landscape, tickNumber);

      // Process media influence on politicians
      await this.processMediaInfluence(landscape);

      // Update politician public perception
      await this.updatePublicPerception(landscape);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        name: this.name,
        processingTime,
        entitiesProcessed: landscape.politicians.length,
        withinBudget: processingTime <= this.timeBudget,
        timeBudget: this.timeBudget,
        success: true,
        metadata: {
          eventsGenerated: this.mediaEvents.length,
          politiciansAffected: this.mediaInfluence.size
        }
      };
    } catch (error) {
      const endTime = performance.now();
      return this.createErrorResult(endTime - startTime, error);
    }
  }

  private async generateMediaEvents(
    landscape: PoliticalLandscape,
    tickNumber: number
  ): Promise<void> {
    // Media event generation logic
    const eventProbability = 0.1; // 10% chance per tick

    if (Math.random() < eventProbability) {
      const randomPolitician = this.selectRandomPolitician(landscape.politicians);
      const eventType = this.selectRandomEventType();

      const mediaEvent: MediaEvent = {
        id: `media_${tickNumber}_${Date.now()}`,
        type: eventType,
        politician_ids: [randomPolitician.id],
        impact_score: this.calculateImpactScore(eventType, randomPolitician),
        timestamp: new Date()
      };

      this.mediaEvents.push(mediaEvent);
    }
  }

  private async processMediaInfluence(landscape: PoliticalLandscape): Promise<void> {
    for (const event of this.mediaEvents) {
      for (const politicianId of event.politician_ids) {
        const currentInfluence = this.mediaInfluence.get(politicianId) || 0;
        this.mediaInfluence.set(politicianId, currentInfluence + event.impact_score);
      }
    }
  }

  private async updatePublicPerception(landscape: PoliticalLandscape): Promise<void> {
    for (const politician of landscape.politicians) {
      const mediaInfluence = this.mediaInfluence.get(politician.id) || 0;

      // Update politician attributes based on media influence
      if (mediaInfluence !== 0) {
        politician.attributes.influence = Math.max(
          0,
          Math.min(100, politician.attributes.influence + mediaInfluence * 0.1)
        );
      }
    }
  }
}
```

#### 2. Register Subsystem

Add the new subsystem to the engine configuration:

```typescript
// src/engine/SimulationEngine.ts
import { MediaSubsystem } from '@/simulation/subsystems/MediaSubsystem';

export class SimulationEngine {
  private subsystems: Map<string, SubsystemBase> = new Map();

  constructor() {
    // Register subsystems
    this.subsystems.set('politics', new PoliticsSubsystem());
    this.subsystems.set('relationships', new RelationshipSubsystem());
    this.subsystems.set('media', new MediaSubsystem()); // New subsystem
  }
}
```

#### 3. Configure Subsystem Dependencies

Define execution order and dependencies:

```typescript
// src/engine/config.ts
export const subsystemConfig: SubsystemConfig[] = [
  {
    name: 'politics',
    priority: 1,
    dependencies: [],
    timeBudget: 30,
    canRunParallel: false,
    scalingFactor: 1.2
  },
  {
    name: 'relationships',
    priority: 2,
    dependencies: ['politics'],
    timeBudget: 20,
    canRunParallel: true,
    scalingFactor: 1.1
  },
  {
    name: 'media',
    priority: 3,
    dependencies: ['politics'],
    timeBudget: 15,
    canRunParallel: true,
    scalingFactor: 1.0
  }
];
```

### AI Behavior Extension

#### Adding New Personality Archetypes

```typescript
// src/ai/personalities.ts
export const CUSTOM_ARCHETYPE: PersonalityArchetype = {
  name: 'Populist Reformer',
  description: 'Charismatic leader focused on systemic change',
  traits: {
    pragmatism: 0.3,      // Low pragmatism, high idealism
    charisma: 0.9,        // Very high charisma
    aggression: 0.6,      // Moderate aggression
    loyalty: 0.7,         // High loyalty to supporters
    transparency: 0.8,    // High transparency
    riskTolerance: 0.7    // High risk tolerance
  },
  decisionPatterns: {
    economic: 'reform_focused',
    social: 'progressive',
    foreign: 'nationalist',
    environmental: 'aggressive'
  },
  responseTemplates: {
    criticism: 'counter_with_reforms',
    praise: 'build_momentum',
    scandal: 'transparency_defense',
    crisis: 'bold_action'
  }
};
```

---

## Performance Optimization

### Performance Monitoring Integration

#### Adding Performance Tracking to Components

```typescript
import { withPerformanceMonitoring } from '@/components/monitoring/usePerformanceMonitoring';

const ExpensiveComponent = withPerformanceMonitoring(
  React.memo(({ data }: { data: ComplexData[] }) => {
    const processedData = useMemo(() => {
      return data.map(item => complexProcessing(item));
    }, [data]);

    return (
      <div>
        {processedData.map(item => (
          <ComplexItem key={item.id} data={item} />
        ))}
      </div>
    );
  }),
  'ExpensiveComponent'
);
```

#### Custom Performance Metrics

```typescript
import { trackSubsystemPerformance } from '@/utils/performance';

const customSubsystemProcess = async () => {
  const startTime = performance.now();

  try {
    // Expensive processing logic
    await performComplexCalculation();

    const endTime = performance.now();
    trackSubsystemPerformance('custom_calculation', endTime - startTime);
  } catch (error) {
    const endTime = performance.now();
    trackSubsystemPerformance('custom_calculation', endTime - startTime, false);
    throw error;
  }
};
```

### Memory Optimization

#### Memory Leak Prevention

```typescript
import { useEffect, useRef } from 'react';

const ComponentWithCleanup = () => {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    // Setup timers and listeners
    const timer = setInterval(() => {
      // Timer logic
    }, 1000);
    timersRef.current.add(timer);

    const unsubscribe = eventBus.subscribe('event', handler);
    listenersRef.current.push(unsubscribe);

    // Cleanup function
    return () => {
      // Clear timers
      timersRef.current.forEach(timer => clearInterval(timer));
      timersRef.current.clear();

      // Remove listeners
      listenersRef.current.forEach(unsubscribe => unsubscribe());
      listenersRef.current.length = 0;
    };
  }, []);

  return <div>Component content</div>;
};
```

### Database Query Optimization

#### Efficient Data Fetching

```typescript
// Optimized repository methods
class OptimizedRepository {
  async findWithProjection(query: any, fields: string[]): Promise<any[]> {
    const projection = fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {});
    return await this.collection.find(query, { projection }).toArray();
  }

  async findWithPagination(
    query: any,
    page: number,
    limit: number
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collection.find(query).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(query)
    ]);

    return { data, total };
  }

  async findWithIndexHints(query: any, indexName: string): Promise<any[]> {
    return await this.collection.find(query).hint(indexName).toArray();
  }
}
```

---

## Testing Strategy

### Unit Testing

#### Component Testing with React Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WindowManager } from '@/components/windows/WindowManager';
import { mockWindowManager } from '@/test/__mocks__/windowManager';

describe('WindowManager', () => {
  it('should create a new window when requested', async () => {
    const mockCreateWindow = jest.fn().mockResolvedValue('new-window-1');
    const mockContext = {
      ...mockWindowManager,
      createWindow: mockCreateWindow
    };

    render(
      <WindowManagerContext.Provider value={mockContext}>
        <WindowCreator />
      </WindowManagerContext.Provider>
    );

    const createButton = screen.getByText('Create Window');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateWindow).toHaveBeenCalledWith(
        'test_window',
        expect.objectContaining({
          title: 'Test Window',
          width: 400,
          height: 300
        })
      );
    });
  });
});
```

#### Simulation Engine Testing

```typescript
import { SimulationEngine } from '@/engine/SimulationEngine';
import { createTestLandscape } from '@/test/utils/testData';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  it('should process ticks within performance budget', async () => {
    const landscape = createTestLandscape();
    const tickResult = await engine.processTick(landscape, 1);

    expect(tickResult.passed).toBe(true);
    expect(tickResult.tickTime).toBeLessThan(100); // 100ms budget
    expect(tickResult.entitiesProcessed).toBeGreaterThan(0);
  });

  it('should handle subsystem failures gracefully', async () => {
    const faultyEngine = new SimulationEngine();
    faultyEngine.addSubsystem('faulty', new FaultySubsystem());

    const landscape = createTestLandscape();
    const tickResult = await faultyEngine.processTick(landscape, 1);

    expect(tickResult.issues).toHaveLength(1);
    expect(tickResult.issues[0].level).toBe('error');
  });
});
```

### Integration Testing

#### End-to-End Window Management

```typescript
import { WindowManager } from '@/components/windows/WindowManager';
import { DesktopShell } from '@/components/desktop/DesktopShell';

describe('Window Management Integration', () => {
  it('should integrate window creation with desktop shell', async () => {
    const { container } = render(
      <WindowManagerProvider>
        <DesktopShell />
      </WindowManagerProvider>
    );

    // Test window creation flow
    const appLauncher = screen.getByTestId('app-launcher');
    const campaignApp = within(appLauncher).getByText('Campaign Manager');

    fireEvent.click(campaignApp);

    await waitFor(() => {
      const windowContainer = screen.getByTestId('window-container');
      expect(windowContainer).toBeInTheDocument();
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    });
  });
});
```

### Performance Testing

#### Simulation Performance Benchmarks

```typescript
describe('Simulation Performance', () => {
  it('should maintain performance under load', async () => {
    const largeDataset = generateLargeTestDataset(1000); // 1000 entities
    const engine = new SimulationEngine();

    const results: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await engine.processTick(largeDataset, i);
      const end = performance.now();
      results.push(end - start);
    }

    const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
    const maxTime = Math.max(...results);

    expect(averageTime).toBeLessThan(100); // Average under 100ms
    expect(maxTime).toBeLessThan(200);     // No tick over 200ms
  });
});
```

---

## Debugging and Troubleshooting

### Development Tools

#### React DevTools Configuration

```typescript
// src/utils/devtools.ts
export const setupDevTools = () => {
  if (process.env.NODE_ENV === 'development') {
    // Enable React Query DevTools
    import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
      // DevTools setup
    });

    // Enable performance monitoring
    if ('performance' in window) {
      window.performance.mark('app-start');
    }
  }
};
```

#### Performance Debugging

```typescript
import { getPerformanceReport } from '@/utils/performance';

const PerformanceDebugger = () => {
  const [report, setReport] = useState<PerformanceReport | null>(null);

  const generateReport = () => {
    const performanceReport = getPerformanceReport();
    setReport(performanceReport);
    console.table(performanceReport.subsystemMetrics);
  };

  return (
    <div>
      <button onClick={generateReport}>Generate Performance Report</button>
      {report && (
        <pre>{JSON.stringify(report, null, 2)}</pre>
      )}
    </div>
  );
};
```

### Common Issues and Solutions

#### Window Management Issues

**Problem**: Windows not appearing or responding
```typescript
// Debug window state
const { windows, refreshWindowList } = useWindowManager();

useEffect(() => {
  console.log('Current windows:', windows);

  // Force refresh if no windows detected
  if (windows.length === 0) {
    refreshWindowList();
  }
}, [windows, refreshWindowList]);
```

**Solution**: Check Tauri backend connection and window registration

#### Performance Issues

**Problem**: Simulation running slowly
```typescript
// Add performance monitoring
import { usePerformanceMonitoring } from '@/components/monitoring/usePerformanceMonitoring';

const SimulationDebugger = () => {
  const { metrics, alerts } = usePerformanceMonitoring();

  useEffect(() => {
    if (metrics.tickTime > 100) {
      console.warn('Slow tick detected:', metrics);

      // Analyze subsystem performance
      Object.entries(metrics.subsystemMetrics).forEach(([name, metrics]) => {
        if (metrics.averageTime > 20) {
          console.warn(`Slow subsystem: ${name}`, metrics);
        }
      });
    }
  }, [metrics]);

  return <div>Monitoring performance...</div>;
};
```

#### Database Connection Issues

**Problem**: Database operations failing
```typescript
// src/utils/database-health.ts
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const db = getDatabaseManager();
    await db.getCollection('politicians').findOne({});
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Use in components
const MyComponent = () => {
  useEffect(() => {
    checkDatabaseHealth().then(healthy => {
      if (!healthy) {
        console.error('Database connection issue detected');
      }
    });
  }, []);
};
```

### Logging and Monitoring

#### Structured Logging

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

// Usage in components
import { logger } from '@/utils/logger';

const MyComponent = () => {
  const handleAction = () => {
    try {
      // Some operation
      logger.info('Action completed successfully', { component: 'MyComponent' });
    } catch (error) {
      logger.error('Action failed', { error, component: 'MyComponent' });
    }
  };
};
```

---

This developer guide provides comprehensive instructions for extending and customizing the Political AI Desktop Foundation. Follow these patterns and best practices to maintain code quality and system performance while adding new features and capabilities.