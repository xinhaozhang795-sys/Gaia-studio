import type { Engine, GaiaState, PlanetState } from '../types';
import { ASTRONOMICAL } from '../UnitSystem';

/**
 * PlanetPhysicsEngine — rigid-body rotation + derived dynamical quantities.
 *
 * The `rendering.rotationSpeed` parameter is a dimensionless multiplier of
 * Earth's nominal sidereal rotation rate. From it we derive:
 *
 *   • effective rotationPeriod   = siderealDay / rotationSpeed
 *   • angularVelocity            = 2π / rotationPeriod
 *   • dayLengthHours             = rotationPeriod adjusted to solar day
 *   • coriolis45                 = 2Ω sin(45°)   (first-order Coriolis parameter)
 *   • gravityEquator             = g − Ω²R       (centrifugal reduction at equator)
 *   • gravityPole                = g              (no centrifugal reduction at pole)
 *   • flattening                 = Ω²R / (2g)     (first-order hydrostatic flattening)
 *
 * The Earth's visible spin angle follows the angular velocity, so dragging the
 * slider immediately changes how fast the globe turns on screen.
 */
export class PlanetPhysicsEngine implements Engine<PlanetState> {
  readonly id = 'planet';
  readonly dependencies: readonly string[] = [];

  update(state: GaiaState, _dt: number): PlanetState {
    const p = state.planet;
    const simTime = state.simulation.simTime;
    const rotationSpeed = state.rendering.rotationSpeed;

    // ── Rotation period from the parameter ───────────────────────────────────
    // rotationSpeed = 1 → real sidereal day. Higher = faster spin = shorter day.
    const siderealDay = ASTRONOMICAL.SIDEREAL_DAY_S;
    const rotationPeriod = rotationSpeed > 0
      ? siderealDay / rotationSpeed
      : Infinity;

    const angularVelocity = rotationSpeed > 0
      ? (Math.PI * 2) / rotationPeriod
      : 0;

    // Solar day ≈ sidereal day × (1 + 1/365) at default; scales with rotationSpeed
    const solarDay = rotationPeriod > 0 && rotationPeriod < Infinity
      ? rotationPeriod * (1 + 1 / 365.25)
      : Infinity;
    const dayLengthHours = solarDay / 3600;

    // ── Coriolis parameter at 45° latitude: f = 2Ω sin(φ) ───────────────────
    const coriolis45 = 2 * angularVelocity * Math.sin(Math.PI / 4);

    // ── Effective gravity: centrifugal reduction at the equator ─────────────
    // g_eff = g − Ω²R cos²(lat); at equator cos(0)=1, at pole cos(90)=0.
    const R = p.radius;
    const centrifugal = angularVelocity * angularVelocity * R; // m/s² at equator
    const gravityEquator = p.gravity - centrifugal;
    const gravityPole = p.gravity;

    // ── Equatorial flattening (first-order hydrostatic theory) ──────────────
    // f ≈ Ω²R / (2g) — the ratio of centrifugal to gravitational acceleration.
    // Earth's real f ≈ 1/298 ≈ 0.0034 at default rotationSpeed = 1.
    const flattening = p.gravity > 0
      ? centrifugal / (2 * p.gravity)
      : 0;

    // ── Spin angle from simTime and the current angular velocity ────────────
    const spin = angularVelocity > 0
      ? (simTime / rotationPeriod) * Math.PI * 2
      : 0;

    // ── Sun direction: Earth orbits the Sun once per year ───────────────────
    const yearLen = 365.25 * 86400;
    const orbitalAngle = (simTime / yearLen) * Math.PI * 2;
    const sunX = Math.cos(orbitalAngle);
    const sunZ = Math.sin(orbitalAngle);
    const sunY = 0.18;
    const len = Math.sqrt(sunX * sunX + sunY * sunY + sunZ * sunZ);

    return {
      ...p,
      rotationPeriod,
      angularVelocity,
      dayLengthHours,
      coriolis45,
      gravityEquator,
      gravityPole,
      flattening,
      spinAngle: spin % (Math.PI * 2),
      sunDirectionX: sunX / len,
      sunDirectionY: sunY / len,
      sunDirectionZ: sunZ / len,
    };
  }
}
