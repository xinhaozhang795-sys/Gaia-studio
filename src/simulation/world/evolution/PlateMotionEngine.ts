/**
 * PlateMotionEngine — simulates tectonic plate movement on a sphere.
 *
 * Each plate has a velocity (cm/year) and direction (radians). Over
 * geological time (millions of years), plates move along great-circle
 * paths. The engine uses the spherical "destination point" formula.
 *
 * Velocity decreases slightly with age as the mantle cools.
 * Deterministic: same input → same output. No randomness.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { TectonicPlate, PlateBoundary } from '../genesis/types';
import { moveOnSphere, velocityToAngular, angularDistance, heading } from './spherical';

export interface PlateMotionResult {
  plates: TectonicPlate[];
  boundaries: PlateBoundary[];
}

export function stepPlateMotion(
  dna: PlanetDNA,
  plates: TectonicPlate[],
  boundaries: PlateBoundary[],
  dtYears: number,
): PlateMotionResult {
  const dtMyr = dtYears / 1e6;

  const ageGyr = dna.age / 1000;
  const decayFactor = Math.exp(-0.01 * (ageGyr + dtMyr / 1000)) /
                      Math.exp(-0.01 * ageGyr);

  const newPlates: TectonicPlate[] = plates.map((plate) => {
    const angularVel = velocityToAngular(plate.velocity, dna.radius);
    const angularDist = angularVel * dtYears;

    const newPos = moveOnSphere(
      plate.centerLatitude,
      plate.centerLongitude,
      plate.direction,
      angularDist,
    );

    return {
      ...plate,
      centerLatitude: newPos.lat,
      centerLongitude: newPos.lon,
      velocity: plate.velocity * decayFactor,
      age: plate.age + dtMyr,
    };
  });

  const newBoundaries = reclassifyBoundaries(newPlates, boundaries);

  return { plates: newPlates, boundaries: newBoundaries };
}

function reclassifyBoundaries(
  plates: TectonicPlate[],
  oldBoundaries: PlateBoundary[],
): PlateBoundary[] {
  return oldBoundaries.map((b) => {
    const pa = plates[b.plateA];
    const pb = plates[b.plateB];
    if (!pa || !pb) return b;

    const dist = angularDistance(
      pa.centerLatitude, pa.centerLongitude,
      pb.centerLatitude, pb.centerLongitude,
    );

    const aToBHeading = heading(
      pa.centerLatitude, pa.centerLongitude,
      pb.centerLatitude, pb.centerLongitude,
    );
    const relDir = (pa.direction - aToBHeading + Math.PI * 2) % (Math.PI * 2);
    const cosAngle = Math.cos(relDir);

    let type: PlateBoundary['type'];
    if (cosAngle > 0.3) type = 'convergent';
    else if (cosAngle < -0.3) type = 'divergent';
    else type = 'transform';

    const relVel = Math.abs(pa.velocity - pb.velocity);

    return {
      ...b,
      type,
      length: dist,
      relativeVelocity: Math.round(relVel * 10) / 10,
    };
  });
}
