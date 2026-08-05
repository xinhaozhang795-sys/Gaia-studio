/**
 * GeologicalTimeEngine — the master orchestrator for geological evolution.
 *
 * Supports multiple time scales:
 *   1 year, 1,000 years, 1 million years, 100 million years, 1 billion years
 *
 * At each step, runs all sub-engines in dependency order:
 *   1. PlateMotionEngine   — move plates on the sphere
 *   2. CollisionEngine     — process convergent boundaries
 *   3. SubductionEngine    — process oceanic subduction
 *   4. RiftEngine          — process divergent boundaries
 *   5. MountainBuilder     — build terrain from geological events
 *
 * Deterministic: same GenesisState + same time steps → identical result.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GenesisState } from '../genesis/types';
import type { TectonicPlate, PlateBoundary, PlateState } from '../genesis/types';
import type {
  GeologicalEvolutionState, EvolutionContext, GeologicalTimeScale, TerrainData,
} from './types';
import { TIME_SCALE_YEARS } from './types';
import { stepPlateMotion } from './PlateMotionEngine';
import { processCollisions, processTransforms } from './CollisionEngine';
import { processSubductions } from './SubductionEngine';
import { processRifts } from './RiftEngine';
import { buildTerrain } from './MountainBuilder';

export function createEvolutionContext(genesis: GenesisState): EvolutionContext {
  return {
    plates: genesis.plates.plates.map((p) => ({ ...p })),
    boundaries: genesis.plates.boundaries.map((b) => ({ ...b })),
    supercontinents: {
      ...genesis.supercontinents,
      supercontinents: genesis.supercontinents.supercontinents.map((s) => ({ ...s })),
      cratons: genesis.supercontinents.cratons.map((c) => ({ ...c })),
      oceanBasins: genesis.supercontinents.oceanBasins.map((b) => ({ ...b })),
      riftZones: genesis.supercontinents.riftZones.map((r) => ({ ...r })),
    },
    hotspots: {
      ...genesis.hotspots,
      hotspots: genesis.hotspots.hotspots.map((h) => ({ ...h })),
      islandChains: genesis.hotspots.islandChains.map((c) => ({ ...c })),
    },
    oceanBasins: genesis.supercontinents.oceanBasins.map((b) => ({ ...b })),
    riftZones: genesis.supercontinents.riftZones.map((r) => ({ ...r })),
    mountains: [],
    terrainFeatures: [],
    collisions: [],
    subductions: [],
    rifts: [],
    historyEvents: [],
    elapsedMyr: 0,
    stepCount: 0,
    nextEventId: 0,
    nextMountainId: 0,
    nextFeatureId: 0,
  };
}

export function stepEvolution(
  dna: PlanetDNA,
  ctx: EvolutionContext,
  scale: GeologicalTimeScale,
): number {
  const dtYears = TIME_SCALE_YEARS[scale];
  const dtMyr = dtYears / 1e6;

  const motionResult = stepPlateMotion(
    dna,
    ctx.plates,
    ctx.boundaries,
    dtYears,
  );
  ctx.plates = motionResult.plates;
  ctx.boundaries = motionResult.boundaries;

  processCollisions(dna, ctx.plates, ctx.boundaries, ctx, dtMyr);
  processTransforms(ctx.plates, ctx.boundaries, ctx, dtMyr);
  processSubductions(dna, ctx.plates, ctx.boundaries, ctx, dtMyr);
  processRifts(dna, ctx.plates, ctx.boundaries, ctx, dtMyr);

  ctx.elapsedMyr += dtMyr;
  ctx.stepCount++;

  return dtYears;
}

export function evolveGeology(
  dna: PlanetDNA,
  genesis: GenesisState,
  totalMyr: number,
  scale: GeologicalTimeScale = '1Myr',
): GeologicalEvolutionState {
  const ctx = createEvolutionContext(genesis);
  const stepMyr = TIME_SCALE_YEARS[scale] / 1e6;
  const stepCount = Math.ceil(totalMyr / stepMyr);

  for (let i = 0; i < stepCount; i++) {
    const remaining = totalMyr - ctx.elapsedMyr;
    if (remaining <= 0) break;
    stepEvolution(dna, ctx, scale);
  }

  const terrain = buildTerrain(
    dna,
    ctx.collisions,
    ctx.subductions,
    ctx.rifts,
    ctx,
  );

  return contextToState(ctx, terrain, scale);
}

function contextToState(
  ctx: EvolutionContext,
  terrain: TerrainData,
  lastScale: GeologicalTimeScale,
): GeologicalEvolutionState {
  const oceanicCount = ctx.plates.filter((p) => p.type === 'oceanic').length;
  const continentalCount = ctx.plates.filter((p) => p.type === 'continental').length;
  const meanVelocity = ctx.plates.length > 0
    ? ctx.plates.reduce((s, p) => s + p.velocity, 0) / ctx.plates.length
    : 0;

  const plateState: PlateState = {
    plates: ctx.plates,
    boundaries: ctx.boundaries,
    oceanicCount,
    continentalCount,
    meanVelocity: Math.round(meanVelocity * 100) / 100,
  };

  const supercontinentState = {
    ...ctx.supercontinents,
    oceanBasins: ctx.oceanBasins,
    riftZones: ctx.riftZones,
  };

  return {
    elapsedMyr: Math.round(ctx.elapsedMyr * 100) / 100,
    stepCount: ctx.stepCount,
    lastTimeScale: lastScale,
    plates: plateState,
    supercontinents: supercontinentState,
    hotspots: ctx.hotspots,
    collisions: ctx.collisions,
    subductions: ctx.subductions,
    rifts: ctx.rifts,
    terrain,
    historyEvents: ctx.historyEvents,
  };
}
