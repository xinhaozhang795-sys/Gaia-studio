/**
 * SupercontinentGenerator — generates continents from tectonic configuration.
 *
 * Continents are NOT drawn with Perlin noise. Instead, they are derived
 * from the tectonic plate layout:
 *   • Continental plates → cratons (ancient continental cores)
 *   • Adjacent continental plates → supercontinents
 *   • Gaps between continental plates → ocean basins
 *   • Divergent boundaries between continental plates → rift zones
 *
 * Deterministic: same DNA + PlateState → same SupercontinentState.
 */

import type { PlanetDNA } from '../PlanetDNA';
import { RandomEngine } from '../RandomEngine';
import type { PlateState, TectonicPlate } from './types';
import type {
  SupercontinentState, Supercontinent, Craton, OceanBasin, RiftZone,
} from './types';

function angularDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function sphericalCentroid(points: Array<{ lat: number; lon: number }>): { lat: number; lon: number } {
  let x = 0, y = 0, z = 0;
  for (const p of points) {
    x += Math.cos(p.lat) * Math.cos(p.lon);
    y += Math.cos(p.lat) * Math.sin(p.lon);
    z += Math.sin(p.lat);
  }
  const n = points.length;
  x /= n; y /= n; z /= n;
  return { lat: Math.asin(z), lon: Math.atan2(y, x) };
}

const CONTINENT_NAMES = [
  'Pangaea', 'Gondwana', 'Laurasia', 'Vaalbara', 'Kenorland',
  'Columbia', 'Rodinia', 'Pannotia', 'Amasia', 'Novopangaea',
];
const OCEAN_NAMES = [
  'Tethys', 'Panthalassa', 'Iapetus', 'Poseidon', 'Borealis',
  'Australis', 'Chronos', 'Aether', 'Styx', 'Lethe',
];
const RIFT_NAMES = [
  'Great Rift', 'Mid-Continental Rift', 'Borealis Rift', 'Equatorial Rift',
  'Circum-Polar Rift', 'Helios Rift',
];
const CRATON_NAMES = [
  'Kaapvaal', 'Pilbara', 'Superior', 'Dharwar', 'Slave',
  'Sao Francisco', 'Kola', 'Aldan', 'Tarim', 'Sino-Korean',
];

export function generateSupercontinentState(
  dna: PlanetDNA,
  plateState: PlateState,
): SupercontinentState {
  const rng = new RandomEngine(dna.seedHash ^ 0x5355434f); // "SUCO"

  const continentalPlates = plateState.plates.filter((p) => p.type === 'continental');

  const cratons: Craton[] = continentalPlates.map((p, i) => ({
    name: CRATON_NAMES[i % CRATON_NAMES.length]!,
    latitude: p.centerLatitude,
    centerLongitude: p.centerLongitude,
    angularRadius: p.angularRadius * rng.nextFloatRange(0.5, 0.9),
    age: rng.nextFloatRange(p.age * 0.6, p.age),
  }));

  const adjacencyThreshold = plateState.plates[0]?.angularRadius ?? 1.0;

  const parent = new Map<number, number>();
  continentalPlates.forEach((p) => parent.set(p.id, p.id));

  function find(x: number): number {
    if (parent.get(x) === x) return x;
    const root = find(parent.get(x)!);
    parent.set(x, root);
    return root;
  }
  function union(a: number, b: number): void {
    parent.set(find(a), find(b));
  }

  for (let i = 0; i < continentalPlates.length; i++) {
    for (let j = i + 1; j < continentalPlates.length; j++) {
      const a = continentalPlates[i]!;
      const b = continentalPlates[j]!;
      const dist = angularDistance(a.centerLatitude, a.centerLongitude,
                                    b.centerLatitude, b.centerLongitude);
      if (dist < adjacencyThreshold * 1.5) {
        union(a.id, b.id);
      }
    }
  }

  const clusters = new Map<number, TectonicPlate[]>();
  continentalPlates.forEach((p) => {
    const root = find(p.id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(p);
  });

  const clusterArray = [...clusters.values()].sort((a, b) => b.length - a.length);
  const maxSupercontinents = Math.min(3, clusterArray.length);
  const supercontinents: Supercontinent[] = [];

  for (let i = 0; i < maxSupercontinents; i++) {
    const cluster = clusterArray[i]!;
    const centroid = sphericalCentroid(
      cluster.map((p) => ({ lat: p.centerLatitude, lon: p.centerLongitude })),
    );
    const cratonIds = cluster.map((p) => p.id);
    const areaFraction = cluster.reduce((s, p) => s + p.areaFraction, 0);
    const maxRadius = Math.max(...cluster.map((p) => p.angularRadius));

    supercontinents.push({
      name: CONTINENT_NAMES[i % CONTINENT_NAMES.length]!,
      latitude: centroid.lat,
      longitude: centroid.lon,
      angularRadius: maxRadius * 1.2,
      cratonIds,
      areaFraction,
    });
  }

  const oceanBasins: OceanBasin[] = [];
  if (supercontinents.length >= 2) {
    for (let i = 0; i < supercontinents.length - 1; i++) {
      const a = supercontinents[i]!;
      const b = supercontinents[i + 1]!;
      const mid = sphericalCentroid([
        { lat: a.latitude, lon: a.longitude },
        { lat: b.latitude, lon: b.longitude },
      ]);
      oceanBasins.push({
        name: OCEAN_NAMES[i % OCEAN_NAMES.length]!,
        latitude: mid.lat,
        longitude: mid.lon,
        angularRadius: angularDistance(a.latitude, a.longitude, b.latitude, b.longitude) * 0.4,
        depth: 3500 + rng.nextFloatRange(0, 2000),
      });
    }
  } else if (supercontinents.length === 1) {
    const sc = supercontinents[0]!;
    oceanBasins.push({
      name: OCEAN_NAMES[0]!,
      latitude: -sc.latitude,
      longitude: (sc.longitude + Math.PI) % (Math.PI * 2),
      angularRadius: Math.PI * 0.6,
      depth: 3500 + rng.nextFloatRange(0, 2000),
    });
  } else {
    oceanBasins.push({
      name: OCEAN_NAMES[0]!,
      latitude: 0,
      longitude: 0,
      angularRadius: Math.PI,
      depth: 4000 + rng.nextFloatRange(0, 2000),
    });
  }

  const riftZones: RiftZone[] = [];
  let riftIdx = 0;
  for (const boundary of plateState.boundaries) {
    if (boundary.type !== 'divergent') continue;
    const pa = plateState.plates[boundary.plateA]!;
    const pb = plateState.plates[boundary.plateB]!;
    if (pa.type !== 'continental' || pb.type !== 'continental') continue;

    riftZones.push({
      name: RIFT_NAMES[riftIdx % RIFT_NAMES.length]!,
      startLat: pa.centerLatitude,
      startLon: pa.centerLongitude,
      endLat: pb.centerLatitude,
      endLon: pb.centerLongitude,
      spreadRate: boundary.relativeVelocity,
    });
    riftIdx++;
  }

  const landFraction = supercontinents.reduce((s, sc) => s + sc.areaFraction, 0);

  return {
    supercontinents,
    cratons,
    oceanBasins,
    riftZones,
    landFraction: Math.min(landFraction, 1 - dna.waterRatio * 0.3),
  };
}
