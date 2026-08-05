/**
 * RiftEngine — generates continental separation and new ocean basins.
 *
 * When two plates move apart at a divergent boundary:
 *   • Continental plates → rift valley, then new ocean basin
 *   • Oceanic plates → mid-ocean ridge, seafloor spreading
 *
 * Rift progression: Stage 1 (rift valley) → Stage 2 (ocean flooding)
 * → Stage 3 (ocean basin with seafloor spreading).
 *
 * All driven by plate velocity and divergence rate — no random noise.
 */

import type { PlanetDNA } from '../PlanetDNA';
import type { TectonicPlate, PlateBoundary, OceanBasin } from '../genesis/types';
import type { RiftEvent, EvolutionContext } from './types';
import { midpoint } from './spherical';

const OCEAN_NAMES = [
  'Tethys', 'Panthalassa', 'Iapetus', 'Poseidon', 'Borealis',
  'Australis', 'Chronos', 'Aether', 'Styx', 'Lethe',
  'Oceanus', 'Rhea', 'Hyperion', 'Themis', 'Mnemosyne',
];

export function processRifts(
  dna: PlanetDNA,
  plates: TectonicPlate[],
  boundaries: PlateBoundary[],
  ctx: EvolutionContext,
  dtMyr: number,
): void {
  for (const boundary of boundaries) {
    if (boundary.type !== 'divergent') continue;

    const pa = plates[boundary.plateA];
    const pb = plates[boundary.plateB];
    if (!pa || !pb) continue;

    const spreadRate = boundary.relativeVelocity;
    if (spreadRate < 0.1) continue;

    const isContinentalRift = pa.type === 'continental' && pb.type === 'continental';

    const riftCenter = midpoint(
      { lat: pa.centerLatitude, lon: pa.centerLongitude },
      { lat: pb.centerLatitude, lon: pb.centerLongitude },
    );

    let existingRift = ctx.rifts.find(
      (r) => (r.plateA === pa.id && r.plateB === pb.id) ||
             (r.plateA === pb.id && r.plateB === pa.id),
    );

    if (!existingRift) {
      const riftEvent: RiftEvent = {
        id: ctx.nextEventId++,
        name: OCEAN_NAMES[ctx.rifts.length % OCEAN_NAMES.length]!,
        plateA: pa.id,
        plateB: pb.id,
        startLat: pa.centerLatitude,
        startLon: pa.centerLongitude,
        endLat: pb.centerLatitude,
        endLon: pb.centerLongitude,
        spreadRate: Math.round(spreadRate * 10) / 10,
        age: 0,
        becameOcean: false,
      };
      ctx.rifts.push(riftEvent);
      existingRift = riftEvent;

      if (isContinentalRift) {
        ctx.terrainFeatures.push({
          id: ctx.nextFeatureId++,
          latitude: riftCenter.lat,
          longitude: riftCenter.lon,
          elevation: -500,
          terrainClass: 'normal',
          type: 'basin',
          angularRadius: boundary.length * 0.2,
        });
      }

      ctx.historyEvents.push({
        time: ctx.elapsedMyr,
        title: 'New Rift Formation',
        description: `Divergent boundary between plates ${pa.id} and ${pb.id} ` +
          `at ${(riftCenter.lat * 180 / Math.PI).toFixed(1)}°, ` +
          `${(riftCenter.lon * 180 / Math.PI).toFixed(1)}°. ` +
          `Spread rate: ${spreadRate.toFixed(1)} cm/yr. ` +
          (isContinentalRift ? 'Continental rift valley forming.' : 'Mid-ocean ridge active.'),
      });
    }

    existingRift.age += dtMyr;
    existingRift.spreadRate = Math.round(spreadRate * 10) / 10;

    if (isContinentalRift && !existingRift.becameOcean && existingRift.age > 20) {
      existingRift.becameOcean = true;

      const oceanBasin: OceanBasin = {
        name: existingRift.name,
        latitude: riftCenter.lat,
        longitude: riftCenter.lon,
        angularRadius: boundary.length * 0.4,
        depth: 1000 + spreadRate * 200,
      };
      ctx.oceanBasins.push(oceanBasin);

      ctx.historyEvents.push({
        time: ctx.elapsedMyr,
        title: 'New Ocean Basin Formed',
        description: `Continental rift "${existingRift.name}" has fully separated. ` +
          `A new ocean basin (${oceanBasin.depth.toFixed(0)} m deep) now exists ` +
          `between plates ${pa.id} and ${pb.id}.`,
      });
    }

    if (existingRift.becameOcean) {
      const basin = ctx.oceanBasins.find((b) => b.name === existingRift!.name);
      if (basin) {
        basin.depth = 1000 + spreadRate * 200 + Math.sqrt(existingRift.age) * 200;
        basin.angularRadius += spreadRate * dtMyr * 10 / dna.radius;
      }
    }

    if (!isContinentalRift) {
      ctx.terrainFeatures.push({
        id: ctx.nextFeatureId++,
        latitude: riftCenter.lat,
        longitude: riftCenter.lon,
        elevation: -2500 + spreadRate * 50,
        terrainClass: 'normal',
        type: 'ridge',
        angularRadius: boundary.length * 0.15,
      });
    }
  }
}
