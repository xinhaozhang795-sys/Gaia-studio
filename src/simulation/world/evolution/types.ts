/**
 * Evolution types — the dynamic geological state produced by the
 * Plate Tectonic Evolution Engine (Sprint 7.3).
 *
 * These types extend the static GenesisState with time-evolving data:
 *   • Moving plates (position updated each step)
 *   • Collision/subduction/rift events
 *   • Mountain ranges and terrain features
 *   • Evolving ocean basins
 *
 * The evolution system is deterministic: same GenesisState + same time steps
 * → same evolution result, always.
 */

import type {
  TectonicPlate, PlateBoundary, PlateState,
  SupercontinentState, HotspotState, OceanBasin, RiftZone,
} from '../genesis/types';

// ── Time scales ────────────────────────────────────────────────────────────────

export type GeologicalTimeScale =
  | '1yr'
  | '1kyr'
  | '1Myr'
  | '100Myr'
  | '1Gyr';

export const TIME_SCALE_YEARS: Record<GeologicalTimeScale, number> = {
  '1yr':     1,
  '1kyr':    1_000,
  '1Myr':    1_000_000,
  '100Myr':  100_000_000,
  '1Gyr':    1_000_000_000,
};

// ── Collision / boundary events ────────────────────────────────────────────────

export type CollisionType =
  | 'continental-collision'
  | 'oceanic-subduction'
  | 'oceanic-collision'
  | 'continental-arc';

export interface CollisionEvent {
  id: number;
  plateA: number;
  plateB: number;
  type: CollisionType;
  angle: number;
  convergenceRate: number;
  latitude: number;
  longitude: number;
  thickening: number;
  upliftRate: number;
}

export interface SubductionEvent {
  id: number;
  subductingPlate: number;
  overridingPlate: number;
  subductionRate: number;
  trenchDepth: number;
  arcLatitude: number;
  arcLongitude: number;
  slabTemp: number;
  co2Release: number;
}

export interface RiftEvent {
  id: number;
  name: string;
  plateA: number;
  plateB: number;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  spreadRate: number;
  age: number;
  becameOcean: boolean;
}

// ── Terrain ───────────────────────────────────────────────────────────────────

export type MountainType = 'collision' | 'volcanic' | 'rift';
export type TerrainClass = 'wonder' | 'spectacular' | 'normal';

export interface MountainRange {
  id: number;
  name: string;
  type: MountainType;
  height: number;
  age: number;
  erosion: number;
  latitude: number;
  longitude: number;
  angularRadius: number;
  terrainClass: TerrainClass;
  sourceEventId: number;
}

export interface TerrainFeature {
  id: number;
  latitude: number;
  longitude: number;
  elevation: number;
  terrainClass: TerrainClass;
  type: 'mountain' | 'plain' | 'highland' | 'trench' | 'ridge' | 'basin' | 'coast';
  angularRadius: number;
}

export interface TerrainData {
  mountainRanges: MountainRange[];
  features: TerrainFeature[];
  meanElevation: number;
  maxElevation: number;
  minElevation: number;
  classDistribution: { wonder: number; spectacular: number; normal: number };
}

// ── Evolution state ───────────────────────────────────────────────────────────

export interface GeologicalEvolutionState {
  elapsedMyr: number;
  stepCount: number;
  lastTimeScale: GeologicalTimeScale;
  plates: PlateState;
  supercontinents: SupercontinentState;
  hotspots: HotspotState;
  collisions: CollisionEvent[];
  subductions: SubductionEvent[];
  rifts: RiftEvent[];
  terrain: TerrainData;
  historyEvents: Array<{ time: number; title: string; description: string }>;
}

export interface EvolutionContext {
  plates: TectonicPlate[];
  boundaries: PlateBoundary[];
  supercontinents: SupercontinentState;
  hotspots: HotspotState;
  oceanBasins: OceanBasin[];
  riftZones: RiftZone[];
  mountains: MountainRange[];
  terrainFeatures: TerrainFeature[];
  collisions: CollisionEvent[];
  subductions: SubductionEvent[];
  rifts: RiftEvent[];
  historyEvents: Array<{ time: number; title: string; description: string }>;
  elapsedMyr: number;
  stepCount: number;
  nextEventId: number;
  nextMountainId: number;
  nextFeatureId: number;
}
