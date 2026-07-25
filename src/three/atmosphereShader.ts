import * as THREE from 'three';

/**
 * Atmosphere — Sprint 3 (lighting rework)
 * Two shells, both using world-space normals so the glow is fixed relative
 * to the Sun and never rotates with the camera.
 *
 *   Outer (BackSide, additive): Rayleigh blue limb glow.
 *   Inner (FrontSide, normal):  subtle day-sky brightening + orange sunset band.
 */

// ── Outer limb glow (BackSide additive — the blue "halo") ───────────────────
const outerVert = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main(){
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp      = modelMatrix * vec4(position, 1.0);
    vWorldPos    = wp.xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const outerFrag = /* glsl */ `
  precision mediump float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  uniform float uGlow;
  uniform vec3  uSunDir;

  void main(){
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uSunDir);

    // World-space view direction (camera → fragment).
    // On BackSide the visible faces point inward, so we flip the normal
    // for the rim calc — the rim is strongest where the surface grazes
    // the view ray regardless of which side we render.
    vec3 V = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - abs(dot(N, V));
    rim = pow(clamp(rim, 0.0, 1.0), 1.8);

    // Sun-facing factor
    float sun = max(dot(N, L), 0.0);

    // Rayleigh blue base
    vec3 blueDay   = vec3(0.18, 0.48, 1.0);
    // Orange sunset at the terminator band
    float termBand = smoothstep(0.0, 0.5, sun) * (1.0 - smoothstep(0.3, 0.9, sun));
    vec3  sunsetCol= vec3(1.0, 0.42, 0.08);

    vec3 col = mix(blueDay, sunsetCol, termBand * 0.75);
    // day-side brighter, night-side fades almost to nothing
    float dayFade = smoothstep(-0.25, 0.4, dot(N, L));
    col *= dayFade * 0.9 + 0.07;

    gl_FragColor = vec4(col, rim * uGlow * 0.72);
  }
`;

// ── Inner sky tint (FrontSide normal blend — very faint) ────────────────────
const innerVert = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main(){
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp      = modelMatrix * vec4(position, 1.0);
    vWorldPos    = wp.xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const innerFrag = /* glsl */ `
  precision mediump float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  uniform vec3  uSunDir;
  uniform float uGlow;

  void main(){
    vec3 N      = normalize(vWorldNormal);
    vec3 L      = normalize(uSunDir);
    vec3 V      = normalize(cameraPosition - vWorldPos);
    float NdotL = dot(N, L);
    float dayAmt= smoothstep(-0.1, 0.25, NdotL);

    // Fresnel: near-grazing = more visible
    float fres  = pow(1.0 - max(dot(N, V), 0.0), 3.5);

    // Sunset band — orange near terminator
    float termBand = (1.0 - smoothstep(0.0, 0.3, NdotL)) * dayAmt;
    vec3  sunsetHue= vec3(1.0, 0.5, 0.1);
    vec3  blueHue  = vec3(0.2, 0.55, 1.0);
    vec3  col      = mix(blueHue, sunsetHue, termBand);

    gl_FragColor = vec4(col, fres * dayAmt * uGlow * 0.18);
  }
`;

// ─── Factory ─────────────────────────────────────────────────────────────────

import { SUN_DIRECTION } from '@/three/orbital';

export interface AtmosphereMaterials {
  outer: THREE.ShaderMaterial;
  inner: THREE.ShaderMaterial;
}

export function createAtmosphereMaterials(): AtmosphereMaterials {
  const sharedUniforms = () => ({
    uGlow:   { value: 1.0 },
    uSunDir: { value: SUN_DIRECTION.clone() },
  });

  const outer = new THREE.ShaderMaterial({
    vertexShader:   outerVert,
    fragmentShader: outerFrag,
    uniforms: sharedUniforms(),
    transparent: true,
    blending:    THREE.AdditiveBlending,
    side:        THREE.BackSide,
    depthWrite:  false,
  });

  const inner = new THREE.ShaderMaterial({
    vertexShader:   innerVert,
    fragmentShader: innerFrag,
    uniforms: sharedUniforms(),
    transparent: true,
    blending:    THREE.NormalBlending,
    side:        THREE.FrontSide,
    depthWrite:  false,
  });

  return { outer, inner };
}

// Keep old single-material export so nothing breaks if imported elsewhere.
export function createAtmosphereMaterial(): THREE.ShaderMaterial {
  return createAtmosphereMaterials().outer;
}
