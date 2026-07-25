import * as THREE from 'three';

/**
 * Orbital system — shared constants for the Sun-Earth lighting model.
 *
 * Architecture:
 *   Sun (fixed world position)
 *     → DirectionalLight aimed at Earth origin
 *       → Earth rotates on its own axis (timeOfDay)
 *         → Day/Night terminator
 *
 * The Sun never moves relative to the scene. The ONLY thing that shifts the
 * day/night boundary is the Earth's rotation angle (`timeOfDay` → rotation.y).
 */

// Fixed world-space direction the sunlight travels (normalized).
// The Sun sphere is placed along this vector; the DirectionalLight points
// from the Sun position back toward the Earth origin (0,0,0).
export const SUN_DIRECTION = new THREE.Vector3(1.0, 0.18, 0.55).normalize();

// Sun distance from Earth centre (scene units, Earth radius = 1).
export const SUN_DISTANCE = 14;

// Fixed world-space position of the visible Sun sphere.
export const SUN_POSITION = SUN_DIRECTION.clone().multiplyScalar(SUN_DISTANCE);

// Earth axial tilt (~23.44°) applied around the Z axis, then rotation
// happens around the tilted Y axis. This is the geometry real seasons use.
export const AXIAL_TILT = THREE.MathUtils.degToRad(23.44);

// Tilted rotation axis (unit vector) — the axis the Earth spins around.
export const EARTH_AXIS = new THREE.Vector3(
  Math.sin(AXIAL_TILT),
  Math.cos(AXIAL_TILT),
  0,
).normalize();
