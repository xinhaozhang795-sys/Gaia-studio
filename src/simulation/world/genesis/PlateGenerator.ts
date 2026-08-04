/**
 * PlateGenerator — generates 6-24 tectonic plates from PlanetDNA.
 *
 * Plates are distributed on a sphere using Fibonacci point placement,
 * then classified as oceanic or continental based on water ratio and
 * plate position. Each plate receives:
 *   id, type, velocity, direction, density, age, temperature, areaFraction
 *
 * Boundaries between plates are classified as convergent, divergent, or
 * transform based on relative motion vectors.
 *
 * Deterministic: same DNA → same PlateState.
 */

import type { PlanetDNA } from '../PlanetDNA';
import { RandomEngine } from '../RandomEngine';
import { ASTRONOMICAL } from '../../UnitSystem';
import type {
  PlateState, TectonicPlate, PlateBoundary, PlateType,
} from './types';

/** Fibonacci sphere distribution. */
function fibonacciSphere(n: number): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      lat: Math.asin(y),
      lon: (theta % (Math.PI * 2)),
    });
  }
  return points;
}

/** Angular distance between two spherical points (radians). */
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

/** Great-circle heading from point A to point B, radians [0..2π). */
function heading(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
}

/** Classify a boundary between two plates based on their motion. */
function classifyBoundary(
  plateA: TectonicPlate,
  plateB: TectonicPlate,
): PlateBoundary['type'] {
  const relDir = (plateA.direction - plateB.direction + Math.PI * 2) % (Math.PI * 2);
  const aToB = heading(plateA.centerLatitude, plateA.centerLongitude,
                       plateB.centerLatitude, plateB.centerLongitude);
  const angle = ((relDir - aToB + Math.PI * 2) % (Math.PI * 2));
  const cosAngle = Math.cos(angle);
  if (cosAngle > 0.3) return 'convergent';
  if (cosAngle < -0.3) return 'divergent';
  return 'transform';
}

export function generatePlateState(dna: PlanetDNA): PlateState {
  const rng = new RandomEngine(dna.seedHash ^ 0x504c4154); // "PLAT"

  const sizeRatio = dna.radius / ASTRONOMICAL.EARTH_RADIUS_M;
  const baseCount = Math.max(6, Math.min(24, Math.round(
    dna.plateCount * (0.5 + sizeRatio * 0.5),
  )));
  const plateCount = Math.max(6, Math.min(24, baseCount));

  const centers = fibonacciSphere(plateCount);

  const areaPerPlate = (4 * Math.PI) / plateCount;
  const angularRadius = Math.acos(1 - areaPerPlate / (2 * Math.PI));

  const landFraction = Math.max(0, 1 - dna.waterRatio);
  const continentalCount = Math.max(1, Math.round(plateCount * landFraction));
  const oceanicCount = plateCount - continentalCount;

  const types: PlateType[] = [];
  for (let i = 0; i < plateCount; i++) {
    types.push(i < continentalCount ? 'continental' : 'oceanic');
  }
  for (let i = types.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [types[i], types[j]] = [types[j], types[i]];
  }

  const ageGyr = dna.age / 1000;
  const heatFactor = Math.exp(-ageGyr * 0.1);
  const velocityScale = 2 + 13 * heatFactor * (dna.mantleEnergy / (dna.mass * 2e-7));

  const plates: TectonicPlate[] = centers.map((c, i) => {
    const type = types[i]!;
    const velocity = rng.nextFloatRange(0.3, 1.0) * velocityScale;
    const direction = rng.nextFloatRange(0, Math.PI * 2);

    const density = type === 'oceanic'
      ? rng.nextFloatRange(2900, 3100)
      : rng.nextFloatRange(2600, 2800);

    const age = type === 'continental'
      ? rng.nextFloatRange(500, dna.age)
      : rng.nextFloatRange(10, Math.min(200, dna.age));

    const temperature = type === 'oceanic'
      ? rng.nextFloatRange(1200, 1400)
      : rng.nextFloatRange(600, 900);

    return {
      id: i,
      type,
      centerLatitude: c.lat,
      centerLongitude: c.lon,
      angularRadius,
      velocity: Math.round(velocity * 10) / 10,
      direction,
      density: Math.round(density),
      age: Math.round(age),
      temperature: Math.round(temperature),
      areaFraction: 1 / plateCount,
    };
  });

  const boundaries: PlateBoundary[] = [];
  for (let i = 0; i < plates.length; i++) {
    const distances = plates
      .map((p, j) => ({ j, d: j === i ? Infinity : angularDistance(
        plates[i]!.centerLatitude, plates[i]!.centerLongitude,
        p.centerLatitude, p.centerLongitude,
      )}))
      .sort((a, b) => a.d - b.d);

    for (let k = 0; k < Math.min(2, distances.length); k++) {
      const j = distances[k]!.j;
      if (j <= i) continue;
      const pa = plates[i]!;
      const pb = plates[j]!;
      const type = classifyBoundary(pa, pb);
      const relVel = Math.abs(pa.velocity - pb.velocity) + rng.nextFloatRange(1, 5);
      boundaries.push({
        plateA: i,
        plateB: j,
        type,
        length: distances[k]!.d,
        relativeVelocity: Math.round(relVel * 10) / 10,
      });
    }
  }

  const meanVelocity = plates.reduce((s, p) => s + p.velocity, 0) / plates.length;

  return {
    plates,
    boundaries,
    oceanicCount,
    continentalCount,
    meanVelocity: Math.round(meanVelocity * 100) / 100,
  };
}
