import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useStudio } from '@/store/useStudio';
import { SUN_DISTANCE } from '@/three/orbital';
import { sim } from '@/simulation';
import { useT } from '@/i18n';

// A reusable target object the DirectionalLight always points at (Earth origin).
const EARTH_ORIGIN = new THREE.Object3D();

const _sunPos = new THREE.Vector3();
const _sunDir = new THREE.Vector3();

function CoronaRing({ position, scale, opacity }: { position: THREE.Vector3; scale: number; opacity: number }) {
  return (
    <mesh scale={scale} position={position.toArray()}>
      <ringGeometry args={[0.55, 0.72, 64]} />
      <meshBasicMaterial
        color={0xffeebb}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function Sun() {
  const t            = useT();
  const lightRef     = useRef<THREE.DirectionalLight>(null);
  const sunIntensity = useStudio((s) => s.gaia.rendering.sunIntensity);

  useFrame(() => {
    // Read the LIVE simulation state — sun position is derived from simTime.
    const snap = sim.state.read();
    const planet = snap.planet;

    _sunDir.set(planet.sunDirectionX, planet.sunDirectionY, planet.sunDirectionZ).normalize();
    _sunPos.copy(_sunDir).multiplyScalar(SUN_DISTANCE);

    if (lightRef.current) {
      lightRef.current.position.copy(_sunPos);
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
      lightRef.current.intensity = sunIntensity * 0.6;
    }
  });

  // For the visible sun mesh position we read from the live state too.
  // We use a ref-based approach to update mesh position each frame.
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const corona1Ref = useRef<THREE.Mesh>(null);
  const corona2Ref = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const htmlRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const snap = sim.state.read();
    const planet = snap.planet;
    _sunDir.set(planet.sunDirectionX, planet.sunDirectionY, planet.sunDirectionZ).normalize();
    _sunPos.copy(_sunDir).multiplyScalar(SUN_DISTANCE);

    if (sunMeshRef.current) sunMeshRef.current.position.copy(_sunPos);
    if (corona1Ref.current) corona1Ref.current.position.copy(_sunPos);
    if (corona2Ref.current) corona2Ref.current.position.copy(_sunPos);
    if (pointLightRef.current) pointLightRef.current.position.copy(_sunPos);
    if (htmlRef.current) {
      htmlRef.current.style.transform = `translate(-50%, -50%)`;
    }
  });

  return (
    <>
      {/* Target the DirectionalLight explicitly at Earth centre (0,0,0) */}
      <primitive object={EARTH_ORIGIN} position={[0, 0, 0]} />

      {/* Main directional light — position updated each frame from sim state */}
      <directionalLight
        ref={lightRef}
        color={0xfff8e8}
        intensity={sunIntensity * 0.6}
        castShadow={false}
      />

      {/* Visible sun disk */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color={0xfffce0} />
      </mesh>

      {/* Inner corona glow */}
      <mesh ref={corona1Ref}>
        <sphereGeometry args={[0.46, 24, 24]} />
        <meshBasicMaterial
          color={0xffe880}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light for gentle scene fill near sun */}
      <pointLight
        ref={pointLightRef}
        color={0xfff4d0}
        intensity={sunIntensity * 0.4}
        distance={50}
        decay={1.5}
      />

      {/* Label — position updated via parent group */}
      <group ref={(g) => {
        if (g) {
          const snap = sim.state.read();
          const p = snap.planet;
          _sunDir.set(p.sunDirectionX, p.sunDirectionY, p.sunDirectionZ).normalize();
          _sunPos.copy(_sunDir).multiplyScalar(SUN_DISTANCE);
          g.position.copy(_sunPos);
        }
      }}>
        <Html
          center
          distanceFactor={14}
          zIndexRange={[10, 0]}
          occlude={false}
        >
          <div className="pointer-events-none select-none whitespace-nowrap rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium tracking-widest text-yellow-200/75 backdrop-blur-sm">
            {t.sunLabel}
          </div>
        </Html>
      </group>
    </>
  );
}
