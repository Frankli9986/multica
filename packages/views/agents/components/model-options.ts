import type { RuntimeModel } from "@multica/core/types";

const PI_MODEL_DISCOVERY_NOISE = new Set(["no/models"]);

export function isPiModelDiscoveryNoise(value: string): boolean {
  return PI_MODEL_DISCOVERY_NOISE.has(value.trim().toLowerCase());
}

export function visibleRuntimeModels(
  models: RuntimeModel[],
  provider: string | undefined,
): RuntimeModel[] {
  if (provider !== "pi") return models;
  return models.filter(
    (model) =>
      !isPiModelDiscoveryNoise(model.id) &&
      !isPiModelDiscoveryNoise(model.label),
  );
}
