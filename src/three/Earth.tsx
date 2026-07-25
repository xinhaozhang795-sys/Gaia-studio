import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createEarthMaterial, VIEW_MODE_INDEX } from '@/three/earthShader';
import { createCloudMaterial } from '@/three/cloudShader';
import { createAtmosphereMaterials } from '@/three/atmosphereShader';
import { AXIAL_TILT } from '@/three/orbital';
import { sim } from '@/simulation';
import { useStudio } from '@/store/useStudio';

// Reusable vector — avoids per-frame allocation.
const _sunDir = new THREE.Vector3();

/**
 * Earth — pure rendering. Reads GaiaState every frame from the live simulation
 * (NOT a stale React closure). Every animated value comes from simTime:
 *
 *   • Earth spin   ← planet.spinAngle     ← simTime
 *   • Cloud drift  ← planet.spinAngle     ← simTime
 *   • Sun direction← planet.sunDirection  ← simTime
 *   • Shader uTime ← simulation.simTime   (frozen when paused)
 *
 * No real-time `delta` is used for any simulation-driven motion. `delta` is
 * only used for purely cosmetic shader wave detail that is meaningless when
 * paused — but we gate it on simRunning too for correctness.
 */
export function Earth() {
  const tiltRef  = useRef<THREE.Group>(null);
  const spinRef  = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const earthMat = useMemo(() => createEarthMaterial(), []);
  const cloudMat = useMemo(() => createCloudMaterial(), []);
  const { outer: atmoOuter, inner: atmoInner } = useMemo(() => createAtmosphereMaterials(), []);

  const isMobile = useStudio((s) => s.isMobile);

  const earthSegs = isMobile ? 96 : 128;
  const cloudSegs = isMobile ? 72 : 96;
  const atmoSegs  = isMobile ? 48 : 64;

  // Apply axial tilt once.
  useMemo(() => {
    if (tiltRef.current) tiltRef.current.rotation.z = AXIAL_TILT;
  }, []);

  useFrame((_, delta) => {
    // Read the LIVE simulation state — never a stale React snapshot.
    const snap = sim.state.read();
    const { rendering, simulation, planet } = snap;
    const running = simulation.running;

    // ── Earth spin — from simTime via PlanetPhysicsEngine ────────────────────
    if (spinRef.current) {
      spinRef.current.rotation.y = planet.spinAngle;
    }

    // ── Equatorial flattening — scale Y down by (1 − flattening) ───────────
    // flattening > 0 → oblate spheroid (equator wider than poles).
    if (spinRef.current) {
      spinRef.current.scale.set(1, 1 - planet.flattening, 1);
    }

    // ── Clouds — locked to Earth rotation + a slow drift driven by simTime ──
    // The drift is a fraction of the spin angle, so it freezes when paused.
    if (cloudRef.current) {
      cloudRef.current.rotation.y = planet.spinAngle + planet.spinAngle * 0.03;
    }

    // ── Sun direction — from planet state (derived from simTime) ────────────
    _sunDir.set(planet.sunDirectionX, planet.sunDirectionY, planet.sunDirectionZ).normalize();

    // ── Shader uniforms (display only) ───────────────────────────────────────
    // uTime advances ONLY when the simulation is running. When paused, waves
    // and cloud detail freeze — nothing animates independently.
    if (running) {
      const simDt = delta * 1; // visual shader detail follows real frames while running
      earthMat.uniforms.uTime.value += simDt;
      cloudMat.uniforms.uTime.value += simDt;
    }

    earthMat.uniforms.uSunDir.value.copy(_sunDir);
    earthMat.uniforms.uSunIntensity.value = rendering.sunIntensity;
    earthMat.uniforms.uViewMode.value     = VIEW_MODE_INDEX[rendering.viewMode];
    earthMat.uniforms.uNightLights.value  = rendering.layers.nightLights ? 1.0 : 0.0;
    earthMat.uniforms.uCloudShadow.value  = rendering.layers.clouds ? rendering.cloudOpacity * 0.8 : 0.0;

    cloudMat.uniforms.uSunDir.value.copy(_sunDir);
    cloudMat.uniforms.uOpacity.value = rendering.layers.clouds ? rendering.cloudOpacity * 1.3 : 0.0;

    const glowVal = rendering.atmosphereGlow;
    atmoOuter.uniforms.uSunDir.value.copy(_sunDir);
    atmoOuter.uniforms.uGlow.value  = glowVal;
    atmoInner.uniforms.uSunDir.value.copy(_sunDir);
    atmoInner.uniforms.uGlow.value  = glowVal;
  });

  // For show/hide layers we can still use the React snapshot.
  const showAtmo   = useStudio((s) => s.layers.atmosphere);
  const showClouds = useStudio((s) => s.layers.clouds);

  return (
    <>
      {/* Tilted Earth system (spin only) */}
      <group ref={tiltRef}>
        <group ref={spinRef}>
          {/* Earth surface */}
          <mesh material={earthMat}>
            <sphereGeometry args={[1, earthSegs, earthSegs]} />
          </mesh>

          {/* Cloud layer */}
          {showClouds && (
            <mesh ref={cloudRef} material={cloudMat} scale={1.011}>
              <sphereGeometry args={[1, cloudSegs, cloudSegs]} />
            </mesh>
          )}
        </group>
      </group>

      {/* Atmosphere — outside the spin group */}
      {showAtmo && (
        <mesh material={atmoOuter} scale={1.18}>
          <sphereGeometry args={[1, atmoSegs, atmoSegs]} />
        </mesh>
      )}
      {showAtmo && (
        <mesh material={atmoInner} scale={1.08}>
          <sphereGeometry args={[1, atmoSegs, atmoSegs]} />
        </mesh>
      )}
    </>
  );
}
