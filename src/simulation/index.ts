/**
 * Simulation Components - Main Export
 *
 * Exports all simulation components including the main simulation engine
 * and individual subsystems.
 */

// Main simulation engine
export { PrototypeSimulation } from './PrototypeSimulation';

// Individual subsystems
export { PoliticalEntitySubsystem } from './subsystems/PoliticalEntitySubsystem';
export { RelationshipSubsystem } from './subsystems/RelationshipSubsystem';
export { EventSubsystem } from './subsystems/EventSubsystem';
export { DecisionSubsystem } from './subsystems/DecisionSubsystem';

// Re-export engine components for convenience
export * from '../engine';