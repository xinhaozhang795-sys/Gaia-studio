import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudio } from '@/store/useStudio';
import { sim } from '@/simulation';

/**
 * Stars — Sprint 2
 * 12 000 stars, per-star twinkle phase, five colour-temperature classes,
 * hardware-responsive point-size clamping.
 */
export function Stars() {
  const ref = useRef<THREE.Points>(null);
  const starDensity = useStudio((s) => s.starDensity);
  const isMobile    = useStudio((s) => s.isMobile);

  // Rebuild geometry when density slider changes
  const { geo, mat } = useMemo(() => {
    // Mobile gets fewer stars to stay at 60 fps
    const maxStars = isMobile ? 6000 : 12000;
    const count    = Math.floor(maxStars * Math.max(0.1, starDensity));

    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const colors    = new Float32Array(count * 3);
    const phases    = new Float32Array(count);   // per-star twinkle phase

    for (let i = 0; i < count; i++) {
      // Uniform spherical distribution
      const u     = Math.random();
      const v     = Math.random();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      const r     = 65 + Math.random() * 45;

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Realistic star-size distribution: most tiny, a few large
      const sizeFactor = Math.pow(Math.random(), 2.2);
      sizes[i] = sizeFactor * 2.2 + 0.25;

      // Per-star independent twinkle phase (0..2π)
      phases[i] = Math.random() * Math.PI * 2;

      // Colour temperature classes (approximate OBAFGKM spectral types)
      const cls = Math.random();
      if (cls < 0.04) {
        // O/B — hot blue
        colors[i * 3] = 0.65; colors[i * 3 + 1] = 0.78; colors[i * 3 + 2] = 1.0;
      } else if (cls < 0.12) {
        // A — blue-white
        colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.90; colors[i * 3 + 2] = 1.0;
      } else if (cls < 0.40) {
        // F/G — white / warm white
        colors[i * 3] = 1.0;  colors[i * 3 + 1] = 1.0;  colors[i * 3 + 2] = 0.96;
      } else if (cls < 0.72) {
        // G/K — yellow
        colors[i * 3] = 1.0;  colors[i * 3 + 1] = 0.93; colors[i * 3 + 2] = 0.72;
      } else {
        // K/M — orange-red
        colors[i * 3] = 1.0;  colors[i * 3 + 1] = 0.72; colors[i * 3 + 2] = 0.45;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute vec3  aColor;
        attribute float aPhase;
        varying   vec3  vColor;
        varying   float vAlpha;
        uniform   float uTime;

        void main(){
          vColor = aColor;

          // Twinkle: each star oscillates at a slightly different frequency
          float twinkle = 0.72 + 0.28 * sin(uTime * 1.8 + aPhase)
                               * cos(uTime * 0.9 + aPhase * 1.7);
          vAlpha = twinkle;

          vec4 mv = modelViewMatrix * vec4(position, 1.0);

          // Clamp point size so it looks reasonable across DPR/screen sizes
          float ps = aSize * twinkle * (280.0 / -mv.z);
          gl_PointSize = clamp(ps, 0.4, 4.5);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3  vColor;
        varying float vAlpha;

        void main(){
          // Soft circular point sprite
          vec2  ctr = gl_PointCoord - 0.5;
          float d   = dot(ctr, ctr) * 4.0;   // 0 centre → 1 edge
          if(d > 1.0) discard;

          // Gaussian-ish falloff for star glow
          float a = exp(-d * 3.5) * vAlpha;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    return { geo: geometry, mat: material };
  }, [starDensity, isMobile]);

  useFrame((_, delta) => {
    // Twinkle and drift follow the simulation clock — freeze when paused.
    const snap = sim.state.read();
    if (snap.simulation.running) {
      mat.uniforms.uTime.value += delta;
      // Very slow drift to give life
      if (ref.current) ref.current.rotation.y += delta * 0.003;
    }
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}
