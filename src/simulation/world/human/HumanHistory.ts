/**
 * HumanHistory — records significant events in human evolution.
 *
 * Events are recorded at appropriate time scales:
 *   10,000 yr — emergence, major stage transitions, extinction
 *   1,000 yr — migrations, regional expansion, agriculture
 *   100 yr — population growth/decline, cultural discoveries
 *   10 yr — settlements, disease, famine
 *   1 yr — (reserved for future fine-grained events)
 *
 * History is capped to prevent unbounded growth. Oldest minor events
 * are pruned first; major events (emergence, extinction, stage_transition)
 * are always preserved.
 */

import type {
  HumanHistoryEvent, HumanEventType, HumanEvolutionState,
  CulturalTrait, SpeciesStage,
} from './types';

const MAX_EVENTS = 200;

// ── Event factory ──────────────────────────────────────────────────────────────

let eventCounter = 0;

export function createEvent(
  type: HumanEventType,
  year: number,
  description: string,
  latitude?: number,
  longitude?: number,
  magnitude?: number,
): HumanHistoryEvent {
  return {
    id: eventCounter++,
    type,
    year,
    description,
    latitude,
    longitude,
    magnitude,
  };
}

// ── Event logging ──────────────────────────────────────────────────────────────

export function logEmergence(
  history: HumanHistoryEvent[],
  year: number,
  latitude: number,
  longitude: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent('emergence', year, 'First hominin emergence', latitude, longitude, 1.0),
  ];
}

export function logStageTransition(
  history: HumanHistoryEvent[],
  year: number,
  from: SpeciesStage,
  to: SpeciesStage,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent(
      'stage_transition', year,
      `Evolutionary transition: ${from} → ${to}`,
      undefined, undefined, 0.8,
    ),
  ];
}

export function logMigration(
  history: HumanHistoryEvent[],
  year: number,
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent(
      'migration', year,
      'Population migration to new region',
      toLat, toLon, 0.3,
    ),
  ];
}

export function logPopulationGrowth(
  history: HumanHistoryEvent[],
  year: number,
  population: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent(
      'population_growth', year,
      `Population growth to ${Math.floor(population).toLocaleString()}`,
      undefined, undefined, 0.2,
    ),
  ];
}

export function logPopulationDecline(
  history: HumanHistoryEvent[],
  year: number,
  population: number,
  cause: string,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent(
      'population_decline', year,
      `Population decline to ${Math.floor(population).toLocaleString()} — ${cause}`,
      undefined, undefined, 0.5,
    ),
  ];
}

export function logCulturalDiscovery(
  history: HumanHistoryEvent[],
  year: number,
  trait: CulturalTrait,
): HumanHistoryEvent[] {
  const descriptions: Record<CulturalTrait, string> = {
    stone_tools: 'Stone tool making discovered',
    controlled_fire: 'Controlled use of fire',
    hunting: 'Organized hunting techniques',
    gathering: 'Systematic food gathering',
    fishing: 'Fishing practices developed',
    clothing: 'Clothing from animal hides',
    shelter: 'Construction of shelters',
    symbolic_art: 'Symbolic art and cave paintings',
    burial: 'Ritual burial practices',
    language: 'Spoken language developed',
    domestication: 'Animal domestication',
    agriculture: 'Agriculture developed',
    pottery: 'Pottery making',
    early_metalworking: 'Early metalworking',
  };
  return [
    ...history,
    createEvent('cultural_discovery', year, descriptions[trait], undefined, undefined, 0.4),
  ];
}

export function logSettlement(
  history: HumanHistoryEvent[],
  year: number,
  latitude: number,
  longitude: number,
  type: string,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent(
      'settlement', year,
      `${type} established`,
      latitude, longitude, 0.3,
    ),
  ];
}

export function logAgriculture(
  history: HumanHistoryEvent[],
  year: number,
  latitude: number,
  longitude: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent('agriculture', year, 'Agricultural revolution', latitude, longitude, 0.8),
  ];
}

export function logDisease(
  history: HumanHistoryEvent[],
  year: number,
  severity: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent('disease', year, `Disease outbreak (severity: ${severity.toFixed(2)})`, undefined, undefined, severity),
  ];
}

export function logFamine(
  history: HumanHistoryEvent[],
  year: number,
  severity: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent('famine', year, `Famine (severity: ${severity.toFixed(2)})`, undefined, undefined, severity),
  ];
}

export function logExtinction(
  history: HumanHistoryEvent[],
  year: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent('extinction', year, 'Human extinction event', undefined, undefined, 1.0),
  ];
}

export function logRegionalExpansion(
  history: HumanHistoryEvent[],
  year: number,
  regionCount: number,
): HumanHistoryEvent[] {
  return [
    ...history,
    createEvent(
      'regional_expansion', year,
      `Regional expansion to ${regionCount} population centers`,
      undefined, undefined, 0.4,
    ),
  ];
}

// ── History pruning ────────────────────────────────────────────────────────────

const MAJOR_EVENTS: ReadonlySet<HumanEventType> = new Set([
  'emergence', 'extinction', 'stage_transition', 'agriculture',
]);

/**
 * Prune history to MAX_EVENTS, preserving major events and recent minor events.
 */
export function pruneHistory(history: HumanHistoryEvent[]): HumanHistoryEvent[] {
  if (history.length <= MAX_EVENTS) return history;

  const major = history.filter((e) => MAJOR_EVENTS.has(e.type));
  const minor = history.filter((e) => !MAJOR_EVENTS.has(e.type));

  // Keep most recent minor events
  const keepMinor = MAX_EVENTS - major.length;
  const keptMinor = minor.slice(-Math.max(0, keepMinor));

  // Sort by year
  return [...major, ...keptMinor].sort((a, b) => a.year - b.year);
}

/** Reset the event counter for deterministic generation. */
export function resetEventCounter(): void {
  eventCounter = 0;
}
