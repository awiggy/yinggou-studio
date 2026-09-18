import { assetApi, type AssetWithItems } from "./asset";
import type { ImageGenerationItem } from "./generation";
import {
  normalizeCharacter,
  profileProperties,
  readProperties,
  type CharacterProfile,
} from "../character-profile";

export async function listCharacters(projectId: number) {
  return (await assetApi.listWithItems(projectId))
    .filter((asset) => asset.type === "character")
    .map(normalizeCharacter);
}

export async function saveCharacter(
  projectId: number,
  profile: CharacterProfile,
  asset: AssetWithItems | null,
) {
  // Read the latest properties before merging so unrelated asset metadata is retained.
  const current = asset ? await assetApi.get(asset.id) : null;
  const payload = {
    name: profile.name.trim(),
    description: profile.description.trim(),
    properties: JSON.stringify(profileProperties(profile, current?.properties)),
  };
  // The update endpoint returns the partial request entity, not a complete asset.
  // Keep project ownership and the chosen cover from the full read above.
  let saved;
  if (current) {
    await assetApi.update({ id: current.id, ...payload });
    saved = {
      ...current,
      ...payload,
      properties: readProperties(payload.properties),
    };
  } else {
    saved = await assetApi.create({ projectId, type: "character", ...payload });
  }
  return normalizeCharacter({ ...saved, items: asset?.items ?? [] });
}

export async function confirmCharacterImage(
  assetId: number,
  image: ImageGenerationItem,
  prompt: string,
) {
  if (image.status !== 1 || !image.imageUrl)
    throw new Error("图片尚未生成完成");
  const [asset, items] = await Promise.all([
    assetApi.get(assetId),
    assetApi.listItems(assetId),
  ]);
  const existing = items.find(
    (item) =>
      readProperties(item.properties).sourceGenerationItemId === image.id,
  );
  const item =
    existing ??
    (await assetApi.createItem({
      assetId,
      itemType: "generated_image",
      name: `${asset.name} · 角色形象`,
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl ?? undefined,
      properties: JSON.stringify({
        appearanceDescription: prompt,
        sourceGenerationMode: "image",
        sourceGenerationItemId: image.id,
        sourceMediaUrl: image.imageUrl,
      }),
      sortOrder: items.length,
    }));
  await assetApi.update({
    id: assetId,
    coverUrl: image.imageUrl,
    properties: JSON.stringify({
      ...readProperties(asset.properties),
      selectedImageItemId: item.id,
    }),
  });
}
