/**
 * ErosionEngine — simulates terrain degradation over geological time.
 *
 * Erosion types: river, weathering, glacial, aeolian, chemical.
 * Rates scale with elevation, gravity, water availability, and age.
 * Foundation only: full high-performance simulation can come later.
 * Deterministic: same input → same output.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { TerrainFeatureNode, ErosionResult, ErosionType } from './types';
import { ASTRONOMICAL } from '../../UnitSystem';

export function computeErosion(
  dna: PlanetDNA,
  features: TerrainFeatureNode[],
): ErosionResult {
  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  const waterScale = dna.waterRatio;

  const featureErosion = new Map<number, number>();
  let totalErosion = 0;
  let totalSediment = 0;

  const depositionSites: Array<{ latitude: number; longitude: number; volume: number }> = [];

  for (const feature of features) {
    const elevFactor = Math.min(1, Math.abs(feature.height) / 5000);
    const ageFactor = Math.min(1, feature.age / 500);
    const gravityFactor = Math.min(1.5, gravityScale);

    const erosionType = determineErosionType(feature, waterScale);

    let rateMultiplier = 1;
    switch (erosionType) {
      case 'river':     rateMultiplier = 1.5 * waterScale; break;
      case 'weathering': rateMultiplier = 1.0; break;
      case 'glacial':   rateMultiplier = 0.8 * Math.max(0.1, 1 - waterScale); break;
      case 'aeolian':   rateMultiplier = 0.5 * Math.max(0.1, 1 - waterScale); break;
      case 'chemical':  rateMultiplier = 0.7; break;
    }

    let erosionLevel = elevFactor * ageFactor * gravityFactor * rateMultiplier;
    erosionLevel = Math.min(0.95, erosionLevel);

    if (feature.age < 10) {
      erosionLevel *= 0.1;
    } else if (feature.age < 50) {
      erosionLevel *= 0.4;
    }

    const heightLoss = feature.originalHeight * erosionLevel;
    feature.height = Math.round(feature.originalHeight - heightLoss);
    feature.erosionLevel = Math.round(erosionLevel * 100) / 100;

    featureErosion.set(feature.id, erosionLevel);
    totalErosion += erosionLevel;

    const areaKm2 = Math.PI * (feature.angularRadius * dna.radius / 1000) ** 2;
    const sediment = Math.abs(heightLoss) * areaKm2 * 0.001;
    totalSediment += sediment;

    if (sediment > 1) {
      depositionSites.push({
        latitude: feature.latitude,
        longitude: feature.longitude,
        volume: Math.round(sediment),
      });
    }
  }

  const compactedDeposits = compactDepositionSites(depositionSites);
  const meanErosion = features.length > 0 ? totalErosion / features.length : 0;

  return {
    featureErosion,
    meanErosion: Math.round(meanErosion * 100) / 100,
    sedimentVolume: Math.round(totalSediment),
    depositionSites: compactedDeposits,
  };
}

function determineErosionType(feature: TerrainFeatureNode, waterScale: number): ErosionType {
  if (feature.height > 2000 && waterScale > 0.3) return 'river';
  if (feature.height > 3000 && waterScale < 0.3) return 'glacial';
  if (feature.height < 500 && waterScale < 0.2) return 'aeolian';
  if (feature.height < 0) return 'chemical';
  return 'weathering';
}

function compactDepositionSites(
  sites: Array<{ latitude: number; longitude: number; volume: number }>,
): Array<{ latitude: number; longitude: number; volume: number }> {
  if (sites.length <= 1) return sites;
  const merged: Array<{ latitude: number; longitude: number; volume: number }> = [];
  const used = new Set<number>();

  for (let i = 0; i < sites.length; i++) {
    if (used.has(i)) continue;
    let lat = sites[i]!.latitude;
    let lon = sites[i]!.longitude;
    let vol = sites[i]!.volume;
    let count = 1;

    for (let j = i + 1; j < sites.length; j++) {
      if (used.has(j)) continue;
      const dLat = Math.abs(sites[j]!.latitude - lat);
      const dLon = Math.abs(sites[j]!.longitude - lon);
      if (dLat < 0.1 && dLon < 0.1) {
        lat = (lat * count + sites[j]!.latitude) / (count + 1);
        lon = (lon * count + sites[j]!.longitude) / (count + 1);
        vol += sites[j]!.volume;
        count++;
        used.add(j);
      }
    }
    merged.push({ latitude: lat, longitude: lon, volume: vol });
  }

  return merged;
}
