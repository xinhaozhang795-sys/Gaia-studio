/**
 * PlanetHistory — generates the geological timeline of a planet from its DNA.
 *
 * Events are ordered from oldest (planet formation) to most recent.
 * The timeline is deterministic from PlanetDNA and reflects:
 *   • Planet formation time (from age)
 *   • First crust solidification (from cooling rate)
 *   • First ocean condensation (from water ratio + orbital temperature)
 *   • Supercontinent formation (from plate tectonics activity)
 *   • Major impact events (random but seeded)
 *   • Great oxidation events (if terrestrial/ocean with life potential)
 *
 * Each event has: time (Mya), title, description.
 */

import type { PlanetDNA } from '../PlanetDNA';
import { RandomEngine } from '../RandomEngine';
import type { HistoryState, HistoryEvent } from './types';

export function generateHistoryState(dna: PlanetDNA): HistoryState {
  const rng = new RandomEngine(dna.seedHash ^ 0x48495354); // "HIST"

  const events: HistoryEvent[] = [];
  const ageMyr = dna.age;
  const ageGyr = ageMyr / 1000;

  events.push({
    time: Math.round(ageMyr),
    title: 'Planet Formation',
    description: `Accretion of ${dna.seed} from the protoplanetary disk. ` +
      `Initial radius ${(dna.radius / 1e6).toFixed(1)} km, mass ${(dna.mass / 5.972e24).toFixed(2)} M⊕. ` +
      `Surface temperature exceeds 2000 K; the planet is fully molten.`,
  });

  const massRatio = dna.mass / 5.972e24;
  const crustFormationTime = Math.round(ageMyr * (0.02 + 0.03 * massRatio));
  events.push({
    time: Math.max(0, Math.round(ageMyr) - crustFormationTime),
    title: 'First Crust Solidification',
    description: `The surface cools below the silicate solidus. A thin ` +
      `${(dna.density > 5000 ? 'iron-rich' : 'basaltic')} crust forms, ` +
      `approximately ${(crustFormationTime).toFixed(0)} Myr after accretion. ` +
      `Mantle temperature: ${Math.round(dna.mantleTemperature)} K.`,
  });

  if (dna.waterRatio > 0.05 && dna.planetType !== 'lava' && dna.planetType !== 'gas-dwarf') {
    const oceanTime = crustFormationTime + Math.round(rng.nextFloatRange(50, 300));
    const oceanCoveragePct = Math.round(dna.waterRatio * 100);
    events.push({
      time: Math.max(0, Math.round(ageMyr) - oceanTime),
      title: 'First Ocean Condensation',
      description: `Atmospheric water vapor condenses onto the cooling crust. ` +
        `Initial ocean coverage: ${oceanCoveragePct}% of the surface. ` +
        `Mean ocean depth: ~${(3500 * (dna.gravity / 9.8)).toFixed(0)} m.`,
    });
  }

  if (dna.plateCount >= 5 && dna.planetType !== 'gas-dwarf' && dna.planetType !== 'ice') {
    const scTime = crustFormationTime + Math.round(rng.nextFloatRange(200, 800));
    events.push({
      time: Math.max(0, Math.round(ageMyr) - scTime),
      title: 'Supercontinent Assembly',
      description: `Convergent plate boundaries drive ${dna.plateCount} tectonic ` +
        `plates together, assembling the first supercontinent. ` +
        `Mean plate velocity: ${(2 + 13 * Math.exp(-ageGyr * 0.1)).toFixed(1)} cm/yr.`,
    });

    const riftTime = scTime - Math.round(rng.nextFloatRange(100, 400));
    if (riftTime > 0) {
      events.push({
        time: Math.max(0, Math.round(ageMyr) - riftTime),
        title: 'Supercontinent Breakup',
        description: `Mantle plumes weaken the continental lithosphere, ` +
          `triggering rifting and the dispersal of the supercontinent into ` +
          `smaller continental fragments.`,
      });
    }
  }

  const impactCount = Math.min(3, Math.max(0, Math.floor(ageGyr * 0.8)));
  for (let i = 0; i < impactCount; i++) {
    const impactTime = Math.round(rng.nextFloatRange(ageMyr * 0.1, ageMyr * 0.8));
    const impactorSize = rng.nextFloatRange(5, 50);
    events.push({
      time: Math.round(ageMyr) - impactTime,
      title: `Major Impact Event ${i + 1}`,
      description: `A ${impactorSize.toFixed(1)} km impactor strikes the surface, ` +
        `releasing ${(impactorSize ** 3 * 1e5).toExponential(1)} J of energy. ` +
        `Global temperature spike of ~${rng.nextFloatRange(50, 300).toFixed(0)} K. ` +
        `Possible mass extinction of early biosphere.`,
    });
  }

  if ((dna.planetType === 'terrestrial' || dna.planetType === 'ocean') && dna.waterRatio > 0.2) {
    const oxTime = Math.round(rng.nextFloatRange(ageMyr * 0.4, ageMyr * 0.7));
    const o2Level = (dna.atmosphereComposition['O2'] ?? 0) * 100;
    if (o2Level > 1) {
      events.push({
        time: Math.max(0, Math.round(ageMyr) - oxTime),
        title: 'Great Oxidation Event',
        description: `Photosynthetic organisms produce enough O₂ to transform ` +
          `the atmosphere. Atmospheric oxygen reaches ${o2Level.toFixed(1)}%. ` +
          `Aerobic life becomes dominant.`,
      });
    }
  }

  if (dna.mantleEnergy > dna.mass * 1e-7) {
    const recentTime = Math.round(rng.nextFloatRange(ageMyr * 0.8, ageMyr * 0.95));
    events.push({
      time: Math.max(0, Math.round(ageMyr) - recentTime),
      title: 'Mantle Plume Surge',
      description: `A new mantle plume reaches the surface, triggering ` +
        `extensive flood basalt volcanism. Global CO₂ levels rise ` +
        `temporarily, affecting climate.`,
    });
  }

  events.sort((a, b) => b.time - a.time);

  const eraCount = Math.min(8, Math.max(3, Math.floor(ageGyr * 2)));

  return {
    events,
    formationTime: Math.round(ageMyr),
    eraCount,
  };
}
