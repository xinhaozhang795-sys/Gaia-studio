/**
 * TerrainGenerator — the main orchestrator for terrain generation.
 *
 * Pipeline:
 *   PlanetDNA + GenesisState + GeologicalEvolutionState
 *     ↓
 *   ElevationEngine   → elevation grid from geological events
 *     ↓
 *   FeatureBuilder    → terrain feature nodes from events + grid
 *     ↓
 *   ErosionEngine     → age-based erosion simulation
 *     ↓
 *   BiomeTerrainMapper → biome classification
 *     ↓
 *   TerrainFeatureDetector → feature grouping + rarity
 *     ↓
 *   TerrainOutput
 *
 * Deterministic: same seed → identical terrain. Always.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GenesisState } from '../genesis/types';
import type { GeologicalEvolutionState } from '../evolution/types';
import type {
  TerrainOutput, TerrainFeatureNode, TerrainFeatureType, FormationCause,
  TerrainClass, TerrainStats,
} from './types';
import { generateElevationGrid } from './ElevationEngine';
import { computeErosion } from './ErosionEngine';
import { mapBiomes } from './BiomeTerrainMapper';
import { detectFeatures } from './TerrainFeatureDetector';
import { ASTRONOMICAL } from '../../UnitSystem';

const FEATURE_NAMES = [
  'Solpeak', 'Aetherius', 'Borealis', 'Crommassif', 'Drekrange',
  'Erebor', 'Frostspire', 'Gorgonpeak', 'Heliosridge', 'Iapyx',
  'Jotunheim', 'Kailash', 'Lunaris', 'Mithril', 'Niflheim',
  'Olympus', 'Pandemonium', 'Quorvex', 'Riftscar', 'Sylvanus',
  'Tartarus', 'Umbra', 'Vortex', 'Whiteridge', 'Xenon',
  'Ymirfall', 'Zephyrcrest', 'Anvilspire', 'Blacktusk', 'Crowngem',
  'Doomvault', 'Emberflow', 'Frostwrought', 'Gloomshard', 'Hollowreach',
  'Ironspine', 'Jadecrag', 'Kragmoor', 'Lightrise', 'Mourncrest',
];

let nameIdx = 0;
function nextName(): string {
  return FEATURE_NAMES[nameIdx++ % FEATURE_NAMES.length]!;
}

export function generateTerrain(
  dna: PlanetDNA,
  genesis: GenesisState,
  evolution: GeologicalEvolutionState,
): TerrainOutput {
  nameIdx = 0;

  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  const maxElev = 18000 / Math.pow(gravityScale, 0.7);

  const elevationGrid = generateElevationGrid(dna, genesis, evolution, 200);
  const features = buildFeatures(dna, genesis, evolution, elevationGrid.maxElevation);
  const erosion = computeErosion(dna, features);
  const biomeMap = mapBiomes(dna, features, elevationGrid.cells);
  const featureReport = detectFeatures(features, Math.max(maxElev, elevationGrid.maxElevation));
  const stats = computeStats(features, erosion, elevationGrid, dna);

  return { features, elevationGrid, erosion, biomeMap, featureReport, stats };
}

function buildFeatures(
  dna: PlanetDNA,
  genesis: GenesisState,
  evolution: GeologicalEvolutionState,
  maxElev: number,
): TerrainFeatureNode[] {
  const features: TerrainFeatureNode[] = [];
  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  let nextId = 0;

  for (const coll of evolution.collisions) {
    if (coll.upliftRate < 30) continue;

    let type: TerrainFeatureType;
    let height: number;
    let cause: FormationCause;

    if (coll.type === 'continental-collision') {
      height = Math.min(maxElev, coll.upliftRate * 120 / gravityScale);
      type = height > maxElev * 0.5 ? 'mountain' : 'plateau';
      cause = 'plate-collision';
    } else if (coll.type === 'continental-arc') {
      height = Math.min(maxElev * 0.6, coll.upliftRate * 60 / gravityScale);
      type = 'mountain';
      cause = 'volcanic-arc';
    } else {
      height = Math.min(maxElev * 0.4, coll.upliftRate * 30 / gravityScale);
      type = 'ridge';
      cause = 'subduction';
    }

    if (Math.abs(height) < 100) continue;

    const terrainClass = classifyByElevation(height, maxElev);
    features.push({
      id: nextId++, type,
      latitude: coll.latitude, longitude: coll.longitude,
      angularRadius: 0.08 + coll.convergenceRate * 0.01,
      height: Math.round(height), originalHeight: Math.round(height),
      age: Math.round(dna.age * 0.3),
      formationCause: cause, plateId: coll.plateA,
      erosionLevel: 0, rarity: terrainClass, rarityLabel: 'common',
      name: nextName(),
    });
  }

  for (const sub of evolution.subductions) {
    const subPlate = evolution.plates.plates[sub.subductingPlate];
    const overPlate = evolution.plates.plates[sub.overridingPlate];
    const trenchLat = ((subPlate?.centerLatitude ?? 0) + (overPlate?.centerLatitude ?? 0)) / 2;
    const trenchLon = ((subPlate?.centerLongitude ?? 0) + (overPlate?.centerLongitude ?? 0)) / 2;

    features.push({
      id: nextId++, type: 'trench',
      latitude: trenchLat, longitude: trenchLon,
      angularRadius: 0.06, height: sub.trenchDepth, originalHeight: sub.trenchDepth,
      age: 0, formationCause: 'subduction', plateId: sub.subductingPlate,
      erosionLevel: 0, rarity: classifyByElevation(sub.trenchDepth, maxElev),
      rarityLabel: 'common', name: nextName(),
    });

    if (sub.subductionRate > 2) {
      const arcHeight = Math.min(maxElev * 0.5, sub.subductionRate * 400 / gravityScale);
      features.push({
        id: nextId++, type: 'volcano',
        latitude: sub.arcLatitude, longitude: sub.arcLongitude,
        angularRadius: 0.05, height: Math.round(arcHeight), originalHeight: Math.round(arcHeight),
        age: 0, formationCause: 'volcanic-arc', plateId: sub.overridingPlate,
        erosionLevel: 0, rarity: classifyByElevation(arcHeight, maxElev),
        rarityLabel: 'common', name: nextName(),
      });
    }
  }

  for (const rift of evolution.rifts) {
    const riftLat = (rift.startLat + rift.endLat) / 2;
    const riftLon = (rift.startLon + rift.endLon) / 2;
    const depth = rift.becameOcean ? -(1000 + Math.sqrt(rift.age) * 200) : -800;

    features.push({
      id: nextId++, type: rift.becameOcean ? 'basin' : 'rift',
      latitude: riftLat, longitude: riftLon,
      angularRadius: rift.becameOcean ? 0.1 : 0.05,
      height: Math.round(depth), originalHeight: Math.round(depth),
      age: Math.round(rift.age), formationCause: 'rifting', plateId: rift.plateA,
      erosionLevel: 0, rarity: classifyByElevation(depth, maxElev),
      rarityLabel: 'common', name: rift.name,
    });

    if (rift.age > 5) {
      const shoulderHeight = Math.min(3000 / gravityScale, rift.spreadRate * 200);
      features.push({
        id: nextId++, type: 'mountain',
        latitude: rift.startLat, longitude: rift.startLon,
        angularRadius: 0.03, height: Math.round(shoulderHeight), originalHeight: Math.round(shoulderHeight),
        age: Math.round(rift.age), formationCause: 'rifting', plateId: rift.plateA,
        erosionLevel: 0, rarity: 'normal', rarityLabel: 'common', name: nextName(),
      });
    }
  }

  for (const hs of genesis.hotspots.hotspots) {
    if (!hs.active) continue;
    const volcanoHeight = Math.min(maxElev * 0.4, hs.heatFlow * 8000 / gravityScale);
    if (volcanoHeight < 200) continue;

    features.push({
      id: nextId++, type: 'volcano',
      latitude: hs.latitude, longitude: hs.longitude,
      angularRadius: 0.03, height: Math.round(volcanoHeight), originalHeight: Math.round(volcanoHeight),
      age: 0, formationCause: 'hotspot', plateId: -1,
      erosionLevel: 0, rarity: classifyByElevation(volcanoHeight, maxElev),
      rarityLabel: 'common', name: nextName(),
    });

    const chain = genesis.hotspots.islandChains.find((c) => c.hotspotId === hs.id);
    if (chain) {
      for (let i = 0; i < Math.min(chain.islandCount, 5); i++) {
        const offset = i * 0.02;
        const islandLat = hs.latitude + Math.cos(chain.heading) * offset;
        const islandLon = hs.longitude + Math.sin(chain.heading) * offset;
        features.push({
          id: nextId++, type: 'island',
          latitude: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, islandLat)),
          longitude: ((islandLon % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
          angularRadius: 0.015,
          height: Math.round(volcanoHeight * (1 - i * 0.15)),
          originalHeight: Math.round(volcanoHeight * (1 - i * 0.15)),
          age: i * Math.round(chain.firstEruption),
          formationCause: 'hotspot', plateId: -1,
          erosionLevel: i * 0.1, rarity: 'normal', rarityLabel: 'common',
          name: nextName(),
        });
      }
    }
  }

  const impacts = evolution.historyEvents.filter((e) => e.title.includes('Impact'));
  for (const impact of impacts) {
    const impactLat = ((impact.time % 180) - 90) * Math.PI / 180;
    const impactLon = ((impact.time * 7) % 360) * Math.PI / 180;
    const craterDepth = -1500 / gravityScale;

    features.push({
      id: nextId++, type: 'crater',
      latitude: impactLat, longitude: impactLon,
      angularRadius: 0.04, height: Math.round(craterDepth), originalHeight: Math.round(craterDepth),
      age: Math.round(impact.time), formationCause: 'impact', plateId: -1,
      erosionLevel: Math.min(0.8, impact.time / 500),
      rarity: classifyByElevation(craterDepth, maxElev), rarityLabel: 'common',
      name: nextName(),
    });
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 80; i++) {
    const y = 1 - (i / 79) * 2;
    const lat = Math.asin(y);
    const lon = (goldenAngle * i) % (Math.PI * 2);
    const isOcean = dna.waterRatio > 0.5;
    const elevation = isOcean ? -2000 - Math.abs(y) * 1000 : 200 + Math.abs(y) * 300;

    features.push({
      id: nextId++, type: isOcean ? 'basin' : 'plain',
      latitude: lat, longitude: lon, angularRadius: 0.25,
      height: Math.round(elevation), originalHeight: Math.round(elevation),
      age: Math.round(dna.age), formationCause: 'background', plateId: -1,
      erosionLevel: 0.3, rarity: 'normal', rarityLabel: 'common',
      name: nextName(),
    });
  }

  enforceDistribution(features);
  return features;
}

function classifyByElevation(elevation: number, maxElev: number): TerrainClass {
  const absE = Math.abs(elevation);
  if (absE >= maxElev * 0.65) return 'wonder';
  if (absE >= maxElev * 0.35) return 'spectacular';
  return 'normal';
}

function enforceDistribution(features: TerrainFeatureNode[]): void {
  const total = features.length;
  if (total === 0) return;

  const targetWonder = Math.round(total * 0.10);
  const targetSpectacular = Math.round(total * 0.20);

  const sorted = [...features].sort((a, b) =>
    Math.abs(b.height) - Math.abs(a.height));

  for (const f of features) f.rarity = 'normal';

  for (let i = 0; i < targetWonder && i < sorted.length; i++) {
    sorted[i]!.rarity = 'wonder';
  }
  for (let i = targetWonder; i < targetWonder + targetSpectacular && i < sorted.length; i++) {
    sorted[i]!.rarity = 'spectacular';
  }
}

function computeStats(
  features: TerrainFeatureNode[],
  erosion: { meanErosion: number },
  grid: { maxElevation: number; minElevation: number; meanElevation: number },
  _dna: PlanetDNA,
): TerrainStats {
  const elevations = features.map((f) => f.height);
  const maxElev = elevations.length > 0 ? Math.max(...elevations) : 0;
  const minElev = elevations.length > 0 ? Math.min(...elevations) : 0;

  const highestFeature = features.find((f) => f.height === maxElev);
  const deepestFeature = features.find((f) => f.height === minElev);

  const landCount = features.filter((f) => f.height > 0).length;
  const total = features.length || 1;

  const wonderCount = features.filter((f) => f.rarity === 'wonder').length;
  const spectacularCount = features.filter((f) => f.rarity === 'spectacular').length;
  const normalCount = features.filter((f) => f.rarity === 'normal').length;

  return {
    meanElevation: grid.meanElevation,
    maxElevation: Math.max(maxElev, grid.maxElevation),
    minElevation: Math.min(minElev, grid.minElevation),
    landFraction: Math.round((landCount / total) * 100) / 100,
    oceanFraction: Math.round(((total - landCount) / total) * 100) / 100,
    highestPeak: highestFeature?.name ?? 'Unknown',
    deepestPoint: deepestFeature?.name ?? 'Unknown',
    mountainCount: features.filter((f) => f.type === 'mountain').length,
    volcanoCount: features.filter((f) => f.type === 'volcano').length,
    craterCount: features.filter((f) => f.type === 'crater').length,
    riftCount: features.filter((f) => f.type === 'rift').length,
    meanErosion: erosion.meanErosion,
    classDistribution: {
      wonder: Math.round((wonderCount / total) * 100) / 100,
      spectacular: Math.round((spectacularCount / total) * 100) / 100,
      normal: Math.round((normalCount / total) * 100) / 100,
    },
  };
}
