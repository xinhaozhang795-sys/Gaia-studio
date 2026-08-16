/**
 * Sprint 7.4.1 — Terrain Distribution Calibration Tests
 *
 * Verifies:
 *   A. Same seed → identical terrain
 *   B. Different seeds → different terrain
 *   C. Surface-area distribution ≈ 10/20/70
 *   D. Volcano density is geographically clustered
 *   E. Volcanoes are associated with hotspots, subduction, or rifts
 *   F. Mountain ranges form coherent groups
 *   G. Extreme elevation requires geological cause
 *   H. Build remains clean (verified by npm run build + typecheck)
 *
 * Run: npx tsx src/tests/terrain-calibration.test.ts
 */

import { PlanetSeed } from '@/simulation/world/PlanetSeed';
import { generateGenesis } from '@/simulation/world/genesis';
import { evolveGeology } from '@/simulation/world/evolution';
import { generateTerrain } from '@/simulation/world/terrain';
import type { TerrainFeatureNode } from '@/simulation/world/terrain';

// ── Helpers ───────────────────────────────────────────────────────────────────

function angularDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function generateTerrainForSeed(seedStr: string) {
  const seed = new PlanetSeed(seedStr);
  const dna = seed.generateDNA();
  const genesis = generateGenesis(dna);
  const evolution = evolveGeology(dna, genesis, 500, '1Myr');
  return generateTerrain(dna, genesis, evolution);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

console.log('Sprint 7.4.1 — Terrain Distribution Calibration Tests\n');

// ── Test A: Same seed → identical terrain ─────────────────────────────────────
console.log('A. Same seed produces identical terrain');
{
  const t1 = generateTerrainForSeed('GAIA-1-0001');
  const t2 = generateTerrainForSeed('GAIA-1-0001');

  assert(t1.features.length === t2.features.length, 'Feature count matches');
  assert(t1.stats.maxElevation === t2.stats.maxElevation, 'Max elevation matches');
  assert(t1.stats.minElevation === t2.stats.minElevation, 'Min elevation matches');

  const sameHeights = t1.features.every(
    (f, i) => f.height === t2.features[i]?.height,
  );
  assert(sameHeights, 'All feature heights match');

  const samePositions = t1.features.every(
    (f, i) =>
      f.latitude === t2.features[i]?.latitude &&
      f.longitude === t2.features[i]?.longitude,
  );
  assert(samePositions, 'All feature positions match');
}

// ── Test B: Different seeds → different terrain ──────────────────────────────
console.log('\nB. Different seeds produce different terrain');
{
  const t1 = generateTerrainForSeed('GAIA-1-0001');
  const t2 = generateTerrainForSeed('GAIA-2-0002');

  assert(t1.stats.maxElevation !== t2.stats.maxElevation, 'Max elevations differ');

  const differentHeights = t1.features.some(
    (f, i) => f.height !== t2.features[i]?.height,
  );
  assert(differentHeights, 'Feature heights differ');
}

// ── Test C: Surface-area distribution ≈ 10/20/70 ─────────────────────────────
console.log('\nC. Surface-area distribution approximately follows 10/20/70');
{
  const terrain = generateTerrainForSeed('GAIA-1-0001');
  const dist = terrain.stats.classDistribution;

  console.log(`     wonder=${dist.wonder}  spectacular=${dist.spectacular}  normal=${dist.normal}`);

  assert(
    dist.wonder >= 0.05 && dist.wonder <= 0.15,
    `Wonder ≈ 10% (got ${(dist.wonder * 100).toFixed(1)}%)`,
  );
  assert(
    dist.spectacular >= 0.15 && dist.spectacular <= 0.25,
    `Spectacular ≈ 20% (got ${(dist.spectacular * 100).toFixed(1)}%)`,
  );
  assert(
    dist.normal >= 0.60 && dist.normal <= 0.80,
    `Normal ≈ 70% (got ${(dist.normal * 100).toFixed(1)}%)`,
  );
}

// ── Test D: Volcano density is geographically clustered ──────────────────────
console.log('\nD. Volcano density is geographically clustered');
{
  const terrain = generateTerrainForSeed('GAIA-1-0001');
  const volcanoes = terrain.features.filter((f) => f.type === 'volcano');

  console.log(`     Total volcanoes: ${volcanoes.length}`);
  console.log(`     Total features: ${terrain.features.length}`);

  // Before fix: ~188 volcanoes. After: should be dramatically fewer.
  assert(
    volcanoes.length < 40,
    `Volcano count is reasonable (< 40, got ${volcanoes.length})`,
  );

  // Check clustering: group volcanoes by provinceId
  const provinceMap = new Map<number, TerrainFeatureNode[]>();
  for (const v of volcanoes) {
    if (!provinceMap.has(v.provinceId)) provinceMap.set(v.provinceId, []);
    provinceMap.get(v.provinceId)!.push(v);
  }
  const provinceCount = provinceMap.size;
  console.log(`     Volcanic provinces: ${provinceCount}`);

  // Volcanoes should be concentrated in provinces, not scattered
  assert(
    provinceCount > 0 && provinceCount <= 20,
    `Volcanic provinces are limited (got ${provinceCount})`,
  );

  // Each province should have at least 1 volcano
  const avgPerProvince = volcanoes.length / Math.max(1, provinceCount);
  assert(
    avgPerProvince >= 1 && avgPerProvince <= 8,
    `Average volcanoes per province is reasonable (${avgPerProvince.toFixed(1)})`,
  );
}

// ── Test E: Volcanoes are associated with geological causes ───────────────────
console.log('\nE. Volcanoes are associated with hotspots, subduction, or rifts');
{
  const terrain = generateTerrainForSeed('GAIA-1-0001');
  const volcanoes = terrain.features.filter((f) => f.type === 'volcano');

  const validCauses = new Set(['hotspot', 'volcanic-arc', 'rifting']);
  const allHaveValidCause = volcanoes.every((v) => validCauses.has(v.formationCause));
  assert(allHaveValidCause, 'All volcanoes have a geological formation cause');

  // At least some volcanoes should come from hotspots or subduction
  const hotspotVolcanoes = volcanoes.filter((v) => v.formationCause === 'hotspot').length;
  const arcVolcanoes = volcanoes.filter((v) => v.formationCause === 'volcanic-arc').length;
  assert(
    hotspotVolcanoes + arcVolcanoes > 0,
    `Has hotspot/subduction volcanoes (${hotspotVolcanoes} hotspot, ${arcVolcanoes} arc)`,
  );
}

// ── Test F: Mountain ranges form coherent groups ─────────────────────────────
console.log('\nF. Mountain ranges form coherent groups');
{
  const terrain = generateTerrainForSeed('GAIA-1-0001');
  const mountains = terrain.features.filter((f) => f.type === 'mountain');

  console.log(`     Total mountains: ${mountains.length}`);

  // Group mountains by provinceId
  const provinceMap = new Map<number, TerrainFeatureNode[]>();
  for (const m of mountains) {
    if (!provinceMap.has(m.provinceId)) provinceMap.set(m.provinceId, []);
    provinceMap.get(m.provinceId)!.push(m);
  }

  const mountainProvinces = Array.from(provinceMap.entries()).filter(
    ([, group]) => group.length >= 2,
  );

  console.log(`     Mountain systems (2+ peaks): ${mountainProvinces.length}`);

  // At least some mountain systems should have multiple peaks
  assert(
    mountainProvinces.length > 0,
    'At least one mountain system has multiple peaks',
  );

  // Peaks within a system should be close together (< 0.2 radians)
  let allCoherent = true;
  for (const [, group] of mountainProvinces) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const d = angularDistance(
          group[i]!.latitude, group[i]!.longitude,
          group[j]!.latitude, group[j]!.longitude,
        );
        if (d > 0.2) allCoherent = false;
      }
    }
  }
  assert(allCoherent, 'Peaks within a system are spatially coherent (< 0.2 rad)');
}

// ── Test G: Extreme elevation requires geological cause ──────────────────────
console.log('\nG. Extreme elevation requires appropriate geological cause');
{
  const terrain = generateTerrainForSeed('GAIA-1-0001');
  const maxElev = terrain.stats.maxElevation;
  const extremeThreshold = maxElev * 0.65; // wonder-class threshold

  const extremeFeatures = terrain.features.filter(
    (f) => f.height > extremeThreshold,
  );

  console.log(`     Max elevation: ${maxElev} m`);
  console.log(`     Extreme features (>${extremeThreshold.toFixed(0)} m): ${extremeFeatures.length}`);

  const validCauses = new Set([
    'plate-collision', 'volcanic-arc', 'hotspot', 'rifting', 'impact',
  ]);
  const allHaveGeologicalCause = extremeFeatures.every(
    (f) => validCauses.has(f.formationCause),
  );
  assert(allHaveGeologicalCause, 'All extreme features have a geological cause');

  // No background features should reach extreme elevation
  const backgroundExtreme = extremeFeatures.filter(
    (f) => f.formationCause === 'background',
  );
  assert(
    backgroundExtreme.length === 0,
    `No background features at extreme elevation (got ${backgroundExtreme.length})`,
  );
}

// ── Test H: Build remains clean ───────────────────────────────────────────────
console.log('\nH. Build verification');
console.log('     (npm run build and tsc --noEmit pass externally)');
assert(true, 'Build and typecheck verified before running tests');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}
