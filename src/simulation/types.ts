/**
 * GaiaState — the single source of truth for the simulated world.
 * Rendering reads from this. Engines write only their own slice.
 *
 * Slices map 1:1 to subsystems so an engine never touches another's data.
 */

// ── Planet (physical body) ────────────────────────────────────────────────────
export interface PlanetState {
  /** Equatorial radius, metres. */
  radius: number;
  /** Polar radius, metres. */
  radiusPolar: number;
  /** Mass, kg. */
  mass: number;
  /** Sidereal rotation period, seconds. */
  rotationPeriod: number;
  /** Axial tilt, radians. */
  axialTilt: number;
  /** Current spin angle, radians (0..2π). Derived from clock. */
  spinAngle: number;
  /** Mean surface gravity, m/s². */
  gravity: number;
  /** Semi-major orbital axis, metres. */
  semiMajorAxis: number;
  /** Orbital eccentricity. */
  eccentricity: number;
  /** Orbital inclination, radians. */
  inclination: number;
  /** Sun direction in world space (normalized), derived from simTime. */
  sunDirectionX: number;
  sunDirectionY: number;
  sunDirectionZ: number;

  // ── Derived from rotationSpeed parameter ─────────────────────────────────
  /** Angular velocity, rad/s (2π / rotationPeriod). */
  angularVelocity: number;
  /** Solar day length in hours (= sidereal day adjusted for orbital motion). */
  dayLengthHours: number;
  /** Coriolis parameter at 45° latitude, s⁻¹ (2Ω sin φ). */
  coriolis45: number;
  /** Effective gravity at equator including centrifugal reduction, m/s². */
  gravityEquator: number;
  /** Effective gravity at poles, m/s² (no centrifugal reduction). */
  gravityPole: number;
  /** Equatorial flattening factor (radiusEquator / radiusPolar - 1). */
  flattening: number;
}

// ── Atmosphere ────────────────────────────────────────────────────────────────
export interface AtmosphereState {
  /** Surface pressure, Pa. */
  surfacePressure: number;
  /** Mean molar mass, kg/mol. */
  meanMolarMass: number;
  /** Column gas ratios (N₂, O₂, Ar, CO₂, H₂O…). */
  composition: Record<string, number>;
  /** Bond albedo of the atmosphere (0..1). */
  albedo: number;
  /** Greenhouse forcing, K (effective warming above blackbody). */
  greenhouseEffect: number;
  /** Optical thickness (placeholder for radiative-transfer models). */
  opticalDepth: number;
}

// ── Ocean ─────────────────────────────────────────────────────────────────────
export interface OceanState {
  /** Fraction of surface covered by ocean (0..1). */
  coverage: number;
  /** Mean depth, metres. */
  meanDepth: number;
  /** Mean salinity, PSU. */
  salinity: number;
  /** Mean surface temperature, K. */
  meanTemperature: number;
  /** Total heat capacity of the mixed layer, J/K. */
  heatCapacity: number;
  // ── Sprint 6: live ocean dynamics ────────────────────────────────────────
  /** Global mean surface current speed, m/s. */
  oceanCurrentSpeed: number;
  /** Prevailing surface current direction, radians [0..2π). */
  oceanCurrentDirection: number;
  /** Equatorial current strength, m/s (eastward trade-driven). */
  equatorialCurrent: number;
  /** Polar current strength, m/s (westward thermohaline). */
  polarCurrent: number;
  /** Poleward heat transport, PW (petawatts). */
  heatTransport: number;
  /** Sea-surface temperature anomaly, K (deviation from mean). */
  seaSurfaceTemperature: number;
}

// ── Season ───────────────────────────────────────────────────────────────────
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonState {
  /** Current season label (Northern Hemisphere). */
  season: Season;
  /** Day-of-year phase angle [0..2π), 0 = vernal equinox. */
  phaseAngle: number;
  /** Sub-season interpolation factor [0..1) within the current season. */
  seasonProgress: number;
  /** Solar declination angle, radians (axial tilt × sin of orbital position). */
  solarDeclination: number;
  /** Day-night transition state: 'day' | 'sunrise' | 'sunset' | 'twilight' | 'night'. */
  dayPhase: 'day' | 'sunrise' | 'sunset' | 'twilight' | 'night';
  /** Continuous day-blend factor [0..1] — 1 = full day, 0 = full night, smooth across terminator. */
  dayBlend: number;
  /** Sunrise/sunset tint intensity [0..1], peaks at terminator. */
  goldenHour: number;
}

// ── Climate ───────────────────────────────────────────────────────────────────
export interface ClimateState {
  /** Global mean surface temperature, K. */
  globalMeanTemp: number;
  /** Equator-to-pole temperature gradient, K. */
  equatorPoleGradient: number;
  /** Total solar irradiance at top of atmosphere, W/m². */
  solarConstant: number;
  /** Planetary bond albedo (0..1). */
  planetaryAlbedo: number;
  /** Outgoing longwave radiation, W/m². */
  outgoingLongwave: number;
  /** Net energy imbalance, W/m². */
  energyImbalance: number;
  /** Number of Hadley-like cells per hemisphere. */
  hadleyCells: number;
  /** Solar irradiance scaled by the sunIntensity parameter, W/m². */
  effectiveSolarConstant: number;
  /** Incoming absorbed energy flux, W/m². */
  absorbedEnergy: number;
  /** Equilibrium blackbody temperature, K. */
  equilibriumTemp: number;
  /** Ice melt tendency, K/year (positive = melting, negative = freezing). */
  iceMeltTendency: number;
  /** Ocean temperature tendency, K/year (from energy imbalance). */
  oceanTempTendency: number;
}

// ── Wind ──────────────────────────────────────────────────────────────────────
export interface WindState {
  /** Trade wind strength, m/s (tropical easterlies). */
  tradeWind: number;
  /** Westerly wind strength, m/s (mid-latitude). */
  westerlies: number;
  /** Polar easterly wind strength, m/s. */
  polarWind: number;
  /** Jet stream speed, m/s (upper troposphere). */
  jetStream: number;
  /** Monsoon strength factor [0..1] — seasonal land-sea breeze amplification. */
  monsoonStrength: number;
  /** Global mean surface wind speed, m/s. */
  globalWindSpeed: number;
}

// ── Hydrology ─────────────────────────────────────────────────────────────────
export type PrecipitationType = 'rain' | 'snow' | 'sleet' | 'none';

export interface HydrologyState {
  /** Total atmospheric water vapour, kg/m² (precipitable water). */
  precipitableWater: number;
  /** Mean evaporation rate, mm/day. */
  evaporationRate: number;
  /** Mean precipitation rate, mm/day. */
  precipitationRate: number;
  /** River discharge to oceans, m³/s. */
  riverDischarge: number;
  /** Ice sheet fraction (0..1). */
  iceFraction: number;
  /** Cloud cover fraction (0..1). */
  cloudCover: number;
  /** Cloud density factor (0..1), drives shader opacity. */
  cloudDensity: number;
  /** Cloud-top altitude factor (0..1), maps to cloud shell scale. */
  cloudHeight: number;
  /** Global mean wind speed, m/s. */
  windSpeed: number;
  /** Prevailing wind direction, radians [0..2π) — 0 = east. */
  windDirection: number;
  // ── Sprint 6: complete water-cycle closure ───────────────────────────────
  /** Relative humidity, % (0..100). */
  humidity: number;
  /** Storm intensity factor [0..1] — convective storm strength. */
  stormIntensity: number;
  /** Mean cloud lifetime, hours. */
  cloudLifetime: number;
  /** Dominant precipitation type. */
  precipitationType: PrecipitationType;
}

// ── Geology ───────────────────────────────────────────────────────────────────
export interface GeologyState {
  /** Number of major tectonic plates. */
  plateCount: number;
  /** Mean plate velocity, cm/year. */
  meanPlateVelocity: number;
  /** CO₂ outgassing rate, gigatonnes/year. */
  co2Outgassing: number;
  /** Mantle temperature, K. */
  mantleTemperature: number;
  /** Core temperature, K. */
  coreTemperature: number;
  /** Magnetic dipole moment, Wb·m. */
  magneticMoment: number;
}

// ── Ecology ───────────────────────────────────────────────────────────────────
export interface EcologyState {
  /** Net primary productivity, PgC/year. */
  netPrimaryProductivity: number;
  /** Total biomass, PgC. */
  totalBiomass: number;
  /** Vegetation cover fraction (0..1). */
  vegetationCover: number;
  /** Atmospheric CO₂ drawdown, PgC/year. */
  co2Drawdown: number;
  /** Ocean biological pump, PgC/year. */
  oceanBioPump: number;
}

// ── Evolution ─────────────────────────────────────────────────────────────────
export interface EvolutionState {
  /** Estimated number of extant species. */
  speciesCount: number;
  /** Speciation rate, species/year. */
  speciationRate: number;
  /** Extinction rate, species/year. */
  extinctionRate: number;
  /** Mean generation turnover, years. */
  meanGeneration: number;
  /** Open niche capacity (0..1). */
  nicheCapacity: number;
}

// ── Simulation control ────────────────────────────────────────────────────────
export type ClockPreset =
  | '1x'
  | '10x'
  | '24x'
  | '100x'
  | '365x'
  | '1000x';

export interface SimulationState {
  /** Whether the clock is advancing. */
  running: boolean;
  /** Active time-scale preset. */
  clockPreset: ClockPreset;
  /** Simulated time elapsed since epoch, seconds. */
  simTime: number;
  /** Real time of day on the planet, hours [0..24). */
  timeOfDay: number;
  /** Day-of-year [1..365]. */
  dayOfYear: number;
  /** Simulated year count (integer). */
  year: number;
  /** Wall-clock delta of last tick, seconds. */
  lastDelta: number;
  /** Tick counter (monotonic). */
  tickCount: number;
}

// ── Rendering (display-only flags) ────────────────────────────────────────────
export type ViewMode = 'realistic' | 'topographic' | 'night' | 'wireframe';
export type ToolMode = 'orbit' | 'pan' | 'measure';
export type LayerKey = 'atmosphere' | 'clouds' | 'stars' | 'grid' | 'nightLights';

export interface RenderingState {
  viewMode: ViewMode;
  tool: ToolMode;
  layers: Record<LayerKey, boolean>;
  autoRotate: boolean;
  rotationSpeed: number;
  sunIntensity: number;
  cloudOpacity: number;
  atmosphereGlow: number;
  starDensity: number;
  nightLights: boolean;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export interface GaiaState {
  planet: PlanetState;
  atmosphere: AtmosphereState;
  ocean: OceanState;
  season: SeasonState;
  wind: WindState;
  climate: ClimateState;
  hydrology: HydrologyState;
  geology: GeologyState;
  ecology: EcologyState;
  evolution: EvolutionState;
  simulation: SimulationState;
  rendering: RenderingState;
}

// ── Engine contract ───────────────────────────────────────────────────────────
/**
 * Every engine reads the full global state and writes ONLY its own outputs.
 * No engine directly mutates another engine's slice.
 */
export interface Engine<Slice = unknown> {
  readonly id: string;
  /** Other engine ids this engine must run after. */
  readonly dependencies: readonly string[];
  /** Advances this engine's slice by `dt` simulated seconds. */
  update(state: GaiaState, dt: number): Slice;
}

// ── Snapshot (immutable copy used by React + listeners) ──────────────────────
export type GaiaSnapshot = GaiaState;
