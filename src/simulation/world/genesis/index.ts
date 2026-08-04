/**
 * genesis/index.ts — barrel export + entry point for the Planet Genesis system.
 *
 * generateGenesis(dna) runs all genesis generators in dependency order and
 * returns a complete GenesisState. This is called once at world creation
 * time by WorldGenerator — never during per-frame simulation.
 *
 * Dependency order:
 *   1. MantleEngine       (from DNA only)
 *   2. PlateGenerator     (from DNA only)
 *   3. SupercontinentGenerator (from DNA + PlateState)
 *   4. HotspotGenerator   (from DNA + MantleState + PlateState)
 *   5. PlanetHistory      (from DNA only)
 */

import type { PlanetDNA } from '../PlanetDNA';
import { generateMantleState } from './MantleEngine';
import { generatePlateState } from './PlateGenerator';
import { generateSupercontinentState } from './SupercontinentGenerator';
import { generateHotspotState } from './HotspotGenerator';
import { generateHistoryState } from './PlanetHistory';
import type { GenesisState } from './types';

export type {
  GenesisState,
  MantleState, ConvectionCell, MantlePlume,
  PlateState, TectonicPlate, PlateBoundary, PlateType,
  SupercontinentState, Supercontinent, Craton, OceanBasin, RiftZone,
  HotspotState, Hotspot, IslandChain,
  HistoryState, HistoryEvent,
} from './types';

export { generateMantleState } from './MantleEngine';
export { generatePlateState } from './PlateGenerator';
export { generateSupercontinentState } from './SupercontinentGenerator';
export { generateHotspotState } from './HotspotGenerator';
export { generateHistoryState } from './PlanetHistory';

export function generateGenesis(dna: PlanetDNA): GenesisState {
  const mantle = generateMantleState(dna);
  const plates = generatePlateState(dna);
  const supercontinents = generateSupercontinentState(dna, plates);
  const hotspots = generateHotspotState(dna, mantle, plates);
  const history = generateHistoryState(dna);
  return { mantle, plates, supercontinents, hotspots, history };
}
