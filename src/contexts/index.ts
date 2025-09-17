/**
 * Contexts Index
 * Re-exports all context providers and hooks
 */

export { SimulationProvider, useSimulationContext } from './SimulationContext';
export type { SimulationContextType } from './SimulationContext';

// Export context default for direct access if needed
export { default as SimulationContext } from './SimulationContext';

// Desktop shell context
export { DesktopProvider, useDesktop } from './DesktopContext';