/**
 * TerrainFeatureDetector — classifies and groups terrain features.
 *
 * Sprint 7.4.1 calibration:
 *   • Class distribution is now AREA-WEIGHTED (angularRadius²), not count-based.
 *   • Rarity uses multi-factor classification: scale + geological uniqueness +
 *     age + formation mechanism + spatial extent.
 *
 * Deterministic: same input → same output.
 */

import type {
  TerrainFeatureNode, TerrainFeatureType, FormationCause,
  DetectedFeatureGroup, TerrainFeatureReport, Rarity,
} from './types';

/**
 * Multi-factor rarity classification.
 *
 * A feature is legendary only if it combines:
 *   • Large scale (height near planetary max)
 *   • Geological uniqueness (not a common background plain)
 *   • Significant spatial extent
 *   • Appropriate age (not fully eroded)
 *
 * A 12,000 m mountain can be "rare" without being "legendary" if it
 * lacks geological uniqueness or is highly eroded.
 */
function classifyRarity(
  feature: TerrainFeatureNode,
  maxElevation: number,
): Rarity {
  const absHeight = Math.abs(feature.height);
  const heightRatio = absHeight / Math.max(1, maxElevation);

  // Geological uniqueness: non-background causes are more unique
  const uniqueCauses: FormationCause[] = [
    'plate-collision', 'hotspot', 'impact', 'volcanic-arc', 'rifting',
  ];
  const isGeologicallyUnique = uniqueCauses.includes(feature.formationCause);

  // Spatial extent: larger features are more significant
  const isLargeExtent = feature.angularRadius >= 0.05;

  // Age factor: young or moderately-aged features retain their grandeur;
  // heavily eroded features lose rarity regardless of height
  const isEroded = feature.erosionLevel > 0.6;

  // ── Legendary: requires multiple factors ────────────────────────────────────
  if (
    feature.rarity === 'wonder' &&
    heightRatio > 0.7 &&
    isGeologicallyUnique &&
    isLargeExtent &&
    !isEroded
  ) {
    return 'legendary';
  }

  // ── Rare: wonder-class features that are geologically significant ───────────
  if (feature.rarity === 'wonder' && isGeologicallyUnique) {
    return 'rare';
  }

  // ── Rare: wonder-class but eroded or small — still notable ──────────────────
  if (feature.rarity === 'wonder') {
    return isEroded ? 'uncommon' : 'rare';
  }

  // ── Uncommon: spectacular features with geological cause ────────────────────
  if (feature.rarity === 'spectacular' && isGeologicallyUnique) {
    return 'uncommon';
  }

  // ── Common: everything else ─────────────────────────────────────────────────
  return 'common';
}

export function detectFeatures(
  features: TerrainFeatureNode[],
  maxElevation: number,
): TerrainFeatureReport {
  // ── Group features by type ──────────────────────────────────────────────────
  const groupMap = new Map<TerrainFeatureType, TerrainFeatureNode[]>();
  for (const f of features) {
    if (!groupMap.has(f.type)) groupMap.set(f.type, []);
    groupMap.get(f.type)!.push(f);
  }

  const groups: DetectedFeatureGroup[] = [];
  for (const [type, groupFeatures] of groupMap) {
    const heights = groupFeatures.map((f) => f.height);
    const ages = groupFeatures.map((f) => f.age);
    const causes = groupFeatures.map((f) => f.formationCause);

    const causeCounts = new Map<FormationCause, number>();
    for (const c of causes) {
      causeCounts.set(c, (causeCounts.get(c) ?? 0) + 1);
    }
    let dominantCause: FormationCause = 'background';
    let maxCauseCount = 0;
    for (const [cause, count] of causeCounts) {
      if (count > maxCauseCount) {
        maxCauseCount = count;
        dominantCause = cause;
      }
    }

    groups.push({
      type,
      count: groupFeatures.length,
      meanHeight: Math.round(heights.reduce((s, h) => s + h, 0) / heights.length),
      maxHeight: Math.max(...heights),
      meanAge: Math.round(ages.reduce((s, a) => s + a, 0) / ages.length),
      areaFraction: Math.round(
        groupFeatures.reduce((s, f) => s + f.angularRadius ** 2, 0) * 100,
      ) / 100,
      cause: dominantCause,
      featureIds: groupFeatures.map((f) => f.id),
    });
  }

  groups.sort((a, b) => b.maxHeight - a.maxHeight);

  // ── Area-weighted class distribution ────────────────────────────────────────
  const totalArea = features.reduce((s, f) => s + f.angularRadius ** 2, 0);
  const wonderArea = features.filter((f) => f.rarity === 'wonder')
    .reduce((s, f) => s + f.angularRadius ** 2, 0);
  const spectacularArea = features.filter((f) => f.rarity === 'spectacular')
    .reduce((s, f) => s + f.angularRadius ** 2, 0);
  const normalArea = features.filter((f) => f.rarity === 'normal')
    .reduce((s, f) => s + f.angularRadius ** 2, 0);

  const classDistribution = {
    wonder: totalArea > 0 ? Math.round((wonderArea / totalArea) * 100) / 100 : 0,
    spectacular: totalArea > 0 ? Math.round((spectacularArea / totalArea) * 100) / 100 : 0,
    normal: totalArea > 0 ? Math.round((normalArea / totalArea) * 100) / 100 : 0,
  };

  // ── Rarity distribution ─────────────────────────────────────────────────────
  const rarityDist: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 0,
  };

  for (const f of features) {
    const rarity = classifyRarity(f, maxElevation);
    f.rarityLabel = rarity;
    rarityDist[rarity]++;
  }

  // ── Notable features (wonders + legendaries, sorted by height) ──────────────
  const notableFeatures = features
    .filter((f) => f.rarity === 'wonder')
    .sort((a, b) => Math.abs(b.height) - Math.abs(a.height))
    .slice(0, 20);

  return {
    groups,
    totalFeatures: features.length,
    classDistribution,
    rarityDistribution: rarityDist,
    notableFeatures,
  };
}
