import type { GaiaState } from './types';
import {
  ASTRONOMICAL, ATMOSPHERE, OCEAN,
} from './UnitSystem';

/**
 * createInitialState — an Earth-like starting condition.
 * Every slice is populated with physically plausible values so engines
 * have sane inputs on tick 0.
 */
export function createInitialState(): GaiaState {
  return {
    planet: {
      radius: ASTRONOMICAL.EARTH_RADIUS_M,
      radiusPolar: ASTRONOMICAL.EARTH_RADIUS_POLAR_M,
      mass: ASTRONOMICAL.EARTH_MASS_KG,
      rotationPeriod: ASTRONOMICAL.SIDEREAL_DAY_S,
      axialTilt: ASTRONOMICAL.EARTH_AXIAL_TILT_RAD,
      spinAngle: 0,
      gravity: ASTRONOMICAL.EARTH_GRAVITY,
      semiMajorAxis: ASTRONOMICAL.AU_M,
      eccentricity: 0.0167,
      inclination: 0,
      sunDirectionX: 1,
      sunDirectionY: 0.18,
      sunDirectionZ: 0,
      angularVelocity: (Math.PI * 2) / ASTRONOMICAL.SIDEREAL_DAY_S,
      dayLengthHours: 24,
      coriolis45: 2 * ((Math.PI * 2) / ASTRONOMICAL.SIDEREAL_DAY_S) * Math.sin(Math.PI / 4),
      gravityEquator: ASTRONOMICAL.EARTH_GRAVITY - ((Math.PI * 2) / ASTRONOMICAL.SIDEREAL_DAY_S) ** 2 * ASTRONOMICAL.EARTH_RADIUS_M,
      gravityPole: ASTRONOMICAL.EARTH_GRAVITY,
      flattening: 0.0034,
    },
    atmosphere: {
      surfacePressure: ATMOSPHERE.SURFACE_PRESSURE_PA,
      meanMolarMass: ATMOSPHERE.MEAN_MOLAR_MASS,
      composition: {
        N2:  ATMOSPHERE.COMPOSITION_N2,
        O2:  ATMOSPHERE.COMPOSITION_O2,
        Ar:  ATMOSPHERE.COMPOSITION_AR,
        CO2: ATMOSPHERE.COMPOSITION_CO2,
        H2O: ATMOSPHERE.COMPOSITION_H2O,
      },
      albedo: ATMOSPHERE.BOND_ALBEDO,
      greenhouseEffect: ATMOSPHERE.GREENHOUSE_K,
      opticalDepth: 0.18,
    },
    ocean: {
      coverage: OCEAN.COVERAGE,
      meanDepth: OCEAN.MEAN_DEPTH_M,
      salinity: OCEAN.SALINITY_PSU,
      meanTemperature: OCEAN.MEAN_TEMP_K,
      heatCapacity: 5.6e24, // ~mixed layer
    },
    climate: {
      globalMeanTemp: 288.0,
      equatorPoleGradient: 45,
      solarConstant: ASTRONOMICAL.SOLAR_CONSTANT,
      planetaryAlbedo: 0.306,
      outgoingLongwave: 239,
      energyImbalance: 0.6, // current Earth energy imbalance
      hadleyCells: 3,
      effectiveSolarConstant: ASTRONOMICAL.SOLAR_CONSTANT * 1.4,
      absorbedEnergy: (ASTRONOMICAL.SOLAR_CONSTANT * 1.4) * (1 - 0.306) / 4,
      equilibriumTemp: 288.0,
      iceMeltTendency: 0,
      oceanTempTendency: 0,
    },
    hydrology: {
      precipitableWater: 25,
      evaporationRate: 3.0,
      precipitationRate: 3.0,
      riverDischarge: 1.2e6,
      iceFraction: 0.1,
      cloudCover: 0.68,
    },
    geology: {
      plateCount: 7,
      meanPlateVelocity: 5.5,
      co2Outgassing: 0.3,
      mantleTemperature: 3700,
      coreTemperature: 5700,
      magneticMoment: 7.94e22,
    },
    ecology: {
      netPrimaryProductivity: 105,
      totalBiomass: 550,
      vegetationCover: 0.27,
      co2Drawdown: 120,
      oceanBioPump: 11,
    },
    evolution: {
      speciesCount: 8_700_000,
      speciationRate: 0.5,
      extinctionRate: 0.1,
      meanGeneration: 5,
      nicheCapacity: 0.35,
    },
    simulation: {
      running: true,
      clockPreset: '24x',
      simTime: 0,
      timeOfDay: 12.0,
      dayOfYear: 80, // ~vernal equinox
      year: 0,
      lastDelta: 0,
      tickCount: 0,
    },
    rendering: {
      viewMode: 'realistic',
      tool: 'orbit',
      layers: {
        atmosphere: true,
        clouds: true,
        stars: true,
        grid: false,
        nightLights: true,
      },
      autoRotate: true,
      rotationSpeed: 1.0,
      sunIntensity: 1.4,
      cloudOpacity: 0.55,
      atmosphereGlow: 1.0,
      starDensity: 0.8,
      nightLights: true,
    },
  };
}
