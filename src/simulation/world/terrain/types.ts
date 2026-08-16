/**
 * Terrain types — the physically-driven terrain model for alien planets.
 *
 * Sprint 7.4: Terrain is derived from the full geological pipeline:
 *   PlanetDNA → Genesis → PlateEvolution → GeologicalHistory → Terrain
 *
 * Every terrain feature has a geological cause. No random noise.
 * The terrain can exceed Earth scale (up to 18,000+ m) but only when
 * a geological process explains it.
 */

import type { TerrainClass } from '../evolution/types';

// Re-export TerrainClass for convenience
export type { TerrainClass } from '../evolution/types';

// ── Terrain feature types ─────────────────────────────────────────────────────

export type TerrainFeatureType =
  | 'mountain'
  | 'plateau'
  | 'valley'
  | 'canyon'
  | 'volcano'
  | 'rift'
  | 'basin'
  | 'plain'
  | 'island'
  | 'trench'
  | 'crater'
  | 'ridge'
  | 'coast';

/** What geological process created this terrain feature. */
export type FormationCause =
  | 'plate-collision'
  | 'subduction'
  | 'rifting'
  | 'hotspot'
  | 'impact'
  | 'erosion'
  | 'sedimentation'
  | 'isostasy'
  | 'volcanic-arc'
  | 'background';

/** Rarity classification for world-wonder-scale features. */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * A single terrain feature on the planet surface.
 * Every feature is traceable to a geological cause.
 */
export interface TerrainFeatureNode {
  /** Unique feature id. */
  id: number;
  /** Feature type. */
  type: TerrainFeatureType;
  /** Latitude, radians [-π/2..π/2]. */
  latitude: number;
  /** Longitude, radians [0..2π). */
  longitude: number;
  /** Angular radius / extent, radians. */
  angularRadius: number;
  /** Elevation, metres (positive = above sea level, negative = below). */
  height: number;
  /** Original formation height before erosion, metres. */
  originalHeight: number;
  /** Geological age, million years. */
  age: number;
  /** What geological process created this feature. */
  formationCause: FormationCause;
  /** Associated tectonic plate id (-1 if not plate-specific). */
  plateId: number;
  /** Erosion level [0..1] — 0 = pristine, 1 = fully eroded. */
  erosionLevel: number;
  /** Terrain class (wonder / spectacular / normal). */
  rarity: TerrainClass;
  /** Rarity label for display. */
  rarityLabel: Rarity;
  /** Feature name (auto-generated). */
  name: string;
  /** Geological province id — features sharing a province belong to the same geological system. */
  provinceId: number;
}

// ── Elevation grid ────────────────────────────────────────────────────────────

/**
 * A discretized elevation grid on the planet surface.
 * Uses a Fibonacci sphere distribution for approximately equal-area cells.
 */
export interface ElevationGrid {
  /** Number of grid cells. */
  resolution: number;
  /** Per-cell elevation data. */
  cells: ElevationCell[];
  /** Global mean elevation, metres. */
  meanElevation: number;
  /** Maximum elevation, metres. */
  maxElevation: number;
  /** Minimum elevation, metres (negative). */
  minElevation: number;
}

export interface ElevationCell {
  /** Cell index. */
  id: number;
  /** Latitude, radians. */
  latitude: number;
  /** Longitude, radians. */
  longitude: number;
  /** Elevation, metres. */
  elevation: number;
  /** Dominant geological cause at this cell. */
  dominantCause: FormationCause;
  /** Nearest plate id (-1 if oceanic background). */
  plateId: number;
  /** Terrain class. */
  terrainClass: TerrainClass;
}

// ── Erosion ───────────────────────────────────────────────────────────────────

/** Erosion type. */
export type ErosionType = 'river' | 'weathering' | 'glacial' | 'aeolian' | 'chemical';

export interface ErosionResult {
  /** Per-feature erosion level [0..1]. */
  featureErosion: Map<number, number>;
  /** Global mean erosion level. */
  meanErosion: number;
  /** Total sediment volume produced, km³. */
  sedimentVolume: number;
  /** Sediment deposition locations (basins/plains that received sediment). */
  depositionSites: Array<{ latitude: number; longitude: number; volume: number }>;
}

// ── Biome terrain mapping ─────────────────────────────────────────────────────

/** Terrain-influenced biome category (foundation for future Biome Engine). */
export type TerrainBiome =
  | 'alpine-peaks'
  | 'mountain-forest'
  | 'highland-plateau'
  | 'volcanic-field'
  | 'rift-valley'
  | 'coastal-lowland'
  | 'alluvial-plain'
  | 'desert-basin'
  | 'oceanic-trench'
  | 'abyssal-plain'
  | 'continental-shelf'
  | 'impact-badlands'
  | 'volcanic-island'
  | 'ice-sheet';

export interface BiomeTerrainCell {
  /** Cell/feature id. */
  id: number;
  latitude: number;
  longitude: number;
  /** Assigned biome. */
  biome: TerrainBiome;
  /** Elevation, metres. */
  elevation: number;
  /** Terrain class. */
  terrainClass: TerrainClass;
  /** Suitable for future climate/hydrology integration. */
  waterAvailability: number;
  /** Temperature modifier from elevation (K), for future Climate Engine. */
  temperatureModifier: number;
}

export interface BiomeTerrainMap {
  cells: BiomeTerrainCell[];
  /** Biome distribution: biome → fraction of surface. */
  distribution: Record<string, number>;
  /** Total land fraction. */
  landFraction: number;
  /** Total ocean fraction. */
  oceanFraction: number;
}

// ── Feature detection ─────────────────────────────────────────────────────────

export interface DetectedFeatureGroup {
  /** Group type. */
  type: TerrainFeatureType;
  /** Number of features in this group. */
  count: number;
  /** Mean height, metres. */
  meanHeight: number;
  /** Max height in group, metres. */
  maxHeight: number;
  /** Mean age, Myr. */
  meanAge: number;
  /** Total surface area fraction. */
  areaFraction: number;
  /** Dominant formation cause. */
  cause: FormationCause;
  /** List of feature ids in this group. */
  featureIds: number[];
}

export interface TerrainFeatureReport {
  groups: DetectedFeatureGroup[];
  /** Total feature count. */
  totalFeatures: number;
  /** Class distribution. */
  classDistribution: { wonder: number; spectacular: number; normal: number };
  /** Rarity distribution. */
  rarityDistribution: Record<Rarity, number>;
  /** Notable features (wonders and legendaries). */
  notableFeatures: TerrainFeatureNode[];
}

// ── Root terrain output ───────────────────────────────────────────────────────

export interface TerrainOutput {
  /** Full feature list. */
  features: TerrainFeatureNode[];
  /** Elevation grid. */
  elevationGrid: ElevationGrid;
  /** Erosion results. */
  erosion: ErosionResult;
  /** Biome terrain map. */
  biomeMap: BiomeTerrainMap;
  /** Feature classification report. */
  featureReport: TerrainFeatureReport;
  /** Global statistics. */
  stats: TerrainStats;
}

export interface TerrainStats {
  meanElevation: number;
  maxElevation: number;
  minElevation: number;
  landFraction: number;
  oceanFraction: number;
  /** Highest mountain name. */
  highestPeak: string;
  /** Deepest point name. */
  deepestPoint: string;
  /** Total mountain ranges. */
  mountainCount: number;
  /** Total volcanoes. */
  volcanoCount: number;
  /** Total impact craters. */
  craterCount: number;
  /** Total rift valleys. */
  riftCount: number;
  /** Mean planetary erosion level. */
  meanErosion: number;
  /** Terrain class distribution. */
  classDistribution: { wonder: number; spectacular: number; normal: number };
}

// ── Terrain generation input ──────────────────────────────────────────────────

export interface TerrainInput {
  dna: import('../PlanetDNA').PlanetDNA;
  genesis: import('../genesis/types').GenesisState;
  evolution: import('../evolution/types').GeologicalEvolutionState;
}
