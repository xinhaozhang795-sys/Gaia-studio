/**
 * BiomeTerrainMapper — maps terrain features to biome categories.
 *
 * Foundation for the future Biome Engine. Assigns a terrain-influenced
 * biome to each cell based on elevation, formation cause, water ratio,
 * and latitude. Also computes water availability and temperature modifiers.
 *
 * Deterministic: same input → same output.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type {
  TerrainFeatureNode, ElevationCell, BiomeTerrainMap, BiomeTerrainCell,
  TerrainBiome,
} from './types';

const LAPSE_RATE_K_PER_KM = 6.5;

export function mapBiomes(
  dna: PlanetDNA,
  features: TerrainFeatureNode[],
  elevationCells: ElevationCell[],
): BiomeTerrainMap {
  const cells: BiomeTerrainCell[] = [];
  const biomeCounts = new Map<TerrainBiome, number>();

  for (const cell of elevationCells) {
    const biome = classifyBiome(cell.elevation, cell.latitude, cell.dominantCause, dna);
    const waterAvail = computeWaterAvailability(cell.elevation, cell.latitude, dna);
    const tempMod = -(Math.max(0, cell.elevation) / 1000) * LAPSE_RATE_K_PER_KM;

    cells.push({
      id: cell.id,
      latitude: cell.latitude,
      longitude: cell.longitude,
      biome,
      elevation: cell.elevation,
      terrainClass: cell.terrainClass,
      waterAvailability: Math.round(waterAvail * 100) / 100,
      temperatureModifier: Math.round(tempMod * 10) / 10,
    });

    biomeCounts.set(biome, (biomeCounts.get(biome) ?? 0) + 1);
  }

  for (const feature of features) {
    const biome = classifyFeatureBiome(feature, dna);
    biomeCounts.set(biome, (biomeCounts.get(biome) ?? 0) + 1);
  }

  const total = cells.length || 1;
  const distribution: Record<string, number> = {};
  for (const [biome, count] of biomeCounts) {
    distribution[biome] = Math.round((count / total) * 100) / 100;
  }

  const landCount = cells.filter((c) => c.elevation > 0).length;
  const landFraction = Math.round((landCount / total) * 100) / 100;

  return {
    cells,
    distribution,
    landFraction,
    oceanFraction: Math.round((1 - landFraction) * 100) / 100,
  };
}

function classifyBiome(
  elevation: number,
  latitude: number,
  cause: string,
  dna: PlanetDNA,
): TerrainBiome {
  const absLat = Math.abs(latitude);
  const polarThreshold = Math.PI / 3;
  const waterScale = dna.waterRatio;

  if (elevation < -4000) return 'abyssal-plain';
  if (elevation < -2000) return 'oceanic-trench';
  if (elevation < -200) return 'continental-shelf';

  if (absLat > polarThreshold && elevation > 0) {
    if (elevation < 500) return 'ice-sheet';
    return 'alpine-peaks';
  }

  if (elevation > 5000) return 'alpine-peaks';
  if (elevation > 2500) return 'mountain-forest';
  if (elevation > 1000) {
    if (cause === 'isostasy') return 'highland-plateau';
    return 'mountain-forest';
  }

  if (cause === 'hotspot' || cause === 'volcanic-arc') {
    if (elevation < 200) return 'volcanic-island';
    return 'volcanic-field';
  }

  if (cause === 'rifting' && elevation < 0) return 'rift-valley';
  if (cause === 'impact') return 'impact-badlands';

  if (elevation < 100) {
    if (waterScale < 0.2) return 'desert-basin';
    if (elevation < 50) return 'coastal-lowland';
    return 'alluvial-plain';
  }

  if (waterScale < 0.2) return 'desert-basin';
  return 'alluvial-plain';
}

function classifyFeatureBiome(feature: TerrainFeatureNode, dna: PlanetDNA): TerrainBiome {
  if (feature.type === 'volcano') return 'volcanic-field';
  if (feature.type === 'island') return 'volcanic-island';
  if (feature.type === 'trench') return 'oceanic-trench';
  if (feature.type === 'crater') return 'impact-badlands';
  if (feature.type === 'rift') return 'rift-valley';
  if (feature.type === 'plateau') return 'highland-plateau';
  if (feature.type === 'canyon') return 'desert-basin';
  if (feature.type === 'basin' && feature.height < -2000) return 'abyssal-plain';
  if (feature.type === 'mountain' && feature.height > 4000) return 'alpine-peaks';
  if (feature.type === 'mountain') return 'mountain-forest';
  if (feature.type === 'plain') return dna.waterRatio < 0.2 ? 'desert-basin' : 'alluvial-plain';
  return 'alluvial-plain';
}

function computeWaterAvailability(
  elevation: number,
  latitude: number,
  dna: PlanetDNA,
): number {
  const absLat = Math.abs(latitude);
  const latFactor = Math.cos(absLat);
  const elevFactor = elevation > 0
    ? Math.max(0.1, 1 - elevation / 8000)
    : 1;

  return Math.min(1, dna.waterRatio * latFactor * elevFactor);
}
