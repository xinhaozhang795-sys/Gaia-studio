/**
 * CollisionEngine — handles plate boundary interactions.
 *
 * For each boundary, based on the boundary type and crust types:
 *   CONVERGENT: continental collision → mountain uplift; oceanic subduction;
 *               oceanic-oceanic → island arc
 *   DIVERGENT:  delegated to RiftEngine
 *   TRANSFORM:  horizontal displacement, seismic activity
 *
 * All rules are physics-based. No random noise.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { TectonicPlate, PlateBoundary } from '../genesis/types';
import type { CollisionEvent, CollisionType, EvolutionContext } from './types';
import { heading, midpoint } from './spherical';

function classifyConvergent(a: TectonicPlate, b: TectonicPlate): CollisionType {
  if (a.type === 'continental' && b.type === 'continental') {
    return 'continental-collision';
  }
  if (a.type === 'oceanic' && b.type === 'oceanic') {
    return 'oceanic-collision';
  }
  return 'continental-arc';
}

export function processCollisions(
  dna: PlanetDNA,
  plates: TectonicPlate[],
  boundaries: PlateBoundary[],
  ctx: EvolutionContext,
  dtMyr: number,
): void {
  for (const boundary of boundaries) {
    if (boundary.type !== 'convergent') continue;

    const pa = plates[boundary.plateA];
    const pb = plates[boundary.plateB];
    if (!pa || !pb) continue;

    const collisionType = classifyConvergent(pa, pb);
    const collisionCenter = midpoint(
      { lat: pa.centerLatitude, lon: pa.centerLongitude },
      { lat: pb.centerLatitude, lon: pb.centerLongitude },
    );

    const aToB = heading(pa.centerLatitude, pa.centerLongitude,
                         pb.centerLatitude, pb.centerLongitude);
    const relDir = (pa.direction - pb.direction + Math.PI * 2) % (Math.PI * 2);
    const angle = Math.abs(((relDir - aToB + Math.PI * 2) % (Math.PI * 2)));

    const convergenceRate = boundary.relativeVelocity * Math.abs(Math.cos(angle));
    if (convergenceRate < 0.1) continue;

    let thickening = 1;
    let upliftRate = 0;

    if (collisionType === 'continental-collision') {
      thickening = 1 + convergenceRate * 0.05;
      upliftRate = convergenceRate * 80 * Math.abs(Math.cos(angle));
    } else if (collisionType === 'continental-arc') {
      thickening = 1 + convergenceRate * 0.02;
      upliftRate = convergenceRate * 40 * Math.abs(Math.cos(angle));
    } else if (collisionType === 'oceanic-collision') {
      thickening = 1 + convergenceRate * 0.01;
      upliftRate = convergenceRate * 20 * Math.abs(Math.cos(angle));
    }

    const gravityScale = dna.gravity / 9.80665;
    upliftRate *= gravityScale;

    const event: CollisionEvent = {
      id: ctx.nextEventId++,
      plateA: pa.id,
      plateB: pb.id,
      type: collisionType,
      angle,
      convergenceRate: Math.round(convergenceRate * 100) / 100,
      latitude: collisionCenter.lat,
      longitude: collisionCenter.lon,
      thickening,
      upliftRate: Math.round(upliftRate),
    };

    ctx.collisions.push(event);

    if (collisionType === 'continental-collision' && convergenceRate > 2) {
      ctx.historyEvents.push({
        time: ctx.elapsedMyr,
        title: 'Continental Collision',
        description: `Plates ${pa.id} and ${pb.id} collide at ` +
          `${(collisionCenter.lat * 180 / Math.PI).toFixed(1)}°, ` +
          `${(collisionCenter.lon * 180 / Math.PI).toFixed(1)}°. ` +
          `Convergence: ${convergenceRate.toFixed(1)} cm/yr. ` +
          `Uplift rate: ${Math.round(upliftRate)} m/Myr.`,
      });
    }
  }
}

export function processTransforms(
  plates: TectonicPlate[],
  boundaries: PlateBoundary[],
  ctx: EvolutionContext,
  dtMyr: number,
): void {
  for (const boundary of boundaries) {
    if (boundary.type !== 'transform') continue;
    const pa = plates[boundary.plateA];
    const pb = plates[boundary.plateB];
    if (!pa || !pb) continue;

    const displacement = boundary.relativeVelocity * dtMyr * 10;
    if (displacement < 1) continue;

    if (displacement > 100) {
      const center = midpoint(
        { lat: pa.centerLatitude, lon: pa.centerLongitude },
        { lat: pb.centerLatitude, lon: pb.centerLongitude },
      );
      ctx.historyEvents.push({
        time: ctx.elapsedMyr,
        title: 'Major Transform Fault Activity',
        description: `Plates ${pa.id} and ${pb.id} experience ` +
          `${displacement.toFixed(0)} km of lateral displacement at ` +
          `${(center.lat * 180 / Math.PI).toFixed(1)}°, ` +
          `${(center.lon * 180 / Math.PI).toFixed(1)}°.`,
      });
    }
  }
}
