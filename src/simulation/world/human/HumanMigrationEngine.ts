/**
 * HumanMigrationEngine — deterministic, terrain-aware migration.
 *
 * Humans migrate along:
 *   • coastlines, plains, valleys, rivers (low cost)
 *   • warm regions, water sources (low cost)
 *
 * Migration is blocked or slowed by:
 *   • high mountains, extreme cold, extreme drought (high cost)
 *   • large deserts, glaciers, volcanic regions (high cost)
 *
 * Deterministic: same seed → same migration history.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GaiaState } from '../../types';
import type {
  HumanEvolutionState, PopulationCenter, MigrationRoute,
} from './types';
import { computeEnvironmentalPressure, carryingCapacityMultiplier } from './HumanEvolutionEngine';

function angularDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function moveOnSphere(
  lat: number, lon: number,
  dir: number, dist: number,
): { lat: number; lon: number } {
  const newLat = Math.asin(
    Math.sin(lat) * Math.cos(dist) +
    Math.cos(lat) * Math.sin(dist) * Math.cos(dir),
  );
  const dLon = Math.atan2(
    Math.sin(dir) * Math.sin(dist) * Math.cos(lat),
    Math.cos(dist) - Math.sin(lat) * Math.sin(newLat),
  );
  return {
    lat: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newLat)),
    lon: ((lon + dLon) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2),
  };
}

export function migrationCost(
  dna: PlanetDNA,
  state: GaiaState,
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
): number {
  const distance = angularDistance(fromLat, fromLon, toLat, toLon);
  if (distance < 1e-6) return 0;

  const env = computeEnvironmentalPressure(dna, state, toLat);
  const habitability = carryingCapacityMultiplier(env);

  if (habitability < 0.05) return Infinity;

  const terrainCost =
    env.terrain < 0.2 ? 3.0 :
    env.terrain < 0.4 ? 1.5 :
    1.0;

  const climateCost =
    env.temperature < 0.2 ? 3.0 :
    env.temperature < 0.4 ? 1.5 :
    1.0;

  const waterCost = env.water < 0.15 ? 2.0 : 1.0;

  return distance * terrainCost * climateCost * waterCost;
}

export function expandMigration(
  dna: PlanetDNA,
  state: GaiaState,
  human: HumanEvolutionState,
  rngState: number,
  dtYears: number,
): {
  centers: PopulationCenter[];
  routes: MigrationRoute[];
  rngState: number;
  expanded: boolean;
} {
  if (!human.humanPresence || human.populationCenters.length === 0) {
    return {
      centers: human.populationCenters,
      routes: human.migration,
      rngState,
      expanded: false,
    };
  }

  const expansionThreshold = 800;
  const maxCenters = 30;

  let rng = rngState;
  let expanded = false;
  const newCenters = [...human.populationCenters];
  const newRoutes = [...human.migration];
  let nextCenterId = Math.max(0, ...newCenters.map((c) => c.id)) + 1;
  let nextRouteId = Math.max(0, ...newRoutes.map((r) => r.id)) + 1;

  const shouldExpand = human.yearsSinceEmergence > 50_000 &&
    newCenters.length < maxCenters &&
    Math.floor(human.yearsSinceEmergence / dtYears) % 100 === 0;

  if (!shouldExpand) {
    return { centers: newCenters, routes: newRoutes, rngState: rng, expanded: false };
  }

  for (const center of newCenters) {
    if (center.population < expansionThreshold) continue;
    if (newCenters.length >= maxCenters) break;

    rng = ((rng * 1103515245 + 12345) & 0x7fffffff) || 1;
    const direction = (rng / 0x7fffffff) * Math.PI * 2;
    const distance = 0.15 + ((rng = ((rng * 1103515245 + 12345) & 0x7fffffff) || 1) / 0x7fffffff) * 0.2;

    const target = moveOnSphere(center.latitude, center.longitude, direction, distance);

    const cost = migrationCost(dna, state, center.latitude, center.longitude, target.lat, target.lon);
    if (!isFinite(cost) || cost > 1.5) continue;

    const tooClose = newCenters.some(
      (c) => angularDistance(c.latitude, c.longitude, target.lat, target.lon) < 0.1,
    );
    if (tooClose) continue;

    const offshootPop = Math.floor(center.population * 0.15);
    if (offshootPop < 50) continue;

    const env = computeEnvironmentalPressure(dna, state, target.lat);
    const cap = carryingCapacityMultiplier(env);

    newCenters.push({
      id: nextCenterId++,
      latitude: target.lat,
      longitude: target.lon,
      population: offshootPop,
      carryingCapacity: Math.floor(cap * 5000),
      adaptationScore: 0.2,
    });

    newRoutes.push({
      id: nextRouteId++,
      fromLat: center.latitude,
      fromLon: center.longitude,
      toLat: target.lat,
      toLon: target.lon,
      yearEstablished: Math.floor(human.yearsSinceEmergence),
      cost,
    });

    const sourceIdx = newCenters.findIndex((c) => c.id === center.id);
    if (sourceIdx >= 0) {
      newCenters[sourceIdx] = {
        ...newCenters[sourceIdx]!,
        population: newCenters[sourceIdx]!.population - offshootPop,
      };
    }

    expanded = true;
  }

  return { centers: newCenters, routes: newRoutes, rngState: rng, expanded };
}
