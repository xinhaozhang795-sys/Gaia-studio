/**
 * evolution/index.ts — barrel export for the Plate Tectonic Evolution Engine.
 *
 * Sprint 7.3: Upgrades Planet Genesis from a static birth state into a
 * dynamic geological evolution system.
 *
 * Architecture:
 *   PlanetDNA → Genesis → EvolutionEngine → TerrainData → Renderer
 */

export type {
  GeologicalTimeScale,
  CollisionType, CollisionEvent,
  SubductionEvent,
  RiftEvent,
  MountainType, TerrainClass,
  MountainRange, TerrainFeature, TerrainData,
  GeologicalEvolutionState, EvolutionContext,
} from './types';

export { TIME_SCALE_YEARS } from './types';

export {
  angularDistance, heading, moveOnSphere, sphericalCentroid, midpoint,
  velocityToAngular,
} from './spherical';
export type { LatLon } from './spherical';

export { stepPlateMotion } from './PlateMotionEngine';
export type { PlateMotionResult } from './PlateMotionEngine';
export { processCollisions, processTransforms } from './CollisionEngine';
export { processSubductions } from './SubductionEngine';
export { processRifts } from './RiftEngine';
export { buildTerrain } from './MountainBuilder';

export {
  createEvolutionContext,
  stepEvolution,
  evolveGeology,
} from './GeologicalTimeEngine';
