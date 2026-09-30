/**
 * human/index.ts — barrel export for the Human Evolution system (Sprint 7.5).
 *
 * Architecture:
 *   PlanetDNA + GaiaState → HumanEvolutionState
 *   HumanEngine (runtime) evolves HumanEvolutionState per tick
 *
 * Humans are one species among many. They may not emerge at all.
 * Development stops at prehistoric / early-agricultural civilization.
 *
 * Flow:
 *   generateHumanEvolution(dna, state) → initial HumanEvolutionState
 *   HumanEngine.update(state, dt) → evolved HumanEvolutionState
 */

// ── Types ───────────────────────────────────────────────────────────────────────
export type {
  SpeciesStage, CulturalTrait, SettlementType,
  Settlement, MigrationRoute, PopulationCenter,
  HumanHistoryEvent, HumanEventType,
  EnvironmentalPressure, HumanEvolutionState,
  HumanTimeScale,
} from './types';
export {
  STAGE_ORDER, stageIndex,
  ALL_CULTURAL_TRAITS,
  HUMAN_TIME_SCALE_YEARS,
} from './types';

// ── Evolution engine ──────────────────────────────────────────────────────────
export {
  emergenceProbability,
  shouldAdvanceStage,
  nextStage,
  computeEnvironmentalPressure,
  carryingCapacityMultiplier,
} from './HumanEvolutionEngine';

// ── Population engine ──────────────────────────────────────────────────────────
export {
  seedPopulationCenters,
  updatePopulation,
  updateGeneticDiversity,
  yearsFromDt,
} from './HumanPopulationEngine';

// ── Migration engine ──────────────────────────────────────────────────────────
export {
  migrationCost,
  expandMigration,
} from './HumanMigrationEngine';

// ── Culture engine ────────────────────────────────────────────────────────────
export {
  discoverTraits,
  updateTechnologyLevel,
  updateLanguageComplexity,
  settlementTypeForStage,
  foundSettlements,
  updateSettlementLevel,
} from './HumanCultureEngine';

// ── History ────────────────────────────────────────────────────────────────────
export {
  createEvent,
  logEmergence,
  logStageTransition,
  logMigration,
  logPopulationGrowth,
  logPopulationDecline,
  logCulturalDiscovery,
  logSettlement,
  logAgriculture,
  logDisease,
  logFamine,
  logExtinction,
  logRegionalExpansion,
  pruneHistory,
  resetEventCounter,
} from './HumanHistory';

// ── Entry point ────────────────────────────────────────────────────────────────
export { generateHumanEvolution } from './HumanEvolutionEngine';
