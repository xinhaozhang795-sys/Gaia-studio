/**
 * HotspotGenerator — generates surface hotspots from mantle plumes.
 *
 * Each mantle plume that reaches the surface becomes a hotspot. Hotspots
 * generate volcanic chains as the overlying plate moves over them (like
 * the Hawaiian chain). Island chains are projected based on plate velocity
 * and plume buoyancy.
 *
 * Deterministic: same DNA + MantleState + PlateState → same HotspotState.
 */

import type { PlanetDNA } from '../PlanetDNA';
import { RandomEngine } from '../RandomEngine';
import type { MantleState, PlateState } from './types';
import type { HotspotState, Hotspot, IslandChain } from './types';

function angularDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const ISLAND_NAMES = [
  'Hawaiian', 'Emperor', 'Réunion', 'Kerguelen', 'Galápagos',
  'Iceland', 'Yellowstone', 'Afar', 'Tristan', 'Samoa',
  'Caroline', 'MacDonald', 'Pitcairn', 'Easter', 'Bowie',
];

export function generateHotspotState(
  dna: PlanetDNA,
  mantle: MantleState,
  plates: PlateState,
): HotspotState {
  const rng = new RandomEngine(dna.seedHash ^ 0x484f5453); // "HOTS"

  const minBuoyancy = 5;
  const eligiblePlumes = mantle.plumes.filter((p) => p.buoyancyFlux >= minBuoyancy);

  const hotspots: Hotspot[] = eligiblePlumes.map((plume, i) => {
    const eruptionTemp = dna.mantleTemperature + plume.temperatureAnomaly;
    const heatFlow = mantle.meanHeatFlux * (1 + plume.temperatureAnomaly / 500);

    let nearestPlate = plates.plates[0]!;
    let minDist = Infinity;
    for (const plate of plates.plates) {
      const d = angularDistance(plume.latitude, plume.longitude,
                                 plate.centerLatitude, plate.centerLongitude);
      if (d < minDist) {
        minDist = d;
        nearestPlate = plate;
      }
    }
    const chainLength = nearestPlate.velocity * 10 * 50;

    return {
      id: i,
      latitude: plume.latitude,
      longitude: plume.longitude,
      plumeId: plume.id,
      heatFlow,
      eruptionTemp: Math.round(eruptionTemp),
      chainLength: Math.round(chainLength),
      active: rng.nextFloat() > 0.2,
    };
  });

  const islandChains: IslandChain[] = [];
  let chainIdx = 0;

  for (const hotspot of hotspots) {
    if (!hotspot.active || hotspot.chainLength < 100) continue;

    let nearestPlate = plates.plates[0]!;
    let minDist = Infinity;
    for (const plate of plates.plates) {
      const d = angularDistance(hotspot.latitude, hotspot.longitude,
                                 plate.centerLatitude, plate.centerLongitude);
      if (d < minDist) {
        minDist = d;
        nearestPlate = plate;
      }
    }

    const islandCount = Math.max(2, Math.min(20, Math.floor(hotspot.chainLength / 300)));
    const firstEruption = rng.nextFloatRange(0.5, 50);

    islandChains.push({
      name: ISLAND_NAMES[chainIdx % ISLAND_NAMES.length]!,
      hotspotId: hotspot.id,
      islandCount,
      heading: nearestPlate.direction,
      firstEruption: Math.round(firstEruption * 10) / 10,
    });
    chainIdx++;
  }

  const co2Output = hotspots.filter((h) => h.active).length * 0.02;

  return {
    hotspots,
    islandChains,
    co2Output: Math.round(co2Output * 100) / 100,
  };
}
