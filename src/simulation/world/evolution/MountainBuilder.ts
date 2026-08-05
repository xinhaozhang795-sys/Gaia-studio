/**
 * MountainBuilder — converts geological events into terrain information.
 *
 * Three mountain types:
 *   • Collision mountains: from continental-continental collision
 *   • Volcanic mountains: from subduction arcs and hotspots
 *   • Rift mountains: from crustal uplift at rift shoulders
 *
 * Terrain class distribution (enforced globally):
 *   • World wonder terrain:  10%
 *   • Spectacular terrain:   20%
 *   • Normal terrain:        70%
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { CollisionEvent, SubductionEvent, RiftEvent, MountainRange, TerrainData, TerrainFeature, TerrainClass, EvolutionContext } from './types';
import { ASTRONOMICAL } from '../../UnitSystem';

const MOUNTAIN_NAMES = [
  'Solpeak', 'Aetherius', 'Borealis', 'Crommassif', 'Drekrange',
  'Erebor', 'Frostspire', 'Gorgonpeak', 'Heliosridge', 'Iapyx',
  'Jotunheim', 'Kailash', 'Lunaris', 'Mithril', 'Niflheim',
  'Olympus', 'Pandemonium', 'Quorvex', 'Riftscar', 'Sylvanus',
  'Tartarus', 'Umbra', 'Vortex', 'Whiteridge', 'Xenon',
];

export function buildTerrain(
  dna: PlanetDNA,
  collisions: CollisionEvent[],
  subductions: SubductionEvent[],
  rifts: RiftEvent[],
  ctx: EvolutionContext,
): TerrainData {
  const mountains: MountainRange[] = [];
  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;

  for (const collision of collisions) {
    if (collision.type !== 'continental-collision') continue;
    if (collision.upliftRate < 50) continue;

    const maxPeak = 9000 / gravityScale;
    const height = Math.min(maxPeak, collision.upliftRate * 100);
    const mountainAge = ctx.elapsedMyr;
    const erosion = Math.min(0.8, mountainAge / 500);

    const terrainClass: TerrainClass = height > maxPeak * 0.8
      ? 'wonder'
      : height > maxPeak * 0.5
        ? 'spectacular'
        : 'normal';

    mountains.push({
      id: ctx.nextMountainId++,
      name: MOUNTAIN_NAMES[mountains.length % MOUNTAIN_NAMES.length]!,
      type: 'collision',
      height: Math.round(height),
      age: Math.round(mountainAge),
      erosion: Math.round(erosion * 100) / 100,
      latitude: collision.latitude,
      longitude: collision.longitude,
      angularRadius: 0.1,
      terrainClass,
      sourceEventId: collision.id,
    });
  }

  for (const sub of subductions) {
    if (sub.subductionRate < 2) continue;

    const maxVolcanic = 6000 / gravityScale;
    const height = Math.min(maxVolcanic, sub.subductionRate * 500);

    const terrainClass: TerrainClass = height > maxVolcanic * 0.7
      ? 'spectacular'
      : 'normal';

    mountains.push({
      id: ctx.nextMountainId++,
      name: MOUNTAIN_NAMES[mountains.length % MOUNTAIN_NAMES.length]!,
      type: 'volcanic',
      height: Math.round(height),
      age: 0,
      erosion: 0,
      latitude: sub.arcLatitude,
      longitude: sub.arcLongitude,
      angularRadius: 0.08,
      terrainClass,
      sourceEventId: sub.id,
    });
  }

  for (const rift of rifts) {
    if (!rift.becameOcean && rift.age < 5) continue;

    const maxRift = 3000 / gravityScale;
    const height = Math.min(maxRift, rift.spreadRate * 200);

    mountains.push({
      id: ctx.nextMountainId++,
      name: MOUNTAIN_NAMES[mountains.length % MOUNTAIN_NAMES.length]!,
      type: 'rift',
      height: Math.round(height),
      age: Math.round(rift.age),
      erosion: Math.min(0.5, rift.age / 100),
      latitude: (rift.startLat + rift.endLat) / 2,
      longitude: (rift.startLon + rift.endLon) / 2,
      angularRadius: 0.05,
      terrainClass: 'normal',
      sourceEventId: rift.id,
    });
  }

  const backgroundFeatures = generateBackgroundTerrain(dna, ctx);

  const allFeatures: TerrainFeature[] = [
    ...ctx.terrainFeatures,
    ...mountains.map((m) => ({
      id: ctx.nextFeatureId++,
      latitude: m.latitude,
      longitude: m.longitude,
      elevation: m.height,
      terrainClass: m.terrainClass,
      type: 'mountain' as const,
      angularRadius: m.angularRadius,
    })),
    ...backgroundFeatures,
  ];

  enforceTerrainDistribution(allFeatures);

  const elevations = allFeatures.map((f) => f.elevation);
  const meanElevation = elevations.length > 0
    ? elevations.reduce((s, e) => s + e, 0) / elevations.length
    : 0;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
  const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;

  const wonderCount = allFeatures.filter((f) => f.terrainClass === 'wonder').length;
  const spectacularCount = allFeatures.filter((f) => f.terrainClass === 'spectacular').length;
  const normalCount = allFeatures.filter((f) => f.terrainClass === 'normal').length;
  const total = allFeatures.length || 1;

  return {
    mountainRanges: mountains,
    features: allFeatures,
    meanElevation: Math.round(meanElevation),
    maxElevation: Math.round(maxElevation),
    minElevation: Math.round(minElevation),
    classDistribution: {
      wonder: Math.round((wonderCount / total) * 100) / 100,
      spectacular: Math.round((spectacularCount / total) * 100) / 100,
      normal: Math.round((normalCount / total) * 100) / 100,
    },
  };
}

function generateBackgroundTerrain(
  dna: PlanetDNA,
  ctx: EvolutionContext,
): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  const count = 60;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = Math.asin(y);
    const lon = (goldenAngle * i) % (Math.PI * 2);

    const isOcean = dna.waterRatio > 0.5;
    const elevation = isOcean
      ? -2000 - Math.abs(y) * 1000
      : 200 + Math.abs(y) * 300;

    features.push({
      id: ctx.nextFeatureId++,
      latitude: lat,
      longitude: lon,
      elevation: Math.round(elevation),
      terrainClass: 'normal',
      type: isOcean ? 'basin' : 'plain',
      angularRadius: 0.3,
    });
  }

  return features;
}

function enforceTerrainDistribution(features: TerrainFeature[]): void {
  const total = features.length;
  if (total === 0) return;

  const targetWonder = Math.round(total * 0.10);
  const targetSpectacular = Math.round(total * 0.20);

  const sorted = [...features].sort((a, b) =>
    Math.abs(b.elevation) - Math.abs(a.elevation));

  for (const f of features) {
    f.terrainClass = 'normal';
  }

  for (let i = 0; i < targetWonder && i < sorted.length; i++) {
    sorted[i]!.terrainClass = 'wonder';
  }

  for (let i = targetWonder; i < targetWonder + targetSpectacular && i < sorted.length; i++) {
    sorted[i]!.terrainClass = 'spectacular';
  }
}
