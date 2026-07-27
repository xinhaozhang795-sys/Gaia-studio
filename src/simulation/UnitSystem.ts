/**
 * UnitSystem — physical constants and unit conversions used by every engine.
 * Centralising these prevents the silent unit-mismatch bugs that plague
 * geophysical models (e.g. W/m² vs W/cm², years vs seconds).
 */

export const SECONDS = {
  perMinute: 60,
  perHour: 3_600,
  perDay: 86_400,
  perMonth: 2_629_800, // Julian month = 365.25/12 days
  perYear: 31_557_600, // Julian year = 365.25 days
} as const;

export const ASTRONOMICAL = {
  EARTH_RADIUS_M: 6_371_000,
  EARTH_RADIUS_POLAR_M: 6_356_752,
  EARTH_MASS_KG: 5.972e24,
  EARTH_GRAVITY: 9.80665,
  SOLAR_CONSTANT: 1361, // W/m² at 1 AU
  EARTH_AXIAL_TILT_RAD: 0.4090928, // 23.44°
  SIDEREAL_DAY_S: 86_164.0905,
  SOLAR_DAY_S: 86_400,
  AU_M: 1.495978707e11,
  STEFAN_BOLTZMANN: 5.670374419e-8,
  GRAVITATIONAL_CONSTANT: 6.67430e-11, // N·m²/kg²
} as const;

export const ATMOSPHERE = {
  SURFACE_PRESSURE_PA: 101_325,
  MEAN_MOLAR_MASS: 0.0289644,
  COMPOSITION_N2: 0.7808,
  COMPOSITION_O2: 0.2095,
  COMPOSITION_AR: 0.0093,
  COMPOSITION_CO2: 0.00042,
  COMPOSITION_H2O: 0.01,
  BOND_ALBEDO: 0.306,
  GREENHOUSE_K: 33, // K of warming above blackbody
} as const;

export const OCEAN = {
  COVERAGE: 0.708,
  MEAN_DEPTH_M: 3682,
  SALINITY_PSU: 35,
  MEAN_TEMP_K: 288.5,
} as const;

/** Convert a ClockPreset into simulated-seconds per real-second. */
export function presetToScale(preset: string): number {
  switch (preset) {
    case '1x':    return 1;              // realtime — 1 sim sec / real sec
    case '10x':   return 10;             // 10 sim sec / real sec
    case '24x':   return 24 * 3600;     // 1 simulated day per real hour
    case '100x':  return 100;            // 100 sim sec / real sec
    case '365x':  return 365 * 86400;   // 1 simulated year per real day
    case '1000x': return 1000 * 86400;  // fast scientific simulation
    default:      return 1;
  }
}
