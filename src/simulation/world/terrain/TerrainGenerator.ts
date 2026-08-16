/**
 * TerrainGenerator — the main orchestrator for terrain generation.
 *
 * Sprint 7.4.1 calibration:
 *   • Volcanic features are clustered into provinces (one per plate pair
 *     for subduction, one per hotspot) instead of one per event.
 *   • Mountain ranges generate multiple peaks along connected systems.
 *   • 10/20/70 distribution is computed by SURFACE AREA, not feature count.
 *   • Rarity uses multi-factor classification (scale + age + cause + extent).
 *
 * Pipeline:
 *   PlanetDNA + GenesisState + GeologicalEvolutionState
 *     ↓ ElevationEngine → elevation grid
 *     ↓ FeatureBuilder  → clustered, geologically-grounded features
 *     ↓ ErosionEngine   → age-based erosion
 *     ↓ BiomeTerrainMapper → biome classification
 *     ↓ TerrainFeatureDetector → feature grouping + rarity
 *     ↓ TerrainOutput
 *
 * Deterministic: same seed → identical terrain. Always.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GenesisState } from '../genesis/types';
import type { GeologicalEvolutionState, SubductionEvent, CollisionEvent } from '../evolution/types';
import type {
  TerrainOutput, TerrainFeatureNode, TerrainFeatureType, FormationCause,
  TerrainClass, TerrainStats,
} from './types';
import { generateElevationGrid } from './ElevationEngine';
import { computeErosion } from './ErosionEngine';
import { mapBiomes } from './BiomeTerrainMapper';
import { detectFeatures } from './TerrainFeatureDetector';
import { ASTRONOMICAL } from '../../UnitSystem';

// ── Spherical helper ──────────────────────────────────────────────────────────

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

function heading(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
}

// ── Name generator ────────────────────────────────────────────────────────────

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

// ── Province tracking ─────────────────────────────────────────────────────────

let nextProvinceId = 0;
function newProvince(): number {
  return nextProvinceId++;
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function generateTerrain(
  dna: PlanetDNA,
  genesis: GenesisState,
  evolution: GeologicalEvolutionState,
): TerrainOutput {
  nameIdx = 0;
  nextProvinceId = 0;

  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  const maxElev = 18000 / Math.pow(gravityScale, 0.7);

  // 1. Elevation grid
  const elevationGrid = generateElevationGrid(dna, genesis, evolution, 200);

  // 2. Build clustered features
  const features = buildFeatures(dna, genesis, evolution, elevationGrid.maxElevation);

  // 3. Apply erosion
  const erosion = computeErosion(dna, features);

  // 4. Map biomes
  const biomeMap = mapBiomes(dna, features, elevationGrid.cells);

  // 5. Detect + classify (area-weighted)
  const featureReport = detectFeatures(features, Math.max(maxElev, elevationGrid.maxElevation));

  // 6. Compute area-weighted stats
  const stats = computeStats(features, erosion, elevationGrid);

  return { features, elevationGrid, erosion, biomeMap, featureReport, stats };
}

// ── Feature builder ───────────────────────────────────────────────────────────

function buildFeatures(
  dna: PlanetDNA,
  genesis: GenesisState,
  evolution: GeologicalEvolutionState,
  maxElev: number,
): TerrainFeatureNode[] {
  const features: TerrainFeatureNode[] = [];
  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  let nextId = 0;

  // ── Collision features: mountain ranges with multiple peaks ────────────────
  // Group collisions by plate pair so each pair produces ONE mountain system,
  // not dozens of independent peaks.
  const collisionPairs = new Map<string, CollisionEvent[]>();
  for (const coll of evolution.collisions) {
    if (coll.upliftRate < 30) continue;
    const key = coll.plateA < coll.plateB
      ? `${coll.plateA}-${coll.plateB}`
      : `${coll.plateB}-${coll.plateA}`;
    if (!collisionPairs.has(key)) collisionPairs.set(key, []);
    collisionPairs.get(key)!.push(coll);
  }

  for (const [, events] of collisionPairs) {
    // Aggregate: find the strongest collision event for this plate pair
    const strongest = events.reduce((best, e) =>
      e.upliftRate > best.upliftRate ? e : best, events[0]!);
    if (!strongest) continue;

    const provinceId = newProvince();
    const peakHeight = Math.min(maxElev, strongest.upliftRate * 120 / gravityScale);
    if (peakHeight < 200) continue;

    // Create the main mountain system: a central peak + satellite peaks
    // along a range axis perpendicular to the collision direction.
    const rangeAxis = strongest.angle + Math.PI / 2;
    const numPeaks = Math.min(5, Math.max(1, Math.floor(strongest.convergenceRate / 2)));

    for (let i = 0; i < numPeaks; i++) {
      const offset = (i - (numPeaks - 1) / 2) * 0.04;
      const pos = moveOnSphere(
        strongest.latitude, strongest.longitude,
        rangeAxis, Math.abs(offset),
      );
      // Each peak slightly lower than the central one
      const peakFactor = 1 - Math.abs(i - (numPeaks - 1) / 2) * 0.12;
      const height = Math.round(peakHeight * peakFactor);

      features.push({
        id: nextId++,
        type: height > maxElev * 0.5 ? 'mountain' : 'plateau',
        latitude: pos.lat,
        longitude: pos.lon,
        angularRadius: 0.06 + strongest.convergenceRate * 0.005,
        height,
        originalHeight: height,
        age: Math.round(dna.age * 0.3),
        formationCause: strongest.type === 'continental-collision' ? 'plate-collision' : 'volcanic-arc',
        plateId: strongest.plateA,
        erosionLevel: 0,
        rarity: classifyByElevation(height, maxElev),
        rarityLabel: 'common',
        name: nextName(),
        provinceId,
      });
    }
  }

  // ── Subduction features: trenches + volcanic arcs ──────────────────────────
  // Deduplicate: one trench + one volcanic arc province per plate pair.
  const subductionPairs = new Map<string, SubductionEvent[]>();
  for (const sub of evolution.subductions) {
    const key = sub.subductingPlate < sub.overridingPlate
      ? `${sub.subductingPlate}-${sub.overridingPlate}`
      : `${sub.overridingPlate}-${sub.subductingPlate}`;
    if (!subductionPairs.has(key)) subductionPairs.set(key, []);
    subductionPairs.get(key)!.push(sub);
  }

  for (const [, events] of subductionPairs) {
    // Aggregate: strongest subduction for this pair
    const strongest = events.reduce((best, e) =>
      e.subductionRate > best.subductionRate ? e : best, events[0]!);
    if (!strongest) continue;

    const plates = evolution.plates.plates;
    const subPlate = plates[strongest.subductingPlate];
    const overPlate = plates[strongest.overridingPlate];

    // ── Trench (one per pair) ────────────────────────────────────────────────
    const trenchLat = ((subPlate?.centerLatitude ?? 0) + (overPlate?.centerLatitude ?? 0)) / 2;
    const trenchLon = ((subPlate?.centerLongitude ?? 0) + (overPlate?.centerLongitude ?? 0)) / 2;

    features.push({
      id: nextId++,
      type: 'trench',
      latitude: trenchLat,
      longitude: trenchLon,
      angularRadius: 0.06,
      height: strongest.trenchDepth,
      originalHeight: strongest.trenchDepth,
      age: 0,
      formationCause: 'subduction',
      plateId: strongest.subductingPlate,
      erosionLevel: 0,
      rarity: classifyByElevation(strongest.trenchDepth, maxElev),
      rarityLabel: 'common',
      name: nextName(),
      provinceId: newProvince(),
    });

    // ── Volcanic arc province (one per pair, multiple peaks) ─────────────────
    if (strongest.subductionRate > 2) {
      const provinceId = newProvince();
      const arcHeight = Math.min(maxElev * 0.5, strongest.subductionRate * 400 / gravityScale);
      const numArcVolcanoes = Math.min(4, Math.max(1, Math.floor(strongest.subductionRate / 3)));

      // Volcanic arc follows the trench-parallel axis
      const trenchToArcHeading = heading(
        trenchLat, trenchLon,
        strongest.arcLatitude, strongest.arcLongitude,
      );
      const arcAxis = trenchToArcHeading + Math.PI / 2;

      for (let i = 0; i < numArcVolcanoes; i++) {
        const offset = (i - (numArcVolcanoes - 1) / 2) * 0.03;
        const pos = moveOnSphere(
          strongest.arcLatitude, strongest.arcLongitude,
          arcAxis, Math.abs(offset),
        );
        const volcanoFactor = 1 - Math.abs(i - (numArcVolcanoes - 1) / 2) * 0.15;
        const height = Math.round(arcHeight * volcanoFactor);
        if (height < 200) continue;

        features.push({
          id: nextId++,
          type: 'volcano',
          latitude: pos.lat,
          longitude: pos.lon,
          angularRadius: 0.04,
          height,
          originalHeight: height,
          age: 0,
          formationCause: 'volcanic-arc',
          plateId: strongest.overridingPlate,
          erosionLevel: 0,
          rarity: classifyByElevation(height, maxElev),
          rarityLabel: 'common',
          name: nextName(),
          provinceId,
        });
      }
    }
  }

  // ── Rift features ──────────────────────────────────────────────────────────
  for (const rift of evolution.rifts) {
    const riftLat = (rift.startLat + rift.endLat) / 2;
    const riftLon = (rift.startLon + rift.endLon) / 2;
    const depth = rift.becameOcean
      ? -(1000 + Math.sqrt(rift.age) * 200)
      : -800;
    const provinceId = newProvince();

    features.push({
      id: nextId++,
      type: rift.becameOcean ? 'basin' : 'rift',
      latitude: riftLat,
      longitude: riftLon,
      angularRadius: rift.becameOcean ? 0.1 : 0.05,
      height: Math.round(depth),
      originalHeight: Math.round(depth),
      age: Math.round(rift.age),
      formationCause: 'rifting',
      plateId: rift.plateA,
      erosionLevel: 0,
      rarity: classifyByElevation(depth, maxElev),
      rarityLabel: 'common',
      name: rift.name,
      provinceId,
    });

    // Rift shoulder mountains (2 peaks, one on each side)
    if (rift.age > 5) {
      const shoulderHeight = Math.min(3000 / gravityScale, rift.spreadRate * 200);
      const riftHeadingVal = heading(rift.startLat, rift.startLon, rift.endLat, rift.endLon);
      for (const side of [1, -1]) {
        const shoulderPos = moveOnSphere(
          riftLat, riftLon,
          riftHeadingVal + side * Math.PI / 2,
          0.03,
        );
        features.push({
          id: nextId++,
          type: 'mountain',
          latitude: shoulderPos.lat,
          longitude: shoulderPos.lon,
          angularRadius: 0.03,
          height: Math.round(shoulderHeight),
          originalHeight: Math.round(shoulderHeight),
          age: Math.round(rift.age),
          formationCause: 'rifting',
          plateId: rift.plateA,
          erosionLevel: 0,
          rarity: 'normal',
          rarityLabel: 'common',
          name: nextName(),
          provinceId,
        });
      }
    }
  }

  // ── Hotspot features: volcanic provinces (one volcano + island chain) ──────
  for (const hs of genesis.hotspots.hotspots) {
    if (!hs.active) continue;
    const volcanoHeight = Math.min(maxElev * 0.4, hs.heatFlow * 8000 / gravityScale);
    if (volcanoHeight < 200) continue;

    const provinceId = newProvince();

    // Main volcanic center
    features.push({
      id: nextId++,
      type: 'volcano',
      latitude: hs.latitude,
      longitude: hs.longitude,
      angularRadius: 0.03,
      height: Math.round(volcanoHeight),
      originalHeight: Math.round(volcanoHeight),
      age: 0,
      formationCause: 'hotspot',
      plateId: -1,
      erosionLevel: 0,
      rarity: classifyByElevation(volcanoHeight, maxElev),
      rarityLabel: 'common',
      name: nextName(),
      provinceId,
    });

    // Island chain — limited to 3-5 islands along the plate motion direction
    const chain = genesis.hotspots.islandChains.find((c) => c.hotspotId === hs.id);
    if (chain) {
      const numIslands = Math.min(chain.islandCount, 4);
      for (let i = 0; i < numIslands; i++) {
        const offset = (i + 1) * 0.025;
        const islandLat = hs.latitude + Math.cos(chain.heading) * offset;
        const islandLon = hs.longitude + Math.sin(chain.heading) * offset;
        const islandHeight = Math.round(volcanoHeight * (1 - (i + 1) * 0.18));
        if (islandHeight < 100) break;

        features.push({
          id: nextId++,
          type: 'island',
          latitude: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, islandLat)),
          longitude: ((islandLon % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
          angularRadius: 0.015,
          height: islandHeight,
          originalHeight: islandHeight,
          age: (i + 1) * Math.round(chain.firstEruption),
          formationCause: 'hotspot',
          plateId: -1,
          erosionLevel: (i + 1) * 0.12,
          rarity: 'normal',
          rarityLabel: 'common',
          name: nextName(),
          provinceId,
        });
      }
    }
  }

  // ── Impact features ────────────────────────────────────────────────────────
  const impacts = evolution.historyEvents.filter((e) => e.title.includes('Impact'));
  for (const impact of impacts) {
    const impactLat = ((impact.time % 180) - 90) * Math.PI / 180;
    const impactLon = ((impact.time * 7) % 360) * Math.PI / 180;
    const craterDepth = -1500 / gravityScale;

    features.push({
      id: nextId++,
      type: 'crater',
      latitude: impactLat,
      longitude: impactLon,
      angularRadius: 0.04,
      height: Math.round(craterDepth),
      originalHeight: Math.round(craterDepth),
      age: Math.round(impact.time),
      formationCause: 'impact',
      plateId: -1,
      erosionLevel: Math.min(0.8, impact.time / 500),
      rarity: classifyByElevation(craterDepth, maxElev),
      rarityLabel: 'common',
      name: nextName(),
      provinceId: newProvince(),
    });
  }

  // ── Background terrain: plains, basins (fills majority of surface) ─────────
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 80; i++) {
    const y = 1 - (i / 79) * 2;
    const lat = Math.asin(y);
    const lon = (goldenAngle * i) % (Math.PI * 2);

    const isOcean = dna.waterRatio > 0.5;
    const elevation = isOcean
      ? -2000 - Math.abs(y) * 1000
      : 200 + Math.abs(y) * 300;

    features.push({
      id: nextId++,
      type: isOcean ? 'basin' : 'plain',
      latitude: lat,
      longitude: lon,
      angularRadius: 0.25,
      height: Math.round(elevation),
      originalHeight: Math.round(elevation),
      age: Math.round(dna.age),
      formationCause: 'background',
      plateId: -1,
      erosionLevel: 0.3,
      rarity: 'normal',
      rarityLabel: 'common',
      name: nextName(),
      provinceId: -1,
    });
  }

  // ── Area-weighted 10/20/70 distribution ────────────────────────────────────
  enforceAreaDistribution(features);

  return features;
}

function classifyByElevation(elevation: number, maxElev: number): TerrainClass {
  const absE = Math.abs(elevation);
  if (absE >= maxElev * 0.65) return 'wonder';
  if (absE >= maxElev * 0.35) return 'spectacular';
  return 'normal';
}

/**
 * Enforce 10/20/70 distribution weighted by SURFACE AREA (angularRadius²),
 * not by feature count. A single mountain range covering a large area
 * counts more than hundreds of tiny hills.
 *
 * Tolerance: ±5% on each target (wonder 5-15%, spectacular 15-25%, normal 60-80%).
 */
function enforceAreaDistribution(features: TerrainFeatureNode[]): void {
  if (features.length === 0) return;

  // Compute surface area proxy for each feature
  const withArea = features.map((f) => ({
    feature: f,
    area: f.angularRadius * f.angularRadius,
    absHeight: Math.abs(f.height),
  }));

  const totalArea = withArea.reduce((s, w) => s + w.area, 0);
  if (totalArea <= 0) return;

  // Sort by absolute height (most extreme first)
  withArea.sort((a, b) => b.absHeight - a.absHeight);

  // Reset all to normal
  for (const w of withArea) w.feature.rarity = 'normal';

  // Promote features to wonder/spectacular until area targets are met
  let wonderArea = 0;
  let spectacularArea = 0;
  const wonderTarget = totalArea * 0.10;
  const spectacularTarget = totalArea * 0.20;

  for (const w of withArea) {
    if (wonderArea < wonderTarget) {
      w.feature.rarity = 'wonder';
      wonderArea += w.area;
    } else if (spectacularArea < spectacularTarget) {
      w.feature.rarity = 'spectacular';
      spectacularArea += w.area;
    } else {
      break;
    }
  }
}

// ── Statistics (area-weighted) ────────────────────────────────────────────────

function computeStats(
  features: TerrainFeatureNode[],
  erosion: { meanErosion: number },
  grid: { maxElevation: number; minElevation: number; meanElevation: number },
): TerrainStats {
  const elevations = features.map((f) => f.height);
  const maxElev = elevations.length > 0 ? Math.max(...elevations) : 0;
  const minElev = elevations.length > 0 ? Math.min(...elevations) : 0;

  const highestFeature = features.find((f) => f.height === maxElev);
  const deepestFeature = features.find((f) => f.height === minElev);

  // Area-weighted land fraction
  const totalArea = features.reduce((s, f) => s + f.angularRadius ** 2, 0);
  const landArea = features.filter((f) => f.height > 0)
    .reduce((s, f) => s + f.angularRadius ** 2, 0);
  const landFraction = totalArea > 0
    ? Math.round((landArea / totalArea) * 100) / 100
    : 0;

  // Area-weighted class distribution
  const wonderArea = features.filter((f) => f.rarity === 'wonder')
    .reduce((s, f) => s + f.angularRadius ** 2, 0);
  const spectacularArea = features.filter((f) => f.rarity === 'spectacular')
    .reduce((s, f) => s + f.angularRadius ** 2, 0);
  const normalArea = features.filter((f) => f.rarity === 'normal')
    .reduce((s, f) => s + f.angularRadius ** 2, 0);

  return {
    meanElevation: grid.meanElevation,
    maxElevation: Math.max(maxElev, grid.maxElevation),
    minElevation: Math.min(minElev, grid.minElevation),
    landFraction,
    oceanFraction: Math.round((1 - landFraction) * 100) / 100,
    highestPeak: highestFeature?.name ?? 'Unknown',
    deepestPoint: deepestFeature?.name ?? 'Unknown',
    mountainCount: features.filter((f) => f.type === 'mountain').length,
    volcanoCount: features.filter((f) => f.type === 'volcano').length,
    craterCount: features.filter((f) => f.type === 'crater').length,
    riftCount: features.filter((f) => f.type === 'rift').length,
    meanErosion: erosion.meanErosion,
    classDistribution: {
      wonder: totalArea > 0 ? Math.round((wonderArea / totalArea) * 100) / 100 : 0,
      spectacular: totalArea > 0 ? Math.round((spectacularArea / totalArea) * 100) / 100 : 0,
      normal: totalArea > 0 ? Math.round((normalArea / totalArea) * 100) / 100 : 0,
    },
  };
}
