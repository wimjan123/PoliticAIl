/**
 * Game Engine - Core Simulation Components
 *
 * Exports all core engine components for the political simulation system.
 */

// Core types and interfaces
export * from './types';

// Main simulation engine components
export { TickManager } from './TickManager';
export { SubsystemCoordinator, SimulationSubsystem } from './SubsystemCoordinator';
export { PerformanceMonitor } from './PerformanceMonitor';
export { DegradationManager } from './DegradationManager';

// Main simulation class
export { PrototypeSimulation } from '../simulation/PrototypeSimulation';