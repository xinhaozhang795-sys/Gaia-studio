/**
 * Spherical math utilities — shared helpers for plate motion on a sphere.
 *
 * All functions work in radians:
 *   latitude  ∈ [-π/2, π/2]
 *   longitude ∈ [0, 2π)
 *   direction ∈ [0, 2π)  (0 = north, π/2 = east)
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export function angularDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function heading(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
}

export function moveOnSphere(
  lat: number, lon: number,
  dir: number, angularDist: number,
): LatLon {
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinDist = Math.sin(angularDist);
  const cosDist = Math.cos(angularDist);

  const newLat = Math.asin(
    sinLat * cosDist + cosLat * sinDist * Math.cos(dir),
  );

  const dLon = Math.atan2(
    Math.sin(dir) * sinDist * cosLat,
    cosDist - sinLat * Math.sin(newLat),
  );

  let newLon = lon + dLon;
  newLon = ((newLon % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  const clampedLat = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newLat));

  return { lat: clampedLat, lon: newLon };
}

export function sphericalCentroid(points: LatLon[]): LatLon {
  if (points.length === 0) return { lat: 0, lon: 0 };
  let x = 0, y = 0, z = 0;
  for (const p of points) {
    x += Math.cos(p.lat) * Math.cos(p.lon);
    y += Math.cos(p.lat) * Math.sin(p.lon);
    z += Math.sin(p.lat);
  }
  const n = points.length;
  x /= n; y /= n; z /= n;
  return {
    lat: Math.asin(Math.max(-1, Math.min(1, z / Math.sqrt(x * x + y * y + z * z)))),
    lon: Math.atan2(y, x),
  };
}

export function midpoint(a: LatLon, b: LatLon): LatLon {
  return sphericalCentroid([a, b]);
}

export function velocityToAngular(
  velocityCmPerYear: number,
  planetRadiusM: number,
): number {
  return velocityCmPerYear / (planetRadiusM * 100);
}
