/**
 * ElevationEngine — generates elevation from geological causes.
 *
 * Elevation is NOT random noise. Every elevation value is derived from:
 *   • Plate collision → mountain ranges, continental uplift, high plateaus
 *   • Subduction → trenches, volcanic arcs
 *   • Rifting → rift valleys, new ocean basins, mid-ocean ridges
 *   • Hotspots → volcanic islands, volcanic chains
 *   • Impact events → impact basins, crater landscapes
 *
 * Alien planet scale: terrain can reach 18,000+ m, but only when a
 * geological process justifies it. Gravity inversely scales max elevation.
 *
 * Deterministic: same input → same output.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { GenesisState } from '../genesis/types';
import type { GeologicalEvolutionState } from '../evolution/types';
import type { ElevationGrid, ElevationCell, FormationCause, TerrainClass } from './types';
import { ASTRONOMICAL } from '../../UnitSystem';

function fibonacciSphere(n: number): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const lat = Math.asin(y);
    const lon = (goldenAngle * i) % (Math.PI * 2);
    points.push({ lat, lon });
  }
  return points;
}

function angularDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function maxElevationForPlanet(dna: PlanetDNA): number {
  const gravityRatio = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  return 18000 / Math.pow(gravityRatio, 0.7);
}

function classifyElevation(elevation: number, maxElev: number): TerrainClass {
  const absE = Math.abs(elevation);
  if (absE >= maxElev * 0.65) return 'wonder';
  if (absE >= maxElev * 0.35) return 'spectacular';
  return 'normal';
}

export function generateElevationGrid(
  dna: PlanetDNA,
  genesis: GenesisState,
  evolution: GeologicalEvolutionState,
  resolution = 200,
): ElevationGrid {
  const maxElev = maxElevationForPlanet(dna);
  const gravityScale = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  const waterRatio = dna.waterRatio;
  const ageMyr = dna.age;

  const points = fibonacciSphere(resolution);
  const cells: ElevationCell[] = [];

  const collisions = evolution.collisions;
  const subductions = evolution.subductions;
  const rifts = evolution.rifts;
  const hotspots = genesis.hotspots.hotspots;
  const plates = evolution.plates.plates;
  const supercontinents = evolution.supercontinents;
  const oceanBasins = evolution.supercontinents.oceanBasins;
  const impacts = evolution.historyEvents.filter((e) => e.title.includes('Impact'));

  for (let i = 0; i < resolution; i++) {
    const p = points[i]!;
    let elevation = 0;
    let dominantCause: FormationCause = 'background';
    let strongestInfluence = 0;
    let nearestPlateId = -1;

    let nearestPlateDist = Infinity;
    for (const plate of plates) {
      const d = angularDistance(p.lat, p.lon, plate.centerLatitude, plate.centerLongitude);
      if (d < nearestPlateDist) {
        nearestPlateDist = d;
        nearestPlateId = plate.id;
        const withinPlate = d < plate.angularRadius;
        if (withinPlate) {
          elevation = plate.type === 'continental'
            ? 300 + (1 - d / plate.angularRadius) * 500
            : -3000 - (d / plate.angularRadius) * 1000;
          dominantCause = 'background';
          strongestInfluence = Math.abs(elevation);
        }
      }
    }

    for (const coll of collisions) {
      const d = angularDistance(p.lat, p.lon, coll.latitude, coll.longitude);
      const influenceRadius = 0.15;
      if (d < influenceRadius) {
        const falloff = 1 - d / influenceRadius;
        let uplift = 0;
        if (coll.type === 'continental-collision') {
          uplift = coll.upliftRate * 100 * falloff / gravityScale;
        } else if (coll.type === 'continental-arc') {
          uplift = coll.upliftRate * 50 * falloff / gravityScale;
        } else {
          uplift = coll.upliftRate * 25 * falloff / gravityScale;
        }
        uplift = Math.min(uplift, maxElev);
        if (uplift > strongestInfluence) {
          strongestInfluence = uplift;
          elevation = Math.max(elevation, uplift);
          dominantCause = coll.type === 'continental-collision' ? 'plate-collision' : 'volcanic-arc';
        }
      }
    }

    for (const sub of subductions) {
      const subPlate = plates[sub.subductingPlate];
      const overPlate = plates[sub.overridingPlate];
      const trenchLat = ((subPlate?.centerLatitude ?? 0) + (overPlate?.centerLatitude ?? 0)) / 2;
      const trenchLon = ((subPlate?.centerLongitude ?? 0) + (overPlate?.centerLongitude ?? 0)) / 2;
      const dTrench = angularDistance(p.lat, p.lon, trenchLat, trenchLon);
      if (dTrench < 0.1) {
        const falloff = 1 - dTrench / 0.1;
        const depth = sub.trenchDepth * falloff;
        if (Math.abs(depth) > strongestInfluence) {
          strongestInfluence = Math.abs(depth);
          elevation = Math.min(elevation, depth);
          dominantCause = 'subduction';
        }
      }
      const dArc = angularDistance(p.lat, p.lon, sub.arcLatitude, sub.arcLongitude);
      if (dArc < 0.08) {
        const falloff = 1 - dArc / 0.08;
        const arcHeight = sub.subductionRate * 300 * falloff / gravityScale;
        if (arcHeight > strongestInfluence) {
          strongestInfluence = arcHeight;
          elevation = Math.max(elevation, arcHeight);
          dominantCause = 'volcanic-arc';
        }
      }
    }

    for (const rift of rifts) {
      const riftLat = (rift.startLat + rift.endLat) / 2;
      const riftLon = (rift.startLon + rift.endLon) / 2;
      const d = angularDistance(p.lat, p.lon, riftLat, riftLon);
      const influenceRadius = rift.becameOcean ? 0.12 : 0.06;
      if (d < influenceRadius) {
        const falloff = 1 - d / influenceRadius;
        if (rift.becameOcean) {
          const depth = -(1000 + Math.sqrt(rift.age) * 200) * falloff;
          if (Math.abs(depth) > strongestInfluence) {
            strongestInfluence = Math.abs(depth);
            elevation = Math.min(elevation, depth);
            dominantCause = 'rifting';
          }
        } else {
          const depth = -800 * falloff;
          if (Math.abs(depth) > strongestInfluence) {
            strongestInfluence = Math.abs(depth);
            elevation = Math.min(elevation, depth);
            dominantCause = 'rifting';
          }
        }
      }
    }

    for (const hs of hotspots) {
      const d = angularDistance(p.lat, p.lon, hs.latitude, hs.longitude);
      if (d < 0.04 && hs.active) {
        const falloff = 1 - d / 0.04;
        const volcanoHeight = Math.min(maxElev * 0.5, hs.heatFlow * 10000 * falloff / gravityScale);
        if (volcanoHeight > strongestInfluence) {
          strongestInfluence = volcanoHeight;
          elevation = Math.max(elevation, volcanoHeight);
          dominantCause = 'hotspot';
        }
      }
    }

    for (const impact of impacts) {
      const impactLat = ((impact.time % 180) - 90) * Math.PI / 180;
      const impactLon = ((impact.time * 7) % 360) * Math.PI / 180;
      const d = angularDistance(p.lat, p.lon, impactLat, impactLon);
      if (d < 0.06) {
        const falloff = 1 - d / 0.06;
        const craterDepth = -2000 * falloff / gravityScale;
        if (Math.abs(craterDepth) > strongestInfluence * 0.5) {
          elevation = Math.min(elevation, craterDepth);
          if (dominantCause === 'background') dominantCause = 'impact';
        }
      }
    }

    for (const sc of supercontinents.supercontinents) {
      const d = angularDistance(p.lat, p.lon, sc.latitude, sc.longitude);
      if (d < sc.angularRadius * 0.7) {
        const falloff = 1 - d / (sc.angularRadius * 0.7);
        const plateauHeight = 800 * falloff / gravityScale;
        elevation = Math.max(elevation, plateauHeight);
        if (dominantCause === 'background' && plateauHeight > 200) {
          dominantCause = 'isostasy';
        }
      }
    }

    for (const basin of oceanBasins) {
      const d = angularDistance(p.lat, p.lon, basin.latitude, basin.longitude);
      if (d < basin.angularRadius) {
        const falloff = 1 - d / basin.angularRadius;
        const depth = -basin.depth * falloff;
        if (depth < elevation) {
          elevation = depth;
        }
      }
    }

    if (waterRatio > 0.5 && elevation < 0) {
      elevation *= 1 + (waterRatio - 0.5) * 0.5;
    }

    const ageGyr = ageMyr / 1000;
    if (elevation > 0 && ageGyr > 2) {
      const decay = Math.exp(-ageGyr * 0.05);
      elevation *= 0.5 + 0.5 * decay;
    }

    elevation = Math.max(-maxElev, Math.min(maxElev, Math.round(elevation)));
    const terrainClass = classifyElevation(elevation, maxElev);

    cells.push({
      id: i,
      latitude: p.lat,
      longitude: p.lon,
      elevation,
      dominantCause,
      plateId: nearestPlateId,
      terrainClass,
    });
  }

  enforceClassDistribution(cells);

  const elevations = cells.map((c) => c.elevation);
  const meanElev = elevations.reduce((s, e) => s + e, 0) / elevations.length;

  return {
    resolution,
    cells,
    meanElevation: Math.round(meanElev),
    maxElevation: Math.max(...elevations),
    minElevation: Math.min(...elevations),
  };
}

function enforceClassDistribution(cells: ElevationCell[]): void {
  const total = cells.length;
  if (total === 0) return;

  const targetWonder = Math.round(total * 0.10);
  const targetSpectacular = Math.round(total * 0.20);

  const sorted = [...cells].sort((a, b) =>
    Math.abs(b.elevation) - Math.abs(a.elevation));

  for (const c of cells) c.terrainClass = 'normal';

  for (let i = 0; i < targetWonder && i < sorted.length; i++) {
    sorted[i]!.terrainClass = 'wonder';
  }
  for (let i = targetWonder; i < targetWonder + targetSpectacular && i < sorted.length; i++) {
    sorted[i]!.terrainClass = 'spectacular';
  }
}
