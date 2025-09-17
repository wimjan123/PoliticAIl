/**
 * Combined Load Test Suite
 *
 * Tests system performance under combined load scenarios including
 * multiple windows, active simulation, UI interactions, and system resource constraints.
 */

import { PrototypeSimulation } from '../../simulation/PrototypeSimulation';
import { Politician, Bloc, Policy } from '../../types/entities';

interface CombinedLoadConfig {
  simulationEntityCount: number;
  simulationDuration: number;
  windowScenarios: WindowScenario[];
  uiInteractionRate: number; // Interactions per second
  memoryPressureTest: boolean;
  cpuStressTest: boolean;
  networkLatencySimulation: boolean;
}

interface WindowScenario {
  name: string;
  windowCount: number;
  windowTypes: WindowType[];
  simultaneousOperations: Operation[];
}

interface WindowType {
  type: 'main' | 'analytics' | 'settings' | 'entity_detail' | 'policy_editor';
  updateFrequency: number; // Updates per second
  dataComplexity: 'low' | 'medium' | 'high';
  memoryFootprint: number; // Estimated MB
}

interface Operation {
  type: 'data_refresh' | 'entity_creation' | 'policy_analysis' | 'network_request' | 'file_io';
  frequency: number; // Operations per second
  duration: number; // Average operation duration in ms
  resourceIntensive: boolean;
}

interface CombinedLoadResult {
  testName: string;
  scenario: WindowScenario;
  duration: number;
  performance: {
    simulation: {
      averageTickTime: number;
      tickTimeVariance: number;
      targetCompliance: number;
      degradationEvents: number;
    };
    ui: {
      averageResponseTime: number;
      maxResponseTime: number;
      responsiveOperations: number;
      unresponsiveOperations: number;
    };
    system: {
      cpuUsage: number[];
      memoryUsage: number[];
      memoryPeak: number;
      swapUsage: number[];
    };
  };
  stability: {
    simulationStable: boolean;
    uiResponsive: boolean;
    memoryStable: boolean;
    noResourceLeaks: boolean;
    overallStable: boolean;
  };
  bottlenecks: {
    identified: string[];
    severity: 'none' | 'minor' | 'moderate' | 'severe';
    recommendations: string[];
  };
  timestamp: Date;
}

interface SystemResourceMonitor {
  cpuUsage: number[];
  memoryUsage: number[];
  ioWait: number[];
  networkLatency: number[];
  samples: number;
}

export class CombinedLoadTest {
  private config: CombinedLoadConfig;
  private simulation?: PrototypeSimulation;
  private resourceMonitor: SystemResourceMonitor;
  private uiOperations: any[] = [];

  constructor(config?: Partial<CombinedLoadConfig>) {
    this.config = {
      simulationEntityCount: 8,
      simulationDuration: 5 * 60 * 1000, // 5 minutes
      windowScenarios: this.getDefaultWindowScenarios(),
      uiInteractionRate: 2, // 2 interactions per second
      memoryPressureTest: true,
      cpuStressTest: true,
      networkLatencySimulation: false,
      ...config
    };

    this.resourceMonitor = {
      cpuUsage: [],
      memoryUsage: [],
      ioWait: [],
      networkLatency: [],
      samples: 0
    };
  }

  /**
   * Run combined load test suite
   */
  public async runCombinedLoadTests(): Promise<CombinedLoadResult[]> {
    console.log('[CombinedLoadTest] Starting combined load test suite...');

    const results: CombinedLoadResult[] = [];

    for (const scenario of this.config.windowScenarios) {
      console.log(`\n[CombinedLoadTest] Testing scenario: ${scenario.name}`);

      const result = await this.runCombinedLoadScenario(scenario);
      results.push(result);

      this.logCombinedLoadResult(result);

      // Cooldown between scenarios
      await this.sleep(10000);
    }

    console.log('\n[CombinedLoadTest] Combined load testing completed!');
    return results;
  }

  /**
   * Run single combined load scenario
   */
  private async runCombinedLoadScenario(scenario: WindowScenario): Promise<CombinedLoadResult> {
    // Reset monitors
    this.resourceMonitor = {
      cpuUsage: [],
      memoryUsage: [],
      ioWait: [],
      networkLatency: [],
      samples: 0
    };
    this.uiOperations = [];

    // Initialize simulation
    this.simulation = this.createSimulation(this.config.simulationEntityCount);
    await this.simulation.initialize();

    // Start resource monitoring
    const resourceMonitoringInterval = this.startResourceMonitoring();

    // Start UI operation simulation
    const uiSimulationInterval = this.startUIOperationSimulation(scenario);

    // Start simulation
    console.log('  Starting simulation...');
    this.simulation.start();

    // Simulate window operations
    const windowOperationsPromise = this.simulateWindowOperations(scenario);

    // Wait for test duration
    console.log(`  Running combined load test for ${this.config.simulationDuration / 1000} seconds...`);
    await this.sleep(this.config.simulationDuration);

    // Stop all operations
    clearInterval(resourceMonitoringInterval);
    clearInterval(uiSimulationInterval);
    this.simulation.stop();

    // Wait for window operations to complete
    await windowOperationsPromise;

    // Collect final metrics
    const simulationMetrics = this.collectSimulationMetrics();
    const uiMetrics = this.collectUIMetrics();
    const systemMetrics = this.collectSystemMetrics();

    // Analyze stability
    const stability = this.analyzeStability(simulationMetrics, uiMetrics, systemMetrics);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(simulationMetrics, uiMetrics, systemMetrics);

    // Cleanup
    this.simulation.cleanup();

    return {
      testName: `Combined Load - ${scenario.name}`,
      scenario,
      duration: this.config.simulationDuration,
      performance: {
        simulation: simulationMetrics,
        ui: uiMetrics,
        system: systemMetrics
      },
      stability,
      bottlenecks,
      timestamp: new Date()
    };
  }

  /**
   * Create simulation for load testing
   */
  private createSimulation(entityCount: number): PrototypeSimulation {
    const entities = this.generateLoadTestEntities(entityCount);

    return new PrototypeSimulation({
      initialEntities: entities,
      autoStart: false,
      enableMonitoring: true,
      enableDegradation: true,
      performance: {
        maxTickTime: 100,
        subsystemBudgets: new Map([
          ['PoliticalEntitySubsystem', 20],
          ['RelationshipSubsystem', 10],
          ['EventSubsystem', 15],
          ['DecisionSubsystem', 25]
        ]),
        degradationThresholds: {
          warning: 70,
          critical: 90
        },
        monitoringWindow: 20
      }
    });
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): NodeJS.Timeout {
    return setInterval(() => {
      const memUsage = process.memoryUsage();

      // Simulate CPU monitoring (in real implementation, use system monitoring)
      const simulatedCpuUsage = this.getSimulatedCpuUsage();

      this.resourceMonitor.cpuUsage.push(simulatedCpuUsage);
      this.resourceMonitor.memoryUsage.push(memUsage.heapUsed);
      this.resourceMonitor.ioWait.push(Math.random() * 10); // Simulated IO wait
      this.resourceMonitor.samples++;
    }, 2000); // Sample every 2 seconds
  }

  /**
   * Start UI operation simulation
   */
  private startUIOperationSimulation(scenario: WindowScenario): NodeJS.Timeout {
    return setInterval(async () => {
      // Simulate UI interactions
      for (let i = 0; i < this.config.uiInteractionRate; i++) {
        const operation = this.simulateUIOperation(scenario);
        this.uiOperations.push(operation);
      }
    }, 1000);
  }

  /**
   * Simulate window operations
   */
  private async simulateWindowOperations(scenario: WindowScenario): Promise<void> {
    const operations: Promise<void>[] = [];

    // Simulate operations for each window type
    for (const windowType of scenario.windowTypes) {
      for (let i = 0; i < scenario.windowCount; i++) {
        operations.push(this.simulateWindowTypeOperations(windowType));
      }
    }

    // Simulate simultaneous operations
    for (const operation of scenario.simultaneousOperations) {
      operations.push(this.simulateOperation(operation));
    }

    // Wait for all operations to start (they run in background)
    await Promise.all(operations.slice(0, 5)); // Start first 5 immediately
  }

  /**
   * Simulate operations for specific window type
   */
  private async simulateWindowTypeOperations(windowType: WindowType): Promise<void> {
    const operationInterval = 1000 / windowType.updateFrequency;
    const endTime = Date.now() + this.config.simulationDuration;

    while (Date.now() < endTime) {
      const startTime = Date.now();

      // Simulate work based on data complexity
      const workDuration = this.getWorkDurationForComplexity(windowType.dataComplexity);
      await this.simulateWork(workDuration);

      const operationTime = Date.now() - startTime;

      // Record UI operation
      this.uiOperations.push({
        type: windowType.type,
        duration: operationTime,
        timestamp: Date.now(),
        responsive: operationTime < 200 // 200ms responsiveness threshold
      });

      // Wait for next operation
      await this.sleep(Math.max(0, operationInterval - operationTime));
    }
  }

  /**
   * Simulate specific operation
   */
  private async simulateOperation(operation: Operation): Promise<void> {
    const operationInterval = 1000 / operation.frequency;
    const endTime = Date.now() + this.config.simulationDuration;

    while (Date.now() < endTime) {
      const startTime = Date.now();

      // Simulate operation work
      await this.simulateWork(operation.duration);

      if (operation.resourceIntensive) {
        // Simulate additional resource usage
        await this.simulateResourceIntensiveWork();
      }

      const operationTime = Date.now() - startTime;

      // Record operation
      this.uiOperations.push({
        type: operation.type,
        duration: operationTime,
        timestamp: Date.now(),
        resourceIntensive: operation.resourceIntensive
      });

      // Wait for next operation
      await this.sleep(Math.max(0, operationInterval - operationTime));
    }
  }

  /**
   * Simulate UI operation
   */
  private simulateUIOperation(scenario: WindowScenario): any {
    const startTime = Date.now();

    // Random UI operation
    const operations = ['click', 'scroll', 'input', 'navigation', 'data_request'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    // Simulate operation duration based on complexity
    const baseDuration = Math.random() * 50 + 10; // 10-60ms base
    const complexityMultiplier = scenario.windowTypes.length * 1.2; // More windows = more complexity
    const duration = baseDuration * complexityMultiplier;

    return {
      type: operation,
      duration,
      timestamp: startTime,
      responsive: duration < 200
    };
  }

  /**
   * Simulate CPU-intensive work
   */
  private async simulateWork(duration: number): Promise<void> {
    const endTime = Date.now() + duration;

    // Simulate CPU work
    while (Date.now() < endTime) {
      // Small CPU-intensive operation
      Math.random() * Math.random();
    }
  }

  /**
   * Simulate resource-intensive work
   */
  private async simulateResourceIntensiveWork(): Promise<void> {
    // Simulate memory allocation
    const tempArray = new Array(10000).fill(Math.random());

    // Simulate some work with the array
    tempArray.sort();

    // Allow garbage collection
    await this.sleep(1);
  }

  /**
   * Get work duration based on complexity
   */
  private getWorkDurationForComplexity(complexity: 'low' | 'medium' | 'high'): number {
    switch (complexity) {
      case 'low': return 5 + Math.random() * 10; // 5-15ms
      case 'medium': return 15 + Math.random() * 20; // 15-35ms
      case 'high': return 35 + Math.random() * 40; // 35-75ms
    }
  }

  /**
   * Get simulated CPU usage
   */
  private getSimulatedCpuUsage(): number {
    // Simulate CPU usage based on current load
    const baseUsage = 20; // 20% base usage
    const simulationLoad = this.simulation?.getStatus().isRunning ? 30 : 0;
    const uiLoad = Math.min(this.uiOperations.length / 100 * 20, 20); // Up to 20% for UI
    const randomVariation = (Math.random() - 0.5) * 10; // ±5% variation

    return Math.max(0, Math.min(100, baseUsage + simulationLoad + uiLoad + randomVariation));
  }

  /**
   * Collect simulation metrics
   */
  private collectSimulationMetrics(): CombinedLoadResult['performance']['simulation'] {
    if (!this.simulation) {
      return {
        averageTickTime: 0,
        tickTimeVariance: 0,
        targetCompliance: 0,
        degradationEvents: 0
      };
    }

    const performanceSummary = this.simulation.getPerformanceSummary();
    const status = this.simulation.getStatus();

    if (!performanceSummary || !performanceSummary.tickTimes) {
      return {
        averageTickTime: 0,
        tickTimeVariance: 0,
        targetCompliance: 0,
        degradationEvents: 0
      };
    }

    const tickTimes = performanceSummary.tickTimes;
    const averageTickTime = tickTimes.reduce((a: number, b: number) => a + b, 0) / tickTimes.length;

    // Calculate variance
    const variance = tickTimes.reduce((acc: number, time: number) => {
      return acc + Math.pow(time - averageTickTime, 2);
    }, 0) / tickTimes.length;
    const tickTimeVariance = Math.sqrt(variance);

    // Calculate compliance
    const compliantTicks = tickTimes.filter((time: number) => time <= 100).length;
    const targetCompliance = (compliantTicks / tickTimes.length) * 100;

    return {
      averageTickTime,
      tickTimeVariance,
      targetCompliance,
      degradationEvents: 0 // Would be tracked via event listeners in real implementation
    };
  }

  /**
   * Collect UI metrics
   */
  private collectUIMetrics(): CombinedLoadResult['performance']['ui'] {
    if (this.uiOperations.length === 0) {
      return {
        averageResponseTime: 0,
        maxResponseTime: 0,
        responsiveOperations: 0,
        unresponsiveOperations: 0
      };
    }

    const responseTimes = this.uiOperations.map(op => op.duration);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    const responsiveOperations = this.uiOperations.filter(op => op.responsive).length;
    const unresponsiveOperations = this.uiOperations.length - responsiveOperations;

    return {
      averageResponseTime,
      maxResponseTime,
      responsiveOperations,
      unresponsiveOperations
    };
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): CombinedLoadResult['performance']['system'] {
    const memoryPeak = Math.max(...this.resourceMonitor.memoryUsage);
    const averageCpuUsage = this.resourceMonitor.cpuUsage.reduce((a, b) => a + b, 0) / this.resourceMonitor.cpuUsage.length;

    return {
      cpuUsage: [...this.resourceMonitor.cpuUsage],
      memoryUsage: [...this.resourceMonitor.memoryUsage],
      memoryPeak,
      swapUsage: [] // Would be implemented with real system monitoring
    };
  }

  /**
   * Analyze system stability
   */
  private analyzeStability(
    simulation: CombinedLoadResult['performance']['simulation'],
    ui: CombinedLoadResult['performance']['ui'],
    system: CombinedLoadResult['performance']['system']
  ): CombinedLoadResult['stability'] {
    const simulationStable = simulation.targetCompliance > 80 && simulation.tickTimeVariance < 50;
    const uiResponsive = ui.averageResponseTime < 200 && (ui.responsiveOperations / (ui.responsiveOperations + ui.unresponsiveOperations)) > 0.9;
    const memoryStable = system.memoryPeak < 500 * 1024 * 1024; // 500MB threshold
    const noResourceLeaks = this.detectResourceLeaks(system);
    const overallStable = simulationStable && uiResponsive && memoryStable && noResourceLeaks;

    return {
      simulationStable,
      uiResponsive,
      memoryStable,
      noResourceLeaks,
      overallStable
    };
  }

  /**
   * Detect resource leaks
   */
  private detectResourceLeaks(system: CombinedLoadResult['performance']['system']): boolean {
    if (system.memoryUsage.length < 10) return true;

    // Check for consistent memory growth
    const firstHalf = system.memoryUsage.slice(0, Math.floor(system.memoryUsage.length / 2));
    const secondHalf = system.memoryUsage.slice(Math.floor(system.memoryUsage.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    // No leak if second half doesn't use significantly more memory
    return secondAvg <= firstAvg * 1.3; // 30% growth tolerance
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(
    simulation: CombinedLoadResult['performance']['simulation'],
    ui: CombinedLoadResult['performance']['ui'],
    system: CombinedLoadResult['performance']['system']
  ): CombinedLoadResult['bottlenecks'] {
    const identified: string[] = [];
    const recommendations: string[] = [];

    // Check simulation bottlenecks
    if (simulation.averageTickTime > 100) {
      identified.push('Simulation tick performance');
      recommendations.push('Optimize simulation subsystems and entity processing');
    }

    if (simulation.targetCompliance < 80) {
      identified.push('Simulation consistency');
      recommendations.push('Implement performance budgeting and graceful degradation');
    }

    // Check UI bottlenecks
    if (ui.averageResponseTime > 200) {
      identified.push('UI responsiveness');
      recommendations.push('Optimize UI rendering and implement virtual scrolling');
    }

    if (ui.unresponsiveOperations > ui.responsiveOperations * 0.2) {
      identified.push('UI operation performance');
      recommendations.push('Implement operation queuing and prioritization');
    }

    // Check system bottlenecks
    const avgCpuUsage = system.cpuUsage.reduce((a, b) => a + b, 0) / system.cpuUsage.length;
    if (avgCpuUsage > 80) {
      identified.push('CPU utilization');
      recommendations.push('Implement CPU-intensive operation throttling');
    }

    if (system.memoryPeak > 400 * 1024 * 1024) { // 400MB
      identified.push('Memory usage');
      recommendations.push('Optimize memory allocation and implement garbage collection');
    }

    let severity: CombinedLoadResult['bottlenecks']['severity'] = 'none';
    if (identified.length === 0) severity = 'none';
    else if (identified.length <= 2) severity = 'minor';
    else if (identified.length <= 4) severity = 'moderate';
    else severity = 'severe';

    return { identified, severity, recommendations };
  }

  /**
   * Generate default window scenarios
   */
  private getDefaultWindowScenarios(): WindowScenario[] {
    return [
      {
        name: 'Single Main Window',
        windowCount: 1,
        windowTypes: [{
          type: 'main',
          updateFrequency: 2,
          dataComplexity: 'medium',
          memoryFootprint: 50
        }],
        simultaneousOperations: [{
          type: 'data_refresh',
          frequency: 0.5,
          duration: 100,
          resourceIntensive: false
        }]
      },
      {
        name: 'Dual Window Setup',
        windowCount: 2,
        windowTypes: [
          {
            type: 'main',
            updateFrequency: 2,
            dataComplexity: 'medium',
            memoryFootprint: 50
          },
          {
            type: 'analytics',
            updateFrequency: 1,
            dataComplexity: 'high',
            memoryFootprint: 80
          }
        ],
        simultaneousOperations: [
          {
            type: 'data_refresh',
            frequency: 1,
            duration: 150,
            resourceIntensive: true
          },
          {
            type: 'policy_analysis',
            frequency: 0.2,
            duration: 500,
            resourceIntensive: true
          }
        ]
      },
      {
        name: 'Multi-Window Heavy Load',
        windowCount: 4,
        windowTypes: [
          {
            type: 'main',
            updateFrequency: 3,
            dataComplexity: 'medium',
            memoryFootprint: 50
          },
          {
            type: 'analytics',
            updateFrequency: 2,
            dataComplexity: 'high',
            memoryFootprint: 80
          },
          {
            type: 'entity_detail',
            updateFrequency: 1,
            dataComplexity: 'medium',
            memoryFootprint: 40
          },
          {
            type: 'policy_editor',
            updateFrequency: 0.5,
            dataComplexity: 'high',
            memoryFootprint: 60
          }
        ],
        simultaneousOperations: [
          {
            type: 'data_refresh',
            frequency: 2,
            duration: 200,
            resourceIntensive: true
          },
          {
            type: 'entity_creation',
            frequency: 0.1,
            duration: 800,
            resourceIntensive: true
          },
          {
            type: 'file_io',
            frequency: 0.5,
            duration: 300,
            resourceIntensive: false
          }
        ]
      }
    ];
  }

  /**
   * Generate entities for load testing
   */
  private generateLoadTestEntities(count: number): {
    politicians: Politician[];
    blocs: Bloc[];
    policies: Policy[];
  } {
    const politicians: Politician[] = [];
    const blocs: Bloc[] = [];
    const policies: Policy[] = [];

    const politicianCount = Math.max(1, Math.floor(count * 0.6));
    const blocCount = Math.max(1, Math.floor(count * 0.25));
    const policyCount = Math.max(1, count - politicianCount - blocCount);

    // Generate politicians
    for (let i = 0; i < politicianCount; i++) {
      politicians.push({
        id: `politician-load-${i}`,
        name: `Load Test Politician ${i}`,
        ideology: {
          economic: Math.random() * 200 - 100,
          social: Math.random() * 200 - 100
        },
        resources: {
          political_capital: Math.random() * 100,
          funding: Math.random() * 1000000
        },
        reputation: Math.random() * 100,
        experience: Math.random() * 30,
        network: [],
        traits: [`trait_${i % 5}`],
        current_position: i % 3 === 0 ? 'government' : 'opposition'
      });
    }

    // Generate blocs
    for (let i = 0; i < blocCount; i++) {
      blocs.push({
        id: `bloc-load-${i}`,
        name: `Load Test Bloc ${i}`,
        ideology: {
          economic: Math.random() * 200 - 100,
          social: Math.random() * 200 - 100
        },
        members: politicians.slice(0, Math.min(3, politicians.length)),
        resources: {
          political_capital: Math.random() * 500,
          funding: Math.random() * 5000000
        },
        influence: Math.random() * 100,
        cohesion: Math.random() * 100
      });
    }

    // Generate policies
    for (let i = 0; i < policyCount; i++) {
      policies.push({
        id: `policy-load-${i}`,
        name: `Load Test Policy ${i}`,
        description: `Load test policy description ${i}`,
        ideology_impact: {
          economic: Math.random() * 20 - 10,
          social: Math.random() * 20 - 10
        },
        support_base: Math.random() * 100,
        implementation_cost: Math.random() * 1000000,
        status: i % 3 === 0 ? 'proposed' : 'under_review',
        sponsor: politicians[i % politicians.length]?.id || 'unknown'
      });
    }

    return { politicians, blocs, policies };
  }

  /**
   * Log combined load test result
   */
  private logCombinedLoadResult(result: CombinedLoadResult): void {
    console.log(`\n=== ${result.testName} ===`);
    console.log(`Scenario: ${result.scenario.name} (${result.scenario.windowCount} windows)`);

    console.log('\nSimulation Performance:');
    console.log(`  Average Tick Time: ${result.performance.simulation.averageTickTime.toFixed(2)}ms`);
    console.log(`  Target Compliance: ${result.performance.simulation.targetCompliance.toFixed(1)}%`);

    console.log('\nUI Performance:');
    console.log(`  Average Response Time: ${result.performance.ui.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Responsive Operations: ${result.performance.ui.responsiveOperations}/${result.performance.ui.responsiveOperations + result.performance.ui.unresponsiveOperations}`);

    console.log('\nSystem Resources:');
    const avgCpu = result.performance.system.cpuUsage.reduce((a, b) => a + b, 0) / result.performance.system.cpuUsage.length;
    console.log(`  Average CPU: ${avgCpu.toFixed(1)}%`);
    console.log(`  Peak Memory: ${(result.performance.system.memoryPeak / 1024 / 1024).toFixed(2)}MB`);

    console.log('\nStability:');
    console.log(`  Overall Stable: ${result.stability.overallStable}`);
    console.log(`  Simulation Stable: ${result.stability.simulationStable}`);
    console.log(`  UI Responsive: ${result.stability.uiResponsive}`);

    if (result.bottlenecks.identified.length > 0) {
      console.log('\nBottlenecks:');
      console.log(`  Severity: ${result.bottlenecks.severity}`);
      console.log(`  Issues: ${result.bottlenecks.identified.join(', ')}`);
    }
  }

  /**
   * Export combined load test results
   */
  public exportResults(results: CombinedLoadResult[]): string {
    return JSON.stringify({
      config: this.config,
      results,
      summary: this.generateCombinedLoadSummary(results)
    }, null, 2);
  }

  /**
   * Generate combined load test summary
   */
  private generateCombinedLoadSummary(results: CombinedLoadResult[]): any {
    const totalTests = results.length;
    const stableTests = results.filter(r => r.stability.overallStable).length;

    const avgSimulationPerformance = results.reduce((sum, r) => sum + r.performance.simulation.averageTickTime, 0) / totalTests;
    const avgUIPerformance = results.reduce((sum, r) => sum + r.performance.ui.averageResponseTime, 0) / totalTests;

    const bottleneckFrequency: { [key: string]: number } = {};
    results.forEach(r => {
      r.bottlenecks.identified.forEach(bottleneck => {
        bottleneckFrequency[bottleneck] = (bottleneckFrequency[bottleneck] || 0) + 1;
      });
    });

    return {
      totalTests,
      stableTests,
      stabilityRate: (stableTests / totalTests) * 100,
      performance: {
        averageSimulationTickTime: avgSimulationPerformance,
        averageUIResponseTime: avgUIPerformance
      },
      bottleneckFrequency,
      recommendations: this.generateOverallRecommendations(results)
    };
  }

  /**
   * Generate overall recommendations
   */
  private generateOverallRecommendations(results: CombinedLoadResult[]): string[] {
    const recommendations: string[] = [];

    const allBottlenecks = results.flatMap(r => r.bottlenecks.identified);
    const uniqueBottlenecks = [...new Set(allBottlenecks)];

    if (uniqueBottlenecks.includes('Simulation tick performance')) {
      recommendations.push('Implement simulation performance optimization and tick budgeting');
    }

    if (uniqueBottlenecks.includes('UI responsiveness')) {
      recommendations.push('Optimize UI rendering and implement progressive loading');
    }

    if (uniqueBottlenecks.includes('Memory usage')) {
      recommendations.push('Implement memory pooling and garbage collection optimization');
    }

    if (uniqueBottlenecks.includes('CPU utilization')) {
      recommendations.push('Implement work scheduling and CPU throttling mechanisms');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performs well under combined load scenarios');
    }

    return recommendations;
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}