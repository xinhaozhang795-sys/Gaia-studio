/**
 * world/ — Procedural planet generation system.
 */

// ── Random ─────────────────────────────────────────────────────────────────────
export { RandomEngine } from './RandomEngine';

// ── DNA ────────────────────────────────────────────────────────────────────────
export type { PlanetDNA, PlanetType, AtmosphereComposition } from './PlanetDNA';
export { sealDNA, isSealedDNA } from './PlanetDNA';

// ── Seed ───────────────────────────────────────────────────────────────────────
export { PlanetSeed, hashSeed, formatSeed, parseSeed } from './PlanetSeed';

// ── Archive ─────────────────────────────────────────────────────────────────────
export type { PlanetArchive } from './PlanetArchive';
export { createArchive, generatePlanetName } from './PlanetArchive';

// ── Generator ───────────────────────────────────────────────────────────────────
export type { WorldBundle } from './WorldGenerator';
export { createWorld, createWorldFromId } from './WorldGenerator';

// ── Genesis (Sprint 7.2) ────────────────────────────────────────────────────────
export * from './genesis';

// ── Evolution (Sprint 7.3) ──────────────────────────────────────────────────────
export * from './evolution';
