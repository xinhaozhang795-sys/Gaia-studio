import type { Engine, GaiaState, ClimateState } from '../types';
import { ASTRONOMICAL } from '../UnitSystem';

/**
 * ClimateEngine — energy-balance model.
 *
 * The `rendering.sunIntensity` parameter is a dimensionless multiplier of the
 * solar constant. From it we derive:
 *
 *   • effectiveSolarConstant = S₀ × sunIntensity
 *   • absorbedEnergy         = S_eff (1 − α) / 4
 *   • equilibriumTemp        = [ absorbed / σ ]^¼  +  ΔT_greenhouse
 *   • globalMeanTemp         relaxes toward equilibriumTemp (ocean inertia)
 *   • outgoingLongwave       = σ T⁴
 *   • energyImbalance        = absorbed − OLR
 *   • hadleyCells            scales with rotation rate (faster spin → more cells)
 *   • iceMeltTendency        = positive when warming, negative when cooling
 *   • oceanTempTendency      = energyImbalance / oceanHeatCapacity
 *
 * Coriolis coupling (from PlanetPhysicsEngine) reshapes the Hadley cell count:
 * a faster-spinning planet has a smaller Rossby radius and more cells.
 */
export class ClimateEngine implements Engine<ClimateState> {
  readonly id = 'climate';
  readonly dependencies = ['atmosphere', 'ocean', 'planet'] as const;

  update(state: GaiaState, dt: number): ClimateState {
    const c = state.climate;
    const atm = state.atmosphere;
    const ocean = state.ocean;
    const sunIntensity = state.rendering.sunIntensity;

    // ── Solar input driven by the sunIntensity parameter ────────────────────
    const S = ASTRONOMICAL.SOLAR_CONSTANT * sunIntensity;
    const alpha = atm.albedo * 0.6 + c.planetaryAlbedo * 0.4;
    const absorbed = S * (1 - alpha) / 4;
    const sigma = ASTRONOMICAL.STEFAN_BOLTZMANN;

    const equilibriumTemp = Math.pow(absorbed / sigma, 0.25) + atm.greenhouseEffect;

    // ── Damped relaxation toward equilibrium (ocean thermal inertia) ────────
    const tau = 10 * 365 * 86400; // 10-year e-folding
    const relax = 1 - Math.exp(-dt / tau);
    const globalMeanTemp = c.globalMeanTemp + (equilibriumTemp - c.globalMeanTemp) * relax;

    const olr = sigma * Math.pow(globalMeanTemp, 4);
    const imbalance = absorbed - olr;

    // ── Hadley cell count: scales with angular velocity ─────────────────────
    // Real Earth: 3 cells per hemisphere. Faster spin → more, narrower cells.
    const earthOmega = (Math.PI * 2) / ASTRONOMICAL.SIDEREAL_DAY_S;
    const omegaRatio = state.planet.angularVelocity / earthOmega;
    const hadleyCells = Math.max(1, Math.round(3 * Math.pow(Math.max(0.01, omegaRatio), 0.5)));

    // ── Equator-pole gradient: widens with ice, narrows with warming ────────
    const gradient = c.equatorPoleGradient + (state.hydrology.iceFraction - 0.1) * 20;

    // ── Ice melt tendency: positive (melting) when temp rises above freezing ─
    const iceMeltTendency = globalMeanTemp > 273.15
      ? (globalMeanTemp - 273.15) * 0.01
      : (globalMeanTemp - 273.15) * 0.005; // negative → freezing tendency

    // ── Ocean temperature tendency: K/year from the energy imbalance ───────
    // P = E×A / heatCapacity → dT/dt. Convert to K/year for readability.
    const oceanTempTendency = (imbalance * 365 * 86400) / ocean.heatCapacity;

    return {
      ...c,
      globalMeanTemp,
      solarConstant: S,
      effectiveSolarConstant: S,
      absorbedEnergy: absorbed,
      equilibriumTemp,
      outgoingLongwave: olr,
      energyImbalance: imbalance,
      equatorPoleGradient: gradient,
      hadleyCells,
      planetaryAlbedo: alpha,
      iceMeltTendency,
      oceanTempTendency,
    };
  }
}
