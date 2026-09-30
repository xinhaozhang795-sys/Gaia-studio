/**
 * Human Evolution types — the proto-culture model for Gaia Studio.
 *
 * Sprint 7.5: Humans are one species among many, constrained by
 * environment, geology, and ecology. They may or may not emerge,
 * and they stop at prehistoric / early-agricultural civilization.
 *
 * No industrial era, no modern states, no modern technology.
 */

// ── Species stage ──────────────────────────────────────────────────────────────

export type SpeciesStage =
  | 'absent'
  | 'pre_hominin'
  | 'early_hominin'
  | 'archaic_human'
  | 'homo_sapiens'
  | 'modern_hunter_gatherer'
  | 'early_settlement';

/** Ordered progression for comparison. */
export const STAGE_ORDER: readonly SpeciesStage[] = [
  'absent',
  'pre_hominin',
  'early_hominin',
  'archaic_human',
  'homo_sapiens',
  'modern_hunter_gatherer',
  'early_settlement',
];

export function stageIndex(s: SpeciesStage): number {
  return STAGE_ORDER.indexOf(s);
}

// ── Culture & technology ──────────────────────────────────────────────────────

export type CulturalTrait =
  | 'stone_tools'
  | 'controlled_fire'
  | 'hunting'
  | 'fishing'
  | 'gathering'
  | 'clothing'
  | 'shelter'
  | 'symbolic_art'
  | 'burial'
  | 'language'
  | 'domestication'
  | 'agriculture'
  | 'pottery'
  | 'early_metalworking';

/** All allowed cultural traits, in rough discovery order. */
export const ALL_CULTURAL_TRAITS: readonly CulturalTrait[] = [
  'stone_tools',
  'controlled_fire',
  'hunting',
  'gathering',
  'fishing',
  'clothing',
  'shelter',
  'symbolic_art',
  'burial',
  'language',
  'domestication',
  'agriculture',
  'pottery',
  'early_metalworking',
];

// ── Settlement ────────────────────────────────────────────────────────────────

export type SettlementType =
  | 'temporary_camp'
  | 'seasonal_camp'
  | 'village'
  | 'early_agricultural_settlement';

export interface Settlement {
  id: number;
  type: SettlementType;
  latitude: number;
  longitude: number;
  population: number;
  foundedYear: number;
  culturalTraits: CulturalTrait[];
}

// ── Migration ─────────────────────────────────────────────────────────────────

export interface MigrationRoute {
  id: number;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  yearEstablished: number;
  /** Cost weight — higher = harder traverse. */
  cost: number;
}

export interface PopulationCenter {
  id: number;
  latitude: number;
  longitude: number;
  population: number;
  /** Environmental carrying capacity at this location. */
  carryingCapacity: number;
  /** 0..1 — how well adapted to local conditions. */
  adaptationScore: number;
}

// ── History events ────────────────────────────────────────────────────────────

export type HumanEventType =
  | 'emergence'
  | 'migration'
  | 'population_growth'
  | 'population_decline'
  | 'settlement'
  | 'cultural_discovery'
  | 'agriculture'
  | 'disease'
  | 'famine'
  | 'extinction'
  | 'regional_expansion'
  | 'stage_transition';

export interface HumanHistoryEvent {
  id: number;
  type: HumanEventType;
  year: number;
  description: string;
  latitude?: number;
  longitude?: number;
  magnitude?: number;
}

// ── Environmental influence ───────────────────────────────────────────────────

export interface EnvironmentalPressure {
  /** Disease pressure 0..1. */
  disease: number;
  /** Predator pressure 0..1. */
  predator: number;
  /** Natural disaster risk 0..1. */
  disaster: number;
  /** Food availability 0..1. */
  food: number;
  /** Water availability 0..1. */
  water: number;
  /** Temperature suitability 0..1. */
  temperature: number;
  /** Terrain habitability 0..1. */
  terrain: number;
}

// ── Root state ────────────────────────────────────────────────────────────────

export interface HumanEvolutionState {
  /** Whether humans exist on this planet at all. */
  humanPresence: boolean;
  /** Current evolutionary stage. */
  speciesStage: SpeciesStage;
  /** Total global population. */
  population: number;
  /** Genetic diversity 0..1. */
  geneticDiversity: number;
  /** Adaptation to environment 0..1. */
  adaptation: number;
  /** Migration routes. */
  migration: MigrationRoute[];
  /** Active population centers. */
  populationCenters: PopulationCenter[];
  /** Discovered cultural traits. */
  culture: CulturalTrait[];
  /** Technology level 0..1 (prehistoric scale only). */
  technologyLevel: number;
  /** Settlement level 0..1. */
  settlementLevel: number;
  /** Language complexity 0..1. */
  languageComplexity: number;
  /** Whether tool use has been discovered. */
  toolUse: boolean;
  /** Whether fire use has been discovered. */
  fireUse: boolean;
  /** Whether agriculture has been discovered. */
  agriculture: boolean;
  /** All settlements. */
  settlements: Settlement[];
  /** History events. */
  history: HumanHistoryEvent[];
  /** Current environmental pressures (aggregate). */
  environmentalPressure: EnvironmentalPressure;
  /** Years since human emergence (0 if absent). */
  yearsSinceEmergence: number;
  /** Internal RNG state — deterministic. */
  rngState: number;
}

/** Alias used by GaiaState for the runtime human slice. */
export type HumanState = HumanEvolutionState;

// ── Time scales for human history ─────────────────────────────────────────────

export type HumanTimeScale = '10kyr' | '1kyr' | '100yr' | '10yr' | '1yr';

export const HUMAN_TIME_SCALE_YEARS: Record<HumanTimeScale, number> = {
  '10kyr': 10_000,
  '1kyr': 1_000,
  '100yr': 100,
  '10yr': 10,
  '1yr': 1,
};
