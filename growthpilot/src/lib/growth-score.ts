export type GrowthScoreDimension = {
  key: string;
  label: string;
  score: number;
  baseWeight: number;
  description: string;
  requiredChannels?: string[];
};

export type WeightedGrowthScoreDimension = GrowthScoreDimension & {
  effectiveWeight: number;
};

export function calculateAdaptiveGrowthScore(
  dimensions: GrowthScoreDimension[],
  activeChannels: string[]
) {
  const activeChannelSet = new Set(activeChannels);
  const activeDimensions = dimensions.filter((dimension) =>
    !dimension.requiredChannels || dimension.requiredChannels.some((channel) => activeChannelSet.has(channel))
  );
  const weightTotal = activeDimensions.reduce((total, dimension) => total + dimension.baseWeight, 0);
  const weightedDimensions = activeDimensions.map((dimension) => ({
    ...dimension,
    effectiveWeight: Number(((dimension.baseWeight / weightTotal) * 100).toFixed(1)),
  }));
  const score = weightedDimensions.reduce(
    (total, dimension) => total + dimension.score * (dimension.effectiveWeight / 100),
    0
  );

  return { score: Math.round(score), dimensions: weightedDimensions };
}