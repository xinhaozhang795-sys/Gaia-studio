import { useMemo } from 'react';
import * as THREE from 'three';

/** A wireframe lat/long graticule sphere for the "grid" layer. */
export function CoordinateGrid() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.005, 36, 18);
    return new THREE.WireframeGeometry(geo);
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x0a84ff,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    [],
  );

  return <lineSegments geometry={geometry} material={material} />;
}

/** A thin glowing equatorial ring + axis pole markers. */
export function AxisMarkers() {
  return (
    <group>
      {/* equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.04, 0.002, 8, 128]} />
        <meshBasicMaterial color={0x30d158} transparent opacity={0.5} />
      </mesh>
      {/* polar axis line */}
      <mesh>
        <cylinderGeometry args={[0.003, 0.003, 2.4, 8]} />
        <meshBasicMaterial color={0xffd60a} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
