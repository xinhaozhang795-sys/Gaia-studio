/**
 * terrain/index.ts — barrel export for the Terrain Engine (Sprint 7.4).
 *
 * Architecture:
 *   PlanetDNA → Genesis → Evolution → TerrainGenerator → TerrainOutput
 */

export type {
  TerrainFeatureType, FormationCause, Rarity,
  TerrainFeatureNode,
  ElevationGrid, ElevationCell,
  ErosionType, ErosionResult,
  TerrainBiome, BiomeTerrainCell, BiomeTerrainMap,
  DetectedFeatureGroup, TerrainFeatureReport,
  TerrainOutput, TerrainStats, TerrainInput,
  TerrainClass,
} from './types';

export { generateElevationGrid } from './ElevationEngine';
export { computeErosion } from './ErosionEngine';
export { mapBiomes } from './BiomeTerrainMapper';
export { detectFeatures } from './TerrainFeatureDetector';
export { generateTerrain } from './TerrainGenerator';
