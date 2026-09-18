import type { Asset, AssetWithItems } from "./api/asset";

export const VISUAL_STYLES = [
  { value: "电影写实", label: "电影写实" },
  { value: "日系动画", label: "日系动画" },
  { value: "国风插画", label: "国风插画" },
  { value: "3D 动画", label: "3D 动画" },
  { value: "水彩绘本", label: "水彩绘本" },
];

export const FRAMINGS = [
  { value: "全身立绘", label: "全身立绘" },
  { value: "半身肖像", label: "半身肖像" },
  { value: "三视图", label: "三视图（正面、侧面、背面）" },
];

export interface CharacterProfile {
  name: string;
  description: string;
  gender: string;
  age: string;
  identity: string;
  appearance: string;
  clothing: string;
  personality: string;
  visualStyle: string;
  framing: string;
}

// Asset REST responses contain JSON strings; list projections may contain parsed objects.
// Malformed data is surfaced to the caller instead of silently discarding saved settings.
export function readProperties(value: unknown): Record<string, unknown> {
  if (value == null) return {};
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("角色属性格式无效，请在资产管理中检查数据");
  }
  return parsed as Record<string, unknown>;
}

export function normalizeCharacter(asset: AssetWithItems): AssetWithItems {
  return {
    ...asset,
    properties: readProperties(asset.properties),
    items: asset.items.map((item) => ({
      ...item,
      properties: readProperties(item.properties),
    })),
  };
}

export function profileFromAsset(
  asset: Asset | null,
  projectStyle = "电影写实",
): CharacterProfile {
  const properties = readProperties(asset?.properties);
  const text = (key: string) =>
    typeof properties[key] === "string" ? (properties[key] as string) : "";
  return {
    name: asset?.name ?? "",
    description: asset?.description ?? "",
    gender: text("gender") || "unknown",
    age: text("age"),
    identity: text("identity"),
    appearance: text("appearance"),
    clothing: text("clothing"),
    personality: text("personality"),
    visualStyle: text("visualStyle") || projectStyle,
    framing: text("framing") || "全身立绘",
  };
}

export function profileProperties(
  profile: CharacterProfile,
  previous: unknown,
): Record<string, unknown> {
  const fields = { ...profile };
  return {
    ...readProperties(previous),
    gender: fields.gender,
    age: fields.age,
    identity: fields.identity,
    appearance: fields.appearance,
    clothing: fields.clothing,
    personality: fields.personality,
    visualStyle: fields.visualStyle,
    framing: fields.framing,
    setting: fields.description,
  };
}

export function buildCharacterPrompt(profile: CharacterProfile) {
  const gender = { male: "男性", female: "女性", unknown: "" }[profile.gender];
  const lines = [
    `为视频创作设计角色「${profile.name.trim()}」的${profile.framing}。`,
    `视觉风格：${profile.visualStyle}。`,
    [gender, profile.age, profile.identity].filter(Boolean).join("，"),
    profile.appearance && `外貌特征：${profile.appearance.trim()}`,
    profile.clothing && `服装与配饰：${profile.clothing.trim()}`,
    profile.personality && `性格与气质：${profile.personality.trim()}`,
    profile.description && `角色背景：${profile.description.trim()}`,
    profile.framing === "三视图"
      ? "同一角色的正面、侧面、背面并列展示，保持发型、面部特征、身材比例和服饰一致。"
      : "单个角色，主体完整清晰，面部与服饰细节可辨识。",
    "干净的中性背景，柔和均匀的光线，无文字、无水印。",
  ];
  return lines.filter(Boolean).join("\n");
}

export function characterCategory(id: number) {
  return `yinggou-character:${id}`;
}
