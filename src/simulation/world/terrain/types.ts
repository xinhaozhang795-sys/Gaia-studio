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

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface TerrainFeatureNode {
  id: number;
  type: TerrainFeatureType;
  latitude: number;
  longitude: number;
  angularRadius: number;
  height: number;
  originalHeight: number;
  age: number;
  formationCause: FormationCause;
  plateId: number;
  erosionLevel: number;
  rarity: TerrainClass;
  rarityLabel: Rarity;
  name: string;
}

export interface ElevationGrid {
  resolution: number;
  cells: ElevationCell[];
  meanElevation: number;
  maxElevation: number;
  minElevation: number;
}

export interface ElevationCell {
  id: number;
  latitude: number;
  longitude: number;
  elevation: number;
  dominantCause: FormationCause;
  plateId: number;
  terrainClass: TerrainClass;
}

export type ErosionType = 'river' | 'weathering' | 'glacial' | 'aeolian' | 'chemical';

export interface ErosionResult {
  featureErosion: Map<number, number>;
  meanErosion: number;
  sedimentVolume: number;
  depositionSites: Array<{ latitude: number; longitude: number; volume: number }>;
}

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
  id: number;
  latitude: number;
  longitude: number;
  biome: TerrainBiome;
  elevation: number;
  terrainClass: TerrainClass;
  waterAvailability: number;
  temperatureModifier: number;
}

export interface BiomeTerrainMap {
  cells: BiomeTerrainCell[];
  distribution: Record<string, number>;
  landFraction: number;
  oceanFraction: number;
}

export interface DetectedFeatureGroup {
  type: TerrainFeatureType;
  count: number;
  meanHeight: number;
  maxHeight: number;
  meanAge: number;
  areaFraction: number;
  cause: FormationCause;
  featureIds: number[];
}

export interface TerrainFeatureReport {
  groups: DetectedFeatureGroup[];
  totalFeatures: number;
  classDistribution: { wonder: number; spectacular: number; normal: number };
  rarityDistribution: Record<Rarity, number>;
  notableFeatures: TerrainFeatureNode[];
}

export interface TerrainOutput {
  features: TerrainFeatureNode[];
  elevationGrid: ElevationGrid;
  erosion: ErosionResult;
  biomeMap: BiomeTerrainMap;
  featureReport: TerrainFeatureReport;
  stats: TerrainStats;
}

export interface TerrainStats {
  meanElevation: number;
  maxElevation: number;
  minElevation: number;
  landFraction: number;
  oceanFraction: number;
  highestPeak: string;
  deepestPoint: string;
  mountainCount: number;
  volcanoCount: number;
  craterCount: number;
  riftCount: number;
  meanErosion: number;
  classDistribution: { wonder: number; spectacular: number; normal: number };
}

export interface TerrainInput {
  dna: import('../PlanetDNA').PlanetDNA;
  genesis: import('../genesis/types').GenesisState;
  evolution: import('../evolution/types').GeologicalEvolutionState;
}
