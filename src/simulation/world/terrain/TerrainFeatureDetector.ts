/**
 * TerrainFeatureDetector — classifies and groups terrain features.
 *
 * Produces feature groups by type, class distribution, rarity distribution,
 * and a notable features list (wonders and legendaries).
 * Deterministic: same input → same output.
 */

import type {
  TerrainFeatureNode, TerrainFeatureType, FormationCause,
  DetectedFeatureGroup, TerrainFeatureReport, Rarity,
} from './types';

function classifyRarity(feature: TerrainFeatureNode, maxElevation: number): Rarity {
  const absHeight = Math.abs(feature.height);
  const ratio = absHeight / maxElevation;

  if (feature.rarity === 'wonder' && ratio > 0.8) return 'legendary';
  if (feature.rarity === 'wonder') return 'rare';
  if (feature.rarity === 'spectacular') return 'uncommon';
  return 'common';
}

export function detectFeatures(
  features: TerrainFeatureNode[],
  maxElevation: number,
): TerrainFeatureReport {
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

  const wonderCount = features.filter((f) => f.rarity === 'wonder').length;
  const spectacularCount = features.filter((f) => f.rarity === 'spectacular').length;
  const normalCount = features.filter((f) => f.rarity === 'normal').length;
  const total = features.length || 1;

  const classDistribution = {
    wonder: Math.round((wonderCount / total) * 100) / 100,
    spectacular: Math.round((spectacularCount / total) * 100) / 100,
    normal: Math.round((normalCount / total) * 100) / 100,
  };

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
