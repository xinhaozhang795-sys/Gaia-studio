/**
 * MantleEngine — generates the initial mantle convection state from PlanetDNA.
 *
 * Computes:
 *   • Convection cells (spherical Fibonacci distribution)
 *   • Surface heat flux map (mean + spatial variance)
 *   • Mantle plume positions (upwelling columns)
 *   • Lithosphere thickness (from age and cooling rate)
 *   • Total internal heat energy
 *   • Rayleigh number (convection vigor)
 *
 * All values are physically motivated:
 *   - Rayleigh number Ra = (g·α·ΔT·d³) / (κ·ν)
 *   - Heat flux scales with planetary mass and inverse age
 *   - Lithosphere thickens as the planet cools (sqrt-age law)
 *
 * Deterministic: same DNA → same MantleState.
 */

import type { PlanetDNA } from '../PlanetDNA';
import { RandomEngine } from '../RandomEngine';
import { ASTRONOMICAL } from '../../UnitSystem';
import type { MantleState, ConvectionCell, MantlePlume } from './types';

// ── Physical constants for mantle convection ───────────────────────────────────

const THERMAL_EXPANSION   = 3e-5;     // α, 1/K (mantle rock)
const THERMAL_DIFFUSIVITY = 1e-6;     // κ, m²/s
const DYNAMIC_VISCOSITY   = 1e21;     // ν, Pa·s (mantle rock)
const MANTLE_THICKNESS_FRAC = 0.45;   // mantle = ~45% of planetary radius
const CORE_TEMP_DIFF      = 1500;     // ΔT across mantle, K (approximate)
const EARTH_HEAT_FLUX     = 0.087;    // W/m² (Earth mean)

/** Fibonacci sphere distribution: N points approximately equidistant on a sphere. */
function fibonacciSphere(n: number): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2; // 1 → -1
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const lat = Math.asin(y); // -π/2..π/2
    const lon = theta % (Math.PI * 2); // 0..2π
    points.push({ lat, lon });
  }
  return points;
}

export function generateMantleState(dna: PlanetDNA): MantleState {
  const rng = new RandomEngine(dna.seedHash ^ 0x4d414e54); // "MANT"

  // ── Mantle thickness ──────────────────────────────────────────────────────
  const mantleThickness = dna.radius * MANTLE_THICKNESS_FRAC;

  // ── Rayleigh number ────────────────────────────────────────────────────────
  // Ra = (g · α · ΔT · d³) / (κ · ν)
  // For non-Earth planets, scale relative to Earth's Ra (~1e7).
  const earthRa = 1e7;
  const gravityRatio = dna.gravity / ASTRONOMICAL.EARTH_GRAVITY;
  const tempRatio = (dna.coreTemperature - dna.mantleTemperature) / CORE_TEMP_DIFF;
  const thicknessRatio = mantleThickness / (ASTRONOMICAL.EARTH_RADIUS_M * MANTLE_THICKNESS_FRAC);
  const rayleighNumber = earthRa * gravityRatio * tempRatio * thicknessRatio ** 3;

  // ── Internal heat energy ───────────────────────────────────────────────────
  // Heat decays with age (radioactive decay + secular cooling).
  // Younger planets have more heat. We scale from DNA's mantleEnergy field.
  const ageGyr = dna.age / 1000; // convert Myr to Gyr
  const heatRetention = Math.exp(-ageGyr * 0.15); // exponential cooling
  const internalHeat = dna.mantleEnergy * heatRetention;

  // ── Mean surface heat flux ─────────────────────────────────────────────────
  // Earth: ~0.087 W/m². Scale with internal heat / surface area.
  const surfaceArea = 4 * Math.PI * dna.radius * dna.radius;
  const meanHeatFlux = (internalHeat / (surfaceArea * 4.5e9)) || EARTH_HEAT_FLUX;
  // 4.5 Gyr integration time (Earth's age); for other planets use age
  const integrationTime = ageGyr * 1e9 * 31_557_600; // seconds
  const heatFluxScaled = internalHeat / (surfaceArea * Math.max(integrationTime, 1));
  const finalHeatFlux = Math.max(0.01, Math.min(5.0, heatFluxScaled));

  // ── Heat flux spatial variability ──────────────────────────────────────────
  // Supersuperadiabatic planets (high Ra) → more variable heat flux.
  const heatFluxStd = finalHeatFlux * (0.3 + 0.7 * Math.min(rayleighNumber / 1e8, 1));

  // ── Convection cells ───────────────────────────────────────────────────────
  // Number of cells scales with Ra (more vigorous convection → more cells).
  const cellCount = Math.max(4, Math.min(20, Math.floor(rayleighNumber / 5e5)));
  const cellPoints = fibonacciSphere(cellCount);
  const convectionCells: ConvectionCell[] = cellPoints.map((p, i) => {
    // Alternate upwelling/downwelling; bias by RNG for asymmetry
    const isUp = (i % 2 === 0) ? (rng.nextFloat() > 0.2) : (rng.nextFloat() > 0.8);
    const flowDirection: 1 | -1 = isUp ? 1 : -1;
    const velocity = rng.nextFloatRange(1e-10, 1e-8) * (rayleighNumber / 1e7);
    // Upwellings carry more heat
    const cellHeatFlux = finalHeatFlux * (flowDirection === 1
      ? rng.nextFloatRange(1.2, 2.5)
      : rng.nextFloatRange(0.3, 0.8));
    return {
      id: i,
      latitude: p.lat,
      longitude: p.lon,
      angularRadius: Math.PI / Math.sqrt(cellCount),
      flowDirection,
      velocity,
      heatFlux: cellHeatFlux,
    };
  });

  // ── Mantle plumes ──────────────────────────────────────────────────────────
  // Number of plumes scales with mantle energy and inversely with age.
  // Earth has ~20 major plumes. Young/hot planets have more.
  const plumeCount = Math.max(2, Math.min(30, Math.floor(
    20 * (dna.mantleEnergy / (ASTRONOMICAL.EARTH_MASS_KG * 2e-7)) * heatRetention,
  )));
  const plumePoints = fibonacciSphere(plumeCount);
  const plumes: MantlePlume[] = plumePoints.map((p, i) => ({
    id: i,
    latitude: p.lat,
    longitude: p.lon,
    sourceRadius: rng.nextFloatRange(200, 800), // km at CMB
    temperatureAnomaly: rng.nextFloatRange(200, 600), // K above ambient
    buoyancyFlux: rng.nextFloatRange(1, 50), // Mg/s
  }));

  // ── Lithosphere thickness ──────────────────────────────────────────────────
  // Lithosphere thickens as √(age) (half-space cooling model).
  // Earth: ~100 km at 4.5 Gyr. Younger planets → thinner lithosphere.
  const earthLitho = 100; // km
  const lithosphereThickness = earthLitho * Math.sqrt(ageGyr / 4.5) * gravityRatio ** (-0.3);

  // ── Core-mantle boundary heat flux ─────────────────────────────────────────
  const cmbHeatFlux = finalHeatFlux * rng.nextFloatRange(2, 5); // CMB flux > surface

  return {
    convectionCells,
    meanHeatFlux: finalHeatFlux,
    heatFluxStd,
    plumes,
    lithosphereThickness,
    internalHeat,
    rayleighNumber,
    cmbHeatFlux,
  };
}
