/**
 * Genesis types — the geological state generated once from PlanetDNA.
 *
 * These types are separate from GaiaState to keep the genesis system
 * self-contained. WorldGenerator (or a future adapter) can merge the
 * relevant fields into GaiaState's geology slice at boot time.
 */

// ── Mantle ─────────────────────────────────────────────────────────────────────

/** A single mantle convection cell. */
export interface ConvectionCell {
  /** Cell index (0-based). */
  id: number;
  /** Latitude of cell center, radians [-π/2..π/2]. */
  latitude: number;
  /** Longitude of cell center, radians [0..2π). */
  longitude: number;
  /** Angular radius of the cell on the sphere, radians. */
  angularRadius: number;
  /** Flow direction: 1 = upwelling (rising), -1 = downwelling (sinking). */
  flowDirection: 1 | -1;
  /** Circulation speed, m/s (typical mantle convection ~10⁻⁹ m/s). */
  velocity: number;
  /** Heat flux contribution from this cell, W/m². */
  heatFlux: number;
}

/** A mantle plume — a narrow column of hot rising material. */
export interface MantlePlume {
  /** Plume index. */
  id: number;
  /** Latitude, radians. */
  latitude: number;
  /** Longitude, radians. */
  longitude: number;
  /** Plume diameter at the core-mantle boundary, km. */
  sourceRadius: number;
  /** Temperature anomaly above ambient mantle, K. */
  temperatureAnomaly: number;
  /** Buoyancy flux, Mg/s (megagrams per second). */
  buoyancyFlux: number;
}

export interface MantleState {
  /** Convection cells covering the mantle. */
  convectionCells: ConvectionCell[];
  /** Mean global heat flux at the surface, W/m² (Earth ~0.087 W/m²). */
  meanHeatFlux: number;
  /** Heat flux standard deviation (spatial variability). */
  heatFluxStd: number;
  /** Mantle plume positions. */
  plumes: MantlePlume[];
  /** Mean lithosphere thickness, km (Earth ~100 km). */
  lithosphereThickness: number;
  /** Total internal heat energy remaining, J. */
  internalHeat: number;
  /** Rayleigh number (dimensionless, drives convection vigor). */
  rayleighNumber: number;
  /** Core-mantle boundary heat flux, W/m². */
  cmbHeatFlux: number;
}

// ── Plates ─────────────────────────────────────────────────────────────────────

export type PlateType = 'oceanic' | 'continental';

export interface TectonicPlate {
  /** Plate identifier (0-based index). */
  id: number;
  /** Oceanic or continental. */
  type: PlateType;
  /** Latitude of plate center, radians. */
  centerLatitude: number;
  /** Longitude of plate center, radians. */
  centerLongitude: number;
  /** Angular radius of the plate on the sphere, radians. */
  angularRadius: number;
  /** Plate velocity, cm/year (Earth range 2-15 cm/yr). */
  velocity: number;
  /** Direction of plate motion, radians [0..2π) — 0 = north. */
  direction: number;
  /** Crustal density, kg/m³ (oceanic ~3000, continental ~2700). */
  density: number;
  /** Crustal age, million years. */
  age: number;
  /** Mean crustal temperature, K. */
  temperature: number;
  /** Approximate surface area fraction (0..1, all plates sum to ~1). */
  areaFraction: number;
}

/** A boundary between two plates. */
export interface PlateBoundary {
  /** First plate id. */
  plateA: number;
  /** Second plate id. */
  plateB: number;
  /** Boundary type. */
  type: 'convergent' | 'divergent' | 'transform';
  /** Boundary length (angular, radians). */
  length: number;
  /** Relative velocity across the boundary, cm/year. */
  relativeVelocity: number;
}

export interface PlateState {
  /** All tectonic plates. */
  plates: TectonicPlate[];
  /** Boundaries between plates. */
  boundaries: PlateBoundary[];
  /** Number of oceanic plates. */
  oceanicCount: number;
  /** Number of continental plates. */
  continentalCount: number;
  /** Mean plate velocity, cm/year. */
  meanVelocity: number;
}

// ── Supercontinents ────────────────────────────────────────────────────────────

export interface Craton {
  /** Craton name (auto-generated). */
  name: string;
  /** Latitude, radians. */
  latitude: number;
  /** Longitude, radians. */
  centerLongitude: number;
  /** Angular radius, radians. */
  angularRadius: number;
  /** Craton age, million years. */
  age: number;
}

export interface Supercontinent {
  /** Supercontinent name (auto-generated). */
  name: string;
  /** Latitude of centroid, radians. */
  latitude: number;
  /** Longitude of centroid, radians. */
  longitude: number;
  /** Angular extent, radians. */
  angularRadius: number;
  /** Constituent craton ids. */
  cratonIds: number[];
  /** Total land area fraction (0..1). */
  areaFraction: number;
}

export interface OceanBasin {
  /** Basin name (auto-generated). */
  name: string;
  /** Latitude, radians. */
  latitude: number;
  /** Longitude, radians. */
  longitude: number;
  /** Angular radius, radians. */
  angularRadius: number;
  /** Mean depth, metres. */
  depth: number;
}

export interface RiftZone {
  /** Rift name (auto-generated). */
  name: string;
  /** Start latitude, radians. */
  startLat: number;
  /** Start longitude, radians. */
  startLon: number;
  /** End latitude, radians. */
  endLat: number;
  /** End longitude, radians. */
  endLon: number;
  /** Spread rate, cm/year. */
  spreadRate: number;
}

export interface SupercontinentState {
  /** 1-3 supercontinents. */
  supercontinents: Supercontinent[];
  /** Ancient cratons (cores of continental plates). */
  cratons: Craton[];
  /** Ocean basins between continents. */
  oceanBasins: OceanBasin[];
  /** Initial rift zones (future divergent boundaries). */
  riftZones: RiftZone[];
  /** Total land fraction (0..1). */
  landFraction: number;
}

// ── Hotspots ────────────────────────────────────────────────────────────────────

export interface Hotspot {
  /** Hotspot id. */
  id: number;
  /** Latitude, radians. */
  latitude: number;
  /** Longitude, radians. */
  longitude: number;
  /** Source plume id. */
  plumeId: number;
  /** Surface heat flow, W/m². */
  heatFlow: number;
  /** Eruption temperature, K. */
  eruptionTemp: number;
  /** Projected volcanic chain length, km (over 50 Myr). */
  chainLength: number;
  /** Whether the hotspot is currently active. */
  active: boolean;
}

export interface IslandChain {
  /** Chain name (auto-generated). */
  name: string;
  /** Associated hotspot id. */
  hotspotId: number;
  /** Number of future islands in the chain. */
  islandCount: number;
  /** Chain heading direction, radians [0..2π). */
  heading: number;
  /** Expected first island emergence, Myr from present. */
  firstEruption: number;
}

export interface HotspotState {
  /** Surface hotspots derived from mantle plumes. */
  hotspots: Hotspot[];
  /** Future volcanic/island chains. */
  islandChains: IslandChain[];
  /** Total volcanic CO₂ output from hotspots, Gt/year. */
  co2Output: number;
}

// ── History ─────────────────────────────────────────────────────────────────────

export interface HistoryEvent {
  /** Time before present, million years ago (Mya). */
  time: number;
  /** Event title. */
  title: string;
  /** Detailed description. */
  description: string;
}

export interface HistoryState {
  /** Geological timeline events, ordered oldest first. */
  events: HistoryEvent[];
  /** Planet formation time, Mya. */
  formationTime: number;
  /** Total geological eras. */
  eraCount: number;
}

// ── Root GenesisState ────────────────────────────────────────────────────────────

export interface GenesisState {
  mantle: MantleState;
  plates: PlateState;
  supercontinents: SupercontinentState;
  hotspots: HotspotState;
  history: HistoryState;
}
