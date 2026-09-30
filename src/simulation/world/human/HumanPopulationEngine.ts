/**
 * HumanPopulationEngine — environment-constrained population dynamics.
 *
 * Population grows only when the environment can support it:
 *   growth → food + water + climate + terrain all sufficient
 *   decline ← drought, cold, disaster, disease, famine, resource depletion
 *
 * No exponential growth beyond carrying capacity. Populations are tracked
 * per-center, with a global aggregate.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GaiaState } from '../../types';
import type {
  HumanEvolutionState, PopulationCenter, EnvironmentalPressure,
} from './types';
import {
  computeEnvironmentalPressure,
  carryingCapacityMultiplier,
} from './HumanEvolutionEngine';
import { SECONDS } from '../../UnitSystem';

// ── Initial population centers ─────────────────────────────────────────────────

/**
 * Seed initial population centers at habitable locations.
 * Deterministic: uses rngState for placement.
 */
export function seedPopulationCenters(
  dna: PlanetDNA,
  state: GaiaState,
  rngState: number,
  count: number,
): { centers: PopulationCenter[]; rngState: number } {
  const centers: PopulationCenter[] = [];
  let rng = rngState;

  for (let i = 0; i < count; i++) {
    const latRand = ((rng = rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const lonRand = ((rng = rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const latitude = (latRand - 0.5) * Math.PI * 0.5;
    const longitude = lonRand * Math.PI * 2;

    const env = computeEnvironmentalPressure(dna, state, latitude);
    const cap = carryingCapacityMultiplier(env);

    if (cap < 0.15) continue;

    const carryingCapacity = Math.floor(cap * 5000);
    const initialPop = Math.floor(carryingCapacity * 0.1);

    centers.push({
      id: i,
      latitude,
      longitude,
      population: initialPop,
      carryingCapacity,
      adaptationScore: 0.3 + cap * 0.2,
    });
  }

  return { centers, rngState: rng };
}

// ── Population update ──────────────────────────────────────────────────────────

export function updatePopulation(
  dna: PlanetDNA,
  state: GaiaState,
  human: HumanEvolutionState,
  dtYears: number,
): { centers: PopulationCenter[]; totalPopulation: number; declined: boolean } {
  if (!human.humanPresence || human.populationCenters.length === 0) {
    return { centers: human.populationCenters, totalPopulation: 0, declined: false };
  }

  const stageGrowthRates: Record<string, number> = {
    absent: 0,
    pre_hominin: 0.002,
    early_hominin: 0.003,
    archaic_human: 0.004,
    homo_sapiens: 0.005,
    modern_hunter_gatherer: 0.006,
    early_settlement: 0.008,
  };
  const baseGrowthRate = stageGrowthRates[human.speciesStage] ?? 0.003;

  let declined = false;
  const updatedCenters: PopulationCenter[] = [];

  for (const center of human.populationCenters) {
    const env = computeEnvironmentalPressure(dna, state, center.latitude);
    const envMult = carryingCapacityMultiplier(env);

    const r = baseGrowthRate * envMult;
    const k = center.carryingCapacity * (0.5 + center.adaptationScore * 0.5);

    const growth = r * center.population * (1 - center.population / k) * dtYears;

    const deathRate =
      env.disease * 0.02 +
      env.disaster * 0.05 +
      env.predator * 0.01 +
      (env.food < 0.2 ? 0.03 : 0) +
      (env.water < 0.2 ? 0.04 : 0) +
      (env.temperature < 0.2 ? 0.05 : 0);

    const deaths = deathRate * center.population * dtYears;

    const newPop = Math.max(0, Math.floor(center.population + growth - deaths));
    if (newPop < center.population) declined = true;

    const adaptationDelta = envMult > 0.5
      ? Math.min(0.001 * dtYears, 1 - center.adaptationScore)
      : -Math.min(0.0005 * dtYears, center.adaptationScore);

    updatedCenters.push({
      ...center,
      population: newPop,
      adaptationScore: Math.max(0, Math.min(1, center.adaptationScore + adaptationDelta)),
    });
  }

  const surviving = updatedCenters.filter((c) => c.population > 0);
  const totalPopulation = surviving.reduce((s, c) => s + c.population, 0);

  return { centers: surviving, totalPopulation, declined };
}

export function updateGeneticDiversity(
  human: HumanEvolutionState,
  dtYears: number,
): number {
  if (human.population < 100) return Math.max(0, human.geneticDiversity - 0.01 * dtYears);

  const populationFactor = Math.min(1, Math.log10(human.population) / 6);
  const centerFactor = Math.min(1, human.populationCenters.length / 10);
  const migrationFactor = Math.min(1, human.migration.length / 8);

  const target = populationFactor * 0.5 + centerFactor * 0.3 + migrationFactor * 0.2;
  const rate = 0.0001 * dtYears;

  if (human.geneticDiversity < target) {
    return Math.min(target, human.geneticDiversity + rate);
  }
  return Math.max(target * 0.8, human.geneticDiversity - rate * 0.5);
}

export function yearsFromDt(dt: number): number {
  return dt / SECONDS.perYear;
}
