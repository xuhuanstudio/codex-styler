import type { ThemeDefinition } from "@codex-styler/theme-core";

export function themeSlug(theme: ThemeDefinition): string {
  return theme.id.split(".").at(-1) ?? theme.id;
}

export function themeAssetUrl(theme: ThemeDefinition, path: string): string {
  return "/themes/" + themeSlug(theme) + "/" + path;
}

export async function assetToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load theme asset: " + url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read asset"));
    reader.readAsDataURL(blob);
  });
}

export async function prepareThemeForRuntime(
  theme: ThemeDefinition,
  resolveAsset: (theme: ThemeDefinition, path: string) => string = themeAssetUrl,
): Promise<ThemeDefinition> {
  const clone = structuredClone(theme);
  const replacements = new Map<string, string>();

  for (const asset of clone.assets) {
    if (asset.type === "preview") continue;
    replacements.set(
      asset.path,
      await assetToDataUrl(resolveAsset(theme, asset.path)),
    );
  }

  for (const variant of Object.values(clone.variants)) {
    if (variant.background.image) {
      variant.background.image =
        replacements.get(variant.background.image) ?? variant.background.image;
    }
  }
  for (const layer of clone.scene.layers) {
    if (layer.asset) layer.asset = replacements.get(layer.asset) ?? layer.asset;
  }
  for (const entity of clone.scene.entities) {
    entity.renderer.asset =
      replacements.get(entity.renderer.asset) ?? entity.renderer.asset;
  }

  return clone;
}
