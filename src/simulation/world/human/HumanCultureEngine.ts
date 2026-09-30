/**
 * HumanCultureEngine — prehistoric culture and technology evolution.
 *
 * Cultural traits are discovered progressively, gated by:
 *   • Species stage (you can't have agriculture as pre_hominin)
 *   • Environmental pressure (necessity drives innovation)
 *   • Genetic diversity (more diverse = more innovation)
 *   • Time since emergence
 *   • Population size (larger = more ideas)
 *
 * Allowed traits stop at early_metalworking. No industrialization,
 * electricity, internet, automobiles, modern cities, or spaceflight.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GaiaState } from '../../types';
import type {
  HumanEvolutionState, CulturalTrait, Settlement, SettlementType,
} from './types';
import { stageIndex } from './types';
import { carryingCapacityMultiplier, computeEnvironmentalPressure } from './HumanEvolutionEngine';

const TRAIT_MIN_STAGE: Record<CulturalTrait, number> = {
  stone_tools: 1, controlled_fire: 1, hunting: 1, gathering: 0,
  fishing: 2, clothing: 2, shelter: 2,
  symbolic_art: 3, burial: 3, language: 3,
  domestication: 4, agriculture: 4,
  pottery: 5, early_metalworking: 5,
};

const TRAIT_DIFFICULTY: Record<CulturalTrait, number> = {
  stone_tools: 0.1, controlled_fire: 0.15, hunting: 0.1, gathering: 0.05,
  fishing: 0.2, clothing: 0.2, shelter: 0.15,
  symbolic_art: 0.5, burial: 0.5, language: 0.6,
  domestication: 0.7, agriculture: 0.75,
  pottery: 0.8, early_metalworking: 0.9,
};

export function discoverTraits(
  dna: PlanetDNA,
  state: GaiaState,
  human: HumanEvolutionState,
  rngState: number,
  dtYears: number,
): { culture: CulturalTrait[]; rngState: number; newTraits: CulturalTrait[] } {
  if (!human.humanPresence) {
    return { culture: [], rngState, newTraits: [] };
  }

  const stageIdx = stageIndex(human.speciesStage);
  const currentTraits = new Set(human.culture);
  const newTraits: CulturalTrait[] = [];
  let rng = rngState;

  const popFactor = Math.min(1, Math.log10(Math.max(1, human.population)) / 5);

  const avgEnv = human.populationCenters.length > 0
    ? human.populationCenters.reduce((s, c) => {
        const env = computeEnvironmentalPressure(dna, state, c.latitude);
        return s + carryingCapacityMultiplier(env);
      }, 0) / human.populationCenters.length
    : 0.3;

  const necessity = 0.3 + (1 - avgEnv) * 0.4;

  for (const trait of Object.keys(TRAIT_MIN_STAGE) as CulturalTrait[]) {
    if (currentTraits.has(trait)) continue;

    const minStage = TRAIT_MIN_STAGE[trait];
    if (stageIdx < minStage) continue;

    const difficulty = TRAIT_DIFFICULTY[trait];
    const discoveryRate =
      (1 - difficulty) * popFactor * necessity *
      human.geneticDiversity * 0.001 * dtYears;

    rng = ((rng * 1103515245 + 12345) & 0x7fffffff) || 1;
    const roll = rng / 0x7fffffff;

    if (roll < discoveryRate) {
      currentTraits.add(trait);
      newTraits.push(trait);
    }
  }

  return { culture: Array.from(currentTraits), rngState: rng, newTraits };
}

export function updateTechnologyLevel(human: HumanEvolutionState): number {
  const traitCount = human.culture.length;
  const maxTraits = 14;
  const traitFactor = traitCount / maxTraits;
  const popFactor = Math.min(1, Math.log10(Math.max(1, human.population)) / 6);
  return Math.min(1, traitFactor * 0.7 + popFactor * 0.3);
}

export function updateLanguageComplexity(human: HumanEvolutionState): number {
  if (!human.culture.includes('language')) return 0;
  const stageIdx = stageIndex(human.speciesStage);
  const stageFactor = Math.min(1, (stageIdx - 2) / 3);
  const popFactor = Math.min(1, Math.log10(Math.max(1, human.population)) / 6);
  const traitFactor = human.culture.length / 14;
  return Math.min(1, stageFactor * 0.4 + popFactor * 0.3 + traitFactor * 0.3);
}

export function settlementTypeForStage(human: HumanEvolutionState): SettlementType | null {
  const stageIdx = stageIndex(human.speciesStage);
  if (stageIdx < 2) return null;
  if (stageIdx < 3) return 'temporary_camp';
  if (stageIdx < 4) return 'seasonal_camp';
  if (stageIdx < 5) return 'village';
  return 'early_agricultural_settlement';
}

export function foundSettlements(
  dna: PlanetDNA,
  state: GaiaState,
  human: HumanEvolutionState,
  rngState: number,
): { settlements: Settlement[]; rngState: number; newSettlements: Settlement[] } {
  if (!human.humanPresence) {
    return { settlements: [], rngState, newSettlements: [] };
  }

  const settlementType = settlementTypeForStage(human);
  if (!settlementType) {
    return { settlements: human.settlements, rngState, newSettlements: [] };
  }

  const popThreshold =
    settlementType === 'temporary_camp' ? 50 :
    settlementType === 'seasonal_camp' ? 100 :
    settlementType === 'village' ? 300 : 500;

  let rng = rngState;
  const newSettlements: Settlement[] = [];
  const allSettlements = [...human.settlements];
  let nextId = allSettlements.length > 0
    ? Math.max(0, ...allSettlements.map((s) => s.id)) + 1 : 0;

  for (const center of human.populationCenters) {
    if (center.population < popThreshold) continue;

    const existing = allSettlements.some(
      (s) => Math.abs(s.latitude - center.latitude) < 0.05 &&
             Math.abs(s.longitude - center.longitude) < 0.05,
    );
    if (existing) continue;

    const env = computeEnvironmentalPressure(dna, state, center.latitude);
    const habitability = carryingCapacityMultiplier(env);
    if (habitability < 0.3) continue;

    rng = ((rng * 1103515245 + 12345) & 0x7fffffff) || 1;
    const roll = rng / 0x7fffffff;
    if (roll > 0.1) continue;

    const settlement: Settlement = {
      id: nextId++,
      type: settlementType,
      latitude: center.latitude,
      longitude: center.longitude,
      population: Math.floor(center.population * 0.5),
      foundedYear: Math.floor(human.yearsSinceEmergence),
      culturalTraits: [...human.culture],
    };

    allSettlements.push(settlement);
    newSettlements.push(settlement);
  }

  return { settlements: allSettlements, rngState: rng, newSettlements };
}

export function updateSettlementLevel(human: HumanEvolutionState): number {
  if (human.settlements.length === 0) return 0;
  const typeLevels: Record<SettlementType, number> = {
    temporary_camp: 0.2,
    seasonal_camp: 0.4,
    village: 0.7,
    early_agricultural_settlement: 1.0,
  };
  const avgLevel = human.settlements.reduce((s, set) => s + typeLevels[set.type], 0) / human.settlements.length;
  const countFactor = Math.min(1, human.settlements.length / 20);
  return Math.min(1, avgLevel * countFactor);
}
