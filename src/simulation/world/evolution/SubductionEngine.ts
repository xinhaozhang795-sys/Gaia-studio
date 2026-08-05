/**
 * SubductionEngine — simulates oceanic plate destruction.
 *
 * When oceanic crust converges with another plate, the denser oceanic
 * plate subducts into the mantle. This engine:
 *   • Identifies subduction zones from convergent boundaries
 *   • Calculates subduction rate, trench depth
 *   • Generates volcanic arc positions
 *   • Estimates CO₂ release from slab dehydration melting
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { TectonicPlate, PlateBoundary } from '../genesis/types';
import type { SubductionEvent, EvolutionContext } from './types';
import { heading, moveOnSphere } from './spherical';

function getSubductingPlate(a: TectonicPlate, b: TectonicPlate): {
  subducting: TectonicPlate;
  overriding: TectonicPlate;
} {
  if (a.type === 'oceanic' && b.type === 'continental') {
    return { subducting: a, overriding: b };
  }
  if (b.type === 'oceanic' && a.type === 'continental') {
    return { subducting: b, overriding: a };
  }
  if (a.density >= b.density) {
    return { subducting: a, overriding: b };
  }
  return { subducting: b, overriding: a };
}

export function processSubductions(
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

    if (pa.type !== 'oceanic' && pb.type !== 'oceanic') continue;

    const { subducting, overriding } = getSubductingPlate(pa, pb);

    const subductionRate = boundary.relativeVelocity * Math.sin(Math.PI / 4);

    const ageFactor = Math.min(2, subducting.age / 100);
    const gravityScale = dna.gravity / 9.80665;
    const trenchDepth = -(3000 + subductionRate * 200 * ageFactor * gravityScale);

    const trenchToArc = 150_000 / dna.radius;
    const trenchHeading = heading(
      subducting.centerLatitude, subducting.centerLongitude,
      overriding.centerLatitude, overriding.centerLongitude,
    );
    const arcPos = moveOnSphere(
      (subducting.centerLatitude + overriding.centerLatitude) / 2,
      (subducting.centerLongitude + overriding.centerLongitude) / 2,
      trenchHeading,
      trenchToArc,
    );

    const slabTemp = dna.mantleTemperature +
      subductionRate * 20 + subducting.temperature * 0.1;

    const co2Release = subductionRate * 0.02 * dtMyr;

    const event: SubductionEvent = {
      id: ctx.nextEventId++,
      subductingPlate: subducting.id,
      overridingPlate: overriding.id,
      subductionRate: Math.round(subductionRate * 100) / 100,
      trenchDepth: Math.round(trenchDepth),
      arcLatitude: arcPos.lat,
      arcLongitude: arcPos.lon,
      slabTemp: Math.round(slabTemp),
      co2Release: Math.round(co2Release * 100) / 100,
    };

    ctx.subductions.push(event);

    const trenchCenter = {
      lat: (subducting.centerLatitude + overriding.centerLatitude) / 2,
      lon: (subducting.centerLongitude + overriding.centerLongitude) / 2,
    };
    ctx.terrainFeatures.push({
      id: ctx.nextFeatureId++,
      latitude: trenchCenter.lat,
      longitude: trenchCenter.lon,
      elevation: trenchDepth,
      terrainClass: 'normal',
      type: 'trench',
      angularRadius: boundary.length * 0.3,
    });

    ctx.terrainFeatures.push({
      id: ctx.nextFeatureId++,
      latitude: arcPos.lat,
      longitude: arcPos.lon,
      elevation: 2000 + subductionRate * 100,
      terrainClass: subductionRate > 5 ? 'spectacular' : 'normal',
      type: 'ridge',
      angularRadius: boundary.length * 0.2,
    });

    if (subductionRate > 3 && ctx.stepCount % 10 === 0) {
      ctx.historyEvents.push({
        time: ctx.elapsedMyr,
        title: 'Active Subduction Zone',
        description: `Oceanic plate ${subducting.id} subducts under ` +
          `${overriding.type} plate ${overriding.id}. ` +
          `Trench depth: ${Math.abs(Math.round(trenchDepth))} m. ` +
          `Volcanic arc at ${(arcPos.lat * 180 / Math.PI).toFixed(1)}°, ` +
          `${(arcPos.lon * 180 / Math.PI).toFixed(1)}°.`,
      });
    }
  }
}
